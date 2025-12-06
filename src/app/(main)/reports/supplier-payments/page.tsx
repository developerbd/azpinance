import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SupplierPaymentsReportClient from '@/components/reports/supplier-payments-client';

export default async function SupplierPaymentsPage() {
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

    return <SupplierPaymentsReportClient />;
}
