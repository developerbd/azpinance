'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { differenceInDays, format } from 'date-fns';
import { RefreshCw, Check } from 'lucide-react';
import { RenewModal } from './renew-modal';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface UpcomingRenewalsProps {
    renewals: any[];
}

export function UpcomingRenewalsWidget({ renewals }: UpcomingRenewalsProps) {
    const [selectedExpense, setSelectedExpense] = useState<any | null>(null);

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center justify-between">
                        Upcoming Renewals (Next 30 Days)
                        <Badge variant="outline" className="ml-2 font-normal">
                            {renewals.length} Pending
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {renewals.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground text-sm">
                                No upcoming renewals.
                            </div>
                        ) : (
                            renewals.map((item) => {
                                const daysLeft = differenceInDays(new Date(item.next_renewal_date), new Date());
                                const isUrgent = daysLeft <= 3;
                                const isWarning = daysLeft <= 7;

                                return (
                                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                        <div className="space-y-1">
                                            <p className="font-medium leading-none">{item.title}</p>
                                            <p className="text-xs text-muted-foreground">{format(new Date(item.next_renewal_date), 'MMM d, yyyy')}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="font-semibold text-sm">{formatCurrency(item.amount_usd)}</p>
                                                <p className={cn(
                                                    "text-xs font-medium",
                                                    isUrgent ? "text-red-500" : isWarning ? "text-yellow-600" : "text-green-600 cancel-italic" // cancel-italic just to reset
                                                )}>
                                                    {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : daysLeft === 0 ? 'Due Today' : `${daysLeft} days left`}
                                                </p>
                                            </div>
                                            <Button size="sm" variant="outline" className="h-8 gap-2" onClick={() => setSelectedExpense(item)}>
                                                <RefreshCw className="h-3.5 w-3.5" />
                                                Renew
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </CardContent>
            </Card>

            <RenewModal
                isOpen={!!selectedExpense}
                onClose={() => setSelectedExpense(null)}
                expense={selectedExpense}
            />
        </>
    );
}
