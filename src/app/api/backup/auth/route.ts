import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/backup/google-drive';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    // 1. Security Check: Only Admins can initiate connection
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Generate Auth URL
    const url = getAuthUrl();

    // 3. Redirect
    return NextResponse.redirect(url);
}
