'use server';

import { createClient } from '@/lib/supabase/server';

export async function getAllPaymentsForExport(
    supplierId: string = 'all',
    startDate: string = '',
    endDate: string = ''
) {
    const supabase = await createClient();

    let query = supabase
        .from('supplier_payments')
        .select(`
            *,
            supplier:contacts(name),
            destination_account:financial_accounts(name, currency)
        `)
        .order('date', { ascending: false });

    if (supplierId && supplierId !== 'all') {
        query = query.eq('supplier_id', supplierId);
    }

    if (startDate) {
        query = query.gte('date', startDate);
    }

    if (endDate) {
        query = query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Export fetch error:', error);
        return { error: error.message };
    }

    return { data };
}
