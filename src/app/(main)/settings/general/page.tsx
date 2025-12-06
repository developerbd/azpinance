import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import GeneralSettingsForm from '@/components/settings/general-form';

export const dynamic = 'force-dynamic';

export default async function GeneralSettingsPage() {
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

    // Allow all authenticated users (Guest, Accountant, Supervisor, Admin)

    // Determine if read-only
    // Guest and Accountant cannot change anything.
    // Supervisor and Admin can update.
    const isReadOnly = ['guest', 'accountant'].includes(role);

    // Fetch system settings
    const { data: settings, error: settingsError } = await supabase
        .from('system_settings')
        .select('*')
        .single();

    return (
        <div className="container mx-auto py-10">
            <h1 className="mb-6 text-2xl font-heading font-semibold tracking-tight">General Settings</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Company Information</CardTitle>
                    <CardDescription>Manage your company details.</CardDescription>
                </CardHeader>
                <CardContent>
                    <GeneralSettingsForm settings={settings} readOnly={isReadOnly} />
                </CardContent>
            </Card>

            {/* SMTP Settings - Only for Admins */}
            {role === 'admin' && (
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Email Configuration (SMTP)</CardTitle>
                        <CardDescription>Configure outgoing email settings for notifications.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SmtpSettingsLoader />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// Separate component to fetch SMTP settings on the server
import { getSmtpSettings } from '@/app/actions/get-smtp-settings';
import SmtpSettingsForm from '@/components/settings/smtp-form';

async function SmtpSettingsLoader() {
    const settings = await getSmtpSettings();

    if (settings.error) {
        return <div className="text-red-500">Error loading SMTP settings: {settings.error}</div>;
    }

    return <SmtpSettingsForm initialSettings={settings} />;
}
