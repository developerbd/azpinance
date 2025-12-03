'use client';

import { useEffect, useState } from 'react';
import { getCashFlowForecast } from '@/app/actions/get-cash-flow-stats';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { Loader2, TrendingUp, AlertCircle, DollarSign } from 'lucide-react';

export default function CashFlowReportPage() {
    const [data, setData] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const result = await getCashFlowForecast(30);
            if (result.data) {
                setData(result.data);
                setSummary(result.summary);
            }
            setLoading(false);
        };
        loadData();
    }, []);

    if (loading) {
        return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-2">Liquidity Forecast</h1>
            <p className="text-muted-foreground mb-8">
                Projected <strong>USD Inflow</strong> vs <strong>BDT Liability</strong> for the next 30 days.
            </p>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-orange-50/50 via-background to-background border-orange-200/50 dark:from-orange-950/20 dark:border-orange-900/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" /> Current Liability
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground tracking-tight">
                            ৳{summary?.immediate_payables_bdt?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}
                        </div>
                        <p className="text-[10px] font-medium text-muted-foreground mt-1 uppercase tracking-wide">Total BDT owed to suppliers</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50/50 via-background to-background border-emerald-200/50 dark:from-emerald-950/20 dark:border-emerald-900/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" /> Avg. Daily Volume
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground tracking-tight">
                            ${summary?.avg_daily_usd_inflow?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}
                        </div>
                        <p className="text-[10px] font-medium text-muted-foreground mt-1 uppercase tracking-wide">Projected USD Inflow / Day</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-violet-50/50 via-background to-background border-violet-200/50 dark:from-violet-950/20 dark:border-violet-900/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center gap-2">
                            <DollarSign className="h-4 w-4" /> Exchange Rate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground tracking-tight">
                            ৳{summary?.avg_exchange_rate?.toFixed(2) || '0'}
                        </div>
                        <p className="text-[10px] font-medium text-muted-foreground mt-1 uppercase tracking-wide">Avg Buy Rate (Last 30d)</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-rose-50/50 via-background to-background border-rose-200/50 dark:from-rose-950/20 dark:border-rose-900/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" /> 30-Day Liability
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground tracking-tight">
                            ৳{summary?.projected_30d_liability_bdt?.toLocaleString(undefined, { maximumFractionDigits: 0, notation: 'compact' }) || '0'}
                        </div>
                        <p className="text-[10px] font-medium text-muted-foreground mt-1 uppercase tracking-wide">Est. new debt from projected inflow</p>
                    </CardContent>
                </Card>
            </div>

            {/* Chart */}
            <Card className="col-span-4 border-none shadow-lg bg-gradient-to-br from-card/50 via-card to-card/50">
                <CardHeader>
                    <CardTitle className="text-xl font-bold">Cumulative Projection</CardTitle>
                    <CardDescription className="text-base">
                        Accumulated <span className="text-emerald-600 dark:text-emerald-400 font-semibold">USD Inflow</span> vs <span className="text-rose-600 dark:text-rose-400 font-semibold">BDT Liability</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[450px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorUsd" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorBdt" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(value) => format(new Date(value), 'MMM d')}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    yAxisId="left"
                                    tickFormatter={(value) => `৳${(value / 1000000).toFixed(1)}M`}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                    label={{ value: 'BDT Liability', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 12, dy: 40 }}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                    label={{ value: 'USD Inflow', angle: 90, position: 'insideRight', fill: 'hsl(var(--muted-foreground))', fontSize: 12, dy: -40 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: '0.75rem',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                                    }}
                                    labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '0.5rem' }}
                                    labelFormatter={(label) => format(new Date(label), 'MMMM d, yyyy')}
                                    formatter={(value: number, name: string) => {
                                        if (name === 'Cumulative USD Inflow') return [<span className="text-emerald-600 font-bold">${value.toLocaleString()}</span>, 'USD Inflow'];
                                        return [<span className="text-rose-600 font-bold">৳{value.toLocaleString()}</span>, 'BDT Liability'];
                                    }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Area
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="cumulative_liability_bdt"
                                    name="Cumulative BDT Liability"
                                    stroke="#f43f5e"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorBdt)"
                                />
                                <Area
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="cumulative_usd"
                                    name="Cumulative USD Inflow"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorUsd)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
