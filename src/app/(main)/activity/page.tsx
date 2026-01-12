'use client';

import { useState, useEffect } from 'react';
import { getActivities, ActivityItem } from '@/app/actions/get-activities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FormattedDateTime } from '@/components/ui/formatted-date-time';
import { cn } from '@/lib/utils';
import {
    ArrowLeftRight,
    FileText,
    CreditCard,
    CheckCircle2,
    Clock,
    Filter,
    Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ActivityPage() {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [filterType, setFilterType] = useState<'all' | 'forex' | 'payment' | 'invoice'>('all');
    const LIMIT = 20;

    useEffect(() => {
        // Reset and fetch when filter changes
        setPage(1);
        setActivities([]);
        setHasMore(true);
        fetchActivities(1, filterType, true);
    }, [filterType]);

    const fetchActivities = async (pageNum: number, type: string, isReset: boolean = false) => {
        setLoading(true);
        try {
            const { data, count } = await getActivities(
                pageNum,
                LIMIT,
                { type: type as any }
            );

            if (isReset) {
                setActivities(data);
            } else {
                setActivities(prev => [...prev, ...data]);
            }

            // Check if we reached the end
            if (data.length < LIMIT || (pageNum * LIMIT) >= count) {
                setHasMore(false);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchActivities(nextPage, filterType);
    };

    return (
        <div className="container mx-auto py-8 max-w-5xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Recent Transactions</h1>
                    <p className="text-muted-foreground mt-1">
                        View and filter all system activities, transactions, and payments.
                    </p>
                </div>
                {/* Placeholder for Date Filter if needed later */}
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <Tabs
                            value={filterType}
                            onValueChange={(val) => setFilterType(val as any)}
                            className="w-full sm:w-auto"
                        >
                            <TabsList className="grid w-full grid-cols-4 sm:w-auto">
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="forex">Forex</TabsTrigger>
                                <TabsTrigger value="payment">Payments</TabsTrigger>
                                <TabsTrigger value="invoice">Invoices</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 px-3 py-1 rounded-md">
                            <Filter className="h-3.5 w-3.5" />
                            <span>Showing {activities.length} items</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="flex flex-col divide-y divide-border/50">
                        {activities.length > 0 ? (
                            activities.map((activity) => (
                                <div
                                    key={`${activity.type}-${activity.reference_id}-${activity.created_at}`}
                                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                                >
                                    {/* Icon */}
                                    <div className={cn(
                                        "h-10 w-10 shrink-0 rounded-full flex items-center justify-center shadow-sm ring-1 ring-inset ring-black/5 mt-1 sm:mt-0",
                                        activity.type === 'forex' && "bg-blue-50 text-blue-600",
                                        activity.type === 'invoice' && "bg-emerald-50 text-emerald-600",
                                        activity.type === 'payment' && "bg-orange-50 text-orange-600",
                                    )}>
                                        {activity.type === 'forex' && <ArrowLeftRight className="h-5 w-5" />}
                                        {activity.type === 'invoice' && <FileText className="h-5 w-5" />}
                                        {activity.type === 'payment' && <CreditCard className="h-5 w-5" />}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 grid gap-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-semibold truncate text-foreground/90">
                                                {activity.description}
                                            </p>

                                            {/* Status Badge */}
                                            <div className="flex items-center shrink-0">
                                                <Badge variant={
                                                    activity.status === 'approved' || activity.status === 'completed' || activity.status === 'paid'
                                                        ? 'outline' // success-like outline? 
                                                        : 'secondary'
                                                } className={cn(
                                                    "gap-1 h-6 px-2 font-normal capitalize",
                                                    (activity.status === 'approved' || activity.status === 'completed' || activity.status === 'paid')
                                                    && "text-emerald-600 border-emerald-200 bg-emerald-50",
                                                    (activity.status === 'pending') && "text-amber-600 border-amber-200 bg-amber-50",
                                                )}>
                                                    {(activity.status === 'approved' || activity.status === 'completed' || activity.status === 'paid') ? (
                                                        <CheckCircle2 className="h-3 w-3" />
                                                    ) : (
                                                        <Clock className="h-3 w-3" />
                                                    )}
                                                    {activity.status}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1.5">
                                                <span className="font-medium text-foreground/70">Recorded:</span>
                                                <FormattedDateTime date={activity.created_at} formatStr="MMM d, yyyy h:mm a" />
                                            </span>

                                            {/* Transaction Date (if different or explicit) */}
                                            {activity.transaction_date && (
                                                <span className="flex items-center gap-1.5 before:content-['•'] before:mr-4 before:text-muted-foreground/50">
                                                    <span className="font-medium text-foreground/70">Transaction Date:</span>
                                                    <FormattedDateTime date={activity.transaction_date} formatStr="MMM d, yyyy" />
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Amount */}
                                    <div className="text-right shrink-0 mt-2 sm:mt-0 pl-14 sm:pl-0">
                                        <p className={cn(
                                            "text-base font-bold tabular-nums tracking-tight",
                                            activity.type === 'forex' ? "text-blue-600" :
                                                activity.type === 'invoice' ? "text-emerald-600" : "text-orange-600"
                                        )}>
                                            {activity.type === 'forex' ? '$' : '৳'}
                                            {Number(activity.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground uppercase font-medium mt-0.5">
                                            {activity.currency}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            !loading && (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="bg-muted/30 p-4 rounded-full mb-4">
                                        <Filter className="h-8 w-8 text-muted-foreground/50" />
                                    </div>
                                    <p className="text-lg font-medium">No activities found</p>
                                    <p className="text-sm text-muted-foreground max-w-sm mt-1">
                                        No recent activities match your selected filter. Try changing the filter or add new transactions.
                                    </p>
                                </div>
                            )
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Load More Trigger */}
            {hasMore && (
                <div className="flex justify-center pt-4">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={handleLoadMore}
                        disabled={loading}
                        className="min-w-[150px]"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            "Load More Activities"
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
