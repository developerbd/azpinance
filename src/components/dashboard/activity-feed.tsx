'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeftRight, FileText, CreditCard, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormattedDateTime } from '@/components/ui/formatted-date-time';

interface ActivityFeedProps {
    activities: any[];
}

import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

export function ActivityFeed({ activities }: ActivityFeedProps) {
    return (
        <Card className="h-full flex flex-col overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/40 bg-muted/5">
                <CardTitle className="text-base font-semibold tracking-tight">Recent Activity</CardTitle>
                <Link href="/activity">
                    <Button variant="ghost" size="sm" className="h-8 text-xs font-medium text-muted-foreground hover:text-primary">
                        View All <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0">
                <ScrollArea className="h-full">
                    <div className="flex flex-col">
                        {activities.length > 0 ? (
                            activities.map((activity, index) => (
                                <div key={`${activity.type}-${activity.id}`} className={cn(
                                    "flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors group",
                                    index !== activities.length - 1 && "border-b border-border/40"
                                )}>
                                    <div className={cn(
                                        "h-9 w-9 rounded-full flex items-center justify-center shadow-sm ring-1 ring-inset ring-black/5",
                                        activity.type === 'forex' && "bg-blue-50 text-blue-600",
                                        activity.type === 'invoice' && "bg-emerald-50 text-emerald-600",
                                        activity.type === 'payment' && "bg-orange-50 text-orange-600",
                                    )}>
                                        {activity.type === 'forex' && <ArrowLeftRight className="h-4 w-4" />}
                                        {activity.type === 'invoice' && <FileText className="h-4 w-4" />}
                                        {activity.type === 'payment' && <CreditCard className="h-4 w-4" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{activity.description}</p>
                                        <p className="text-[11px] text-muted-foreground">
                                            <FormattedDateTime date={activity.date} formatStr="MMM d, h:mm a" />
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {activity.transactionDate && (
                                                <span className="text-[10px] text-muted-foreground font-medium opacity-80">
                                                    <FormattedDateTime date={activity.transactionDate} formatStr="MMM d, yy" />
                                                </span>
                                            )}
                                            <p className={cn(
                                                "text-sm font-bold tabular-nums",
                                                activity.type === 'forex' ? "text-blue-600" :
                                                    activity.type === 'invoice' ? "text-emerald-600" : "text-orange-600"
                                            )}>
                                                {activity.type === 'forex' ? '$' : '৳'}
                                                {Number(activity.amount).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-end gap-1 mt-0.5">
                                            {activity.status === 'approved' || activity.status === 'paid' || activity.status === 'completed' ? (
                                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                            ) : (
                                                <Clock className="h-3 w-3 text-amber-500" />
                                            )}
                                            <span className="text-[10px] text-muted-foreground capitalize">{activity.status}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-center p-6">
                                <p className="text-sm text-muted-foreground">No recent activity found.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
