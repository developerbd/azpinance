'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, DollarSign, Wallet } from 'lucide-react';

interface SupplierStatsProps {
    stats: {
        totalPaid: number;
        totalDue: number;
    } | null;
}

export function SupplierStats({ stats }: SupplierStatsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Total Paid to Suppliers
                    </CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">৳{stats?.totalPaid.toLocaleString() || '0'}</div>
                    <p className="text-xs text-muted-foreground">
                        Lifetime payments
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Total Outstanding Due
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">৳{stats?.totalDue.toLocaleString() || '0'}</div>
                    <p className="text-xs text-muted-foreground">
                        Current payable amount
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
