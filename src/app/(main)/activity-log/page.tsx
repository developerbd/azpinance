import { createClient } from '@/lib/supabase/server';
import { ActivityLogTable } from '@/components/activity-log-table';
import { redirect } from 'next/navigation';

export default async function ActivityLogPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        redirect('/dashboard');
    }

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-6">Activity Log</h1>
            <ActivityLogTable />
        </div>
    );
}
