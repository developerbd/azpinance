import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import UserList from '../user-list';

export default async function UserManagementPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/login');
    }

    // Check user role
    const { data: userProfile } = await supabase
        .from('users')
        .select('role, is_super_admin')
        .eq('id', user.id)
        .single();

    const role = userProfile?.role || 'guest';
    const isSuperAdmin = userProfile?.is_super_admin || false;

    // Allow Admin, Supervisor. Redirect Guest, Accountant.
    if (!['admin', 'supervisor'].includes(role)) {
        return redirect('/dashboard');
    }

    // Fetch all users for management
    const { data: users } = await supabase
        .from('users')
        .select('*, admin_grace_period_start, is_2fa_exempt')
        .order('created_at', { ascending: false });

    return (
        <div className="container mx-auto py-10">
            <h1 className="mb-6 text-2xl font-heading font-semibold tracking-tight">User Management</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>Manage users and their roles.</CardDescription>
                </CardHeader>
                <CardContent>
                    <UserList initialUsers={users || []} currentUserRole={role} currentUserIsSuperAdmin={isSuperAdmin} />
                </CardContent>
            </Card>
        </div>
    );
}
