import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CashFlowReportClient from '@/components/reports/cash-flow-client';

export default async function CashFlowPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role === 'guest') {
        redirect('/dashboard');
    }

    return <CashFlowReportClient />;
}
