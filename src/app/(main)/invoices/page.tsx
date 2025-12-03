import { createClient } from '@/lib/supabase/server';
import { getInvoices } from '@/app/actions/invoices';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Plus, FileText, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { format } from 'date-fns';
import { PageHeader } from '@/components/ui/page-header';

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
    const { data: invoices, error } = await getInvoices();

    if (error) {
        return <div className="text-destructive p-4">Error loading invoices</div>;
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20';
            case 'overdue': return 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-500/20';
            case 'sent': return 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20';
            case 'draft': return 'bg-slate-500/10 text-slate-600 hover:bg-slate-500/20 border-slate-500/20';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <div className="container mx-auto p-2 space-y-6">
            <PageHeader
                title="Invoices & Bills"
                description="Manage your receivables and payables."
            >
                <Link href="/invoices/new?type=bill">
                    <Button variant="outline" size="sm" className="rounded-full border-primary/20 hover:bg-primary/5 hover:text-primary transition-all">
                        <ArrowDownLeft className="mr-2 h-4 w-4" />
                        New Bill
                    </Button>
                </Link>
                <Link href="/invoices/new?type=invoice">
                    <Button size="sm" className="rounded-full shadow-lg hover:shadow-primary/25 transition-all">
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        New Invoice
                    </Button>
                </Link>
            </PageHeader>

            <Card className="border-border/50 shadow-sm">
                <CardHeader className="px-6 pt-6 pb-4 border-b border-border/40">
                    <CardTitle className="text-lg font-semibold tracking-tight">Recent Documents</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-border/40">
                                <TableHead className="pl-6">Number</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices && invoices.length > 0 ? (
                                invoices.map((invoice: any) => (
                                    <TableRow key={invoice.id} className="hover:bg-muted/30 border-border/40">
                                        <TableCell className="font-medium pl-6">{invoice.invoice_number}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={invoice.type === 'invoice' ? 'border-emerald-500/20 text-emerald-600 bg-emerald-500/5' : 'border-rose-500/20 text-rose-600 bg-rose-500/5'}>
                                                {invoice.type === 'invoice' ? 'Invoice' : 'Bill'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{invoice.contacts?.name || 'Unknown'}</TableCell>
                                        <TableCell className="text-muted-foreground">{format(new Date(invoice.issue_date), 'MMM d, yyyy')}</TableCell>
                                        <TableCell className="text-muted-foreground">{format(new Date(invoice.due_date), 'MMM d, yyyy')}</TableCell>
                                        <TableCell className="font-bold text-foreground">
                                            {invoice.currency} {Number(invoice.total_amount).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(invoice.status)} variant="outline">
                                                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Link href={`/invoices/${invoice.id}`}>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary rounded-full">
                                                    <FileText className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                                        No invoices found. Create one to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
