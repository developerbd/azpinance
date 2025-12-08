'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/logger';

export async function toggle2FAExemption(userId: string, exempt: boolean) {
    const supabase = await createClient();

    // 1. Check if current user is super admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    const { data: currentUserProfile } = await supabase
        .from('users')
        .select('is_super_admin')
        .eq('id', user.id)
        .single();

    if (!currentUserProfile?.is_super_admin) {
        return { error: 'Forbidden: Only super admin can manage 2FA exemptions' };
    }

    // 2. Prevent super admin from exempting themselves
    if (userId === user.id) {
        return { error: 'Super admin cannot be exempt from 2FA' };
    }

    // 3. Check if target user is an admin
    const { data: targetUser } = await supabase
        .from('users')
        .select('role, username, is_super_admin')
        .eq('id', userId)
        .single();

    if (!targetUser) {
        return { error: 'User not found' };
    }

    if (targetUser.role !== 'admin') {
        return { error: '2FA exemption can only be granted to admin users' };
    }

    // 4. Update exemption status using Admin Client
    try {
        const adminSupabase = createAdminClient();

        const { error } = await adminSupabase
            .from('users')
            .update({ is_2fa_exempt: exempt })
            .eq('id', userId);

        if (error) throw error;

        await logActivity({
            action: exempt ? 'GRANT_2FA_EXEMPTION' : 'REVOKE_2FA_EXEMPTION',
            entityType: 'USER',
            entityId: userId,
            details: { username: targetUser.username, exempt }
        });

        revalidatePath('/settings');
        return { success: true };
    } catch (error: any) {
        console.error("Toggle 2FA exemption error:", error);
        return { error: error.message || 'Failed to update 2FA exemption' };
    }
}
