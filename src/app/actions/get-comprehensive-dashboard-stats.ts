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

    // Check Authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('Unauthorized');
    }

    // 1. Fetch Core Data with limits to prevent excessive data fetching
    // NOTE: sorting by created_at in main query to catch recently entered data, 
    // but typically metrics might require 'transaction_date'.
    // However, if we recently entered old data, we want it included in calculations?
    // Actually, limits are simple hacks. Real solution is aggregation. 
    // Keeping limits high (1000) makes it safer for small-medium usage.
    const [forexResult, invoicesResult, paymentsResult, forecast] = await Promise.all([
        supabase
            .from('forex_transactions')
            .select('id, amount, amount_bdt, transaction_date, created_at, status, contact_id')
            //.eq('status', 'approved') // REMOVED: Fetch all for activity feed
            .order('created_at', { ascending: false })
            .limit(1000),
        supabase
            .from('invoices')
            .select('id, total_amount, status, due_date, created_at, invoice_number')
            .neq('status', 'paid')
            .order('created_at', { ascending: false })
            .limit(500),
        supabase
            .from('supplier_payments')
            .select('id, amount, date, created_at, supplier_id')
            .order('created_at', { ascending: false })
            .limit(1000),
        getCashFlowForecast(30)
    ]);

    const forexData = forexResult.data;
    const invoices = invoicesResult.data;
    const payments = paymentsResult.data;

    // 2. Calculate Metrics

    // Total Volume (USD) - Global (Only Approved)
    const approvedForex = forexData?.filter(tx => tx.status === 'approved') || [];
    const total_volume_usd = approvedForex.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0) || 0;

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
    if (approvedForex.length > 0) {
        approvedForex.forEach(tx => {
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
    // forecast is moved to Promise.all above

    // 4. Recent Activity Feed (Merge & Sort) - Only top 10 for performance
    // 4. Recent Activity Feed (Merge & Sort)
    // We need a specific query for Forex Activity to include PENDING transactions and potentially use updated_at
    // But since we can't easily change the main Promise.all without fetching duplicate data or complex logic,
    // we will just use the fetched data if it's sufficient, OR add a specific activity query.
    // Given the requirement "Pending" should show, and the main query filters "Approved", we MUST fetch separately or change the main query.
    // Changing main query to fetch ALL and filtering in JS for metrics is safer for small datasets (limit 1000).

    // Activity Mapping
    const recentForex = (forexData || []).map(tx => ({
        type: 'forex',
        id: tx.id,
        date: tx.created_at, // Activity Time
        transactionDate: tx.transaction_date, // Display Date
        amount: tx.amount,
        description: `Forex Inflow`,
        status: tx.status
    }));

    const recentInvoices = (invoices || []).map(inv => ({
        type: 'invoice',
        id: inv.id,
        date: inv.created_at,
        transactionDate: inv.created_at, // Use created_at as fallback for invoices
        amount: inv.total_amount,
        description: `Invoice #${inv.invoice_number}`,
        status: inv.status
    }));

    const recentPayments = (payments || []).map(pay => ({
        type: 'payment',
        id: pay.id,
        date: pay.created_at, // Activity Time
        transactionDate: pay.date, // Display Date (Transaction Date)
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
