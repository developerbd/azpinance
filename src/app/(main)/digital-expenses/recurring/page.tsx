import { createClient } from '@/lib/supabase/server';
import { getDigitalExpenses } from '@/app/actions/digital-expenses/get-expenses';
import { getUpcomingRenewals } from '@/app/actions/digital-expenses/get-upcoming-renewals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, ArrowRight } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import Link from 'next/link';
import { UpcomingRenewalsWidget } from '@/components/digital-expenses/upcoming-renewals-widget';

export default async function RecurringExpensesPage() {
    const expenses = await getDigitalExpenses({ recurring_only: true });
    const upcoming = await getUpcomingRenewals();

    // Sort by next renewal date
    const sorted = activeExpenses(expenses).sort((a: any, b: any) => {
        if (!a.next_renewal_date) return 1;
        if (!b.next_renewal_date) return -1;
        return new Date(a.next_renewal_date).getTime() - new Date(b.next_renewal_date).getTime();
    });

    function activeExpenses(list: any[]) {
        return list.filter(e => e.status !== 'rejected');
    }

    const totalRecurringMonthly = expenses
        .filter((e: any) => e.status !== 'rejected')
        .reduce((sum: number, e: any) => {
            let monthlyCost = Number(e.amount_usd);
            if (e.frequency === 'quarterly') monthlyCost /= 3;
            if (e.frequency === 'yearly') monthlyCost /= 12;
            return sum + monthlyCost;
        }, 0);

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-heading font-semibold tracking-tight">Recurring Expenses</h1>
                    <p className="text-muted-foreground mt-2">
                        Projected Monthly Burn: <span className="font-bold text-foreground">${totalRecurringMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span> / mo
                    </p>
                </div>
            </div>

            {/* Upcoming Widget */}
            <UpcomingRenewalsWidget renewals={upcoming} />

            <div className="space-y-4">
                <h2 className="text-xl font-semibold tracking-tight">All Active Subscriptions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sorted.length === 0 ? (
                        <div className="col- span-3 text-muted-foreground">No recurring expenses found.</div>
                    ) : (
                        sorted.map((expense: any) => {
                            const daysUntil = expense.next_renewal_date ? differenceInDays(new Date(expense.next_renewal_date), new Date()) : null;
                            const isUrgent = daysUntil !== null && daysUntil <= 7 && daysUntil >= 0;

                            return (
                                <Card key={expense.id} className={`border ${isUrgent ? 'border-orange-300 bg-orange-50/50 dark:bg-orange-950/20' : ''}`}>
                                    <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                                        <div className="space-y-1">
                                            <CardTitle className="text-base font-semibold leading-none">{expense.title}</CardTitle>
                                            <p className="text-sm text-muted-foreground">{expense.vendor_platform}</p>
                                        </div>
                                        <Badge variant={isUrgent ? 'destructive' : 'secondary'}>
                                            {expense.frequency}
                                        </Badge>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="text-2xl font-bold">${Number(expense.amount_usd).toLocaleString()}</div>
                                            <div className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                                                {expense.payment_method}
                                            </div>
                                        </div>

                                        <div className="flex items-center text-sm gap-2">
                                            <CalendarClock className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">Renewal:</span>
                                            <span className={`font-medium ${isUrgent ? 'text-orange-600' : ''}`}>
                                                {expense.next_renewal_date ? format(new Date(expense.next_renewal_date), 'MMM d, yyyy') : 'N/A'}
                                            </span>
                                            {daysUntil !== null && daysUntil >= 0 && (
                                                <Badge variant="outline" className="ml-auto bg-background text-[10px]">
                                                    {daysUntil === 0 ? 'Today' : `in ${daysUntil} days`}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="mt-4 pt-4 border-t flex justify-end">
                                            <Link href={`/digital-expenses/${expense.id}/edit`} className="text-sm font-medium text-primary flex items-center hover:underline">
                                                Manage <ArrowRight className="ml-1 h-3 w-3" />
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
