'use server';

import { createClient } from '@/lib/supabase/server';

export async function getDashboardStats() {
    const supabase = await createClient();

    // Check Authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    // Fetch all data in parallel for better performance
    const [
        { data: payments, error: paymentError },
        { data: forexData, error: forexError }
    ] = await Promise.all([
        supabase.from('supplier_payments').select('supplier_id, amount'),
        supabase.from('forex_transactions').select('contact_id, amount_bdt')
    ]);

    if (paymentError) return { error: paymentError.message };
    if (forexError) return { error: forexError.message };

    // Calculate total paid
    const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Build receivables map
    const receivablesMap = new Map<string, number>();
    forexData.forEach(tx => {
        const current = receivablesMap.get(tx.contact_id) || 0;
        receivablesMap.set(tx.contact_id, current + (Number(tx.amount_bdt) || 0));
    });

    // Build payments map
    const paymentsMap = new Map<string, number>();
    payments.forEach(p => {
        const current = paymentsMap.get(p.supplier_id) || 0;
        paymentsMap.set(p.supplier_id, current + (Number(p.amount) || 0));
    });

    // Calculate total due
    let totalDue = 0;
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
