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

    const { data: profile } = await supabase
        .from('users')
        .select('role, full_name')
        .eq('id', user.id)
        .single();

    if (profile?.role === 'guest') {
        return { error: 'Permission denied. Guests cannot create transactions.' };
    }

    // 2. Validate Input
    const validatedFields = ForexTransactionSchema.safeParse(data);

    if (!validatedFields.success) {
        console.error('Zod Validation Error:', validatedFields.error.issues);
        return { error: `Validation Error: ${validatedFields.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}` };
    }

    const validatedData = validatedFields.data;

    // 3. (Profile fetched above for role check)

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
