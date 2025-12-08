'use server';

import { createClient } from '@/lib/supabase/server';

export async function getContacts() {
    const supabase = await createClient();

    // Check Authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching contacts:', error);
        return { error: 'Failed to fetch contacts' };
    }

    return { data };
}
