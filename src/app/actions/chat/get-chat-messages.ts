'use server';

import { createClient } from '@/lib/supabase/server';

interface GetMessagesOptions {
    sessionId: string;
    slidingWindow?: boolean; // If true, return only last 10 messages
}

export async function getChatMessages({ sessionId, slidingWindow = false }: GetMessagesOptions) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    // Verify user owns this session
    const { data: session } = await supabase
        .from('chat_sessions')
        .select('user_id, summary')
        .eq('id', sessionId)
        .single();

    if (!session || session.user_id !== user.id) {
        return { error: 'Session not found or unauthorized' };
    }

    let query = supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

    if (slidingWindow) {
        // Get only the last 10 messages for sliding window
        const { data: allMessages } = await query;
        const recentMessages = allMessages?.slice(-10) || [];

        return {
            data: recentMessages,
            summary: session.summary || null,
            hasOlderMessages: (allMessages?.length || 0) > 10
        };
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching chat messages:', error);
        return { error: error.message };
    }

    return { data, summary: session.summary || null };
}
