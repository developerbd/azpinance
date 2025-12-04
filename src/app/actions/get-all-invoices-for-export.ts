'use server';

import { createClient } from '@/lib/supabase/server';

export async function getAllInvoicesForExport() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Check role if needed, but for export usually any auth user or specific roles
    // Assuming basic auth is enough for now, or match existing permissions

    const { data, error } = await supabase
        .from('invoices')
        .select(`
            *,
            contacts (name, email)
        `)
        .order('issue_date', { ascending: false });

    if (error) {
        console.error('Error fetching invoices for export:', error);
        return { error: 'Failed to fetch invoices' };
    }

    return { data };
}
