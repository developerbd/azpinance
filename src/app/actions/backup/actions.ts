'use server';

import { BackupService } from '@/lib/backup/backup-service';
import { listBackups, deleteBackup } from '@/lib/backup/google-drive';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
async function getDriveCredentials(supabase: any) {
    // 1. Try DB
    const { data } = await supabase
        .from('integration_tokens')
        .select('*')
        .eq('service_name', 'google_drive')
        .single();

    if (data?.refresh_token && data?.client_id && data?.client_secret) {
        return {
            clientId: data.client_id,
            clientSecret: data.client_secret,
            refreshToken: data.refresh_token
        };
    }

    // 2. Fallback to ENV (Legacy/Local)
    if (process.env.GOOGLE_REFRESH_TOKEN) {
        return {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            refreshToken: process.env.GOOGLE_REFRESH_TOKEN
        };
    }

    return null;
}

export async function saveManualCredentials(clientId: string, clientSecret: string, refreshToken: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check Auth & Role
    if (!user) return { error: 'Unauthorized' };
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return { error: 'Permission denied' };

    // Clean Inputs
    const cleanClientId = clientId.trim();
    const cleanClientSecret = clientSecret.trim();
    const cleanRefreshToken = refreshToken.trim();



    // 1. VERIFY CREDENTIALS FIRST
    try {
        const testClient = new google.auth.OAuth2(cleanClientId, cleanClientSecret);
        testClient.setCredentials({ refresh_token: cleanRefreshToken });

        // Force refresh to prove validity
        const { token } = await testClient.getAccessToken();

        if (!token) throw new Error('No access token returned');

    } catch (error: any) {
        console.error('Credential Verification Failed:', error.message);
        return { error: `Authentication Failed: ${error.message || 'Invalid Credentials'}` };
    }

    // 2. UPSERT credentials (Only if verification passed)
    const { error } = await supabase
        .from('integration_tokens')
        .upsert({
            service_name: 'google_drive',
            client_id: cleanClientId,
            client_secret: cleanClientSecret,
            refresh_token: cleanRefreshToken,
            updated_at: new Date().toISOString()
        });

    if (error) {
        console.error('Failed to save creds:', error);
        return { error: 'Failed to save credentials' };
    }

    revalidatePath('/settings/backup');
    return { success: true };
}

export async function triggerBackup(type: 'db' | 'codebase' | 'full') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check Auth & Role
    if (!user) return { error: 'Unauthorized' };
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return { error: 'Permission denied' };

    const creds = await getDriveCredentials(supabase);

    if (!creds) {
        return { error: 'Google Drive not connected. Please connect from settings.' };
    }

    // We no longer strictly need DATABASE_URL for the backup service itself,
    // but we keep the variable check if needed for other things, or remove it.
    // The service now uses the Supabase Client.

    try {
        // Initialize simple client just to get token
        const tempClient = new google.auth.OAuth2(creds.clientId, creds.clientSecret);
        tempClient.setCredentials({ refresh_token: creds.refreshToken });
        const { token } = await tempClient.getAccessToken();

        // Pass the authenticated supabase client (admin role verified above)
        const service = new BackupService(supabase);
        const result = await service.performBackup(type, {
            refresh_token: creds.refreshToken,
            access_token: token,
            client_id: creds.clientId,      // Pass full creds
            client_secret: creds.clientSecret
        });

        revalidatePath('/settings/backup');
        return { success: true, fileId: (result as any).id };
    } catch (error: any) {
        console.error('Backup Action Failed:', error);
        return { error: error.message };
    }
}

export async function getBackupsList() {
    const supabase = await createClient(); // Use server client to access DB
    const creds = await getDriveCredentials(supabase);

    if (!creds) return [];

    try {
        // We need to re-instantiate client with DB creds if they exist
        const client = new google.auth.OAuth2(creds.clientId, creds.clientSecret);
        client.setCredentials({ refresh_token: creds.refreshToken });

        const files = await listBackups(20, client); // Pass client explicitly
        return files;
    } catch (error) {
        console.error('Failed to list backups:', error);
        return [];
    }
}

export async function getDriveConnectionStatus() {
    const supabase = await createClient();
    const creds = await getDriveCredentials(supabase);

    if (!creds) {
        return { isConnected: false, status: 'missing_creds' };
    }

    // Optional: Verify token validity
    try {
        const client = new google.auth.OAuth2(creds.clientId, creds.clientSecret);
        client.setCredentials({ refresh_token: creds.refreshToken });
        await client.getAccessToken(); // Will throw if revoked
        return { isConnected: true, status: 'active' };
    } catch (error: any) {
        console.error('Drive Connection Check Failed:', error.message);
        return { isConnected: false, status: 'error', error: error.message || 'Token expired or invalid credentials' };
    }
}

// Disconnect (Delete Credentials)
export async function disconnectDrive() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    // Check admin role
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return { error: 'Permission denied' };

    try {
        const { error } = await supabase
            .from('integration_tokens')
            .delete()
            .eq('service_name', 'google_drive');

        if (error) throw error;

        revalidatePath('/settings/backup');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to disconnect:', error);
        return { error: 'Failed to disconnect from Google Drive' };
    }
}

// Delete Backup File
export async function deleteBackupAction(fileId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    // Check admin role
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return { error: 'Permission denied' };

    const creds = await getDriveCredentials(supabase);
    if (!creds) return { error: 'No Google Drive connection' };

    try {
        const client = new google.auth.OAuth2(creds.clientId, creds.clientSecret);
        client.setCredentials({ refresh_token: creds.refreshToken });

        await deleteBackup(fileId, client); // Ensure google-drive.ts deleteBackup accepts client
        revalidatePath('/settings/backup');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to delete backup:', error);
        return { error: 'Failed to delete backup file' };
    }
}
