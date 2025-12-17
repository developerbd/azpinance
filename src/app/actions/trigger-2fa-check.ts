'use server';

import { createClient } from '@/lib/supabase/server';

export async function triggerAdmin2FACheck() {
    const supabase = await createClient();

    // 1. Check if user is super admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    const { data: profile } = await supabase
        .from('users')
        .select('is_super_admin')
        .eq('id', user.id)
        .single();

    if (!profile?.is_super_admin) {
        return { error: 'Only super admins can trigger this action' };
    }

    // 2. Call the cron endpoint
    try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/cron/admin-2fa-check`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.CRON_SECRET || 'dev-secret'}`,
            },
        });

        if (!response.ok) {
            const error = await response.text();
            return { error: `Failed to run 2FA check: ${error}` };
        }

        const result = await response.json();
        return { success: true, data: result };
    } catch (error: any) {
        return { error: `Failed to trigger 2FA check: ${error.message}` };
    }
}
