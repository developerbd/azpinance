import { createClient } from '@/lib/supabase/server';
import { ForexList } from '@/components/transactions/forex-list';
import { ForexImportDialog } from '@/components/transactions/forex-import-dialog';
import { ForexStats } from '@/components/transactions/forex-stats';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ForexTransactionsPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | undefined }>
}) {
    const supabase = await createClient();
    const params = await searchParams;


    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch user role
    const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    const role = userProfile?.role || 'guest';
    const canAdd = ['accountant', 'supervisor', 'admin'].includes(role);

    // Parse Params
    const page = parseInt(params.page || '1');
    const pageSize = 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const q = params.q || '';
    const status = params.status || 'all';
    const contactId = params.contact || 'all';
    const dateFrom = params.date_from || '';
    const dateTo = params.date_to || '';

    // Build Query
    let query = supabase
        .from('forex_transactions')
        .select('*, contacts(name)', { count: 'exact' });

    if (q) {
        // Search transaction_id or note
        query = query.or(`transaction_id.ilike.%${q}%,note.ilike.%${q}%`);
    }

    if (status && status !== 'all') {
        query = query.eq('status', status);
    }

    if (contactId && contactId !== 'all') {
        query = query.eq('contact_id', contactId);
    }

    if (dateFrom) {
        query = query.gte('transaction_date', dateFrom);
    }

    if (dateTo) {
        query = query.lte('transaction_date', dateTo);
    }

    // Order by date desc
    query = query.order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false }) // Secondary sort
        .range(from, to);

    const { data: transactions, count, error } = await query;

    if (error) {
        console.error('Error fetching forex transactions:', error);
    }

    // Fetch Stats
    const { data: stats, error: statsError } = await supabase.rpc('get_forex_stats');
    if (statsError) {
        console.error('Error fetching stats (function might not exist):', statsError);
    }

    // Fetch Contacts for Filtering
    const { data: contacts } = await supabase
        .from('contacts')
        .select('id, name')
        .order('name');

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-heading font-semibold tracking-tight">Forex Transactions</h1>
                {canAdd && (
                    <div className="flex gap-2">
                        <ForexImportDialog />
                        <Link href="/transactions/forex/new">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Add Record
                            </Button>
                        </Link>
                    </div>
                )}
            </div>

            <ForexStats stats={stats ? stats[0] : null} />

            <ForexList
                initialTransactions={transactions || []}
                userRole={role}
                totalCount={count || 0}
                currentPage={page}
                pageSize={pageSize}
                contacts={contacts || []}
                currentContact={contactId}
            />
        </div>
    );
}
