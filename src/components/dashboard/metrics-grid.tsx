'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Activity, Wallet, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';

interface MetricsGridProps {
    metrics: {
        total_volume_usd: number;
        active_float_usd: number;
        total_supplier_dues: number;
        settlement_score: number;
    };
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Active Float (USD) */}
            <Card className="bg-gradient-to-br from-blue-50/50 via-background to-background border-blue-200/50 dark:from-blue-950/20 dark:border-blue-900/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Active Float</CardTitle>
                    <div className="p-2 bg-blue-100/50 dark:bg-blue-900/30 rounded-full">
                        <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground tracking-tight">
                        ${metrics.active_float_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-wide">
                        Unsettled USD
                    </p>
                </CardContent>
            </Card>

            {/* Supplier Dues (BDT) */}
            <Card className="bg-gradient-to-br from-rose-50/50 via-background to-background border-rose-200/50 dark:from-rose-950/20 dark:border-rose-900/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Supplier Dues</CardTitle>
                    <div className="p-2 bg-rose-100/50 dark:bg-rose-900/30 rounded-full">
                        <ArrowDownRight className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground tracking-tight">
                        ৳{metrics.total_supplier_dues.toLocaleString()}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-wide">
                        Total Liability
                    </p>
                </CardContent>
            </Card>

            {/* Total Volume (USD) */}
            <Card className="bg-gradient-to-br from-emerald-50/50 via-background to-background border-emerald-200/50 dark:from-emerald-950/20 dark:border-emerald-900/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total Volume</CardTitle>
                    <div className="p-2 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-full">
                        <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground tracking-tight">
                        ${metrics.total_volume_usd.toLocaleString()}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-wide">
                        Processed USD
                    </p>
                </CardContent>
            </Card>

            {/* Settlement Score */}
            <Card className="bg-gradient-to-br from-violet-50/50 via-background to-background border-violet-200/50 dark:from-violet-950/20 dark:border-violet-900/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">Settlement Score</CardTitle>
                    <div className="p-2 bg-violet-100/50 dark:bg-violet-900/30 rounded-full">
                        <CheckCircle2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground tracking-tight">
                        {metrics.settlement_score.toFixed(1)}%
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-wide">
                        Payment Efficiency
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
