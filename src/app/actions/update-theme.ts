'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateTheme(theme: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    const { error } = await supabase
        .from('users')
        .update({ theme })
        .eq('id', user.id);

    if (error) {
        console.error('Error updating theme:', error);
        return { error: 'Failed to update theme' };
    }

    revalidatePath('/', 'layout');
    return { success: true };
}
