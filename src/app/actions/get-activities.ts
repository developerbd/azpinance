'use server';

import { createClient } from '@/lib/supabase/server';
import { format, subDays } from 'date-fns';

export interface ActivityFilter {
    type?: 'all' | 'forex' | 'payment' | 'invoice';
    startDate?: Date;
    endDate?: Date;
}

export interface ActivityItem {
    reference_id: string;
    type: 'forex' | 'payment' | 'invoice';
    amount: number;
    currency: string;
    status: string;
    description: string;
    created_at: string;
    transaction_date: string;
}

export interface GetActivitiesResponse {
    data: ActivityItem[];
    count: number;
    error?: string;
}

export async function getActivities(
    page: number = 1,
    limit: number = 20,
    filters: ActivityFilter = { type: 'all' }
): Promise<GetActivitiesResponse> {
    const supabase = await createClient();

    // Check Auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { data: [], count: 0, error: 'Unauthorized' };
    }

    let query = supabase
        .from('view_all_activities')
        .select('*', { count: 'exact' });

    // Apply Type Filter
    if (filters.type && filters.type !== 'all') {
        query = query.eq('type', filters.type);
    }

    // Apply Date Filters
    if (filters.startDate) {
        // Assume filtering by created_at for "Activity Feed" logic, 
        // OR transaction_date? User wants to see "Activities", so created_at is usually the feed timeline.
        // But user can also filter by "Date". Let's stick to created_at for the Feed aspect.
        query = query.gte('created_at', filters.startDate.toISOString());
    }
    if (filters.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Sorting: Always newest first
    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
        console.error('Error fetching activities:', error);
        return { data: [], count: 0, error: error.message };
    }

    return {
        data: (data as ActivityItem[]) || [],
        count: count || 0
    };
}
