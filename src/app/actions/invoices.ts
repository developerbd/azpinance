'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { notifyAdmins } from '@/lib/notifications';
import { logActivity } from '@/lib/logger';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type InvoiceType = 'invoice' | 'bill';

export interface InvoiceItem {
    id?: string;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
}

export interface CreateInvoiceParams {
    contact_id: string;
    type: InvoiceType;
    issue_date: string;
    due_date: string;
    currency: string;
    notes?: string;
    items: InvoiceItem[];
    tax_rate?: number;
}

export async function createInvoice(params: CreateInvoiceParams) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Get user profile for notification
    const { data: profile } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single();

    // Generate Invoice Number (Simple auto-increment-like or timestamp based for MVP)
    // For a real app, we'd want a sequence or a more robust generation strategy.
    // Let's use INV-{YYYYMMDD}-{Random4}
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const prefix = params.type === 'invoice' ? 'INV' : 'BILL';
    const invoice_number = `${prefix}-${dateStr}-${randomSuffix}`;

    // Calculate totals
    const subtotal = params.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const tax_rate = params.tax_rate || 0;
    const tax_amount = (subtotal * tax_rate) / 100;
    const total_amount = subtotal + tax_amount;

    // 1. Create Invoice
    const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
            invoice_number,
            contact_id: params.contact_id,
            type: params.type,
            status: 'draft',
            issue_date: params.issue_date,
            due_date: params.due_date,
            currency: params.currency,
            subtotal,
            tax_rate,
            tax_amount,
            total_amount,
            notes: params.notes,
        })
        .select()
        .single();

    if (invoiceError) {
        console.error('Error creating invoice:', invoiceError);
        return { error: 'Failed to create invoice' };
    }

    // 2. Create Invoice Items
    const itemsToInsert = params.items.map(item => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.quantity * item.unit_price,
    }));

    const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

    if (itemsError) {
        console.error('Error creating invoice items:', itemsError);
        // Ideally we should rollback here, but Supabase doesn't support transactions in HTTP API easily without RPC.
        // For MVP, we'll just report error.
        return { error: 'Failed to create invoice items' };
    }

    // Log activity
    await logActivity({
        action: 'CREATE',
        entityType: params.type === 'invoice' ? 'INVOICE' : 'BILL',
        entityId: invoice.id,
        details: { invoice_number, total_amount, currency: params.currency }
    });

    // Notify Admins
    await notifyAdmins({
        title: `New ${params.type === 'invoice' ? 'Invoice' : 'Bill'} Created`,
        message: `${params.type === 'invoice' ? 'Invoice' : 'Bill'} ${invoice_number} for ${total_amount} ${params.currency} has been created by ${profile?.full_name || user.email}.`,
        type: 'info',
        link: `/invoices/${invoice.id}`
    });

    revalidatePath('/invoices');
    return { success: true, id: invoice.id };
}

export async function getInvoices(type?: InvoiceType) {
    const supabase = await createClient();

    let query = supabase
        .from('invoices')
        .select(`
            *,
            contacts (name, email)
        `)
        .order('created_at', { ascending: false });

    if (type) {
        query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching invoices:', error);
        return { error: 'Failed to fetch invoices' };
    }

    return { data };
}

export async function getInvoiceById(id: string) {
    const supabase = await createClient();

    const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
            *,
            contacts (*),
            invoice_items (*)
        `)
        .eq('id', id)
        .single();

    if (invoiceError) {
        console.error('Error fetching invoice:', invoiceError);
        return { error: 'Failed to fetch invoice' };
    }

    return { data: invoice };
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', id);

    if (error) {
        console.error('Error updating invoice status:', error);
        return { error: 'Failed to update status' };
    }

    revalidatePath('/invoices');
    revalidatePath(`/invoices/${id}`);
    return { success: true };
}

export async function deleteInvoice(id: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Get user profile for notification
    const { data: profile } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single();

    // Get invoice details before deletion
    const { data: invoice } = await supabase
        .from('invoices')
        .select('invoice_number, type, total_amount, currency')
        .eq('id', id)
        .single();

    const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting invoice:', error);
        return { error: 'Failed to delete invoice' };
    }

    // Log activity
    await logActivity({
        action: 'DELETE',
        entityType: invoice?.type === 'invoice' ? 'INVOICE' : 'BILL',
        entityId: id,
        details: { invoice_number: invoice?.invoice_number }
    });

    // Notify Admins
    await notifyAdmins({
        title: `${invoice?.type === 'invoice' ? 'Invoice' : 'Bill'} Deleted`,
        message: `${invoice?.type === 'invoice' ? 'Invoice' : 'Bill'} ${invoice?.invoice_number} has been deleted by ${profile?.full_name || user.email}.`,
        type: 'warning',
        link: '/invoices'
    });

    revalidatePath('/invoices');
    return { success: true };
}
