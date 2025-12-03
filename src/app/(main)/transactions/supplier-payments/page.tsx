import { PaymentHistoryTable } from '@/components/transactions/payment-history-table';
import { createClient } from '@/lib/supabase/server';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default async function SupplierPaymentsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let userRole = 'guest';
    if (user) {
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
        userRole = profile?.role || 'guest';
    }

    const canAdd = ['admin', 'supervisor', 'accountant'].includes(userRole);

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Supplier Payments</h1>
                {canAdd && (
                    <Link href="/transactions/supplier-payments/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Payment
                        </Button>
                    </Link>
                )}
            </div>
            <PaymentHistoryTable userRole={userRole} />
        </div>
    );
}
