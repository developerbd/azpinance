'use client';

import { Button } from '@/components/ui/button';
import { Plus, ArrowLeftRight, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface DashboardHeaderProps {
    userName: string;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
    const today = new Date();

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-2xl font-heading font-semibold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Good {getHoursGreeting()}, {userName}
                </h1>
                <p className="text-muted-foreground font-medium mt-1">
                    {format(today, 'EEEE, MMMM do, yyyy')}
                </p>
            </div>

            <div className="flex items-center gap-3">

                <Link href="/transactions/forex/new">
                    <Button variant="outline" size="sm" className="rounded-full border-primary/20 hover:bg-primary/5 hover:text-primary transition-all">
                        <ArrowLeftRight className="mr-2 h-4 w-4" /> New Forex
                    </Button>
                </Link>
                <Link href="/transactions/supplier-payments/new">
                    <Button className="rounded-full shadow-lg hover:shadow-primary/25 transition-all">
                        <CreditCard className="mr-2 h-4 w-4" /> Make Payment
                    </Button>
                </Link>
            </div>
        </div>
    );
}

function getHoursGreeting() {
    const hours = new Date().getHours();
    if (hours < 12) return 'Morning';
    if (hours < 18) return 'Afternoon';
    return 'Evening';
}
