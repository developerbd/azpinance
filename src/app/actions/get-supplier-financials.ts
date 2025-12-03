'use server';

import { createClient } from '@/lib/supabase/server';

export async function getSupplierFinancials(supplierId: string) {
    const supabase = await createClient();

    // 1. Get Total Receivables (Sum of Forex amount_bdt)
    const { data: forexData, error: forexError } = await supabase
        .from('forex_transactions')
        .select('amount_bdt')
        .eq('contact_id', supplierId)
        .eq('status', 'approved');

    if (forexError) return { error: forexError.message };

    const totalReceivables = forexData.reduce((sum, tx) => sum + (Number(tx.amount_bdt) || 0), 0);

    // 2. Get Total Payments (Sum of supplier_payments amount)
    const { data: paymentData, error: paymentError } = await supabase
        .from('supplier_payments')
        .select('amount')
        .eq('supplier_id', supplierId);

    if (paymentError) return { error: paymentError.message };

    const totalPayments = paymentData.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    const currentDue = totalReceivables - totalPayments;

    return {
        totalReceivables,
        totalPayments,
        currentDue
    };
}
