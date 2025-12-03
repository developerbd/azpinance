'use client';

import { ForexForm } from '@/components/transactions/forex-form';

import RoleGuard from '@/components/role-guard';

export default function NewForexTransactionPage() {
    return (
        <RoleGuard allowedRoles={['admin', 'supervisor', 'accountant']}>
            <div className="container mx-auto py-10 max-w-3xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">New Forex Transaction</h1>
                    <p className="text-muted-foreground">Record a new forex transaction.</p>
                </div>

                <ForexForm mode="create" />
            </div>
        </RoleGuard>
    );
}
