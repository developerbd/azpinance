import { NextRequest, NextResponse } from 'next/server';
import { getTokens } from '@/lib/backup/google-drive';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get('code');
    const error = request.nextUrl.searchParams.get('error');

    if (error) {
        return NextResponse.redirect(new URL('/settings/backup?error=oauth_failed', request.url));
    }

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    try {
        // Exchange code for tokens
        const tokens = await getTokens(code);

        // Save to DB (using Admin Client to bypass RLS if needed, or ensuring current user is admin)
        // We verified admin on init, but good to verify again or use service role for system tokens.
        // Using Admin Client is safer for "System Configurations" that belong to the app, not a specific user.
        const supabaseAdmin = createAdminClient();

        const payload = {
            service_name: 'google_drive',
            refresh_token: tokens.refresh_token,
            access_token: tokens.access_token,
            expires_at: tokens.expiry_date,
            updated_at: new Date().toISOString()
        };

        // Upsert tokens
        const { error: dbError } = await supabaseAdmin
            .from('integration_tokens')
            .upsert(payload, { onConflict: 'service_name' });

        if (dbError) {
            console.error('Failed to save tokens:', dbError);
            return NextResponse.redirect(new URL('/settings/backup?error=db_save_failed', request.url));
        }

        return NextResponse.redirect(new URL('/settings/backup?success=connected', request.url));

    } catch (err) {
        console.error('OAuth Callback Error:', err);
        return NextResponse.redirect(new URL('/settings/backup?error=token_exchange_failed', request.url));
    }
}
