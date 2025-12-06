'use server';

import { createClient } from '@/lib/supabase/server';
import { format, parseISO, eachMonthOfInterval, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';

export interface AnalyticsData {
    total_spend: number;
    average_burn_rate: number;
    by_category: { name: string; value: number }[];
    by_nature: { name: string; value: number }[];
    monthly_trend: { month: string; amount: number }[];
    vendor_stats: { name: string; total: number; count: number }[];
    raw_expenses: any[]; // For export
}

export async function getExpenseAnalytics(startDate: string, endDate: string): Promise<AnalyticsData> {
    const supabase = await createClient();

    // 1. Fetch raw data filtered by date and status
    const { data: expenses, error } = await supabase
        .from('digital_expenses')
        .select('*')
        .neq('status', 'rejected')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', { ascending: false });

    if (error) {
        console.error('Error fetching analytics:', error);
        throw new Error('Failed to fetch analytics data');
    }

    const safeExpenses = expenses || [];

    // 2. Calculations
    const total_spend = safeExpenses.reduce((sum, e) => sum + (Number(e.amount_usd) || 0), 0);

    // Burn Rate (Average per month in the selected range)
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const months = eachMonthOfInterval({ start, end });
    const monthCount = months.length || 1;
    const average_burn_rate = total_spend / monthCount;

    // By Category
    const categoryMap = new Map<string, number>();
    safeExpenses.forEach(e => {
        const cat = e.category || 'Uncategorized';
        const amt = Number(e.amount_usd) || 0;
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + amt);
    });
    const by_category = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));

    // By Nature (Recurring vs One-time)
    const natureMap = new Map<string, number>();
    safeExpenses.forEach(e => {
        const type = e.is_recurring ? 'Recurring' : 'One-time';
        const amt = Number(e.amount_usd) || 0;
        natureMap.set(type, (natureMap.get(type) || 0) + amt);
    });
    const by_nature = Array.from(natureMap.entries()).map(([name, value]) => ({ name, value }));

    // Monthly Trend
    // Initialize all months in range with 0
    const trendMap = new Map<string, number>();
    months.forEach(date => {
        trendMap.set(format(date, 'MMM yyyy'), 0);
    });

    safeExpenses.forEach(e => {
        if (!e.transaction_date) return;
        const date = parseISO(e.transaction_date);
        const monthKey = format(date, 'MMM yyyy');
        // Only add if it falls within our generated months (it should, given the query)
        if (trendMap.has(monthKey)) {
            const amt = Number(e.amount_usd) || 0;
            trendMap.set(monthKey, (trendMap.get(monthKey) || 0) + amt);
        }
    });
    const monthly_trend = Array.from(trendMap.entries())
        .map(([month, amount]) => ({ month, amount }))
    // sort by date strictly? eachMonthOfInterval already gives sorted, map preserves insertion order mostly, 
    // but let's trust the map iteration order for now or we can parse back.
    // Array.from on Map usually preserves insertion order in JS.

    // Vendor Stats
    const vendorMap = new Map<string, { total: number; count: number }>();
    safeExpenses.forEach(e => {
        const vendor = e.vendor_platform || 'Unknown';
        const current = vendorMap.get(vendor) || { total: 0, count: 0 };
        const amt = Number(e.amount_usd) || 0;
        vendorMap.set(vendor, {
            total: current.total + amt,
            count: current.count + 1
        });
    });
    const vendor_stats = Array.from(vendorMap.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.total - a.total); // Top spenders first

    return {
        total_spend,
        average_burn_rate,
        by_category,
        by_nature,
        monthly_trend,
        vendor_stats,
        raw_expenses: safeExpenses
    };
}
