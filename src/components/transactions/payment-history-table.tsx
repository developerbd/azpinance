'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getAllSupplierPayments } from '@/app/actions/get-all-supplier-payments';
import { deleteSupplierPayment } from '@/app/actions/delete-supplier-payment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2, Filter, X, MoreHorizontal, Edit, Trash, RefreshCw } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ExportMenu } from '@/components/common/export-menu';
import { BulkActionsToolbar } from '@/components/ui/bulk-actions-toolbar';

interface PaymentHistoryTableProps {
    userRole?: string;
}

export function PaymentHistoryTable({ userRole = 'guest' }: PaymentHistoryTableProps) {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const router = useRouter();

    // Filters
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);

    const supabase = createClient();

    const normalizedRole = (userRole || '').toLowerCase();
    const isAdmin = normalizedRole === 'admin';
    const isSupervisor = normalizedRole === 'supervisor';
    const canEdit = isAdmin || isSupervisor;
    const canDelete = isAdmin;

    const fetchPayments = useCallback(async () => {
        setLoading(true);
        const { data, count, error } = await getAllSupplierPayments(
            page,
            limit,
            selectedSupplier,
            startDate || undefined,
            endDate || undefined
        );

        if (!error) {
            setPayments(data as any[]);
            setTotalCount(count || 0);
        } else {
            console.error('Fetch error:', error);
            toast.error('Failed to load payments: ' + error);
        }
        setLoading(false);
    }, [page, limit, selectedSupplier, startDate, endDate]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    useEffect(() => {
        const fetchSuppliers = async () => {
            const { data } = await supabase
                .from('contacts')
                .select('id, name')
                .eq('type', 'supplier')
                .order('name');
            if (data) setSuppliers(data);
        };
        fetchSuppliers();
    }, [supabase]);

    const clearFilters = () => {
        setSelectedSupplier('all');
        setStartDate('');
        setEndDate('');
        setPage(1);
    };

    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async (type: 'csv' | 'xlsx' | 'pdf') => {
        setIsExporting(true);
        try {
            const { getAllPaymentsForExport } = await import('@/app/actions/get-all-payments-for-export');
            const { data, error } = await getAllPaymentsForExport(selectedSupplier, startDate, endDate);

            if (error || !data) {
                toast.error('Failed to fetch data for export');
                return;
            }

            if (type === 'pdf') {
                const jsPDF = (await import('jspdf')).default;
                const autoTable = (await import('jspdf-autotable')).default;

                const doc = new jsPDF();
                doc.text('Supplier Payments Report', 14, 10);

                const tableData = data.map((p: any) => [
                    format(new Date(p.date), 'dd-MM-yyyy'),
                    p.supplier?.name || '-',
                    p.amount.toLocaleString(),
                    p.destination_account?.name || '-',
                    p.transaction_method.replace('_', ' '),
                    p.reference_id || '-'
                ]);

                autoTable(doc, {
                    head: [['Date', 'Supplier', 'Amount (BDT)', 'Account', 'Method', 'Reference']],
                    body: tableData,
                    startY: 20,
                });

                doc.save(`supplier-payments-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
            } else {
                const XLSX = await import('xlsx');
                const worksheet = XLSX.utils.json_to_sheet(data.map((p: any) => ({
                    Date: format(new Date(p.date), 'dd-MM-yyyy'),
                    Supplier: p.supplier?.name || '-',
                    'Amount (BDT)': p.amount,
                    Account: p.destination_account?.name || '-',
                    Method: p.transaction_method,
                    Reference: p.reference_id || '-',
                    Notes: p.notes || '-'
                })));

                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Supplier Payments');

                if (type === 'csv') {
                    XLSX.writeFile(workbook, `supplier-payments-${format(new Date(), 'yyyy-MM-dd')}.csv`);
                } else {
                    XLSX.writeFile(workbook, `supplier-payments-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
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

    const confirmDelete = async () => {
        if (!deleteId) return;

        const result = await deleteSupplierPayment(deleteId);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success('Payment deleted successfully');
            fetchPayments(); // Refresh list
        }
        setDeleteId(null);
    };

    // Bulk Selection State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [showBulkConfirm, setShowBulkConfirm] = useState(false);

    // Toggle single row selection
    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Toggle select all
    const toggleSelectAll = () => {
        if (selectedIds.length === payments.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(payments.map(p => p.id));
        }
    };

    const confirmBulkDelete = async () => {
        setIsBulkDeleting(true);
        try {
            const { bulkDeleteSupplierPayments } = await import('@/app/actions/bulk-delete-payments');
            const result = await bulkDeleteSupplierPayments(selectedIds);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('Payments deleted successfully');
                setSelectedIds([]);
                fetchPayments();
            }
        } catch (error) {
            toast.error('Failed to delete payments');
        } finally {
            setIsBulkDeleting(false);
            setShowBulkConfirm(false);
        }
    };

    const handleBulkExport = async (type: 'xlsx' | 'pdf') => {
        const selectedData = payments.filter(p => selectedIds.includes(p.id));

        try {
            if (type === 'pdf') {
                const jsPDF = (await import('jspdf')).default;
                const autoTable = (await import('jspdf-autotable')).default;

                const doc = new jsPDF();
                doc.text('Selected Supplier Payments', 14, 10);

                const tableData = selectedData.map(p => [
                    format(new Date(p.date), 'dd-MM-yyyy'),
                    p.supplier?.name || '-',
                    p.amount.toLocaleString(),
                    p.destination_account?.name || '-',
                    p.transaction_method.replace('_', ' '),
                    p.reference_id || '-'
                ]);

                autoTable(doc, {
                    head: [['Date', 'Supplier', 'Amount (BDT)', 'Account', 'Method', 'Reference']],
                    body: tableData,
                    startY: 20,
                });

                doc.save(`selected-payments-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
            } else {
                const XLSX = await import('xlsx');
                const worksheet = XLSX.utils.json_to_sheet(selectedData.map((p: any) => ({
                    Date: format(new Date(p.date), 'dd-MM-yyyy'),
                    Supplier: p.supplier?.name || '-',
                    'Amount (BDT)': p.amount,
                    Account: p.destination_account?.name || '-',
                    Method: p.transaction_method,
                    Reference: p.reference_id || '-',
                    Notes: p.notes || '-'
                })));

                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Selected Payments');
                XLSX.writeFile(workbook, `selected-payments-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
            }
            toast.success('Export successful');
        } catch (e) {
            toast.error('Export failed');
        }
    };

    return (
        <div className="relative">
            <BulkActionsToolbar
                selectedCount={selectedIds.length}
                onDelete={isAdmin ? () => setShowBulkConfirm(true) : undefined}
                onExport={handleBulkExport}
                onCancel={() => setSelectedIds([])}
                loading={isBulkDeleting}
            />
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle>All Supplier Payments</CardTitle>
                        <div className="flex flex-wrap items-end gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs">Supplier</Label>
                                <Select value={selectedSupplier} onValueChange={(val) => { setSelectedSupplier(val); setPage(1); }}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="All Suppliers" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Suppliers</SelectItem>
                                        {suppliers.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">From</Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                                    className="w-[140px]"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">To</Label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                                    className="w-[140px]"
                                />
                            </div>
                            <Button variant="outline" size="icon" onClick={clearFilters} title="Clear Filters">
                                <X className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => fetchPayments()} title="Refresh">
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                            <ExportMenu onExport={handleExport} isExporting={isExporting} />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="p-3 w-[40px]">
                                        <input
                                            type="checkbox"
                                            className="translate-y-[2px]"
                                            checked={selectedIds.length === payments.length && payments.length > 0}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="p-3 text-left">Date</th>
                                    <th className="p-3 text-left">Supplier</th>
                                    <th className="p-3 text-left">Amount</th>
                                    <th className="p-3 text-left">Account</th>
                                    <th className="p-3 text-left">Method</th>
                                    <th className="p-3 text-left">Reference</th>
                                    <th className="p-3 text-left">Attachments</th>
                                    {(canEdit || canDelete) && <th className="p-3 text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </td>
                                    </tr>
                                ) : payments.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-muted-foreground">
                                            No payments found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    payments.map((payment) => (
                                        <tr key={payment.id} className={`border-b hover:bg-muted/50 transition-colors ${selectedIds.includes(payment.id) ? 'bg-muted' : ''}`}>
                                            <td className="p-3">
                                                <input
                                                    type="checkbox"
                                                    className="translate-y-[2px]"
                                                    checked={selectedIds.includes(payment.id)}
                                                    onChange={() => toggleSelection(payment.id)}
                                                />
                                            </td>
                                            <td className="p-3">{format(new Date(payment.date), 'MMM d, yyyy')}</td>
                                            <td className="p-3 font-medium">{payment.supplier?.name}</td>
                                            <td className="p-3 font-bold">{payment.amount.toLocaleString()} BDT</td>
                                            <td className="p-3">{payment.destination_account?.name || '-'}</td>
                                            <td className="p-3 capitalize">{payment.transaction_method.replace('_', ' ')}</td>
                                            <td className="p-3">{payment.reference_id || '-'}</td>
                                            <td className="p-3">
                                                {payment.attachments && payment.attachments.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
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
                                            {(canEdit || canDelete) && (
                                                <td className="p-3 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            {canEdit && (
                                                                <DropdownMenuItem onClick={() => router.push(`/transactions/supplier-payments/${payment.id}`)}>
                                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                                </DropdownMenuItem>
                                                            )}
                                                            {canDelete && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="text-red-600 cursor-pointer"
                                                                        onSelect={() => setDeleteId(payment.id)}
                                                                    >
                                                                        <Trash className="mr-2 h-4 w-4" /> Delete
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            )}
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
                                Page {page} of {Math.max(1, Math.ceil(totalCount / limit))}
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
                </CardContent>
            </Card>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the supplier payment record.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showBulkConfirm} onOpenChange={setShowBulkConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete {selectedIds.length} payment records.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmBulkDelete} className="bg-red-600 hover:bg-red-700">
                            {isBulkDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Delete All
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
