'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/logger';
import { notifyAdmins } from '@/lib/notifications';

export async function approveForexTransaction(id: string) {
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
        .update({ status: 'approved' })
        .eq('id', id);

    if (error) return { error: error.message };

    // After success:
    await logActivity({
        action: 'APPROVE',
        entityType: 'FOREX_TRANSACTION',
        entityId: id,
        details: { status: 'approved' }
    });

    // Notify Admins
    await notifyAdmins({
        title: 'Forex Transaction Approved',
        message: `Forex transaction of ${transaction?.amount} ${transaction?.currency} has been approved by ${profile?.full_name || 'a supervisor'}.`,
        type: 'success',
        link: '/transactions/forex'
    });

    revalidatePath('/transactions/forex');
    return { success: true };
}
