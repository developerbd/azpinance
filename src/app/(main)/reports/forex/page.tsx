import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ReportDashboard } from '@/components/reports/report-dashboard';
import { DateRangePicker } from '@/components/reports/date-range-picker';


export default async function ReportsPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | undefined }>
}) {
    const supabase = await createClient();
    const params = await searchParams;

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role === 'guest') {
        redirect('/dashboard');
    }

    // Default to current month
    const now = new Date();
    const defaultFrom = format(startOfMonth(now), 'yyyy-MM-dd');
    const defaultTo = format(endOfMonth(now), 'yyyy-MM-dd');

    const from = params.from || defaultFrom;
    const to = params.to || defaultTo;

    // Fetch system timezone
    const { data: settings } = await supabase
        .from('system_settings')
        .select('timezone')
        .single();
    const timezone = settings?.timezone || 'UTC';

    // Fetch Report Data
    const { data: reportData, error } = await supabase.rpc('get_forex_report_data', {
        p_start_date: from,
        p_end_date: to,
        p_timezone: timezone
    });

    if (error) {
        console.error('Error fetching report data:', error);
    }

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-heading font-semibold tracking-tight">Forex Reports</h1>
                    <p className="text-muted-foreground">
                        Insights and analytics for {from} to {to}
                    </p>
                </div>
                <div className="flex flex-col md:flex-row gap-2">
                    <DateRangePicker from={from} to={to} />
                </div>
            </div>

            <ReportDashboard data={reportData} />
        </div>
    );
}
