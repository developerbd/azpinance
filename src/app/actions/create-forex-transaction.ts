'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/logger';
import { notifyAdmins } from '@/lib/notifications';

import { forexTransactionSchema } from '@/lib/schemas';

export async function createForexTransaction(data: any) {
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
    const validation = forexTransactionSchema.safeParse(data);
    if (!validation.success) {
        return { error: validation.error.issues[0].message };
    }

    const { error } = await supabase
        .from('forex_transactions')
        .insert({
            ...validation.data,
            status: 'pending',
            payment_status: 'processing'
        });

    if (error) return { error: error.message };

    // Log activity
    await logActivity({
        action: 'CREATE',
        entityType: 'FOREX_TRANSACTION',
        details: { amount: validation.data.amount, currency: validation.data.currency, contact_id: validation.data.contact_id }
    });

    // Notify Admins
    await notifyAdmins({
        title: 'New Forex Transaction',
        message: `A new transaction of ${validation.data.amount} ${validation.data.currency} has been created by ${profile?.full_name || 'a user'}.`,
        type: 'info',
        link: '/transactions/forex'
    });

    revalidatePath('/transactions/forex');
    return { success: true };
}
