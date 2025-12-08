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

    // Check if target user is super admin
    const { data: targetUser } = await supabase
        .from('users')
        .select('role, is_super_admin')
        .eq('id', userId)
        .single();

    if (targetUser?.is_super_admin) {
        return { error: 'Cannot modify super admin role' };
    }

    // Supervisor restrictions
    if (currentUserProfile?.role === 'supervisor') {
        // Cannot promote to Admin or Supervisor
        if (['admin', 'supervisor'].includes(newRole)) {
            return { error: 'Forbidden: Supervisors cannot assign Admin or Supervisor roles' };
        }

        // Cannot modify Admin or Supervisor users
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
                    .select('admin_grace_period_start, is_2fa_exempt')
                    .eq('id', userId)
                    .single();

                // Check if user is exempt from 2FA requirements
                if (targetUserProfile?.is_2fa_exempt) {
                    // User is exempt from 2FA, just update role without grace period or notifications
                    const { error } = await adminSupabase
                        .from('users')
                        .update({
                            role: newRole,
                            admin_grace_period_start: null // Clear any existing grace period
                        })
                        .eq('id', userId);
                    if (error) throw error;
                } else {
                    // User is NOT exempt, apply normal 2FA policy
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
                    await adminSupabase.from('notifications').insert({
                        user_id: userId,
                        title: 'Action Required: Enable 2FA',
                        message: 'You have been promoted to Admin. You have 7 days to enable Two-Factor Authentication (2FA), otherwise you will be demoted to Supervisor.',
                        type: 'warning',
                        link: '/profile'
                    });
                }
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
