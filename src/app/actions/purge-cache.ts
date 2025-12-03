'use server';

// Action to purge system cache

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/logger';

export async function purgeCache() {
    const supabase = await createClient();

    // Check auth and role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!['admin', 'supervisor'].includes(profile?.role)) {
        return { error: 'Permission denied' };
    }

    try {
        revalidatePath('/', 'layout');

        await logActivity({
            action: 'PURGE_CACHE',
            entityType: 'SYSTEM',
            details: { scope: 'layout' }
        });

        return { success: true };
    } catch (error) {
        return { error: 'Failed to purge cache' };
    }
}
