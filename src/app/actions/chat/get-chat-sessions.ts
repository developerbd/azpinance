'use server';

import { createClient } from '@/lib/supabase/server';

export async function getChatSessions(status?: 'active' | 'idle' | 'closed' | 'archived') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    let query = supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_activity_at', { ascending: false });

    if (status) {
        query = query.eq('status', status);
    } else {
        // By default, don't show archived sessions
        query = query.neq('status', 'archived');
    }

    const { data, error } = await query.limit(50);

    if (error) {
        console.error('Error fetching chat sessions:', error);
        return { error: error.message };
    }

    return { data };
}
