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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { Plus, MoreHorizontal, Search, Edit, Trash, Ban, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

import { getContactsWithDue } from '@/app/actions/get-contacts-with-due';
import { updateContactStatus } from '@/app/actions/update-contact-status';
import { deleteContact } from '@/app/actions/delete-contact';
import { MakePaymentDialog } from '@/components/transactions/make-payment-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function ContactsPage() {
    const [contacts, setContacts] = useState<any[]>([]);
    const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [contactToDelete, setContactToDelete] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        fetchUserRole();
        fetchContacts();
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
        let result = contacts;

        if (search) {
            const lowerSearch = search.toLowerCase();
            result = result.filter(
                (c) =>
                    c.name.toLowerCase().includes(lowerSearch) ||
                    c.email?.toLowerCase().includes(lowerSearch) ||
                    c.company_name?.toLowerCase().includes(lowerSearch)
            );
        }

        if (typeFilter !== 'all') {
            result = result.filter((c) => c.type === typeFilter);
        }

        setFilteredContacts(result);
    }, [search, typeFilter, contacts]);

    const fetchContacts = async () => {
        setLoading(true);
        const { data, error } = await getContactsWithDue();

        if (error) {
            toast.error('Failed to fetch contacts');
        } else {
            setContacts(data || []);
            setFilteredContacts(data || []);
        }
        setLoading(false);
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        const result = await updateContactStatus(id, newStatus);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(`Contact ${newStatus === 'active' ? 'activated' : 'suspended'}`);
            fetchContacts();
        }
    };

    const confirmDelete = (id: string) => {
        setContactToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!contactToDelete) return;
        setDeleting(true);

        const result = await deleteContact(contactToDelete);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success('Contact deleted');
            fetchContacts();
        }
        setDeleting(false);
        setDeleteDialogOpen(false);
        setContactToDelete(null);
    };

    const canEdit = userRole === 'admin';
    const canDelete = userRole === 'admin';

    return (
        <div className="container mx-auto py-10">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-3xl font-bold">Contacts</h1>
                {canEdit && (
                    <Link href="/contacts/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Contact
                        </Button>
                    </Link>
                )}
            </div>

            <div className="mb-6 flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, email, or company..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="supplier">Supplier</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Total Receivables</TableHead>
                            <TableHead>Current Due</TableHead>
                            <TableHead>Make Payment</TableHead>
                            <TableHead>Status</TableHead>
                            {(canEdit || canDelete) && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : filteredContacts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center">
                                    No contacts found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredContacts.map((contact) => (
                                <TableRow key={contact.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/contacts/${contact.id}`} className="hover:underline text-blue-600">
                                            {contact.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{contact.company_name || '-'}</TableCell>
                                    <TableCell className="capitalize">{contact.type}</TableCell>
                                    <TableCell>{contact.email}</TableCell>
                                    <TableCell>
                                        {contact.type === 'supplier' ? (
                                            <span className="font-medium">
                                                {contact.total_receivables ? contact.total_receivables.toLocaleString() : '0'} BDT
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {contact.type === 'supplier' ? (
                                            <span className={contact.current_due > 0 ? 'text-red-600 font-bold' : 'text-green-600'}>
                                                {contact.current_due ? contact.current_due.toLocaleString() : '0'} BDT
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {contact.type === 'supplier' ? (
                                            <MakePaymentDialog
                                                supplierId={contact.id}
                                                onSuccess={fetchContacts}
                                                trigger={
                                                    <Button variant="outline" size="sm" className="h-8">
                                                        Pay
                                                    </Button>
                                                }
                                            />
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={contact.status === 'active' ? 'default' : 'secondary'}>
                                            {contact.status}
                                        </Badge>
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
                                                                <Link href={`/contacts/${contact.id}/edit`}>
                                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            {contact.status === 'active' ? (
                                                                <DropdownMenuItem onClick={() => handleStatusChange(contact.id, 'suspended')}>
                                                                    <Ban className="mr-2 h-4 w-4" /> Suspend
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem onClick={() => handleStatusChange(contact.id, 'active')}>
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
                                                                onClick={() => confirmDelete(contact.id)}
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

            <ConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Contact"
                description="Are you sure you want to delete this contact? This action cannot be undone."
                onConfirm={handleDelete}
                loading={deleting}
            />
        </div>
    );
}
