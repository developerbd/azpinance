'use server';

import { createClient } from '@/lib/supabase/server';

export async function getSupplierPayments(supplierId: string, page: number = 1, limit: number = 10) {
    const supabase = await createClient();

    // Check Authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await supabase
        .from('supplier_payments')
        .select(`
            *,
            destination_account:financial_accounts(name, currency)
        `, { count: 'exact' })
        .eq('supplier_id', supplierId)
        .order('date', { ascending: false })
        .range(from, to);

    if (error) return { error: error.message };

    return { data, count };
}
