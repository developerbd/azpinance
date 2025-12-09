'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreHorizontal, Edit, Trash, CheckCircle, XCircle, RefreshCw, FileText, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { deleteDigitalExpense } from '@/app/actions/digital-expenses/delete-expense';
import { approveDigitalExpense } from '@/app/actions/digital-expenses/approve-expense';
import { toast } from 'sonner';

interface ExpenseListProps {
    expenses: any[];
    userRole: string;
}

export function ExpenseList({ expenses, userRole }: ExpenseListProps) {
    const router = useRouter();
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [methodFilter, setMethodFilter] = useState('all');
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const filteredExpenses = expenses.filter(expense => {
        if (categoryFilter !== 'all' && expense.category !== categoryFilter) return false;
        if (methodFilter !== 'all' && expense.payment_method !== methodFilter) return false;
        return true;
    });

    const isSupervisorOrAdmin = ['supervisor', 'admin'].includes(userRole);
    const canDelete = userRole === 'admin';

    const confirmDelete = async () => {
        if (!deleteId) return;

        const result = await deleteDigitalExpense(deleteId);
        if (result.success) {
            toast.success('Expense deleted');
            router.refresh(); // Refresh server data
        } else {
            toast.error(result.error);
        }
        setDeleteId(null);
    };

    const handleApprove = async (id: string, status: 'approved' | 'rejected') => {
        const result = await approveDigitalExpense(id, status);
        if (result.success) {
            toast.success(`Expense ${status}`);
            router.refresh();
        } else {
            toast.error(result.error);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
            case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
            default: return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between bg-muted/20 p-4 rounded-lg mb-6">
                <div className="flex gap-4 items-center">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="Domain">Domain</SelectItem>
                            <SelectItem value="Hosting">Hosting</SelectItem>
                            <SelectItem value="Software License">Software License</SelectItem>
                            <SelectItem value="SaaS Subscription">SaaS Subscription</SelectItem>
                            <SelectItem value="Ad Spend">Ad Spend</SelectItem>
                            <SelectItem value="Digital Asset">Digital Asset</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={methodFilter} onValueChange={setMethodFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by Method" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Methods</SelectItem>
                            <SelectItem value="Payoneer Card">Payoneer Card</SelectItem>
                            <SelectItem value="PayPal">PayPal</SelectItem>
                            <SelectItem value="Wise">Wise</SelectItem>
                            <SelectItem value="Credit Card">Credit Card</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button variant="outline" size="icon" onClick={() => router.refresh()} title="Refresh">
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Recurring?</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredExpenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                        No expenses found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredExpenses.map((expense) => (
                                    <TableRow key={expense.id}>
                                        <TableCell className="font-medium">{format(new Date(expense.transaction_date), 'MMM d, yyyy')}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{expense.title}</span>
                                                {expense.vendor_platform && <span className="text-xs text-muted-foreground">{expense.vendor_platform}</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{expense.category}</Badge>
                                        </TableCell>
                                        <TableCell>{formatCurrency(expense.amount_usd, 'USD')}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{expense.payment_method}</TableCell>
                                        <TableCell>
                                            {expense.is_recurring ? (
                                                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                                                    {expense.frequency}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-xs text-center block w-6">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(expense.status)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>

                                                    {/* View Attachment */}
                                                    {expense.attachment_url && (
                                                        <DropdownMenuItem asChild>
                                                            <a href={expense.attachment_url} target="_blank" rel="noopener noreferrer">
                                                                <FileText className="mr-2 h-4 w-4" /> View Invoice
                                                            </a>
                                                        </DropdownMenuItem>
                                                    )}

                                                    {/* Edit: Pending for accountant, All for Sup/Admin */}
                                                    {(userRole === 'accountant' && expense.status === 'pending') || isSupervisorOrAdmin ? (
                                                        <DropdownMenuItem onClick={() => router.push(`/digital-expenses/${expense.id}/edit`)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                    ) : null}

                                                    {/* Approve/Reject: Sup/Admin Only */}
                                                    {isSupervisorOrAdmin && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => handleApprove(expense.id, 'approved')}>
                                                                <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Approve
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleApprove(expense.id, 'rejected')}>
                                                                <XCircle className="mr-2 h-4 w-4 text-red-600" /> Reject
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}

                                                    {/* Delete: Admin Only */}
                                                    {canDelete && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onSelect={() => setDeleteId(expense.id)} className="text-red-600 cursor-pointer">
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

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this expense record.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
