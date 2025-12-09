'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { encrypt } from '@/lib/crypto';

interface UpdateSmtpParams {
    host: string;
    port: number;
    user: string;
    password?: string; // Optional if not changing
    from_email: string;
    sender_name?: string;
}

export async function updateSmtpSettings(params: UpdateSmtpParams) {
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

    // Prepare update data
    const updateData: {
        host: string;
        port: number;
        user: string;
        from_email: string;
        sender_name?: string;
        password?: string;
        updated_at: string;
    } = {
        host: params.host,
        port: params.port,
        user: params.user,
        from_email: params.from_email,
        sender_name: params.sender_name,
        updated_at: new Date().toISOString(),
    };

    // Encrypt password before storing (only if provided)
    if (params.password) {
        try {
            updateData.password = encrypt(params.password);
        } catch (error) {
            console.error('Failed to encrypt SMTP password:', error);
            return { error: 'Failed to encrypt password' };
        }
    }

    const { error } = await supabase
        .from('smtp_settings')
        .upsert({
            id: 1,
            ...updateData,
        });

    if (error) {
        console.error('Error updating SMTP settings:', error);
        return { error: 'Failed to update settings' };
    }

    revalidatePath('/settings/general');
    return { success: true };
}
