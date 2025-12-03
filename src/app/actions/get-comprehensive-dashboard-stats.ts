'use server';

import { createClient } from '@/lib/supabase/server';
import { getCashFlowForecast } from './get-cash-flow-stats';

export interface DashboardStats {
    metrics: {
        total_volume_usd: number;
        active_float_usd: number;
        total_supplier_dues: number;
        settlement_score: number;
        // Legacy fields for compatibility
        total_receivables: number;
        total_payables: number;
        net_position: number;
        health_score: number;
    };
    chart_data: any[];
    recent_activity: any[];
    user_name: string;
}

export async function getComprehensiveDashboardStats(): Promise<DashboardStats> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Fetch Core Data
    const { data: forexData } = await supabase
        .from('forex_transactions')
        .select('id, amount, amount_bdt, transaction_date, status, contact_id')
        .eq('status', 'approved')
        .order('transaction_date', { ascending: false });

    const { data: invoices } = await supabase
        .from('invoices')
        .select('id, total_amount, status, due_date, created_at, invoice_number')
        .neq('status', 'paid')
        .order('created_at', { ascending: false });

    const { data: payments } = await supabase
        .from('supplier_payments')
        .select('id, amount, date, supplier_id')
        .order('date', { ascending: false });

    // 2. Calculate Metrics

    // Total Volume (USD) - Global
    const total_volume_usd = forexData?.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0) || 0;

    // We need to group data by Contact/Supplier to calculate accurate float per supplier
    // Interface for our aggregation
    interface SupplierStats {
        total_usd: number;
        total_bdt_liability: number;
        total_bdt_paid: number;
    }

    const supplierMap = new Map<string, SupplierStats>();

    // Helper to get or init stats
    const getStats = (id: string): SupplierStats => {
        if (!supplierMap.has(id)) {
            supplierMap.set(id, { total_usd: 0, total_bdt_liability: 0, total_bdt_paid: 0 });
        }
        return supplierMap.get(id)!;
    };

    // Process Forex (Liabilities)
    let global_liability_bdt = 0;
    if (forexData) {
        forexData.forEach(tx => {
            const stats = getStats(tx.contact_id);
            const amount_usd = Number(tx.amount) || 0;
            const amount_bdt = Number(tx.amount_bdt) || 0;

            stats.total_usd += amount_usd;
            stats.total_bdt_liability += amount_bdt;

            global_liability_bdt += amount_bdt;
        });
    }

    // Process Payments
    let global_paid_bdt = 0;
    if (payments) {
        payments.forEach(pay => {
            const stats = getStats(pay.supplier_id);
            const amount_bdt = Number(pay.amount) || 0;

            stats.total_bdt_paid += amount_bdt;
            global_paid_bdt += amount_bdt;
        });
    }

    // Calculate Aggregates
    // We use GLOBAL Net for Supplier Dues to match user expectation (Liability - Paid)
    // This includes advance payments (negative dues) which offset the total liability.
    const total_supplier_dues = global_liability_bdt - global_paid_bdt;

    let active_float_usd = 0;

    supplierMap.forEach(stats => {
        // Dues for this specific supplier
        const dues = stats.total_bdt_liability - stats.total_bdt_paid;

        // Calculate Float USD for this supplier based on THEIR average rate
        // If they have 0 USD volume (e.g. advance payment only), use fallback rate
        const avg_rate = stats.total_usd > 0 ? (stats.total_bdt_liability / stats.total_usd) : 120;

        // Float = Dues / Rate
        // We include negative float (advances) to reflect true net position
        active_float_usd += (dues / avg_rate);
    });

    // Settlement Score (Global)
    // Formula: (Total Paid / Total Liability) * 100
    let settlement_score = 100;
    if (global_liability_bdt > 0) {
        const ratio = global_paid_bdt / global_liability_bdt;
        settlement_score = Math.min(100, ratio * 100);
    } else if (total_volume_usd === 0) {
        settlement_score = 100;
    }

    // 3. Chart Data (Reuse existing logic)
    const forecast = await getCashFlowForecast(30);

    // 4. Recent Activity Feed (Merge & Sort)
    const recentForex = (forexData || []).slice(0, 5).map(tx => ({
        type: 'forex',
        id: tx.id,
        date: tx.transaction_date,
        amount: tx.amount,
        description: `Forex Inflow`,
        status: tx.status
    }));

    const recentInvoices = (invoices || []).slice(0, 5).map(inv => ({
        type: 'invoice',
        id: inv.id,
        date: inv.created_at,
        amount: inv.total_amount,
        description: `Invoice #${inv.invoice_number}`,
        status: inv.status
    }));

    const recentPayments = (payments || []).slice(0, 5).map(pay => ({
        type: 'payment',
        id: pay.id,
        date: pay.date,
        amount: pay.amount,
        description: `Supplier Payment`,
        status: 'completed'
    }));

    const recent_activity = [...recentForex, ...recentInvoices, ...recentPayments]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

    return {
        metrics: {
            total_volume_usd,
            active_float_usd,
            total_supplier_dues,
            settlement_score,
            // Deprecated but kept for type safety if needed temporarily
            total_receivables: 0,
            total_payables: total_supplier_dues,
            net_position: 0,
            health_score: settlement_score
        },
        chart_data: forecast.data,
        recent_activity,
        user_name: user?.email?.split('@')[0] || 'User'
    };
}
