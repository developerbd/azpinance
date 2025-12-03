'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function markForexPaid(id: string) {
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

    if (!['admin', 'supervisor'].includes(profile?.role)) {
        return { error: 'Permission denied' };
    }

    const { error } = await supabase
        .from('forex_transactions')
        .update({ payment_status: 'paid' })
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/transactions/forex');
    return { success: true };
}
