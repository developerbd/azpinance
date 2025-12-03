'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface UpdateSettingsParams {
    email_enabled: boolean;
    whatsapp_enabled: boolean;
    discord_enabled: boolean;
    discord_webhook_url?: string;
    whatsapp_number?: string;
    email_address?: string;
}

export async function updateNotificationSettings(params: UpdateSettingsParams) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    const { error } = await supabase
        .from('notification_settings')
        .upsert({
            user_id: user.id,
            ...params,
            updated_at: new Date().toISOString(),
        });

    if (error) {
        console.error('Error updating notification settings:', error);
        return { error: 'Failed to update settings' };
    }

    revalidatePath('/settings/notifications');
    return { success: true };
}
