import { createAdminClient } from '@/lib/supabase/admin';

export interface Admin2FACheckResults {
    checked: number;
    downgraded: number;
    reminded: number;
    compliant: number;
    errors?: { id: string; error: any }[];
}

export async function runAdmin2FACheck(): Promise<Admin2FACheckResults> {
    const adminSupabase = createAdminClient();

    // 2. Fetch all admins
    const { data: admins, error } = await adminSupabase
        .from('users')
        .select('*')
        .eq('role', 'admin');

    if (error || !admins) {
        throw new Error('Failed to fetch admins');
    }

    const results: Admin2FACheckResults = {
        checked: 0,
        downgraded: 0,
        reminded: 0,
        compliant: 0
    };

    for (const admin of admins) {
        results.checked++;

        // Skip super admin
        if (admin.is_super_admin) {
            results.compliant++;
            continue;
        }

        if (admin.is_2fa_exempt) {
            results.compliant++;
            // Clear grace period if set
            if (admin.admin_grace_period_start) {
                await adminSupabase.from('users').update({ admin_grace_period_start: null }).eq('id', admin.id);
            }
            continue;
        }

        // 3. Check 2FA Status via Auth Admin API
        const { data: { user: authUser }, error: authError } = await adminSupabase.auth.admin.getUserById(admin.id);

        if (authError || !authUser) {
            console.error(`Failed to fetch auth user for admin ${admin.id}`);
            continue;
        }

        const has2FA = authUser.factors && authUser.factors.length > 0 && authUser.factors.some(f => f.status === 'verified');

        if (has2FA) {
            // Compliant
            results.compliant++;
            // Clear grace period if set
            if (admin.admin_grace_period_start) {
                await adminSupabase.from('users').update({ admin_grace_period_start: null }).eq('id', admin.id);
            }
        } else {
            // Non-Compliant
            const graceStart = admin.admin_grace_period_start ? new Date(admin.admin_grace_period_start) : null;

            // If checking a "Legacy" admin who doesn't have a start time, set it to NOW.
            if (!graceStart) {
                const now = new Date().toISOString();
                const { error: updateError } = await adminSupabase.from('users').update({ admin_grace_period_start: now }).eq('id', admin.id);

                if (updateError) {
                    console.error('Update failed:', updateError);
                    results.errors = results.errors || [];
                    results.errors.push({ id: admin.id, error: updateError });
                }

                // Notify them
                await adminSupabase.from('notifications').insert({
                    user_id: admin.id,
                    title: 'Action Required: Enable 2FA',
                    message: 'As per new security policy, you must enable 2FA within 7 days or you will be demoted to Supervisor.',
                    type: 'warning',
                    link: '/profile'
                });

                // We treat them as assuming the grace period just started, no downgrade yet.
                results.reminded++;
                continue;
            }

            // Check if Grace Period Expired
            const now = new Date();
            const daysDiff = (now.getTime() - graceStart.getTime()) / (1000 * 3600 * 24);

            if (daysDiff > 7) {
                // EXPIRED -> DOWNGRADE
                await adminSupabase.from('users').update({ role: 'supervisor' }).eq('id', admin.id);

                // Notify
                await adminSupabase.from('notifications').insert({
                    user_id: admin.id,
                    title: 'Role Changed: Demoted to Supervisor',
                    message: 'You have been demoted to Supervisor because you failed to enable 2FA within the 7-day grace period. Contact another Admin after enabling 2FA to be reinstated.',
                    type: 'error',
                    link: '/profile'
                });
                results.downgraded++;
            } else {
                // WARNING / REMINDER
                const daysLeft = Math.ceil(7 - daysDiff);
                // Only change today: We want to avoid spamming everyday?
                // The original logic was sending a notification every time this runs.
                // Assuming "every 6 hours" or "daily" run, this is fine.
                await adminSupabase.from('notifications').insert({
                    user_id: admin.id,
                    title: '2FA Reminder',
                    message: `Warning: You have ${daysLeft} days left to enable 2FA or you will be demoted.`,
                    type: 'warning',
                    link: '/profile'
                });
                results.reminded++;
            }
        }
    }

    return results;
}
