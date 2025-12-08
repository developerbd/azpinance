'use server';

import { createClient } from '@/lib/supabase/server';

export async function updateSessionActivity(sessionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { error } = await supabase
        .from('chat_sessions')
        .update({
            last_activity_at: new Date().toISOString(),
            status: 'active', // Reset to active if it was idle
        })
        .eq('id', sessionId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error updating session activity:', error);
        return { error: error.message };
    }

    return { success: true };
}
