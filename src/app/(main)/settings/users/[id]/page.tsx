'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useRouter, useParams } from 'next/navigation';
import { FileUpload } from '@/components/file-upload';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';

export default function AdminUserProfilePage() {
    const params = useParams();
    const userId = params.id as string;
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [role, setRole] = useState('');
    const [status, setStatus] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string[]>([]);

    useEffect(() => {
        const fetchUser = async () => {
            setLoading(true);
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                toast.error('Failed to load user');
                router.push('/settings');
                return;
            }

            if (user) {
                setEmail(user.email || '');
                setFullName(user.full_name || '');
                setUsername(user.username || '');
                setRole(user.role || 'guest');
                setStatus(user.status || 'active');
                setAvatarUrl(user.avatar_url ? [user.avatar_url] : []);
            }
            setLoading(false);
        };

        if (userId) {
            fetchUser();
        }
    }, [userId, router, supabase]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const updates = {
            full_name: fullName,
            username: username,
            role: role,
            status: status,
            avatar_url: avatarUrl[0] || null,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId);

        if (error) {
            toast.error(error.message);
        } else {
            toast.success('User updated successfully');
            router.refresh();
        }
        setSaving(false);
    };

    if (loading) {
        return <div className="p-10">Loading user profile...</div>;
    }

    return (
        <div className="container mx-auto py-10 max-w-2xl">
            <div className="mb-6">
                <Link href="/settings" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to User Management
                </Link>
            </div>

            <h1 className="mb-6 text-2xl font-heading font-semibold tracking-tight">Edit User Profile</h1>

            <Card>
                <CardHeader>
                    <CardTitle>User Details</CardTitle>
                    <CardDescription>Update information and permissions for {email}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={email} disabled />
                        </div>

                        <div className="space-y-2">
                            <Label>Username</Label>
                            <Input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="username"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Full Name"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="supervisor">Supervisor</SelectItem>
                                        <SelectItem value="accountant">Accountant</SelectItem>
                                        <SelectItem value="guest">Guest</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="suspended">Suspended</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label>Avatar</Label>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={avatarUrl[0]} alt={fullName || username || 'User'} />
                                    <AvatarFallback className="bg-muted">
                                        <User className="h-10 w-10 text-muted-foreground" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <FileUpload
                                        bucket="avatars"
                                        existingFiles={avatarUrl}
                                        onUploadComplete={setAvatarUrl}
                                        maxFiles={1}
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Upload a new avatar or remove the current one.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
