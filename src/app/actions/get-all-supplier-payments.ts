'use server';

import { createClient } from '@/lib/supabase/server';

export async function getAllSupplierPayments(
    page: number = 1,
    limit: number = 20,
    supplierId?: string,
    startDate?: string,
    endDate?: string
) {
    const supabase = await createClient();

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
        .from('supplier_payments')
        .select(`
            *,
            supplier:contacts(name),
            destination_account:financial_accounts(name, currency)
        `, { count: 'exact' });

    if (supplierId && supplierId !== 'all') {
        query = query.eq('supplier_id', supplierId);
    }

    if (startDate) {
        query = query.gte('date', startDate);
    }

    if (endDate) {
        query = query.lte('date', endDate);
    }

    const { data, count, error } = await query
        .order('date', { ascending: false })
        .range(from, to);

    if (error) return { error: error.message };

    return { data, count };
}
