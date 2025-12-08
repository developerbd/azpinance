'use server';

import { createClient } from '@/lib/supabase/server';

export async function createChatSession() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    // Check if user has reached max active sessions (5)
    const { count } = await supabase
        .from('chat_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active');

    if (count && count >= 5) {
        return { error: 'Maximum active sessions reached (5). Please close an existing session.' };
    }

    const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
            user_id: user.id,
            title: 'New Conversation',
            status: 'active',
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating chat session:', error);
        return { error: error.message };
    }

    return { data };
}
