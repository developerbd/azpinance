import { getInvoiceById } from '@/app/actions/invoices';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { ArrowLeft, Edit } from 'lucide-react';
import { format } from 'date-fns';
import InvoicePdfButton from '@/components/invoices/invoice-pdf-button';
import { notFound } from 'next/navigation';

export default async function InvoiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { data: invoice, error } = await getInvoiceById(id);

    if (error || !invoice) {
        return notFound();
    }

    return (
        <div className="container mx-auto py-10">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/invoices">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        {invoice.invoice_number}
                        <Badge variant="outline">{invoice.status}</Badge>
                    </h1>
                </div>
                <InvoicePdfButton invoice={invoice} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoice.invoice_items.map((item: any) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.description}</TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right">{invoice.currency} {item.unit_price}</TableCell>
                                            <TableCell className="text-right">{invoice.currency} {item.amount}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="flex justify-end mt-4 space-y-2">
                                <div className="w-64">
                                    <div className="flex justify-between py-1">
                                        <span className="text-muted-foreground">Subtotal:</span>
                                        <span>{invoice.currency} {invoice.subtotal}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-muted-foreground">Tax ({invoice.tax_rate}%):</span>
                                        <span>{invoice.currency} {invoice.tax_amount}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-t font-bold text-lg">
                                        <span>Total:</span>
                                        <span>{invoice.currency} {invoice.total_amount}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {invoice.notes && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="whitespace-pre-wrap text-sm">{invoice.notes}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="text-sm text-muted-foreground">Type</div>
                                <div className="font-medium capitalize">{invoice.type}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Contact</div>
                                <div className="font-medium">{invoice.contacts?.name}</div>
                                <div className="text-sm">{invoice.contacts?.email}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Issue Date</div>
                                <div className="font-medium">{format(new Date(invoice.issue_date), 'MMM d, yyyy')}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Due Date</div>
                                <div className="font-medium">{format(new Date(invoice.due_date), 'MMM d, yyyy')}</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
