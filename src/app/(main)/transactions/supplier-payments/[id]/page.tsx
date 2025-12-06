import { getSupplierPayment } from '@/app/actions/get-supplier-payment';
import { SupplierPaymentForm } from '@/components/transactions/supplier-payment-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function EditSupplierPaymentPage({ params }: PageProps) {
    const { id } = await params;
    const { data: payment, error } = await getSupplierPayment(id);

    if (error || !payment) {
        return (
            <div className="container mx-auto py-10">
                <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                    <h2 className="text-lg font-bold">Error Loading Payment</h2>
                    <p>ID: {id}</p>
                    <p>Error: {error?.message || 'Payment not found'}</p>
                    <p>Details: {JSON.stringify(error)}</p>
                    <Link href="/transactions/supplier-payments" className="underline mt-2 block">Back to List</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 max-w-3xl">
            <div className="mb-6">
                <Link href="/transactions/supplier-payments" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back to Payments
                </Link>
                <h1 className="text-2xl font-heading font-semibold tracking-tight">Edit Payment</h1>
                <p className="text-muted-foreground">
                    Payment to <span className="font-medium text-foreground">{payment.supplier?.name}</span>
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Payment Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <SupplierPaymentForm initialData={payment} />
                </CardContent>
            </Card>
        </div>
    );
}
