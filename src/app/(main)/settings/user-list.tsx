'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
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
import { MoreHorizontal, Trash, Ban, CheckCircle, UserPlus, Shield, Search, Filter, Edit, Eye, EyeOff, ShieldCheck, ShieldAlert } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type User = {
    id: string;
    email: string;
    full_name: string | null;
    username: string | null;
    role: 'admin' | 'supervisor' | 'accountant' | 'guest';
    status: 'active' | 'suspended';
    created_at: string;
    is_super_admin?: boolean;
    is_2fa_exempt?: boolean;
};

interface UserListProps {
    initialUsers: User[];
    currentUserRole: string;
    currentUserIsSuperAdmin: boolean;
}

export default function UserList({ initialUsers, currentUserRole, currentUserIsSuperAdmin }: UserListProps) {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [loading, setLoading] = useState(false);
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Edit User State
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editFullName, setEditFullName] = useState('');
    const [editRole, setEditRole] = useState('');
    const [editStatus, setEditStatus] = useState('');

    const supabase = createClient();

    // New User State
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [newUserFullName, setNewUserFullName] = useState('');
    const [newUserUsername, setNewUserUsername] = useState('');
    const [newUserRole, setNewUserRole] = useState('guest');
    const [showPassword, setShowPassword] = useState(false);

    const isAdmin = currentUserRole === 'admin';
    const isSupervisor = currentUserRole === 'supervisor';
    const canAddUser = isAdmin || isSupervisor;

    const router = useRouter();

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            (user.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (user.username?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = roleFilter === 'all' || user.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    const navigateToUser = (userId: string) => {
        // Allow navigation if admin or supervisor (view only for supervisor if restricted?)
        // Prompt says "can see all records". Assuming detail view is read-only or editable based on same rules.
        // For now, let's allow navigation.
        if (isAdmin || isSupervisor) {
            router.push(`/settings/users/${userId}`);
        }
    };

    const canManageUser = (targetUser: User) => {
        if (isAdmin) return true;
        if (isSupervisor) {
            return ['guest', 'accountant'].includes(targetUser.role);
        }
        return false;
    };

    const canDeleteUser = (targetUser: User) => {
        if (isAdmin) return true;
        return false;
    };

    const toggleStatus = async (userId: string, currentStatus: string) => {
        // Check permission
        const targetUser = users.find(u => u.id === userId);
        if (!targetUser || !canManageUser(targetUser)) return;

        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';

        try {
            const { updateUserStatus } = await import('@/app/actions/update-user-status');
            const result = await updateUserStatus(userId, newStatus);

            if (result.error) {
                toast.error(result.error);
            } else {
                setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus as any } : u));
                toast.success(`User ${newStatus === 'active' ? 'activated' : 'suspended'}`);
            }
        } catch (error) {
            toast.error('Failed to update status');
            console.error(error);
        }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        const targetUser = users.find(u => u.id === deleteId);
        if (!targetUser || !canDeleteUser(targetUser)) return;

        try {
            const { deleteUser } = await import('@/app/actions/delete-user');
            const result = await deleteUser(deleteId);

            if (result.error) {
                toast.error(result.error);
            } else {
                setUsers(users.filter(u => u.id !== deleteId));
                toast.success('User deleted successfully');
                window.location.reload();
            }
        } catch (error) {
            toast.error('Failed to delete user');
            console.error(error);
        }
        setDeleteId(null);
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        const targetUser = users.find(u => u.id === userId);
        if (!targetUser || !canManageUser(targetUser)) return;

        // Supervisor cannot promote to admin/supervisor
        if (isSupervisor && ['admin', 'supervisor'].includes(newRole)) {
            toast.error("You cannot assign Admin or Supervisor roles.");
            return;
        }

        try {
            const { updateUserRole } = await import('@/app/actions/update-user-role');
            const result = await updateUserRole(userId, newRole);

            if (result.error) {
                toast.error(result.error);
            } else {
                setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
                toast.success(`User role updated to ${newRole}`);
            }
        } catch (error) {
            toast.error('Failed to update role');
            console.error(error);
        }
    };

    const handleToggle2FAExemption = async (userId: string, currentExempt: boolean) => {
        const targetUser = users.find(u => u.id === userId);
        if (!targetUser || !currentUserIsSuperAdmin) return;

        const newExempt = !currentExempt;

        try {
            const { toggle2FAExemption } = await import('@/app/actions/toggle-2fa-exemption');
            const result = await toggle2FAExemption(userId, newExempt);

            if (result.error) {
                toast.error(result.error);
            } else {
                setUsers(users.map(u => u.id === userId ? { ...u, is_2fa_exempt: newExempt } : u));
                toast.success(`2FA exemption ${newExempt ? 'granted' : 'revoked'}`);
            }
        } catch (error) {
            toast.error('Failed to update 2FA exemption');
            console.error(error);
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canAddUser) return;

        setLoading(true);

        if (newUserPassword !== confirmPassword) {
            toast.error("Passwords don't match");
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('email', newUserEmail);
        formData.append('password', newUserPassword);
        formData.append('fullName', newUserFullName);
        formData.append('username', newUserUsername);
        formData.append('role', newUserRole);

        try {
            const { createUser } = await import('@/app/actions/create-user');
            const result = await createUser(formData);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('User created successfully');
                setIsAddUserOpen(false);
                // Reset form
                setNewUserEmail('');
                setNewUserPassword('');
                setNewUserFullName('');
                setNewUserRole('guest');
                // Refresh list (optional, as revalidatePath handles it, but client state needs update or refresh)
                window.location.reload(); // Simple reload to get new data
            }
        } catch (error) {
            toast.error('Failed to create user');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-[150px]">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                <SelectValue placeholder="Filter Role" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="supervisor">Supervisor</SelectItem>
                            <SelectItem value="accountant">Accountant</SelectItem>
                            <SelectItem value="guest">Guest</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {canAddUser && (
                    <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <UserPlus className="mr-2 h-4 w-4" /> Add User
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New User</DialogTitle>
                                <DialogDescription>
                                    Create a new user account. They will be able to login with these credentials.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddUser} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input
                                        value={newUserFullName}
                                        onChange={(e) => setNewUserFullName(e.target.value)}
                                        required
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Username</Label>
                                    <Input
                                        value={newUserUsername}
                                        onChange={(e) => setNewUserUsername(e.target.value)}
                                        placeholder="johndoe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        value={newUserEmail}
                                        onChange={(e) => setNewUserEmail(e.target.value)}
                                        required
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Password</Label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            value={newUserPassword}
                                            onChange={(e) => setNewUserPassword(e.target.value)}
                                            required
                                            placeholder="******"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <Eye className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Confirm Password</Label>
                                    <Input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        placeholder="******"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select value={newUserRole} onValueChange={setNewUserRole}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {isAdmin && <SelectItem value="admin">Admin</SelectItem>}
                                            {isAdmin && <SelectItem value="supervisor">Supervisor</SelectItem>}
                                            <SelectItem value="accountant">Accountant</SelectItem>
                                            <SelectItem value="guest">Guest</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={loading}>
                                        {loading ? 'Creating...' : 'Create User'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Username</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            {(isAdmin || isSupervisor) && <TableHead className="text-right">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.map((user) => (
                            <TableRow key={user.id} className="group">
                                <TableCell
                                    className="font-medium cursor-pointer hover:underline text-primary"
                                    onClick={() => navigateToUser(user.id)}
                                >
                                    {user.full_name || 'N/A'}
                                </TableCell>
                                <TableCell
                                    className="cursor-pointer hover:underline text-primary"
                                    onClick={() => navigateToUser(user.id)}
                                >
                                    {user.username || '-'}
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant="outline" className="capitalize">{user.role}</Badge>
                                        {user.is_super_admin && (
                                            <Badge className="bg-purple-600 hover:bg-purple-700 flex items-center gap-1">
                                                <ShieldCheck className="h-3 w-3" /> Super Admin
                                            </Badge>
                                        )}
                                        {user.is_2fa_exempt && !user.is_super_admin && (
                                            <Badge variant="outline" className="border-amber-500 text-amber-600 flex items-center gap-1">
                                                <ShieldAlert className="h-3 w-3" /> 2FA Exempt
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge className={user.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                                        {user.status}
                                    </Badge>
                                </TableCell>
                                {(canManageUser(user) || canDeleteUser(user)) && (
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

                                                {canManageUser(user) && (
                                                    <>
                                                        <DropdownMenuItem onClick={() => navigateToUser(user.id)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit Details
                                                        </DropdownMenuItem>
                                                        {!user.is_super_admin && (
                                                            <DropdownMenuSub>
                                                                <DropdownMenuSubTrigger>
                                                                    <Shield className="mr-2 h-4 w-4" /> Change Role
                                                                </DropdownMenuSubTrigger>
                                                                <DropdownMenuSubContent>
                                                                    <DropdownMenuRadioGroup value={user.role} onValueChange={(val) => handleRoleChange(user.id, val)}>
                                                                        {isAdmin && <DropdownMenuRadioItem value="admin">Admin</DropdownMenuRadioItem>}
                                                                        {isAdmin && <DropdownMenuRadioItem value="supervisor">Supervisor</DropdownMenuRadioItem>}
                                                                        <DropdownMenuRadioItem value="accountant">Accountant</DropdownMenuRadioItem>
                                                                        <DropdownMenuRadioItem value="guest">Guest</DropdownMenuRadioItem>
                                                                    </DropdownMenuRadioGroup>
                                                                </DropdownMenuSubContent>
                                                            </DropdownMenuSub>
                                                        )}

                                                        <DropdownMenuSeparator />

                                                        {!user.is_super_admin && (
                                                            <>
                                                                {user.status === 'active' ? (
                                                                    <DropdownMenuItem onClick={() => toggleStatus(user.id, 'suspended')}>
                                                                        <Ban className="mr-2 h-4 w-4" /> Suspend
                                                                    </DropdownMenuItem>
                                                                ) : (
                                                                    <DropdownMenuItem onClick={() => toggleStatus(user.id, 'active')}>
                                                                        <CheckCircle className="mr-2 h-4 w-4" /> Activate
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </>
                                                        )}

                                                        {currentUserIsSuperAdmin && user.role === 'admin' && !user.is_super_admin && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => handleToggle2FAExemption(user.id, user.is_2fa_exempt || false)}>
                                                                    <ShieldAlert className="mr-2 h-4 w-4" />
                                                                    {user.is_2fa_exempt ? 'Revoke 2FA Exemption' : 'Grant 2FA Exemption'}
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </>
                                                )}

                                                {canDeleteUser(user) && !user.is_super_admin && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-600 cursor-pointer"
                                                            onSelect={() => setDeleteId(user.id)}
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
                        ))}
                    </TableBody>
                </Table>
            </div>
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the user account and revoke all access.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
}
