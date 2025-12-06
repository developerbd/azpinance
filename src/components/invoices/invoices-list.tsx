'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, MoreHorizontal, Trash, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { BulkActionsToolbar } from '@/components/ui/bulk-actions-toolbar';
import { ExportMenu } from '@/components/common/export-menu';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface InvoicesListProps {
    invoices: any[];
    userRole: string;
}

export function InvoicesList({ invoices, userRole }: InvoicesListProps) {
    const router = useRouter();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const isAdmin = userRole === 'admin';

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20';
            case 'overdue': return 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-500/20';
            case 'sent': return 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20';
            case 'draft': return 'bg-slate-500/10 text-slate-600 hover:bg-slate-500/20 border-slate-500/20';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    // Toggle single row selection
    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Toggle select all
    const toggleSelectAll = () => {
        if (selectedIds.length === invoices.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(invoices.map(inv => inv.id));
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} invoices?`)) return;

        setIsBulkDeleting(true);
        try {
            const { bulkDeleteInvoices } = await import('@/app/actions/bulk-delete-invoices');
            const result = await bulkDeleteInvoices(selectedIds);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('Invoices deleted successfully');
                setSelectedIds([]);
                router.refresh();
            }
        } catch (error) {
            toast.error('Failed to delete invoices');
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const handleBulkExport = async (type: 'xlsx' | 'pdf') => {
        const selectedData = invoices.filter(inv => selectedIds.includes(inv.id));

        try {
            if (type === 'pdf') {
                const jsPDF = (await import('jspdf')).default;
                const autoTable = (await import('jspdf-autotable')).default;

                const doc = new jsPDF();
                doc.text('Selected Invoices', 14, 10);

                const tableData = selectedData.map(inv => [
                    inv.invoice_number,
                    inv.type,
                    inv.contacts?.name || 'Unknown',
                    format(new Date(inv.issue_date), 'yyyy-MM-dd'),
                    format(new Date(inv.due_date), 'yyyy-MM-dd'),
                    inv.total_amount,
                    inv.currency,
                    inv.status
                ]);

                autoTable(doc, {
                    head: [['Number', 'Type', 'Contact', 'Date', 'Due Date', 'Amount', 'Currency', 'Status']],
                    body: tableData,
                    startY: 20,
                });

                doc.save(`selected-invoices-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
            } else {
                const XLSX = await import('xlsx');
                const worksheet = XLSX.utils.json_to_sheet(selectedData.map((inv: any) => ({
                    Number: inv.invoice_number,
                    Type: inv.type,
                    Contact: inv.contacts?.name || 'Unknown',
                    Date: format(new Date(inv.issue_date), 'yyyy-MM-dd'),
                    'Due Date': format(new Date(inv.due_date), 'yyyy-MM-dd'),
                    Amount: inv.total_amount,
                    Currency: inv.currency,
                    Status: inv.status
                })));

                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Selected Invoices');
                XLSX.writeFile(workbook, `selected-invoices-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
            }
            toast.success('Export successful');
        } catch (e) {
            toast.error('Export failed');
        }
    };

    const handleExport = async (type: 'csv' | 'xlsx' | 'pdf') => {
        setIsExporting(true);
        try {
            const { getAllInvoicesForExport } = await import('@/app/actions/get-all-invoices-for-export');
            const { data, error } = await getAllInvoicesForExport();

            if (error || !data) {
                toast.error('Failed to fetch data for export');
                return;
            }

            if (type === 'pdf') {
                const jsPDF = (await import('jspdf')).default;
                const autoTable = (await import('jspdf-autotable')).default;

                const doc = new jsPDF();
                doc.text('Invoices Report', 14, 10);

                const tableData = data.map((inv: any) => [
                    inv.invoice_number,
                    inv.type,
                    inv.contacts?.name || 'Unknown',
                    format(new Date(inv.issue_date), 'yyyy-MM-dd'),
                    format(new Date(inv.due_date), 'yyyy-MM-dd'),
                    inv.total_amount,
                    inv.currency,
                    inv.status
                ]);

                autoTable(doc, {
                    head: [['Number', 'Type', 'Contact', 'Date', 'Due Date', 'Amount', 'Currency', 'Status']],
                    body: tableData,
                    startY: 20,
                });

                doc.save(`invoices-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
            } else {
                const XLSX = await import('xlsx');
                const worksheet = XLSX.utils.json_to_sheet(data.map((inv: any) => ({
                    Number: inv.invoice_number,
                    Type: inv.type,
                    Contact: inv.contacts?.name || 'Unknown',
                    Date: format(new Date(inv.issue_date), 'yyyy-MM-dd'),
                    'Due Date': format(new Date(inv.due_date), 'yyyy-MM-dd'),
                    Amount: inv.total_amount,
                    Currency: inv.currency,
                    Status: inv.status
                })));

                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');

                if (type === 'csv') {
                    XLSX.writeFile(workbook, `invoices-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
                } else {
                    XLSX.writeFile(workbook, `invoices-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
                }
            }
            toast.success('Export successful');
        } catch (e) {
            console.error(e);
            toast.error('Export failed');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="relative space-y-4">
            <div className="flex justify-end gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => router.refresh()}
                    title="Refresh"
                >
                    <RefreshCw className="h-4 w-4" />
                </Button>
                <ExportMenu onExport={handleExport} isExporting={isExporting} />
            </div>

            <BulkActionsToolbar
                selectedCount={selectedIds.length}
                onDelete={isAdmin ? handleBulkDelete : undefined}
                onExport={handleBulkExport}
                onCancel={() => setSelectedIds([])}
                loading={isBulkDeleting}
            />

            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/40">
                        <TableHead className="w-[40px] pl-6">
                            <input
                                type="checkbox"
                                className="translate-y-[2px]"
                                checked={selectedIds.length === invoices.length && invoices.length > 0}
                                onChange={toggleSelectAll}
                            />
                        </TableHead>
                        <TableHead>Number</TableHead>
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
                            <TableRow key={invoice.id} className={`hover:bg-muted/30 border-border/40 ${selectedIds.includes(invoice.id) ? 'bg-muted/50' : ''}`}>
                                <TableCell className="pl-6">
                                    <input
                                        type="checkbox"
                                        className="translate-y-[2px]"
                                        checked={selectedIds.includes(invoice.id)}
                                        onChange={() => toggleSelection(invoice.id)}
                                    />
                                </TableCell>
                                <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
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
                                    <div className="flex items-center justify-end gap-2">
                                        <Link href={`/invoices/${invoice.id}`}>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary rounded-full">
                                                <FileText className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        {isAdmin && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        className="text-red-600"
                                                        onClick={() => {
                                                            setSelectedIds([invoice.id]);
                                                            // We can reuse handleBulkDelete but we need to set state first.
                                                            // Or better, just call a single delete function.
                                                            // For simplicity, let's just use the bulk delete flow or a separate one.
                                                            // Let's just confirm and call bulk delete with one ID.
                                                            if (confirm('Are you sure you want to delete this invoice?')) {
                                                                import('@/app/actions/bulk-delete-invoices').then(({ bulkDeleteInvoices }) => {
                                                                    bulkDeleteInvoices([invoice.id]).then(res => {
                                                                        if (res.error) toast.error(res.error);
                                                                        else {
                                                                            toast.success('Invoice deleted');
                                                                            router.refresh();
                                                                        }
                                                                    });
                                                                });
                                                            }
                                                        }}
                                                    >
                                                        <Trash className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                                No invoices found. Create one to get started.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
