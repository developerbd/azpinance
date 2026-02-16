'use server';

import { createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import { notifyAdmins } from '@/lib/notifications';
import { FinancialAccountSchema, type FinancialAccountInput } from '@/lib/validations';
import { z } from 'zod';

export async function createFinancialAccount(data: unknown) {
    const supabase = await createClient();

    // 1. Check Authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    // 2. Check Authorization (Admin/Supervisor only)
    const { data: profile } = await supabase
        .from('users')
        .select('role, full_name')
        .eq('id', user.id)
        .single();

    if (!['admin', 'supervisor'].includes(profile?.role)) {
        return { error: 'Permission denied. Only admins and supervisors can create financial accounts.' };
    }

    // 3. Validate Input
    let validatedData: FinancialAccountInput;
    try {
        validatedData = FinancialAccountSchema.parse(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { error: error.issues[0]?.message || 'Validation error' };
        }
        return { error: 'Invalid input data' };
    }

    // 4. Create Account
    const { data: account, error: insertError } = await supabase
        .from('financial_accounts')
        .insert([validatedData])
        .select()
        .single();

    if (insertError) {
        console.error('Error creating financial account:', insertError);
        return { error: `Failed to create account: ${insertError.message} (${insertError.details || ''})` };
    }

    // 5. Log Activity
    await logActivity({
        action: 'CREATE',
        entityType: 'FINANCIAL_ACCOUNT',
        entityId: account.id,
        details: { name: account.name, type: account.type }
    });

    // 6. Notify Admins
    await notifyAdmins({
        title: 'New Financial Account Created',
        message: `A new ${account.type} account "${account.name}" has been created by ${profile?.full_name || user.email}.`,
        type: 'info',
        link: `/accounts/${account.id}`
    });

    revalidatePath('/accounts');
    return { success: true, data: account };
}
