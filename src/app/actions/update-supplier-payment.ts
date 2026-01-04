'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/logger';
import { notifyAdmins } from '@/lib/notifications';

interface UpdateSupplierPaymentParams {
    id: string;
    amount: number;
    date: string;
    destination_account_id: string | null;
    from_account_id?: string | null;
    transaction_method: string;
    reference_id: string;
    notes: string;
    attachments: string[];
}

export async function updateSupplierPayment(params: UpdateSupplierPaymentParams) {
    const supabase = await createClient();
    const { id, ...updates } = params;

    try {
        // Check user role
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Unauthorized' };

        const { data: profile } = await supabase
            .from('users')
            .select('role, full_name')
            .eq('id', user.id)
            .single();

        const role = (profile?.role || '').toLowerCase();
        if (role !== 'admin' && role !== 'supervisor') {
            return { error: 'Permission denied. Only admins and supervisors can edit payments.' };
        }

        const { error } = await supabase
            .from('supplier_payments')
            .update(updates)
            .eq('id', id);

        if (error) throw error;

        await logActivity({
            action: 'UPDATE',
            entityType: 'SUPPLIER_PAYMENT',
            entityId: id,
            details: updates
        });

        // Notify Admins
        await notifyAdmins({
            title: 'Supplier Payment Updated',
            message: `A supplier payment has been updated by ${profile?.full_name || 'a user'}.`,
            type: 'info',
            link: `/transactions/supplier-payments/${id}`
        });

        revalidatePath('/transactions/supplier-payments');
        revalidatePath(`/transactions/supplier-payments/${id}`);
        return { success: true };
    } catch (error: any) {
        console.error('Update error:', error);
        return { error: error.message || 'Failed to update payment' };
    }
}
