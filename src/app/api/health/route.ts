import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const start = performance.now();
        const supabase = await createClient();

        // Lightweight query to check DB connection
        const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });

        const end = performance.now();
        const latency = Math.round(end - start);

        if (error) {
            console.error('Health check database error:', error);
            return NextResponse.json(
                { status: 'error', message: 'Database unreachable', latency },
                { status: 503 }
            );
        }

        return NextResponse.json({
            status: 'ok',
            latency,
            timestamp: new Date().toISOString()
        });

    } catch (e) {
        console.error('Health check failed:', e);
        return NextResponse.json(
            { status: 'error', message: 'Internal system failure' },
            { status: 500 }
        );
    }
}
