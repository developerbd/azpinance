'use client';

import { useState, useEffect } from 'react';

interface ClockProps {
    timezone?: string;
}

export function Clock({ timezone = 'UTC' }: ClockProps) {
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        setTime(new Date());
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);
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
        <div className="flex flex-col items-end text-sm text-muted-foreground mr-4">
            <span className="font-medium text-foreground">{formattedTime}</span>
            <span className="text-xs">{formattedDate}</span>
        </div>
    );
}
