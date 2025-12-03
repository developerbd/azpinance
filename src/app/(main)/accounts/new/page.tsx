'use client';

import { AccountForm } from '@/components/account-form';

import RoleGuard from '@/components/role-guard';

export default function NewAccountPage() {
    return (
        <RoleGuard allowedRoles={['admin']}>
            <div className="container mx-auto py-10 max-w-3xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">New Financial Account</h1>
                    <p className="text-muted-foreground">Add a new financial account.</p>
                </div>

                <AccountForm mode="create" />
            </div>
        </RoleGuard>
    );
}
