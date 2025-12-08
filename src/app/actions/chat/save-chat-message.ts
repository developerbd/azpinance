'use server';

import { createClient } from '@/lib/supabase/server';

interface SaveMessageParams {
    sessionId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    tokens?: number;
}

export async function saveChatMessage({ sessionId, role, content, tokens = 0 }: SaveMessageParams) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    // Verify user owns this session
    const { data: session } = await supabase
        .from('chat_sessions')
        .select('user_id, title, message_count')
        .eq('id', sessionId)
        .single();

    if (!session || session.user_id !== user.id) {
        return { error: 'Session not found or unauthorized' };
    }

    // Save the message
    const { data: message, error: messageError } = await supabase
        .from('chat_messages')
        .insert({
            session_id: sessionId,
            role,
            content,
            tokens,
        })
        .select()
        .single();

    if (messageError) {
        console.error('Error saving chat message:', messageError);
        return { error: messageError.message };
    }

    // Update session title if this is the first user message
    if (role === 'user' && session.message_count === 0) {
        const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
        await supabase
            .from('chat_sessions')
            .update({ title })
            .eq('id', sessionId);
    }

    // Update total tokens
    await supabase
        .from('chat_sessions')
        .update({
            total_tokens: supabase.rpc('increment', { x: tokens }),
            last_activity_at: new Date().toISOString()
        })
        .eq('id', sessionId);

    return { data: message };
}
