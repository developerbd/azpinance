'use server';

import { createClient } from '@/lib/supabase/server';

export async function getNotificationSettings() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching notification settings:', error);
        return { error: 'Failed to fetch settings' };
    }

    // Return default if no settings found
    if (!data) {
        return {
            email_enabled: false,
            whatsapp_enabled: false,
            discord_enabled: false,
            discord_webhook_url: '',
            whatsapp_number: '',
            email_address: user.email || '',
        };
    }

    return data;
}
