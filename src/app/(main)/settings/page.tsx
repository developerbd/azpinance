import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
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

    if (role === 'admin') {
        return redirect('/settings/general');
    } else if (['supervisor', 'accountant'].includes(role)) {
        return redirect('/settings/users');
    } else {
        return redirect('/dashboard');
    }
}
