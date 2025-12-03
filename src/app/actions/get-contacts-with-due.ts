'use server';

import { createClient } from '@/lib/supabase/server';

export async function getContactsWithDue() {
    const supabase = await createClient();

    // 1. Fetch all contacts
    const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

    if (contactsError) return { error: contactsError.message };

    // 2. Fetch all forex transactions (Receivables) - Only Approved
    const { data: forexData, error: forexError } = await supabase
        .from('forex_transactions')
        .select('contact_id, amount_bdt')
        .eq('status', 'approved');

    if (forexError) return { error: forexError.message };

    // 3. Fetch all supplier payments (Payments)
    const { data: paymentData, error: paymentError } = await supabase
        .from('supplier_payments')
        .select('supplier_id, amount');

    if (paymentError) return { error: paymentError.message };

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
}
