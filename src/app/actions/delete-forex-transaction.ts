'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/logger';
import { notifyAdmins } from '@/lib/notifications';

export async function deleteForexTransaction(id: string) {
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

    const { error } = await supabase
        .from('forex_transactions')
        .delete()
        .eq('id', id);

    if (error) return { error: error.message };

    // Log activity
    await logActivity({
        action: 'DELETE',
        entityType: 'FOREX_TRANSACTION',
        entityId: id,
        details: { transaction_id: id }
    });

    // Notify Admins
    await notifyAdmins({
        title: 'Forex Transaction Deleted',
        message: `A forex transaction has been deleted by ${profile?.full_name || 'an admin'}.`,
        type: 'warning',
        link: '/transactions/forex'
    });

    revalidatePath('/transactions/forex');
    return { success: true };
}
