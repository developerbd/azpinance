'use client';

import { ContactForm } from '@/components/contact-form';

import RoleGuard from '@/components/role-guard';

export default function NewContactPage() {
    return (
        <RoleGuard allowedRoles={['admin']}>
            <div className="container mx-auto py-10 max-w-3xl">
                <div className="mb-8">
                    <h1 className="text-2xl font-heading font-semibold tracking-tight">New Contact</h1>
                    <p className="text-muted-foreground">Add a new contact (Supplier, Customer, etc.).</p>
                </div>

                <ContactForm mode="create" />
            </div>
        </RoleGuard>
    );
}
