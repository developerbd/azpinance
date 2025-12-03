import { createClient } from '@/lib/supabase/server';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function RecentTransactions() {
    const supabase = await createClient();

    const { data: transactions } = await supabase
        .from('forex_transactions')
        .select('id, transaction_date, transaction_id, amount, currency, status, created_at')
        .order('transaction_date', { ascending: false })
        .limit(5);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent Forex Activity</h2>
                <Link href="/transactions/forex">
                    <Button variant="link" size="sm">View All</Button>
                </Link>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Tx ID</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions?.map((tx) => (
                            <TableRow key={tx.id}>
                                <TableCell>
                                    {tx.transaction_date
                                        ? new Date(tx.transaction_date).toLocaleDateString()
                                        : new Date(tx.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="font-medium font-mono text-xs">{tx.transaction_id || '-'}</TableCell>
                                <TableCell className="text-green-600">
                                    ${tx.amount.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={tx.status === 'approved' ? 'default' : 'secondary'}>
                                        {tx.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                        {transactions?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No recent activity.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
