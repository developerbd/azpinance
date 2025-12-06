'use server';

import { createClient } from '@/lib/supabase/server';
import { addDays, format } from 'date-fns';

export async function getUrgentRenewalsCount() {
    const supabase = await createClient();
    const today = format(new Date(), 'yyyy-MM-dd');
    const limitDate = format(addDays(new Date(), 3), 'yyyy-MM-dd'); // Due in <= 3 days

    const { count, error } = await supabase
        .from('digital_expenses')
        .select('*', { count: 'exact', head: true })
        .eq('is_recurring', true)
        .neq('status', 'rejected')
        .lte('next_renewal_date', limitDate);

    if (error) return 0;
    return count || 0;
}
