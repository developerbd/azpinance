import { createClient } from '@/lib/supabase/server';

import { headers } from 'next/headers';

interface LogActivityParams {
    action: string;
    entityType: string;
    entityId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
}

export async function logActivity({
    action,
    entityType,
    entityId,
    details,
    ipAddress,
    userAgent,
}: LogActivityParams) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    // If IP/UA not provided, try to get from headers
    let ip = ipAddress;
    let ua = userAgent;

    if (!ip || !ua) {
        const headersList = await headers();
        if (!ip) ip = headersList.get('x-forwarded-for') || 'unknown';
        if (!ua) ua = headersList.get('user-agent') || 'unknown';
    }

    const { error } = await supabase.from('activity_logs').insert({
        user_id: user.id,
        action_type: action,
        entity_type: entityType,
        entity_id: entityId,
        details: sanitizeDetails(details),
        ip_address: ip,
        user_agent: ua,
    });
    if (error) {
        console.error('Error logging activity:', error);
        // Don't throw, just log error to avoid breaking the main flow
    } else {
        console.log('Activity logged successfully:', action, entityType, entityId);
    }
}

function sanitizeDetails(details: any): any {
    if (!details) return details;
    if (typeof details !== 'object') return details;

    const sensitiveKeys = ['password', 'token', 'secret', 'credit_card', 'cvv', 'api_key'];
    const sanitized = { ...details };

    for (const key in sanitized) {
        if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
            sanitized[key] = '***REDACTED***';
        } else if (typeof sanitized[key] === 'object') {
            sanitized[key] = sanitizeDetails(sanitized[key]);
        }
    }

    return sanitized;
}
