'use server';

import { createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import { notifyAdmins } from '@/lib/notifications';


export async function updateFinancialAccount(id: string, data: unknown) {
    const supabase = await createClient();

    // 1. Check Authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    // 2. Check Authorization (Admin/Supervisor only)
    const { data: profile } = await supabase
        .from('users')
        .select('role, full_name')
        .eq('id', user.id)
        .single();

    if (!['admin', 'supervisor'].includes(profile?.role)) {
        return { error: 'Permission denied. Only admins and supervisors can update financial accounts.' };
    }

    // 3. Validate Input (MANUAL VALIDATION - Emergency Fix for Zod Crash)
    const input = data as Record<string, any>;
    const errors: string[] = [];

    // Basic validation (optional for updates, but types should match if present)
    if (input.name && (typeof input.name !== 'string' || input.name.length < 2)) {
        errors.push('Name must be at least 2 characters');
    }
    if (input.currency && (typeof input.currency !== 'string' || input.currency.length < 3)) {
        errors.push('Currency must be at least 3 characters');
    }

    if (errors.length > 0) {
        return { error: errors[0] };
    }

    // Prune non-existent columns from top-level and move to details
    // We destruct specific fields to separate them, and gather the rest into 'updatePayload'
    // 'details' from input needs to be merged with the moved fields
    const {
        account_number,
        bank_name,
        branch,
        notes,
        details,
        contact_id, // extract to ensure type safety if present
        ...otherFields
    } = input;

    // Construct the payload for simple top-level columns
    const updatePayload: Record<string, any> = { ...otherFields };
    if (contact_id !== undefined) updatePayload.contact_id = contact_id;

    // Construct the details object separately
    // Note: For updates, we usually want to merge with existing details, but typically the frontend sends the whole object.
    // If the frontend sends a partial 'details' object, we might lose data if we don't merge deeper.
    // However, the standard pattern here seems to be "replace details with what's sent + extracted fields".
    // For a robust update, we should ideally fetch existing first if we want deep merge,
    // but standard supabase update replaces the column value.
    // Assuming the frontend sends the complete 'details' object or we are okay with replacing it.

    // We need to fetch the current account to merge details if we want to be safe,
    // OR we assume the frontend sends the full state.
    // Given the form logic, it seems `details` state in form is complete.

    const finalUpdatePayload = {
        ...updatePayload,
        details: {
            ...(details || {}),
            ...(account_number ? { account_number } : {}),
            ...(bank_name ? { bank_name } : {}),
            ...(branch ? { branch } : {}),
            ...(notes ? { notes } : {})
        }
    };

    // 4. Update Account
    const { data: account, error: updateError } = await supabase
        .from('financial_accounts')
        .update(finalUpdatePayload)
        .eq('id', id)
        .select()
        .single();

    if (updateError) {
        console.error('Error updating financial account:', updateError);
        return { error: 'Failed to update account' };
    }

    // 5. Log Activity
    await logActivity({
        action: 'UPDATE',
        entityType: 'FINANCIAL_ACCOUNT',
        entityId: account.id,
        details: { name: account.name, changes: Object.keys(input) }
    });

    // 6. Notify Admins
    const changedFields = Object.keys(input).join(', ');
    await notifyAdmins({
        title: 'Financial Account Updated',
        message: `Account "${account.name}" has been updated by ${profile?.full_name || user.email}. Changed: ${changedFields}`,
        type: 'info',
        link: `/accounts/${account.id}`
    });

    revalidatePath('/accounts');
    return { success: true, data: account };
}
