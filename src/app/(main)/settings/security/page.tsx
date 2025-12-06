import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SecuritySettingsForm from '@/components/settings/security-form';

export default async function SecuritySettingsPage() {
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
        .select('role')
        .eq('id', user.id)
        .single();

    const role = userProfile?.role || 'guest';

    // Allow Admin, Supervisor
    if (!['admin', 'supervisor'].includes(role)) {
        return redirect('/dashboard');
    }

    // Fetch system settings
    const { data: settings } = await supabase
        .from('system_settings')
        .select('*')
        .single();

    return (
        <div className="container mx-auto py-10">
            <h1 className="mb-6 text-2xl font-heading font-semibold tracking-tight">Security Settings</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Security Configuration</CardTitle>
                    <CardDescription>Manage IP restrictions and cache.</CardDescription>
                </CardHeader>
                <CardContent>
                    <SecuritySettingsForm settings={settings} />
                </CardContent>
            </Card>
        </div>
    );
}
