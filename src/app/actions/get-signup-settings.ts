'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export async function getSignupSettings() {
    const supabase = createAdminClient();

    // System settings has ID 1
    const { data, error } = await supabase
        .from('system_settings')
        .select('signup_enabled')
        .single();

    if (error) {
        console.error('Error fetching signup settings:', error);
        return { signup_enabled: true }; // Default to true if error (fail safe) or false? True is better for UX usually, but for security, false. Let's stick to True as default was logic.
    }

    return { signup_enabled: data?.signup_enabled ?? true };
}
