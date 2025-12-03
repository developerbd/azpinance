'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/logger';

export async function deleteContact(id: string) {
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
        .delete()
        .eq('id', id);

    if (error) return { error: error.message };

    await logActivity({
        action: 'DELETE',
        entityType: 'CONTACT',
        entityId: id,
        details: { contact_id: id }
    });

    revalidatePath('/contacts');
    return { success: true };
}
