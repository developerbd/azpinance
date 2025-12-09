'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/logger';
import { digitalExpenseSchema } from '@/lib/schemas';
import { addMonths, addYears, format, parseISO } from 'date-fns';

export async function updateDigitalExpense(id: string, data: unknown) {
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Check role
    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    // Check existing record
    const { data: existing } = await supabase
        .from('digital_expenses')
        .select('*')
        .eq('id', id)
        .single();

    if (!existing) return { error: 'Expense not found' };

    // RBAC Logic
    // Accountant: Can Edit entries ONLY if status is Pending
    // Supervisor/Admin: Can Edit ANY record

    const isAccountant = profile?.role === 'accountant';
    const isSupervisorOrAdmin = ['supervisor', 'admin'].includes(profile?.role);

    if (isAccountant) {
        if (existing.status !== 'pending') {
            return { error: 'Cannot edit approved or rejected expenses' };
        }
    } else if (!isSupervisorOrAdmin) {
        return { error: 'Permission denied' };
    }

    // Validate data
    const validation = digitalExpenseSchema.safeParse(data);
    if (!validation.success) {
        return { error: validation.error.issues[0].message };
    }

    const updateData = { ...validation.data };

    // Recalculate renewal if needed
    if (updateData.is_recurring && updateData.frequency && (!updateData.next_renewal_date || updateData.transaction_date !== existing.transaction_date)) {
        const transDate = parseISO(updateData.transaction_date);
        let nextDate = transDate;

        if (updateData.frequency === 'monthly') nextDate = addMonths(transDate, 1);
        else if (updateData.frequency === 'quarterly') nextDate = addMonths(transDate, 3);
        else if (updateData.frequency === 'yearly') nextDate = addYears(transDate, 1);

        updateData.next_renewal_date = format(nextDate, 'yyyy-MM-dd');
    }

    // Calculate Diff
    const changes: Record<string, { from: any; to: any }> = {};
    const sensitiveFields = ['updated_at', 'created_at', 'id', 'user_id'];

    Object.keys(updateData).forEach(key => {
        if (sensitiveFields.includes(key)) return;

        // Loose comparison since form data might be string vs number from DB
        const newVal = (updateData as any)[key];
        const oldVal = existing[key];

        // normalize for comparison
        const isDiff = JSON.stringify(newVal) !== JSON.stringify(oldVal); // basic check

        // Refined check for numbers (string "50" vs number 50)
        let reallyDiff = isDiff;
        if (typeof oldVal === 'number' && !isNaN(Number(newVal))) {
            if (Number(oldVal) === Number(newVal)) reallyDiff = false;
        }

        if (reallyDiff) {
            changes[key] = { from: oldVal, to: newVal };
        }
    });

    const { error: updateError } = await supabase
        .from('digital_expenses')
        .update(updateData)
        .eq('id', id);

    if (updateError) return { error: updateError.message };

    // Audit Log
    if (Object.keys(changes).length > 0) {
        try {
            const { error: auditError } = await supabase
                .from('expense_audit_logs')
                .insert({
                    expense_id: id,
                    performed_by: user.id,
                    action: 'Updated',
                    change_log: changes,
                    timestamp: new Date().toISOString()
                });
            if (auditError) console.error('Audit Log Error:', auditError);
        } catch (err) {
            console.error('Audit Log Exception:', err);
        }
    }

    // Still keep the generic activity log for global feed if needed, or replace?
    // User asked for specific Audit Log system. I will keep the generic one as backup/global feed 
    // unless instructed otherwise, but maybe redundant. 
    // Let's keep it for "Activity Log" page compatibility.
    await logActivity({
        action: 'UPDATE',
        entityType: 'DIGITAL_EXPENSE',
        details: { id, title: updateData.title }
    });

    revalidatePath('/digital-expenses');
    return { success: true };
}
