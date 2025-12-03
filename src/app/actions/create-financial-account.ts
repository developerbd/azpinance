'use server';

import { createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/logger';
import { revalidatePath } from 'next/cache';

export async function createFinancialAccount(data: any) {
    const supabase = await createClient();

    // 1. Check Auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    // 2. Insert Account
    const { data: account, error } = await supabase
        .from('financial_accounts')
        .insert([data])
        .select()
        .single();

    if (error) {
        console.error('Error creating financial account:', error);
        return { error: error.message };
    }

    // 3. Log Activity
    await logActivity({
        action: 'CREATE',
        entityType: 'FINANCIAL_ACCOUNT',
        entityId: account.id,
        details: { name: account.name, type: account.type }
    });

    revalidatePath('/accounts');
    return { success: true, data: account };
}
