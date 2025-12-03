'use server';

import { createClient } from '@/lib/supabase/server';
import { addDays, format, startOfDay, subDays } from 'date-fns';

export async function getCashFlowForecast(days = 30) {
    const supabase = await createClient();
    const today = startOfDay(new Date());
    const endDate = addDays(today, days);
    const startDateHistory = subDays(today, 30);

    // 1. Fetch All Required Data in Parallel
    const [
        { data: contacts },
        { data: forexData },
        { data: paymentData },
        { data: historyForex }
    ] = await Promise.all([
        supabase.from('contacts').select('id'),
        supabase.from('forex_transactions').select('contact_id, amount_bdt').eq('status', 'approved'),
        supabase.from('supplier_payments').select('supplier_id, amount'),
        supabase.from('forex_transactions')
            .select('amount, amount_bdt, transaction_date')
            .eq('status', 'approved')
            .gte('transaction_date', format(startDateHistory, 'yyyy-MM-dd'))
    ]);

    let totalImmediateReceivables = 0; // BDT (What clients owe us)
    let totalImmediatePayables = 0;    // BDT (What we owe suppliers)

    if (contacts && forexData && paymentData) {
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

        contacts.forEach(c => {
            const rec = receivablesMap.get(c.id) || 0; // Total Forex (Liability created)
            const pay = paymentsMap.get(c.id) || 0;    // Total Paid (Liability reduced)
            const balance = rec - pay;                 // Positive = We owe them

            if (balance > 0) totalImmediatePayables += balance;      // We owe them (Payable)
            if (balance < 0) totalImmediateReceivables += Math.abs(balance); // We overpaid (Receivable)
        });
    }

    let totalHistoryUSD = 0;
    let totalHistoryBDT = 0;

    historyForex?.forEach(tx => {
        totalHistoryUSD += Number(tx.amount);
        totalHistoryBDT += Number(tx.amount_bdt);
    });

    // Calculate active days (time since first transaction in the window)
    const dates = historyForex?.map(tx => new Date(tx.transaction_date).getTime()) || [];
    const firstTxDate = dates.length > 0 ? new Date(Math.min(...dates)) : new Date();
    const daysActive = Math.max(1, Math.ceil((new Date().getTime() - firstTxDate.getTime()) / (1000 * 60 * 60 * 24)));
    const divisor = Math.min(daysActive, 30); // Cap at 30, but don't dilute if history is short

    const avgDailyUSDInflow = totalHistoryUSD / divisor;
    const avgExchangeRate = totalHistoryUSD > 0 ? (totalHistoryBDT / totalHistoryUSD) : 120;

    // 3. Build Forecast
    const dailyData: Record<string, any> = {};
    let cumulativeUSD = 0;
    let cumulativeLiabilityBDT = totalImmediatePayables; // Start with current debt

    for (let i = 0; i <= days; i++) {
        const date = format(addDays(today, i), 'yyyy-MM-dd');

        // Projected Inflow (USD)
        const projectedUSD = avgDailyUSDInflow;

        // Projected Liability Creation (BDT)
        // This is the BDT obligation created by receiving the USD
        const projectedLiability = projectedUSD * avgExchangeRate;

        cumulativeUSD += projectedUSD;
        cumulativeLiabilityBDT += projectedLiability;

        dailyData[date] = {
            date,
            usd_inflow: projectedUSD,
            bdt_liability_created: projectedLiability,
            cumulative_usd: cumulativeUSD,
            cumulative_liability_bdt: cumulativeLiabilityBDT
        };
    }

    return {
        data: Object.values(dailyData),
        summary: {
            immediate_payables_bdt: totalImmediatePayables,
            immediate_receivables_bdt: totalImmediateReceivables,
            avg_daily_usd_inflow: avgDailyUSDInflow,
            avg_exchange_rate: avgExchangeRate,
            projected_30d_liability_bdt: avgDailyUSDInflow * 30 * avgExchangeRate
        }
    };
}
