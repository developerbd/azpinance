import { createClient } from '@/lib/supabase/server';
import { AccountForm } from '@/components/account-form';
import { notFound } from 'next/navigation';

export default async function EditAccountPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient();
    const { data: account } = await supabase
        .from('financial_accounts')
        .select('*')
        .eq('id', params.id)
        .single();

    if (!account) {
        notFound();
    }

    return (
        <div className="container mx-auto py-10">
            <AccountForm account={account} />
        </div>
    );
}
