'use server';

import { createClient } from '@/lib/supabase/server';

export async function getSupplierPayment(id: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('supplier_payments')
            .select(`
                *,
                supplier:contacts(id, name),
                destination_account:financial_accounts!destination_account_id(id, name, currency),
                from_account:financial_accounts!from_account_id(id, name, currency)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        return { data };
    } catch (error: any) {
        console.error('Fetch error:', error);
        return { error: error.message || 'Failed to fetch payment' };
    }
}
