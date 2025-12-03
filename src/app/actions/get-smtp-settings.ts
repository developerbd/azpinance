'use server';

import { createClient } from '@/lib/supabase/server';

export async function getSmtpSettings() {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { error: 'Unauthorized: Admin access required' };
    }

    const { data, error } = await supabase
        .from('smtp_settings')
        .select('*')
        .eq('id', 1)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching SMTP settings:', error);
        return { error: 'Failed to fetch settings' };
    }

    if (!data) {
        return {
            host: '',
            port: 587,
            user: '',
            password: '',
            from_email: '',
            sender_name: 'Biz Ad Finance',
        };
    }

    return data;
}
