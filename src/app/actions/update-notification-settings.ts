'use server';

import { createClient } from '@/lib/supabase/server';

interface UpdateSettingsParams {
    email_enabled: boolean;
    email_address: string;
}

export async function updateNotificationSettings(settings: UpdateSettingsParams) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    const { error } = await supabase
        .from('notification_settings')
        .upsert({
            user_id: user.id,
            email_enabled: settings.email_enabled,
            email_address: settings.email_address,
        }, {
            onConflict: 'user_id'
        });

    if (error) {
        console.error('Error updating notification settings:', error);
        return { error: 'Failed to update settings' };
    }

    return { success: true };
}
