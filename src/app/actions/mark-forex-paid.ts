'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/logger';
import { notifyAdmins } from '@/lib/notifications';

export async function markForexPaid(id: string) {
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

    if (!['admin', 'supervisor'].includes(profile?.role)) {
        return { error: 'Permission denied' };
    }

    // Get transaction details
    const { data: transaction } = await supabase
        .from('forex_transactions')
        .select('amount, currency')
        .eq('id', id)
        .single();

    const { error } = await supabase
        .from('forex_transactions')
        .update({ payment_status: 'paid' })
        .eq('id', id);

    if (error) return { error: error.message };

    // Log activity
    await logActivity({
        action: 'MARK_PAID',
        entityType: 'FOREX_TRANSACTION',
        entityId: id,
        details: { payment_status: 'paid' }
    });

    // Notify Admins
    await notifyAdmins({
        title: 'Forex Transaction Paid',
        message: `Forex transaction of ${transaction?.amount} ${transaction?.currency} has been marked as paid by ${profile?.full_name || 'a supervisor'}.`,
        type: 'success',
        link: '/transactions/forex'
    });

    revalidatePath('/transactions/forex');
    return { success: true };
}
