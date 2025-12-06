'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/logger';

export async function deleteDigitalExpense(id: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    // Only Admin can delete
    if (profile?.role !== 'admin') {
        return { error: 'Permission denied. Only Admins can delete expenses.' };
    }

    const { error } = await supabase
        .from('digital_expenses')
        .delete()
        .eq('id', id);

    if (error) return { error: error.message };

    await logActivity({
        action: 'DELETE',
        entityType: 'DIGITAL_EXPENSE',
        details: { id }
    });

    revalidatePath('/digital-expenses');
    return { success: true };
}
