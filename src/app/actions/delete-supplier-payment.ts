'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/logger';
import { notifyAdmins } from '@/lib/notifications';

export async function deleteSupplierPayment(id: string) {
    const supabase = await createClient();

    try {
        // Check user role
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Unauthorized' };

        const { data: profile } = await supabase
            .from('users')
            .select('role, full_name')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return { error: 'Permission denied. Only admins can delete payments.' };
        }

        const { error } = await supabase
            .from('supplier_payments')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // ...

        await logActivity({
            action: 'DELETE',
            entityType: 'SUPPLIER_PAYMENT',
            entityId: id,
            details: { payment_id: id }
        });

        // Notify Admins
        await notifyAdmins({
            title: 'Supplier Payment Deleted',
            message: `A supplier payment has been deleted by ${profile?.full_name || 'an admin'}.`,
            type: 'warning',
            link: '/transactions/supplier-payments'
        });

        revalidatePath('/transactions/supplier-payments');
        return { success: true };
    } catch (error: any) {
        console.error('Delete error:', error);
        return { error: error.message || 'Failed to delete payment' };
    }
}
