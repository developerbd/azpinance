'use server';

import { createClient } from '@/lib/supabase/server';

export interface AuditLogEntry {
    id: string;
    action: string;
    performed_by: string;
    performed_by_name?: string; // We will fill this manually since relation might be complex or just direct join
    change_log: Record<string, { from: any; to: any }>;
    timestamp: string;
    users?: {
        full_name: string;
        email: string;
    };
}

export async function getAuditLogs(expenseId: string): Promise<AuditLogEntry[]> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('expense_audit_logs')
            .select(`
                *,
                users (
                    full_name,
                    email
                )
            `)
            .eq('expense_id', expenseId)
            .order('timestamp', { ascending: false });

        if (error) {
            console.error('Error fetching audit logs:', error);
            return [];
        }

        return (data || []) as AuditLogEntry[];
    } catch (error) {
        console.error('Unexpected error in getAuditLogs:', error);
        return [];
    }
}
