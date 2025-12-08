'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/logger';
import { notifyAdmins } from '@/lib/notifications';

export async function deleteContact(id: string) {
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Check role
    const { data: profile } = await supabase
        .from('users')
        .select('role, full_name')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { error: 'Permission denied' };
    }

    // Get contact details before deletion
    const { data: contact } = await supabase
        .from('contacts')
        .select('name, type')
        .eq('id', id)
        .single();

    const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

    if (error) return { error: error.message };

    await logActivity({
        action: 'DELETE',
        entityType: 'CONTACT',
        entityId: id,
        details: { contact_id: id, name: contact?.name }
    });

    // Notify Admins
    await notifyAdmins({
        title: 'Contact Deleted',
        message: `${contact?.type || 'Contact'} "${contact?.name}" has been deleted by ${profile?.full_name || 'an admin'}.`,
        type: 'warning',
        link: '/contacts'
    });

    revalidatePath('/contacts');
    return { success: true };
}
