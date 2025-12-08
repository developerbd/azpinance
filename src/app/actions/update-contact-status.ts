'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/logger';
import { notifyAdmins } from '@/lib/notifications';

export async function updateContactStatus(id: string, newStatus: string) {
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

    // Get contact details before update
    const { data: contact } = await supabase
        .from('contacts')
        .select('name, type')
        .eq('id', id)
        .single();

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

    // Notify Admins
    await notifyAdmins({
        title: 'Contact Status Updated',
        message: `${contact?.type || 'Contact'} "${contact?.name}" has been ${newStatus} by ${profile?.full_name || 'an admin'}.`,
        type: newStatus === 'active' ? 'success' : 'warning',
        link: `/contacts/${id}`
    });

    revalidatePath('/contacts');
    return { success: true };
}
