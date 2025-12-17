'use server';

import { createClient } from '@/lib/supabase/server';
import { runAdmin2FACheck } from '@/lib/admin-2fa-logic';

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

    // 2. Run the check directly (no fetch loopback)
    try {
        const results = await runAdmin2FACheck();
        return { success: true, data: { results } };
    } catch (error: any) {
        return { error: `Failed to trigger 2FA check: ${error.message}` };
    }
}
