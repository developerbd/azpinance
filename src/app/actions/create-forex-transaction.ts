'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { notifyAdmins } from '@/lib/notifications';
import { logActivity } from '@/lib/logger';
import { ForexTransactionSchema, type ForexTransactionInput } from '@/lib/validations';
import { z } from 'zod';

export async function createForexTransaction(data: unknown) {
    const supabase = await createClient();

    // 1. Check Authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    // 2. Validate Input
    let validatedData: ForexTransactionInput;
    try {
        validatedData = ForexTransactionSchema.parse(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('Zod Validation Error:', error.errors);
            return { error: `Validation Error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}` };
        }
        return { error: 'Invalid input data' };
    }

    // 3. Get user profile for notification
    const { data: profile } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single();

    // 4. Create Transaction
    const { data: transaction, error: insertError } = await supabase
        .from('forex_transactions')
        .insert([{ ...validatedData, user_id: user.id }])
        .select()
        .single();

    if (insertError) {
        console.error('Error creating forex transaction:', insertError);
        return { error: `Failed to create transaction: ${insertError.message} (${insertError.details || ''})` };
    }

    // 5. Log Activity
    await logActivity({
        action: 'CREATE',
        entityType: 'FOREX_TRANSACTION',
        entityId: transaction.id,
        details: { amount: validatedData.amount, currency: validatedData.currency }
    });

    // 6. Notify Admins
    await notifyAdmins({
        title: 'New Forex Transaction',
        message: `A new transaction of ${validatedData.amount} ${validatedData.currency} has been created by ${profile?.full_name || user.email}.`,
        type: 'info',
        link: '/transactions/forex'
    });

    revalidatePath('/transactions/forex');
    return { success: true, data: transaction };
}
