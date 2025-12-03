import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import IntegrationsForm from '@/components/settings/integrations-form';

export default async function IntegrationsSettingsPage() {
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

    // Allow Admin, Supervisor, Accountant. Redirect Guest.
    if (!['admin', 'supervisor', 'accountant'].includes(role)) {
        return redirect('/dashboard');
    }

    // Fetch system settings
    const { data: settings } = await supabase
        .from('system_settings')
        .select('*')
        .single();

    return (
        <div className="container mx-auto py-10">
            <h1 className="mb-6 text-3xl font-bold">Integrations & SEO</h1>
            <Card>
                <CardHeader>
                    <CardTitle>External Tools</CardTitle>
                    <CardDescription>Manage external tools and SEO settings.</CardDescription>
                </CardHeader>
                <CardContent>
                    <IntegrationsForm settings={settings} />
                </CardContent>
            </Card>
        </div>
    );
}
