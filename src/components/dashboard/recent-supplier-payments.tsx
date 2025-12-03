import { createClient } from '@/lib/supabase/server';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default async function RecentSupplierPayments() {
    const supabase = await createClient();

    const { data: payments } = await supabase
        .from('supplier_payments')
        .select(`
            *,
            supplier:contacts(name)
        `)
        .order('date', { ascending: false })
        .limit(5);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent Supplier Payments</h2>
                <Link href="/transactions/supplier-payments">
                    <Button variant="link" size="sm">View All</Button>
                </Link>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Method</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments?.map((payment) => (
                            <TableRow key={payment.id}>
                                <TableCell>{format(new Date(payment.date), 'MMM d, yyyy')}</TableCell>
                                <TableCell className="font-medium">{payment.supplier?.name}</TableCell>
                                <TableCell className="font-bold">৳{payment.amount.toLocaleString()}</TableCell>
                                <TableCell className="capitalize text-xs text-muted-foreground">{payment.transaction_method.replace('_', ' ')}</TableCell>
                            </TableRow>
                        ))}
                        {payments?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No recent payments.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
