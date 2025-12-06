import { createClient } from '@/lib/supabase/server';
import { ForexForm } from '@/components/transactions/forex-form';
import { notFound } from 'next/navigation';

export default async function ForexTransactionPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { id } = await params;

    // Fetch transaction
    const { data: transaction, error } = await supabase
        .from('forex_transactions')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching transaction:', error);
    }

    if (!transaction) {
        console.error('Transaction not found for ID:', id);
        notFound();
    }

    // Fetch contacts
    const { data: contacts } = await supabase
        .from('contacts')
        .select('id, name, type')
        .order('name');

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-2xl font-heading font-semibold tracking-tight mb-6">Edit Forex Record</h1>
            <ForexForm contacts={contacts || []} initialData={transaction} />
        </div>
    );
}
