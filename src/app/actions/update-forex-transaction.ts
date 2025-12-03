'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

import { forexTransactionSchema } from '@/lib/schemas';
import { logActivity } from '@/lib/logger';
import { notifyAdmins } from '@/lib/notifications';

export async function updateForexTransaction(id: string, data: any) {
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

    const role = profile?.role;

    if (!['accountant', 'supervisor', 'admin'].includes(role)) {
        return { error: 'Permission denied' };
    }

    // Validate data (partial update allowed)
    const validation = forexTransactionSchema.partial().safeParse(data);
    if (!validation.success) {
        return { error: validation.error.issues[0].message };
    }

    // If accountant, check if pending
    if (role === 'accountant') {
        const { data: tx } = await supabase
            .from('forex_transactions')
            .select('status')
            .eq('id', id)
            .single();

        if (tx?.status !== 'pending') {
            return { error: 'Cannot edit approved transactions' };
        }
    }

    const { error, data: updatedData } = await supabase
        .from('forex_transactions')
        .update(validation.data)
        .eq('id', id)
        .select('id');

    if (error) return { error: error.message };
    if (!updatedData || updatedData.length === 0) return { error: 'Transaction not found or permission denied (must be pending for accountants)' };

    await logActivity({
        action: 'UPDATE',
        entityType: 'FOREX_TRANSACTION',
        entityId: id,
        details: validation.data
    });

    // Notify Admins
    await notifyAdmins({
        title: 'Forex Transaction Updated',
        message: `A forex transaction has been updated by ${profile?.full_name || 'a user'}.`,
        type: 'info',
        link: '/transactions/forex'
    });

    revalidatePath('/transactions/forex');
    return { success: true };
}
