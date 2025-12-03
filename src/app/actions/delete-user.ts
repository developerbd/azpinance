'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function deleteUser(userId: string) {
    const supabase = await createClient();

    // 1. Check if current user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    const { data: currentUserProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (currentUserProfile?.role !== 'admin') {
        return { error: 'Forbidden: Admin access required' };
    }

    // 2. Delete user using Admin Client
    try {
        const adminSupabase = createAdminClient();

        // Delete from auth.users - this will cascade to public.users if configured, 
        // but we should rely on Supabase Auth deletion to be the source of truth.
        const { error } = await adminSupabase.auth.admin.deleteUser(userId);

        if (error) throw error;

        revalidatePath('/settings');
        return { success: true };
    } catch (error: any) {
        console.error("Delete user error:", error);
        return { error: error.message || 'Failed to delete user' };
    }
}
