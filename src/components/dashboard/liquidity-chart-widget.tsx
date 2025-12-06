'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface LiquidityChartWidgetProps {
    data: any[];
}

export function LiquidityChartWidget({ data }: LiquidityChartWidgetProps) {
    return (
        <Card className="h-full border-border/50 shadow-lg bg-card/40 backdrop-blur-xl">
            <CardHeader>
                <CardTitle className="text-lg font-semibold tracking-tight">Liquidity Forecast (30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorUsd" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorBdt" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(value) => format(new Date(value), 'd')}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 10, fill: '#888' }}
                            />
                            <YAxis
                                yAxisId="left"
                                tickFormatter={(value) => `৳${(value / 1000000).toFixed(1)}M`}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 10, fill: '#888' }}
                                width={50}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 10, fill: '#888' }}
                                width={40}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                labelFormatter={(label) => format(new Date(label), 'MMM d, yyyy')}
                                formatter={(value: number, name: string) => {
                                    if (name === 'USD Inflow') return [`$${value.toLocaleString()}`, name];
                                    return [`৳${value.toLocaleString()}`, name];
                                }}
                            />
                            <Area
                                yAxisId="left"
                                type="monotone"
                                dataKey="cumulative_liability_bdt"
                                name="BDT Liability"
                                stroke="#ef4444"
                                fillOpacity={1}
                                fill="url(#colorBdt)"
                                strokeWidth={2}
                            />
                            <Area
                                yAxisId="right"
                                type="monotone"
                                dataKey="cumulative_usd"
                                name="USD Inflow"
                                stroke="#22c55e"
                                fillOpacity={1}
                                fill="url(#colorUsd)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
