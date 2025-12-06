'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
import { Plus, Search, Edit, MoreHorizontal, Trash, Ban, CheckCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [filteredAccounts, setFilteredAccounts] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [scopeFilter, setScopeFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchUserRole();
        fetchAccounts();
    }, []);

    const fetchUserRole = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();
            setUserRole(profile?.role || 'guest');
        }
    };

    useEffect(() => {
        let result = accounts;

        if (search) {
            const lowerSearch = search.toLowerCase();
            result = result.filter(
                (a) =>
                    a.name.toLowerCase().includes(lowerSearch) ||
                    a.currency.toLowerCase().includes(lowerSearch)
            );
        }

        if (scopeFilter !== 'all') {
            result = result.filter((a) => a.scope === scopeFilter);
        }

        if (typeFilter !== 'all') {
            result = result.filter((a) => a.type === typeFilter);
        }

        setFilteredAccounts(result);
    }, [search, scopeFilter, typeFilter, accounts]);

    const fetchAccounts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('financial_accounts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            toast.error('Failed to fetch accounts');
        } else {
            setAccounts(data || []);
            setFilteredAccounts(data || []);
        }
        setLoading(false);
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        const { error } = await supabase
            .from('financial_accounts')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            toast.error('Failed to update status');
        } else {
            toast.success(`Account ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
            fetchAccounts();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this account?')) return;

        const { error } = await supabase.from('financial_accounts').delete().eq('id', id);

        if (error) {
            toast.error('Failed to delete account');
        } else {
            toast.success('Account deleted');
            fetchAccounts();
        }
    };

    const canEdit = userRole === 'admin';
    const canDelete = userRole === 'admin';

    return (
        <div className="container mx-auto py-10">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-heading font-semibold tracking-tight">Financial Accounts</h1>
                {canEdit && (
                    <Link href="/accounts/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Account
                        </Button>
                    </Link>
                )}
            </div>

            <div className="mb-6 flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or currency..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={scopeFilter} onValueChange={setScopeFilter}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Scope" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Scopes</SelectItem>
                        <SelectItem value="local">Local</SelectItem>
                        <SelectItem value="international">International</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="bank">Bank</SelectItem>
                        <SelectItem value="mobile_finance">MFS</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="payoneer">Payoneer</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="wise">Wise</SelectItem>
                        <SelectItem value="crypto">Crypto</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={fetchAccounts} title="Refresh">
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Scope</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Currency</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Details</TableHead>
                            {(canEdit || canDelete) && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : filteredAccounts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No accounts found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAccounts.map((account) => (
                                <TableRow key={account.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/accounts/${account.id}`} className="hover:underline text-blue-600">
                                            {account.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {account.scope || 'local'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="capitalize">
                                        {account.type?.replace('_', ' ')}
                                    </TableCell>
                                    <TableCell>{account.currency}</TableCell>
                                    <TableCell>
                                        <Badge className={account.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                                            {account.status || 'active'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate text-muted-foreground text-xs">
                                        {account.type === 'bank' && account.details?.account_no}
                                        {account.type === 'mobile_finance' && `${account.details?.provider} - ${account.details?.account_no}`}
                                        {account.type === 'payoneer' && account.details?.email}
                                        {account.type === 'crypto' && account.details?.exchange_name}
                                    </TableCell>
                                    {(canEdit || canDelete) && (
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
                                                    {canEdit && (
                                                        <>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/accounts/${account.id}/edit`}>
                                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            {account.status === 'active' ? (
                                                                <DropdownMenuItem onClick={() => handleStatusChange(account.id, 'inactive')}>
                                                                    <Ban className="mr-2 h-4 w-4" /> Deactivate
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem onClick={() => handleStatusChange(account.id, 'active')}>
                                                                    <CheckCircle className="mr-2 h-4 w-4" /> Activate
                                                                </DropdownMenuItem>
                                                            )}
                                                        </>
                                                    )}
                                                    {canDelete && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-red-600 focus:text-red-600"
                                                                onClick={() => handleDelete(account.id)}
                                                            >
                                                                <Trash className="mr-2 h-4 w-4" /> Delete
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
