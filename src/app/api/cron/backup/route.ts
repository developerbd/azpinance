import { NextRequest, NextResponse } from 'next/server';
import { BackupService } from '@/lib/backup/backup-service';
import { driveClient } from '@/lib/backup/google-drive';

import { createAdminClient } from '@/lib/supabase/admin';

export const maxDuration = 300; // 5 minutes max for backup

export async function GET(request: NextRequest) {
    // 1. Verify Cron Secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    // 2. Refresh Tokens (Try DB first)
    const supabase = createAdminClient();
    let refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    const { data: tokenData } = await supabase
        .from('integration_tokens')
        .select('refresh_token')
        .eq('service_name', 'google_drive')
        .single();

    if (tokenData?.refresh_token) {
        refreshToken = tokenData.refresh_token;
    }

    if (!refreshToken) {
        return NextResponse.json({ error: 'Google Drive not connected (No Token)' }, { status: 500 });
    }

    try {
        driveClient.setCredentials({ refresh_token: refreshToken });
        // Force refresh to get access token
        const { token } = await driveClient.getAccessToken(); // This automatically refreshes if needed

        // 3. Perform Backup
        const backupService = new BackupService(process.env.DATABASE_URL!);

        // Default to Full Backup for Weekly Cron
        const result = await backupService.performBackup('full', {
            refresh_token: refreshToken,
            access_token: token
        });

        // 4. Rotation
        await backupService.rotate(5, { refresh_token: refreshToken, access_token: token });

        return NextResponse.json({ success: true, fileId: result.id });
    } catch (error: any) {
        console.error('Cron Backup Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
