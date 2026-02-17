'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { notifyAdmins } from '@/lib/notifications';
import { logActivity } from '@/lib/logger';
import { ForexTransactionSchema, type ForexTransactionInput } from '@/lib/validations';
import { z } from 'zod';

export async function updateForexTransaction(id: string, data: unknown) {
    const supabase = await createClient();

    // 1. Check Authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    // 2. Validate Input (partial schema for updates)
    const validatedFields = ForexTransactionSchema.partial().safeParse(data);

    if (!validatedFields.success) {
        return { error: validatedFields.error.issues[0]?.message || 'Validation error' };
    }

    const validatedData = validatedFields.data;

    // 3. Get user profile for notification
    const { data: profile } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single();

    // 4. Update Transaction
    const { data: transaction, error: updateError } = await supabase
        .from('forex_transactions')
        .update(validatedData)
        .eq('id', id)
        .select()
        .single();

    if (updateError) {
        console.error('Error updating forex transaction:', updateError);
        return { error: 'Failed to update transaction' };
    }

    // 5. Log Activity
    await logActivity({
        action: 'UPDATE',
        entityType: 'FOREX_TRANSACTION',
        entityId: id,
        details: { changes: Object.keys(validatedData) }
    });

    // 6. Notify Admins
    await notifyAdmins({
        title: 'Forex Transaction Updated',
        message: `Forex transaction updated by ${profile?.full_name || user.email}.`,
        type: 'info',
        link: '/transactions/forex'
    });

    revalidatePath('/transactions/forex');
    return { success: true, data: transaction };
}
