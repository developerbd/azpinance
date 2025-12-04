'use client';

import { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash, CheckCircle, DollarSign, Search, Filter, X, Square } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ExportMenu } from '@/components/common/export-menu';
import { BulkActionsToolbar } from '@/components/ui/bulk-actions-toolbar';

type ForexTransaction = {
    id: string;
    contact_id: string;
    contacts?: { name: string };
    account_type: string;
    currency: string;
    amount: number;
    exchange_rate: number;
    amount_bdt: number;
    transaction_id: string | null;
    transaction_date: string | null;
    note: string | null;
    status: 'pending' | 'approved';
    payment_status: 'processing' | 'paid';
    created_at: string;
};

interface ForexListProps {
    initialTransactions: ForexTransaction[];
    userRole: string;
    totalCount: number;
    currentPage: number;
    pageSize: number;
}

export function ForexList({ initialTransactions, userRole, totalCount, currentPage, pageSize }: ForexListProps) {
    const [transactions, setTransactions] = useState<ForexTransaction[]>(initialTransactions);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Sync state with props when they change (re-fetch)
    useEffect(() => {
        setTransactions(initialTransactions);
    }, [initialTransactions]);

    // Filter States
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
    const [dateFrom, setDateFrom] = useState(searchParams.get('date_from') || '');
    const [dateTo, setDateTo] = useState(searchParams.get('date_to') || '');

    const normalizedRole = (userRole || '').toLowerCase();
    const isAdmin = normalizedRole === 'admin';
    const isSupervisor = normalizedRole === 'supervisor';
    const isAccountant = normalizedRole === 'accountant';
    const canApprove = isAdmin || isSupervisor;
    const canDelete = isAdmin;

    const canEdit = (tx: ForexTransaction) => {
        if (isAdmin || isSupervisor) return true;
        if (isAccountant && (tx.status || '').toLowerCase() === 'pending') return true;
        return false;
    };

    // Update URL helper
    const updateUrl = (params: Record<string, string | null>) => {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        Object.entries(params).forEach(([key, value]) => {
            if (value === null || value === '') {
                newSearchParams.delete(key);
            } else {
                newSearchParams.set(key, value);
            }
        });
        // Reset to page 1 on filter change
        if (params.page === undefined) {
            newSearchParams.set('page', '1');
        }
        router.push(`${pathname}?${newSearchParams.toString()}`);
    };

    // Debounced Search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== (searchParams.get('q') || '')) {
                updateUrl({ q: searchQuery });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleStatusChange = (val: string) => {
        setStatusFilter(val);
        updateUrl({ status: val });
    };

    const handleDateChange = () => {
        updateUrl({ date_from: dateFrom, date_to: dateTo });
    };

    const handlePageChange = (newPage: number) => {
        updateUrl({ page: newPage.toString() });
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setDateFrom('');
        setDateTo('');
        router.push(pathname);
    };

    const hasFilters = searchQuery || statusFilter !== 'all' || dateFrom || dateTo;

    // ... (Action handlers: handleApprove, handleMarkPaid, handleDelete - same as before)
    const handleApprove = async (id: string) => {
        try {
            const { approveForexTransaction } = await import('@/app/actions/approve-forex-transaction');
            const result = await approveForexTransaction(id);
            if (result.error) toast.error(result.error);
            else {
                toast.success('Transaction approved');
                // Optimistic update or refresh
                router.refresh();
            }
        } catch (e) {
            toast.error('Failed to approve');
        }
    };



    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            const { deleteForexTransaction } = await import('@/app/actions/delete-forex-transaction');
            const result = await deleteForexTransaction(id);
            if (result.error) toast.error(result.error);
            else {
                toast.success('Transaction deleted');
                router.refresh();
            }
        } catch (e) {
            toast.error('Failed to delete');
        }
    };

    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async (type: 'csv' | 'xlsx' | 'pdf') => {
        setIsExporting(true);
        try {
            const { getAllForexForExport } = await import('@/app/actions/get-all-forex-for-export');
            const { data, error } = await getAllForexForExport(searchQuery, statusFilter, dateFrom, dateTo);

            if (error || !data) {
                toast.error('Failed to fetch data for export');
                return;
            }

            if (type === 'pdf') {
                const jsPDF = (await import('jspdf')).default;
                const autoTable = (await import('jspdf-autotable')).default;

                const doc = new jsPDF();
                doc.text('Forex Transactions Report', 14, 10);

                const tableData = data.map(tx => [
                    tx.transaction_date ? format(new Date(tx.transaction_date), 'dd-MM-yyyy') : '-',
                    tx.transaction_id || '-',
                    tx.contacts?.name || '-',
                    tx.account_type,
                    tx.amount.toFixed(2),
                    tx.exchange_rate.toFixed(2),
                    tx.amount_bdt.toFixed(2),
                    tx.status
                ]);

                autoTable(doc, {
                    head: [['Date', 'Tx ID', 'Contact', 'Account', 'Amount (USD)', 'Rate', 'Amount (BDT)', 'Status']],
                    body: tableData,
                    startY: 20,
                });

                doc.save(`forex-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
            } else {
                const XLSX = await import('xlsx');
                const worksheet = XLSX.utils.json_to_sheet(data.map(tx => ({
                    Date: tx.transaction_date ? format(new Date(tx.transaction_date), 'dd-MM-yyyy') : '-',
                    'Transaction ID': tx.transaction_id || '-',
                    Contact: tx.contacts?.name || '-',
                    Account: tx.account_type,
                    'Amount (USD)': tx.amount,
                    Rate: tx.exchange_rate,
                    'Amount (BDT)': tx.amount_bdt,
                    Status: tx.status,
                    Note: tx.note || '-'
                })));

                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Forex Transactions');

                if (type === 'csv') {
                    XLSX.writeFile(workbook, `forex-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
                } else {
                    XLSX.writeFile(workbook, `forex-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
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

    const totalPages = Math.ceil(totalCount / pageSize);

    // Bulk Selection State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    // Toggle single row selection
    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Toggle select all
    const toggleSelectAll = () => {
        if (selectedIds.length === transactions.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(transactions.map(tx => tx.id));
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} transactions?`)) return;

        setIsBulkDeleting(true);
        try {
            const { bulkDeleteForexTransactions } = await import('@/app/actions/bulk-delete-forex');
            const result = await bulkDeleteForexTransactions(selectedIds);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('Transactions deleted successfully');
                setSelectedIds([]);
                router.refresh();
            }
        } catch (error) {
            toast.error('Failed to delete transactions');
        } finally {
            setIsBulkDeleting(false);
        }
    };






    const handleBulkExport = async (type: 'xlsx' | 'pdf') => {
        const selectedData = transactions.filter(tx => selectedIds.includes(tx.id));

        try {
            if (type === 'pdf') {
                const jsPDF = (await import('jspdf')).default;
                const autoTable = (await import('jspdf-autotable')).default;

                const doc = new jsPDF();
                doc.text('Selected Forex Transactions', 14, 10);

                const tableData = selectedData.map(tx => [
                    tx.transaction_date ? format(new Date(tx.transaction_date), 'dd-MM-yyyy') : '-',
                    tx.transaction_id || '-',
                    tx.contacts?.name || '-',
                    tx.account_type,
                    tx.amount.toFixed(2),
                    tx.exchange_rate.toFixed(2),
                    tx.amount_bdt.toFixed(2),
                    tx.status
                ]);

                autoTable(doc, {
                    head: [['Date', 'Tx ID', 'Contact', 'Account', 'Amount (USD)', 'Rate', 'Amount (BDT)', 'Status']],
                    body: tableData,
                    startY: 20,
                });

                doc.save(`selected-forex-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
            } else {
                const XLSX = await import('xlsx');
                const worksheet = XLSX.utils.json_to_sheet(selectedData.map(tx => ({
                    Date: tx.transaction_date ? format(new Date(tx.transaction_date), 'dd-MM-yyyy') : '-',
                    'Transaction ID': tx.transaction_id || '-',
                    Contact: tx.contacts?.name || '-',
                    Account: tx.account_type,
                    'Amount (USD)': tx.amount,
                    Rate: tx.exchange_rate,
                    'Amount (BDT)': tx.amount_bdt,
                    Status: tx.status,
                    Note: tx.note || '-'
                })));

                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Selected Forex');
                XLSX.writeFile(workbook, `selected-forex-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
            }
            toast.success('Export successful');
        } catch (e) {
            toast.error('Export failed');
        }
    };

    return (
        <div className="space-y-4 relative">
            <BulkActionsToolbar
                selectedCount={selectedIds.length}
                onDelete={isAdmin ? handleBulkDelete : undefined}
                onExport={handleBulkExport}
                onCancel={() => setSelectedIds([])}
                loading={isBulkDeleting}
            />

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between bg-muted/20 p-4 rounded-lg">
                <div className="flex flex-wrap gap-4 items-center w-full">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search ID or Note..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                        />
                    </div>

                    <Select value={statusFilter} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-[150px]"
                        />
                        <span>to</span>
                        <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-[150px]"
                        />
                        <Button variant="secondary" onClick={handleDateChange}>Filter Date</Button>
                    </div>

                    {hasFilters && (
                        <Button variant="ghost" onClick={handleClearFilters} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                            <X className="mr-2 h-4 w-4" /> Clear Filters
                        </Button>
                    )}

                    <div className="ml-auto">
                        <ExportMenu onExport={handleExport} isExporting={isExporting} />
                    </div>
                </div>
            </div>

            {/* Count Info */}
            <div className="text-sm text-muted-foreground">
                Showing {transactions.length} of {totalCount} records
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px] pl-4">
                                    <input
                                        type="checkbox"
                                        className="translate-y-[2px]"
                                        checked={selectedIds.length === transactions.length && transactions.length > 0}
                                        onChange={toggleSelectAll}
                                    />
                                </TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Tx ID</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Account</TableHead>
                                <TableHead>Amount (USD)</TableHead>
                                <TableHead>Rate</TableHead>
                                <TableHead>Amount (BDT)</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right pr-4">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                                        No transactions found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((tx) => (
                                    <TableRow key={tx.id} data-state={selectedIds.includes(tx.id) ? "selected" : undefined}>
                                        <TableCell className="pl-4">
                                            <input
                                                type="checkbox"
                                                className="translate-y-[2px]"
                                                checked={selectedIds.includes(tx.id)}
                                                onChange={() => toggleSelection(tx.id)}
                                            />
                                        </TableCell>
                                        <TableCell>{tx.transaction_date ? format(new Date(tx.transaction_date), 'dd-MM-yyyy') : format(new Date(tx.created_at), 'dd-MM-yyyy')}</TableCell>
                                        <TableCell className="font-mono text-xs">{tx.transaction_id || '-'}</TableCell>
                                        <TableCell>{tx.contacts?.name || 'Unknown'}</TableCell>
                                        <TableCell className="capitalize">{tx.account_type}</TableCell>
                                        <TableCell>${tx.amount.toFixed(2)}</TableCell>
                                        <TableCell>{tx.exchange_rate.toFixed(2)}</TableCell>
                                        <TableCell>৳{tx.amount_bdt.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge variant={tx.status === 'approved' ? 'default' : 'secondary'}>
                                                {tx.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    {canEdit(tx) && (
                                                        <DropdownMenuItem onClick={() => router.push(`/transactions/forex/${tx.id}`)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                    )}
                                                    {canApprove && tx.status === 'pending' && (
                                                        <DropdownMenuItem onClick={() => handleApprove(tx.id)}>
                                                            <CheckCircle className="mr-2 h-4 w-4" /> Approve
                                                        </DropdownMenuItem>
                                                    )}
                                                    {canDelete && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-red-600"
                                                                onClick={() => handleDelete(tx.id)}
                                                            >
                                                                <Trash className="mr-2 h-4 w-4" /> Delete
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-end gap-2 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                    >
                        Previous
                    </Button>
                    <div className="text-sm font-medium">
                        Page {currentPage} of {totalPages}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
