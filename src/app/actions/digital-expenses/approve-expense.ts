'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/logger';

export async function approveDigitalExpense(id: string, status: 'approved' | 'rejected') {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!['supervisor', 'admin'].includes(profile?.role)) {
        return { error: 'Permission denied. Only Supervisors and Admins can approve/reject.' };
    }

    const { data: existing } = await supabase
        .from('digital_expenses')
        .select('status')
        .eq('id', id)
        .single();

    const { error } = await supabase
        .from('digital_expenses')
        .update({ status })
        .eq('id', id);

    if (error) return { error: error.message };

    // Audit Log
    if (existing && existing.status !== status) {
        try {
            const { error: auditError } = await supabase
                .from('expense_audit_logs')
                .insert({
                    expense_id: id,
                    performed_by: user.id,
                    action: status === 'approved' ? 'Approved' : 'Rejected',
                    change_log: {
                        status: { from: existing.status, to: status }
                    },
                    timestamp: new Date().toISOString()
                });
            if (auditError) console.error('Audit Log Error:', auditError);
        } catch (err) {
            console.error('Audit Log Exception:', err);
        }
    }

    await logActivity({
        action: status === 'approved' ? 'APPROVE' : 'REJECT',
        entityType: 'DIGITAL_EXPENSE',
        details: { id, status }
    });

    revalidatePath('/digital-expenses');
    return { success: true };
}
