'use server';

import { createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/logger';
import { revalidatePath } from 'next/cache';

export async function updateFinancialAccount(id: string, data: any) {
    const supabase = await createClient();

    // 1. Check Auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    // 2. Update Account
    const { data: account, error } = await supabase
        .from('financial_accounts')
        .update(data)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating financial account:', error);
        return { error: error.message };
    }

    // 3. Log Activity
    await logActivity({
        action: 'UPDATE',
        entityType: 'FINANCIAL_ACCOUNT',
        entityId: account.id,
        details: { name: account.name, changes: Object.keys(data) }
    });

    revalidatePath('/accounts');
    return { success: true, data: account };
}
