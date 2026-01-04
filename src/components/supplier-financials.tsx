'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSupplierFinancials } from '@/app/actions/get-supplier-financials';
import { getSupplierPayments } from '@/app/actions/get-supplier-payments';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { MakePaymentDialog } from './transactions/make-payment-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function SupplierFinancials({ supplierId }: { supplierId: string }) {
    const [financials, setFinancials] = useState({ totalReceivables: 0, totalPayments: 0, currentDue: 0 });
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    // Pagination State
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [finRes, payRes] = await Promise.all([
            getSupplierFinancials(supplierId),
            getSupplierPayments(supplierId, page, limit)
        ]);

        if (finRes && !finRes.error) setFinancials(finRes as any);
        if (payRes && !payRes.error) {
            setPayments(payRes.data as any[]);
            setTotalCount(payRes.count || 0);
        }
        setLoading(false);
    }, [supplierId, page, limit]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return <div>Loading financials...</div>;

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-50/50 via-background to-background border-blue-200/50 dark:from-blue-950/20 dark:border-blue-900/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Receivables</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{financials.totalReceivables.toLocaleString()} BDT</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-50/50 via-background to-background border-emerald-200/50 dark:from-emerald-950/20 dark:border-emerald-900/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Paid</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{financials.totalPayments.toLocaleString()} BDT</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-rose-50/50 via-background to-background border-rose-200/50 dark:from-rose-950/20 dark:border-rose-900/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">Current Due</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{financials.currentDue.toLocaleString()} BDT</div>
                    </CardContent>
                </Card>
            </div>

            {/* Payment Action & History */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Payment History</CardTitle>
                    <MakePaymentDialog
                        supplierId={supplierId}
                        onSuccess={fetchData}
                    />
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <table className="w-full text-sm min-w-full">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="p-3 text-left whitespace-nowrap">Date</th>
                                    <th className="p-3 text-left whitespace-nowrap">Amount</th>
                                    <th className="p-3 text-left whitespace-nowrap">Account</th>
                                    <th className="p-3 text-left whitespace-nowrap">Method</th>
                                    <th className="p-3 text-left whitespace-nowrap">Reference</th>
                                    <th className="p-3 text-left whitespace-nowrap">Attachments</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-4 text-center text-muted-foreground">No payments recorded.</td>
                                    </tr>
                                ) : (
                                    payments.map((payment) => (
                                        <tr key={payment.id} className="border-b">
                                            <td className="p-3 whitespace-nowrap">{format(new Date(payment.date), 'MMM d, yyyy')}</td>
                                            <td className="p-3 font-medium whitespace-nowrap">{payment.amount.toLocaleString()} BDT</td>
                                            <td className="p-3 whitespace-nowrap">{payment.destination_account?.name || '-'}</td>
                                            <td className="p-3 capitalize whitespace-nowrap">{payment.transaction_method.replace('_', ' ')}</td>
                                            <td className="p-3 whitespace-nowrap">{payment.reference_id || '-'}</td>
                                            <td className="p-3">
                                                {payment.attachments && payment.attachments.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1 min-w-[100px]">
                                                        {payment.attachments.map((url: string, i: number) => (
                                                            <a
                                                                key={i}
                                                                href={url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                                                            >
                                                                View
                                                            </a>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Rows per page:</span>
                            <Select value={limit.toString()} onValueChange={(val) => { setLimit(Number(val)); setPage(1); }}>
                                <SelectTrigger className="w-[70px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                Page {page} of {Math.ceil(totalCount / limit)}
                            </span>
                            <div className="flex gap-1">
                                <Button variant="outline" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="icon" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(totalCount / limit)}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 text-center">
                        <Link href="/transactions/supplier-payments" className="text-sm text-blue-600 hover:underline">
                            See All Payments
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}
