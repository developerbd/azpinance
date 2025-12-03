'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/logger';

export async function updateUserStatus(userId: string, newStatus: string) {
    const supabase = await createClient();

    // 1. Check if current user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    const { data: currentUserProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!['admin', 'supervisor'].includes(currentUserProfile?.role)) {
        return { error: 'Forbidden: Admin or Supervisor access required' };
    }

    // Check target user role if supervisor
    if (currentUserProfile?.role === 'supervisor') {
        const { data: targetUser } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

        if (!targetUser || ['admin', 'supervisor'].includes(targetUser.role)) {
            return { error: 'Forbidden: Supervisors cannot modify Admin or Supervisor accounts' };
        }
    }

    // 2. Update user using Admin Client
    try {
        const adminSupabase = createAdminClient();

        const { error } = await adminSupabase
            .from('users')
            .update({ status: newStatus })
            .eq('id', userId);

        if (error) throw error;

        await logActivity({
            action: 'UPDATE_STATUS',
            entityType: 'USER',
            entityId: userId,
            details: { new_status: newStatus }
        });

        revalidatePath('/settings');
        return { success: true };
    } catch (error: any) {
        console.error("Update status error:", error);
        return { error: error.message || 'Failed to update status' };
    }
}
