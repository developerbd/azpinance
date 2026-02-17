'use server';

import { createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import { notifyAdmins } from '@/lib/notifications';


type FinancialAccountInput = {
    name: string;
    scope: 'local' | 'international';
    category: 'internal' | 'receiving' | 'third_party';
    type: 'bank' | 'cash' | 'mobile_finance' | 'payoneer' | 'paypal' | 'wise' | 'crypto' | 'other';
    currency: string;
    status: 'active' | 'inactive';
    contact_id?: string | null;
    details?: Record<string, any>;
    custom_fields?: Record<string, any>;
    attachments?: string[];
    notes?: string;
    account_number?: string;
    bank_name?: string;
    branch?: string;
};


export async function createFinancialAccount(data: unknown) {
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
        return { error: 'Permission denied. Only admins and supervisors can create financial accounts.' };
    }

    // 3. Validate Input (MANUAL VALIDATION - Emergency Fix for Zod Crash)
    const input = data as Record<string, any>;
    const errors: string[] = [];

    if (!input.name || typeof input.name !== 'string' || input.name.length < 2) {
        errors.push('Name must be at least 2 characters');
    }
    if (!input.currency || typeof input.currency !== 'string' || input.currency.length < 3) {
        errors.push('Currency must be at least 3 characters');
    }

    const validTypes = ['bank', 'cash', 'mobile_finance', 'payoneer', 'paypal', 'wise', 'crypto', 'other'];
    if (!validTypes.includes(input.type)) {
        errors.push(`Invalid account type. Must be one of: ${validTypes.join(', ')}`);
    }

    if (input.category === 'third_party' && !input.contact_id) {
        errors.push('Supplier/Contact is required for third-party accounts');
    }

    if (errors.length > 0) {
        return { error: errors[0] }; // Return first error to match previous behavior
    }

    const validatedData: FinancialAccountInput = {
        name: input.name,
        scope: input.scope || 'local',
        category: input.category || 'internal',
        type: input.type,
        currency: input.currency,
        status: input.status || 'active',
        contact_id: input.contact_id || null,
        details: {
            ...input.details,
            ...(input.account_number ? { account_number: input.account_number } : {}),
            ...(input.bank_name ? { bank_name: input.bank_name } : {}),
            ...(input.branch ? { branch: input.branch } : {}),
            ...(input.notes ? { notes: input.notes } : {})
        },
        custom_fields: input.custom_fields,
        attachments: input.attachments
    };

    // 4. Create Account
    const { data: account, error: insertError } = await supabase
        .from('financial_accounts')
        .insert([validatedData])
        .select()
        .single();

    if (insertError) {
        console.error('Error creating financial account:', insertError);
        return { error: `Failed to create account: ${insertError.message} (${insertError.details || ''})` };
    }

    // 5. Log Activity
    await logActivity({
        action: 'CREATE',
        entityType: 'FINANCIAL_ACCOUNT',
        entityId: account.id,
        details: { name: account.name, type: account.type }
    });

    // 6. Notify Admins
    await notifyAdmins({
        title: 'New Financial Account Created',
        message: `A new ${account.type} account "${account.name}" has been created by ${profile?.full_name || user.email}.`,
        type: 'info',
        link: `/accounts/${account.id}`
    });

    revalidatePath('/accounts');
    return { success: true, data: account };
}
