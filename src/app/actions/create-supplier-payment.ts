'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { notifyAdmins } from '@/lib/notifications';
import { logActivity } from '@/lib/logger';
import { SupplierPaymentSchema, type SupplierPaymentInput } from '@/lib/validations';
import { z } from 'zod';

export async function createSupplierPayment(data: unknown) {
    const supabase = await createClient();

    // 1. Check Authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    const { data: profile } = await supabase
        .from('users')
        .select('role, full_name')
        .eq('id', user.id)
        .single();

    if (profile?.role === 'guest') {
        return { error: 'Permission denied. Guests cannot create payments.' };
    }

    // 2. Validate Input
    const validatedFields = SupplierPaymentSchema.safeParse(data);

    if (!validatedFields.success) {
        return { error: validatedFields.error.issues[0]?.message || 'Validation error' };
    }

    const validatedData = validatedFields.data;

    // 3. (Profile fetched above for role check)

    // 4. Create Payment
    const { data: payment, error: insertError } = await supabase
        .from('supplier_payments')
        .insert([{ ...validatedData, user_id: user.id }])
        .select()
        .single();

    if (insertError) {
        console.error('Error creating supplier payment:', insertError);
        return { error: `Failed to create payment: ${insertError.message} (${insertError.details || ''})` };
    }

    // 5. Log Activity
    await logActivity({
        action: 'CREATE',
        entityType: 'SUPPLIER_PAYMENT',
        entityId: payment.id,
        details: {
            amount: validatedData.amount,
            supplier_id: validatedData.supplier_id,
            destination_account: validatedData.destination_account_id,
            from_account: validatedData.from_account_id
        }
    });

    // 6. Notify Admins
    await notifyAdmins({
        title: 'New Supplier Payment',
        message: `A new supplier payment of ${validatedData.amount} has been created by ${profile?.full_name || user.email}.`,
        type: 'info',
        link: `/contacts/${validatedData.supplier_id}`
    });

    revalidatePath('/contacts');
    revalidatePath(`/contacts/${validatedData.supplier_id}`);
    revalidatePath('/transactions/supplier-payments');
    return { success: true, data: payment };
}
