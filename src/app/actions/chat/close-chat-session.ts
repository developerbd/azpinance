'use server';

import { createClient } from '@/lib/supabase/server';

export async function closeChatSession(sessionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    // Verify user owns this session
    const { data: session } = await supabase
        .from('chat_sessions')
        .select('user_id')
        .eq('id', sessionId)
        .single();

    if (!session || session.user_id !== user.id) {
        return { error: 'Session not found or unauthorized' };
    }

    const { error } = await supabase
        .from('chat_sessions')
        .update({
            status: 'closed',
            closed_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

    if (error) {
        console.error('Error closing chat session:', error);
        return { error: error.message };
    }

    return { success: true };
}
