import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getComprehensiveDashboardStats } from '@/app/actions/get-comprehensive-dashboard-stats';
import { getUpcomingRenewals } from '@/app/actions/digital-expenses/get-upcoming-renewals';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { MetricsGrid } from '@/components/dashboard/metrics-grid';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { UpcomingRenewalsWidget } from '@/components/digital-expenses/upcoming-renewals-widget';
import dynamic from 'next/dynamic';

const LiquidityChartWidget = dynamic(() => import('@/components/dashboard/liquidity-chart-widget').then(mod => mod.LiquidityChartWidget), {
    loading: () => <div className="h-full w-full bg-muted/20 animate-pulse rounded-xl" />
});

export default async function DashboardPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/login');
    }

    // Fetch Comprehensive Stats & Renewals
    const [stats, renewals] = await Promise.all([
        getComprehensiveDashboardStats(),
        getUpcomingRenewals()
    ]);

    return (
        <div className="container mx-auto p-2 space-y-6">
            {/* Header & Quick Actions */}
            <DashboardHeader userName={stats.user_name} />

            {/* Key Metrics Grid */}
            <MetricsGrid metrics={stats.metrics} />

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Section (2/3 width) */}
                <div className="lg:col-span-2 h-[400px]">
                    <LiquidityChartWidget data={stats.chart_data} />
                </div>

                {/* Activity Feed (1/3 width) */}
                <div className="lg:col-span-1 h-[400px]">
                    <ActivityFeed activities={stats.recent_activity} />
                </div>
            </div>

            {/* Upcoming Renewals */}
            <div className="w-full">
                <UpcomingRenewalsWidget renewals={renewals} />
            </div>
        </div>
    );
}
