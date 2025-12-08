'use server';

import { createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import { notifyAdmins } from '@/lib/notifications';
import { FinancialAccountSchema, type FinancialAccountInput } from '@/lib/validations';
import { z } from 'zod';

export async function updateFinancialAccount(id: string, data: unknown) {
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
        return { error: 'Permission denied. Only admins and supervisors can update financial accounts.' };
    }

    // 3. Validate Input (partial schema for updates)
    let validatedData: Partial<FinancialAccountInput>;
    try {
        validatedData = FinancialAccountSchema.partial().parse(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { error: error.errors[0].message };
        }
        return { error: 'Invalid input data' };
    }

    // 4. Update Account
    const { data: account, error: updateError } = await supabase
        .from('financial_accounts')
        .update(validatedData)
        .eq('id', id)
        .select()
        .single();

    if (updateError) {
        console.error('Error updating financial account:', updateError);
        return { error: 'Failed to update account' };
    }

    // 5. Log Activity
    await logActivity({
        action: 'UPDATE',
        entityType: 'FINANCIAL_ACCOUNT',
        entityId: account.id,
        details: { name: account.name, changes: Object.keys(validatedData) }
    });

    // 6. Notify Admins
    const changedFields = Object.keys(validatedData).join(', ');
    await notifyAdmins({
        title: 'Financial Account Updated',
        message: `Account "${account.name}" has been updated by ${profile?.full_name || user.email}. Changed: ${changedFields}`,
        type: 'info',
        link: `/accounts/${account.id}`
    });

    revalidatePath('/accounts');
    return { success: true, data: account };
}
