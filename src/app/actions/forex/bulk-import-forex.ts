'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/logger';

export interface ForexImportData {
    contact_id: string;
    receiving_account_id: string;
    account_type: string;
    currency: string;
    amount: number;
    exchange_rate: number;
    amount_bdt: number;
    transaction_date: string;
    transaction_id?: string;
    note?: string;
    status: 'pending' | 'approved' | 'rejected';
}

export async function bulkImportForex(transactions: ForexImportData[]) {
    const supabase = await createClient();

    // 1. Check Auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role === 'guest') {
        return { error: 'Permission denied. Guests cannot import transactions.' };
    }

    // 2. Prepare Data (Add user_id)
    const records = transactions.map(item => ({
        ...item,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }));

    // 3. Bulk Insert
    const { data, error } = await supabase
        .from('forex_transactions')
        .insert(records)
        .select();

    if (error) {
        console.error('Bulk Import Error:', error);
        return { error: `Import failed: ${error.message}` };
    }

    // 4. Log Activity
    await logActivity({
        action: 'CREATE',
        entityType: 'FOREX_TRANSACTION',
        entityId: 'bulk-import', // or maybe just leave it generic
        details: {
            count: data?.length,
            description: `Bulk Imported ${data?.length} transactions`
        }
    });

    // 5. Revalidate
    revalidatePath('/transactions/forex');
    revalidatePath('/activity');
    revalidatePath('/dashboard');

    return { success: true, count: data?.length || 0 };
}
