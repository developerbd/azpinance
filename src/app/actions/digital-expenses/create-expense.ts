'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/logger';
import { notifyAdmins } from '@/lib/notifications';
import { digitalExpenseSchema } from '@/lib/schemas';
import { addMonths, addYears, format, parseISO } from 'date-fns';

export async function createDigitalExpense(data: unknown) {
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Check role
    const { data: profile } = await supabase
        .from('users')
        .select('role, full_name')
        .eq('id', user.id)
        .single();

    if (!['accountant', 'supervisor', 'admin'].includes(profile?.role)) {
        return { error: 'Permission denied' };
    }

    // Validate data
    const validation = digitalExpenseSchema.safeParse(data);
    if (!validation.success) {
        return { error: validation.error.issues[0].message };
    }

    const expenseData = { ...validation.data };

    // Auto-calculate next renewal date if recurring
    if (expenseData.is_recurring && expenseData.frequency && !expenseData.next_renewal_date) {
        const transDate = parseISO(expenseData.transaction_date);
        let nextDate = transDate;

        if (expenseData.frequency === 'monthly') nextDate = addMonths(transDate, 1);
        else if (expenseData.frequency === 'quarterly') nextDate = addMonths(transDate, 3);
        else if (expenseData.frequency === 'yearly') nextDate = addYears(transDate, 1);

        expenseData.next_renewal_date = format(nextDate, 'yyyy-MM-dd');
    }

    // Default status is pending, unless Admin auto-approves? (Sticking to spec: Pending default)
    // Actually, Spec says "Status (Pending (Default))". So we stick to pending.

    const { data: newExpense, error } = await supabase
        .from('digital_expenses')
        .insert({
            ...expenseData,
            user_id: user.id
        })
        .select()
        .single();

    if (error) return { error: error.message };

    // Audit Log
    try {
        const { error: auditError } = await supabase
            .from('expense_audit_logs')
            .insert({
                expense_id: newExpense.id,
                performed_by: user.id,
                action: 'Created',
                change_log: {},
                timestamp: new Date().toISOString()
            });
        if (auditError) console.error('Audit Log Error:', auditError);
    } catch (err) {
        console.error('Audit Log Exception:', err);
    }

    // Log activity
    await logActivity({
        action: 'CREATE',
        entityType: 'DIGITAL_EXPENSE',
        details: { title: expenseData.title, amount: expenseData.amount_usd }
    });

    // Notify Admins
    if (profile?.role !== 'admin') {
        await notifyAdmins({
            title: 'New Digital Expense',
            message: `${profile?.full_name} submitted a new expense: ${expenseData.title} ($${expenseData.amount_usd})`,
            type: 'info',
            link: '/digital-expenses'
        });
    }

    revalidatePath('/digital-expenses');
    return { success: true };
}
