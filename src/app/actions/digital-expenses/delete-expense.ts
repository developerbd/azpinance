'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/logger';
import { notifyAdmins } from '@/lib/notifications';

export async function deleteDigitalExpense(id: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data: profile } = await supabase
        .from('users')
        .select('role, full_name')
        .eq('id', user.id)
        .single();

    // Only Admin can delete
    if (profile?.role !== 'admin') {
        return { error: 'Permission denied. Only Admins can delete expenses.' };
    }

    // Get expense details before deletion
    const { data: expense } = await supabase
        .from('digital_expenses')
        .select('title, amount_usd')
        .eq('id', id)
        .single();

    const { error } = await supabase
        .from('digital_expenses')
        .delete()
        .eq('id', id);

    if (error) return { error: error.message };

    await logActivity({
        action: 'DELETE',
        entityType: 'DIGITAL_EXPENSE',
        details: { id, title: expense?.title }
    });

    // Notify Admins
    await notifyAdmins({
        title: 'Digital Expense Deleted',
        message: `Expense "${expense?.title}" ($${expense?.amount_usd}) has been deleted by ${profile?.full_name || 'an admin'}.`,
        type: 'warning',
        link: '/digital-expenses'
    });

    revalidatePath('/digital-expenses');
    return { success: true };
}
