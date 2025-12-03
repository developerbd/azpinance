'use client';

import { useState, useEffect } from 'react';

import { cn } from '@/lib/utils';

interface ClockProps {
    timezone?: string;
    className?: string;
}

export function Clock({ timezone = 'UTC', className }: ClockProps) {
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        const updateTime = () => setTime(new Date());
        updateTime();
        const timer = setInterval(updateTime, 1000);
        return () => clearInterval(timer);
    }, []);

    if (!time) return null; // Prevent hydration mismatch

    const formattedDate = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(time);

    const formattedTime = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    }).format(time);

    return (
        <div className={cn("flex flex-col items-end text-sm text-muted-foreground mr-4", className)}>
            <span className="font-medium text-foreground">{formattedTime}</span>
            <span className="text-xs whitespace-nowrap">{formattedDate}</span>
        </div>
    );
}
