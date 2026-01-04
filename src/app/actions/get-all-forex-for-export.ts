'use server';

import { createClient } from '@/lib/supabase/server';

export async function getAllForexForExport(
    queryText: string = '',
    status: string = 'all',
    dateFrom: string = '',
    dateTo: string = '',
    contactId: string = 'all'
) {
    const supabase = await createClient();

    let query = supabase
        .from('forex_transactions')
        .select(`
            *,
            contacts(name)
        `)
        .order('transaction_date', { ascending: false });

    if (queryText) {
        query = query.or(`transaction_id.ilike.%${queryText}%,note.ilike.%${queryText}%`);
    }

    if (status !== 'all') {
        query = query.eq('status', status);
    }

    if (contactId && contactId !== 'all') {
        query = query.eq('contact_id', contactId);
    }

    if (dateFrom) {
        query = query.gte('transaction_date', dateFrom);
    }

    if (dateTo) {
        query = query.lte('transaction_date', dateTo);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Export fetch error:', error);
        return { error: error.message };
    }

    return { data };
}
