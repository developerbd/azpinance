'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { startOfMonth, endOfMonth, subMonths, subDays, format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

interface DateRangePickerProps {
    from: string;
    to: string;
}

export function DateRangePicker({ from, to }: DateRangePickerProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const updateRange = (newFrom: string, newTo: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('from', newFrom);
        params.set('to', newTo);
        router.push(`${pathname}?${params.toString()}`);
    };

    const handlePreset = (preset: 'thisMonth' | 'lastMonth' | 'last7Days') => {
        const now = new Date();
        let newFrom = '';
        let newTo = '';

        switch (preset) {
            case 'thisMonth':
                newFrom = format(startOfMonth(now), 'yyyy-MM-dd');
                newTo = format(endOfMonth(now), 'yyyy-MM-dd');
                break;
            case 'lastMonth':
                const lastMonth = subMonths(now, 1);
                newFrom = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
                newTo = format(endOfMonth(lastMonth), 'yyyy-MM-dd');
                break;
            case 'last7Days':
                newFrom = format(subDays(now, 7), 'yyyy-MM-dd');
                newTo = format(now, 'yyyy-MM-dd');
                break;
        }
        updateRange(newFrom, newTo);
    };

    return (
        <div className="flex flex-wrap items-center gap-2 bg-muted/20 p-2 rounded-lg">
            <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <Input
                    type="date"
                    value={from}
                    onChange={(e) => updateRange(e.target.value, to)}
                    className="w-auto h-9"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                    type="date"
                    value={to}
                    onChange={(e) => updateRange(from, e.target.value)}
                    className="w-auto h-9"
                />
            </div>
            <div className="flex items-center gap-1 border-l pl-2 ml-2">
                <Button variant="ghost" size="sm" onClick={() => handlePreset('thisMonth')}>This Month</Button>
                <Button variant="ghost" size="sm" onClick={() => handlePreset('lastMonth')}>Last Month</Button>
                <Button variant="ghost" size="sm" onClick={() => handlePreset('last7Days')}>Last 7 Days</Button>
            </div>
        </div>
    );
}
