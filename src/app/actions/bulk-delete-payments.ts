'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/logger';
import { notifyAdmins } from '@/lib/notifications';

export async function bulkDeleteSupplierPayments(ids: string[]) {
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

    if (profile?.role !== 'admin') {
        return { error: 'Permission denied. Only admins can delete records.' };
    }

    if (!ids || ids.length === 0) {
        return { error: 'No records selected' };
    }

    const { error } = await supabase
        .from('supplier_payments')
        .delete()
        .in('id', ids);

    if (error) return { error: error.message };

    // Log activity
    await logActivity({
        action: 'BULK_DELETE',
        entityType: 'SUPPLIER_PAYMENT',
        details: { count: ids.length, ids }
    });

    // Notify Admins
    await notifyAdmins({
        title: 'Bulk Payment Deletion',
        message: `${ids.length} supplier payments have been deleted by ${profile?.full_name || 'an admin'}.`,
        type: 'warning',
        link: '/transactions/supplier-payments'
    });

    revalidatePath('/transactions/supplier-payments');
    return { success: true };
}
