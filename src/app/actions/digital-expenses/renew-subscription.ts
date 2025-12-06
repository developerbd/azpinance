'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/logger';
import { addMonths, addYears, parseISO, format } from 'date-fns';

export async function renewSubscription(data: {
    masterId: string;
    amount: number;
    transactionId: string;
    paymentMethod: string;
    date: string; // Transaction date
}) {
    const supabase = await createClient();

    // Check Auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data: profile } = await supabase
        .from('users')
        .select('role, full_name')
        .eq('id', user.id)
        .single();

    if (!['accountant', 'supervisor', 'admin'].includes(profile?.role)) {
        return { error: 'Permission denied' };
    }

    // 1. Fetch Master Subscription
    const { data: master, error: masterError } = await supabase
        .from('digital_expenses')
        .select('*')
        .eq('id', data.masterId)
        .single();

    if (masterError || !master) {
        return { error: 'Subscription not found' };
    }

    // 2. Insert Payment Record
    const { error: insertError } = await supabase
        .from('digital_expenses')
        .insert({
            title: `${master.title} (Renewal)`, // Or just keep same title? Usually helpful to differentiate
            category: master.category,
            vendor_platform: master.vendor_platform,
            is_recurring: false, // This specific payment is not the recurring master
            amount_usd: data.amount,
            payment_method: data.paymentMethod,
            transaction_date: data.date,
            transaction_id: data.transactionId,
            status: 'approved', // Auto-approve renewals? Or pending? Spec says: "Insert Record... Update Master". Usually renewals are recorded as 'paid'. Let's assume 'approved' or 'pending' based on role. Even Accountant can create payments. Let's set to 'approved' as it's a "Mark as Paid" feature.
            user_id: user.id,
            parent_id: master.id
        });

    if (insertError) return { error: 'Failed to create payment record: ' + insertError.message };

    // 3. Update Master Subscription Renewal Date
    // Calculate new date based on CURRENT next_renewal_date + Frequency
    // If next_renewal_date is null/old, maybe base on today? 
    // Spec says: "Update the next_renewal_date of the Master Subscription by adding the frequency duration"

    const baseDate = master.next_renewal_date ? parseISO(master.next_renewal_date) : new Date();
    // If it's very overdue, should we bump from TODAY or from the OLD date?
    // "Mark as Paid" usually implies we paid for the cycle that was due.
    // So if it was due Jan 1st, and we pay it Jan 5th, the next one is Feb 1st.
    // So we add to the baseDate.

    let nextDate = baseDate;
    if (master.frequency === 'monthly') nextDate = addMonths(baseDate, 1);
    else if (master.frequency === 'quarterly') nextDate = addMonths(baseDate, 3);
    else if (master.frequency === 'yearly') nextDate = addYears(baseDate, 1);

    const { error: updateError } = await supabase
        .from('digital_expenses')
        .update({ next_renewal_date: format(nextDate, 'yyyy-MM-dd') })
        .eq('id', master.id);

    if (updateError) return { error: 'Failed to update renewal date: ' + updateError.message };

    // Log Activity
    await logActivity({
        action: 'RENEWAL',
        entityType: 'DIGITAL_EXPENSE',
        details: { masterId: master.id, amount: data.amount, newDate: format(nextDate, 'yyyy-MM-dd') }
    });

    revalidatePath('/digital-expenses');
    revalidatePath('/dashboard');
    return { success: true };
}
