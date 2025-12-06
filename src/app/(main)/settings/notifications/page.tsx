import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import NotificationSettingsClient from '@/components/settings/notifications-client';

export default async function NotificationSettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    const role = userProfile?.role || 'guest';

    // Allow Admin, Supervisor. Redirect Guest, Accountant.
    if (!['admin', 'supervisor'].includes(role)) {
        redirect('/dashboard');
    }

    return <NotificationSettingsClient />;
}
