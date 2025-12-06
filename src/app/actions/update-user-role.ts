'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/logger';

export async function updateUserRole(userId: string, newRole: string) {
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

    // Supervisor restrictions
    if (currentUserProfile?.role === 'supervisor') {
        // Cannot promote to Admin or Supervisor
        if (['admin', 'supervisor'].includes(newRole)) {
            return { error: 'Forbidden: Supervisors cannot assign Admin or Supervisor roles' };
        }

        // Cannot modify Admin or Supervisor users
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

        // Check 2FA status for the target user if promoting to admin
        if (newRole === 'admin') {
            const { data: { user: targetAuthUser }, error: authError } = await adminSupabase.auth.admin.getUserById(userId);

            if (authError || !targetAuthUser) {
                return { error: 'Failed to verify user authentication details' };
            }

            const has2FA = targetAuthUser.factors && targetAuthUser.factors.length > 0 && targetAuthUser.factors.some(f => f.status === 'verified');

            if (has2FA) {
                // User has 2FA, clear any existing grace period
                const { error } = await adminSupabase
                    .from('users')
                    .update({
                        role: newRole,
                        admin_grace_period_start: null
                    })
                    .eq('id', userId);
                if (error) throw error;

            } else {
                // User does NOT have 2FA
                const { data: targetUserProfile } = await adminSupabase
                    .from('users')
                    .select('admin_grace_period_start')
                    .eq('id', userId)
                    .single();

                const gracePeriodStart = targetUserProfile?.admin_grace_period_start ? new Date(targetUserProfile.admin_grace_period_start) : null;
                const now = new Date();

                if (gracePeriodStart) {
                    const daysDiff = (now.getTime() - gracePeriodStart.getTime()) / (1000 * 3600 * 24);
                    if (daysDiff > 7) {
                        return { error: 'User has exceeded the 7-day 2FA grace period. They must enable 2FA before being made Admin.' };
                    }
                }

                // If existing grace period is active OR this is a fresh start (null), we allow (continuing or starting grace period)
                // If it was null, we set it to NOW.
                const newGraceStart = gracePeriodStart ? undefined : new Date().toISOString(); // undefined means don't update if exists

                const updateData: any = { role: newRole };
                if (newGraceStart) {
                    updateData.admin_grace_period_start = newGraceStart;
                }

                const { error } = await adminSupabase
                    .from('users')
                    .update(updateData)
                    .eq('id', userId);
                if (error) throw error;

                // Send Warning Notification
                // We'll use a simplified notification insertion here. Ideally use the notification helper if it supported direct email efficiently without recreating logic.
                // For now, inserting into notifications table is the baseline requirement "get a notification immediately".
                // Triggering the email would be better but requires logic duplication or a new helper.
                // I'll stick to in-app notification + console log for now, and maybe add email trigger if I can import a helper easily.
                await adminSupabase.from('notifications').insert({
                    user_id: userId,
                    title: 'Action Required: Enable 2FA',
                    message: 'You have been promoted to Admin. You have 7 days to enable Two-Factor Authentication (2FA), otherwise you will be demoted to Supervisor.',
                    type: 'warning',
                    link: '/profile'
                });
            }

        } else {
            // Not making admin (e.g. downgrading or changing to other role)
            const { error } = await adminSupabase
                .from('users')
                .update({ role: newRole })
                .eq('id', userId);
            if (error) throw error;
        }

        await logActivity({
            action: 'UPDATE_ROLE',
            entityType: 'USER',
            entityId: userId,
            details: { new_role: newRole }
        });

        revalidatePath('/settings');
        return { success: true };
    } catch (error: any) {
        console.error("Update role error:", error);
        return { error: error.message || 'Failed to update role' };
    }
}
