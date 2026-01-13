'use server';

import { BackupService } from '@/lib/backup/backup-service';
import { driveClient, listBackups } from '@/lib/backup/google-drive';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Helper to get token
async function getDriveToken(supabase: any) {
    // 1. Try DB
    const { data } = await supabase
        .from('integration_tokens')
        .select('refresh_token')
        .eq('service_name', 'google_drive')
        .single();

    if (data?.refresh_token) return data.refresh_token;

    // 2. Fallback to ENV
    return process.env.GOOGLE_REFRESH_TOKEN;
}

export async function triggerBackup(type: 'db' | 'codebase' | 'full') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check Auth & Role
    if (!user) return { error: 'Unauthorized' };
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return { error: 'Permission denied' };

    const refreshToken = await getDriveToken(supabase);

    if (!refreshToken) {
        return { error: 'Google Drive not connected. Please connect from settings.' };
    }

    try {
        driveClient.setCredentials({ refresh_token: refreshToken });
        const { token } = await driveClient.getAccessToken();

        const service = new BackupService(process.env.DATABASE_URL!);
        const result = await service.performBackup(type, { refresh_token: refreshToken, access_token: token });

        revalidatePath('/settings/backup');
        return { success: true, fileId: result.id };
    } catch (error: any) {
        console.error('Backup Action Failed:', error);
        return { error: error.message };
    }
}

export async function getBackupsList() {
    const supabase = await createClient(); // Use server client to access DB
    const refreshToken = await getDriveToken(supabase);

    if (!refreshToken) return [];

    try {
        driveClient.setCredentials({ refresh_token: refreshToken });
        const files = await listBackups(20);
        return files;
    } catch (error) {
        console.error('Failed to list backups:', error);
        return [];
    }
}

export async function getDriveConnectionStatus() {
    const supabase = await createClient();
    const refreshToken = await getDriveToken(supabase);

    if (!refreshToken) {
        return { isConnected: false };
    }

    // Optional: Verify token validity
    try {
        driveClient.setCredentials({ refresh_token: refreshToken });
        await driveClient.getAccessToken(); // Will throw if revoked
        return { isConnected: true };
    } catch (error) {
        return { isConnected: false, error: 'Token expired or revoked' };
    }
}
