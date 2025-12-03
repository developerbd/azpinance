import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Calendar, CreditCard } from 'lucide-react';

interface ForexStatsProps {
    stats: {
        today_volume_usd: number;
        month_volume_usd: number;
        month_volume_bdt: number;
        month_avg_rate: number;
        total_volume_usd: number;
        total_volume_bdt: number;
    } | null;
}

export function ForexStats({ stats }: ForexStatsProps) {
    const safeStats = stats || {
        today_volume_usd: 0,
        month_volume_usd: 0,
        month_volume_bdt: 0,
        month_avg_rate: 0,
        total_volume_usd: 0,
        total_volume_bdt: 0
    };

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 w-full">
            <Card className="bg-gradient-to-br from-blue-50/50 via-background to-background border-blue-200/50 dark:from-blue-950/20 dark:border-blue-900/50 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">Today's Transactions</CardTitle>
                    <div className="p-2 bg-blue-100/50 dark:bg-blue-900/30 rounded-full">
                        <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground">${safeStats.today_volume_usd.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">
                        Volume for today
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50/50 via-background to-background border-emerald-200/50 dark:from-emerald-950/20 dark:border-emerald-900/50 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Monthly Volume</CardTitle>
                    <div className="p-2 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-full">
                        <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground">${safeStats.month_volume_usd.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">
                        ৳{safeStats.month_volume_bdt.toLocaleString()} (BDT)
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-violet-50/50 via-background to-background border-violet-200/50 dark:from-violet-950/20 dark:border-violet-900/50 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wider">Avg Rate (Month)</CardTitle>
                    <div className="p-2 bg-violet-100/50 dark:bg-violet-900/30 rounded-full">
                        <DollarSign className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground">{safeStats.month_avg_rate.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">
                        Weighted average
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-rose-50/50 via-background to-background border-rose-200/50 dark:from-rose-950/20 dark:border-rose-900/50 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">Total Volume</CardTitle>
                    <div className="p-2 bg-rose-100/50 dark:bg-rose-900/30 rounded-full">
                        <CreditCard className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground">${safeStats.total_volume_usd.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">
                        All Time
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
