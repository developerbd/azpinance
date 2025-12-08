import { NextResponse } from 'next/server';

export async function GET() {
    const hasKey = !!process.env.OPENAI_API_KEY;
    const keyLength = process.env.OPENAI_API_KEY?.length || 0;
    const nodeEnv = process.env.NODE_ENV;

    return NextResponse.json({
        status: 'ok',
        env_check: {
            has_openai_key: hasKey,
            key_length: keyLength,
            node_env: nodeEnv,
        },
        message: hasKey ? 'Key detected' : 'Key MISSING',
    });
}
