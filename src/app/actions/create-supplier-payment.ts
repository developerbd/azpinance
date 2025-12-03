'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/logger';
import { notifyAdmins } from '@/lib/notifications';
import { supplierPaymentSchema } from '@/lib/schemas';

export async function createSupplierPayment(data: any) {
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Check role
    const { data: profile } = await supabase
        .from('users')
        .select('role, full_name')
        .eq('id', user.id)
        .single();

    if (!['accountant', 'supervisor', 'admin'].includes(profile?.role)) {
        return { error: 'Permission denied' };
    }

    // Validate data
    const validation = supplierPaymentSchema.safeParse(data);
    if (!validation.success) {
        return { error: validation.error.issues[0].message };
    }

    const { error } = await supabase
        .from('supplier_payments')
        .insert({
            ...validation.data,
            created_by: user.id
        });

    if (error) return { error: error.message };

    // Log activity
    await logActivity({
        action: 'CREATE',
        entityType: 'SUPPLIER_PAYMENT',
        details: { amount: validation.data.amount, supplier_id: validation.data.supplier_id }
    });

    // Notify Admins
    await notifyAdmins({
        title: 'New Supplier Payment',
        message: `A new supplier payment of ${validation.data.amount} has been created by ${profile?.full_name || 'a user'}.`,
        type: 'info',
        link: `/contacts/${validation.data.supplier_id}`
    });

    revalidatePath(`/contacts/${validation.data.supplier_id}`);
    return { success: true };
}
