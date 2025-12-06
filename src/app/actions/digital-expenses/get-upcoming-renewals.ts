'use server';

import { createClient } from '@/lib/supabase/server';
import { addDays, format } from 'date-fns';

export async function getUpcomingRenewals() {
    const supabase = await createClient();
    const today = format(new Date(), 'yyyy-MM-dd');
    const limitDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');

    // Fetch active recurring expenses where next_renewal_date is soon
    // Active means status != rejected

    const { data, error } = await supabase
        .from('digital_expenses')
        .select('*')
        .eq('is_recurring', true)
        .neq('status', 'rejected')
        .lte('next_renewal_date', limitDate) // Date <= 30 days from now
        .order('next_renewal_date', { ascending: true });

    if (error) {
        console.error('Error fetching renewals:', error);
        return [];
    }

    // Filter out items that might have null next_renewal_date (though schema allows it optional, logic implies it exists for recurring)
    return data?.filter(item => item.next_renewal_date) || [];
}
