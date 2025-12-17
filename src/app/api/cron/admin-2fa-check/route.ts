import { NextRequest, NextResponse } from 'next/server';
import { runAdmin2FACheck } from '@/lib/admin-2fa-logic';

// CRON_SECRET should be set in environment variables and used in the header of the request
// e.g. curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron/admin-2fa-check

export async function GET(req: NextRequest) {
    // 1. Authorization Check
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const results = await runAdmin2FACheck();
        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        console.error('2FA Check Cron Failed:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
