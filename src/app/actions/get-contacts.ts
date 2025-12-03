'use server';

import { createClient } from '@/lib/supabase/server';

export async function getContacts() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('contacts')
        .select('id, name, type')
        .order('name');

    if (error) return { error: error.message };
    return { data };
}
