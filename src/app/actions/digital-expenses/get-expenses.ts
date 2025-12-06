'use server';

import { createClient } from '@/lib/supabase/server';
import { format, parseISO } from 'date-fns';

export async function getDigitalExpenses(filters?: { category?: string; payment_method?: string, recurring_only?: boolean }) {
    const supabase = await createClient();

    let query = supabase
        .from('digital_expenses')
        .select('*')
        .order('transaction_date', { ascending: false });

    if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
    }

    if (filters?.payment_method && filters.payment_method !== 'all') {
        query = query.eq('payment_method', filters.payment_method);
    }

    if (filters?.recurring_only) {
        query = query.eq('is_recurring', true);
    }

    const { data: expenses, error } = await query;

    if (error) {
        console.error('Error fetching expenses detailed:', JSON.stringify(error, null, 2));
        return [];
    }

    // Manual join for users
    const userIds = Array.from(new Set(expenses.map(e => e.user_id).filter(Boolean)));
    let userMap: Record<string, any> = {};

    if (userIds.length > 0) {
        const { data: users } = await supabase
            .from('users')
            .select('id, full_name')
            .in('id', userIds);

        if (users) {
            userMap = users.reduce((acc, user) => {
                acc[user.id] = user;
                return acc;
            }, {} as Record<string, any>);
        }
    }

    const enrichedData = expenses.map(e => ({
        ...e,
        users: userMap[e.user_id] || { full_name: 'Unknown' }
    }));

    return enrichedData;
}
