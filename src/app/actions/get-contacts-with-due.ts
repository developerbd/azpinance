'use server';

import { createClient } from '@/lib/supabase/server';
import { unstable_noStore as noStore } from 'next/cache';

export async function getContactsWithDue() {
    noStore(); // Bypass Next.js fetch caching
    const supabase = await createClient();

    // Check Authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    // Helper to fetch all rows bypassing the 1000 API limit
    async function fetchAllRows(table: string, columns: string, eqFilters: Record<string, string> = {}) {
        let allData: any[] = [];
        let from = 0;
        const step = 1000;
        let hasMore = true;

        while (hasMore) {
            let query = supabase
                .from(table)
                .select(columns)
                .range(from, from + step - 1);

            for (const [key, val] of Object.entries(eqFilters)) {
                query = query.eq(key, val);
            }

            const { data, error } = await query;
            if (error) throw error;

            if (data && data.length > 0) {
                allData = [...allData, ...data];
                if (data.length < step) {
                    hasMore = false;
                } else {
                    from += step;
                }
            } else {
                hasMore = false;
            }
        }
        return allData;
    }

    try {
        // 1. Fetch contacts (limit to prevent performance issues on huge datasets, but get full balances)
        const { data: contacts, error: contactsError } = await supabase
            .from('contacts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(500);

        if (contactsError) return { error: contactsError.message };

        // 2. Fetch all forex transactions (Receivables) - Only Approved
        const forexData = await fetchAllRows('forex_transactions', 'contact_id, amount_bdt', { status: 'approved' });

        // 3. Fetch all supplier payments (Payments)
        const paymentData = await fetchAllRows('supplier_payments', 'supplier_id, amount');

    // 4. Aggregate Data
    const receivablesMap = new Map<string, number>();
    forexData.forEach(tx => {
        const current = receivablesMap.get(tx.contact_id) || 0;
        receivablesMap.set(tx.contact_id, current + (Number(tx.amount_bdt) || 0));
    });

    const paymentsMap = new Map<string, number>();
    paymentData.forEach(tx => {
        const current = paymentsMap.get(tx.supplier_id) || 0;
        paymentsMap.set(tx.supplier_id, current + (Number(tx.amount) || 0));
    });

    // 5. Merge with contacts
    const contactsWithDue = contacts.map(contact => {
        const totalReceivables = receivablesMap.get(contact.id) || 0;
        const totalPayments = paymentsMap.get(contact.id) || 0;
        const currentDue = totalReceivables - totalPayments;

        return {
            ...contact,
            total_receivables: totalReceivables,
            current_due: currentDue
        };
    });

    return { data: contactsWithDue };
    } catch (error: any) {
        return { error: error?.message || 'Failed to fetch contacts with due' };
    }
}
