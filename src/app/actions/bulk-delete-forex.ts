'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/logger';
import { notifyAdmins } from '@/lib/notifications';

export async function bulkDeleteForexTransactions(ids: string[]) {
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
        .from('forex_transactions')
        .delete()
        .in('id', ids);

    if (error) return { error: error.message };

    // Log activity
    await logActivity({
        action: 'BULK_DELETE',
        entityType: 'FOREX_TRANSACTION',
        details: { count: ids.length, ids }
    });

    // Notify Admins
    await notifyAdmins({
        title: 'Bulk Forex Deletion',
        message: `${ids.length} forex transactions have been deleted by ${profile?.full_name || 'an admin'}.`,
        type: 'warning',
        link: '/transactions/forex'
    });

    revalidatePath('/transactions/forex');
    return { success: true };
}
