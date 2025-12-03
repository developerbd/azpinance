'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/logger';

export async function updateContactStatus(id: string, newStatus: string) {
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Check role
    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { error: 'Permission denied' };
    }

    const { error } = await supabase
        .from('contacts')
        .update({ status: newStatus })
        .eq('id', id);

    if (error) return { error: error.message };

    await logActivity({
        action: 'UPDATE_STATUS',
        entityType: 'CONTACT',
        entityId: id,
        details: { status: newStatus }
    });

    revalidatePath('/contacts');
    return { success: true };
}
