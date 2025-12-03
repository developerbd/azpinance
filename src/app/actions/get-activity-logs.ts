'use server';

import { createClient } from '@/lib/supabase/server';

export async function getActivityLogs(
    page: number = 1,
    limit: number = 20,
    actionType?: string,
    userId?: string,
    dateFrom?: string,
    dateTo?: string
) {
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Check role (Admin only?)
    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { error: 'Permission denied' };
    }

    let query = supabase
        .from('activity_logs')
        .select(`
            *,
            users (
                full_name,
                email
            )
        `, { count: 'exact' });

    if (actionType && actionType !== 'all') {
        query = query.eq('action_type', actionType);
    }

    if (userId && userId !== 'all') {
        query = query.eq('user_id', userId);
    }

    if (dateFrom) {
        query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
        query = query.lte('created_at', dateTo); // Maybe add time to end of day
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query
        .order('created_at', { ascending: false })
        .range(from, to);

    const { data, count, error } = await query;

    if (error) {
        console.error('Error fetching activity logs:', error);
        return { error: error.message };
    }

    console.log('Fetched logs:', data?.length, 'Total:', count);
    return { data, count };
}
