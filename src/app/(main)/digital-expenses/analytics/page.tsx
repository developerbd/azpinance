import { AnalyticsDashboard } from '@/components/digital-expenses/analytics/dashboard';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
    title: 'Reports & Analytics - Digital Expenses',
    description: 'Analyze spending, trends, and export accounting data.',
};

export default async function AnalyticsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role === 'guest') {
        redirect('/digital-expenses');
    }

    return (
        <div className="container mx-auto py-10 space-y-6">
            <div>
                <h1 className="text-2xl font-heading font-semibold tracking-tight">Reports & Analytics</h1>
                <p className="text-muted-foreground">
                    Analyze your digital spending and export data for accounting.
                </p>
            </div>

            <AnalyticsDashboard />
        </div>
    );
}
