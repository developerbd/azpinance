'use server';

import { createClient } from '@/lib/supabase/server';

export async function getDashboardStats() {
    const supabase = await createClient();

    // 1. Total Paid to Suppliers (All Time)
    const { data: payments, error: paymentError } = await supabase
        .from('supplier_payments')
        .select('amount');

    if (paymentError) return { error: paymentError.message };

    const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // 2. Total Outstanding Due
    // We need to calculate this by iterating all suppliers.
    // Re-using logic from getContactsWithDue but optimized for aggregation.

    const { data: forexData, error: forexError } = await supabase
        .from('forex_transactions')
        .select('contact_id, amount_bdt');

    if (forexError) return { error: forexError.message };

    const receivablesMap = new Map<string, number>();
    forexData.forEach(tx => {
        const current = receivablesMap.get(tx.contact_id) || 0;
        receivablesMap.set(tx.contact_id, current + (Number(tx.amount_bdt) || 0));
    });

    const paymentsMap = new Map<string, number>();
    payments.forEach((p: any) => { // We already fetched payments above, but we need supplier_id. 
        // Wait, the first fetch didn't select supplier_id. Let's refetch or adjust.
    });

    // Let's do a clean fetch for due calculation
    const { data: allPayments, error: allPaymentsError } = await supabase
        .from('supplier_payments')
        .select('supplier_id, amount');

    if (allPaymentsError) return { error: allPaymentsError.message };

    allPayments.forEach(p => {
        const current = paymentsMap.get(p.supplier_id) || 0;
        paymentsMap.set(p.supplier_id, current + (Number(p.amount) || 0));
    });

    let totalDue = 0;
    // Iterate over all contacts that have receivables
    for (const [contactId, receivable] of receivablesMap.entries()) {
        const paid = paymentsMap.get(contactId) || 0;
        const due = receivable - paid;
        if (due > 0) {
            totalDue += due;
        }
    }

    return {
        totalPaid,
        totalDue
    };
}
