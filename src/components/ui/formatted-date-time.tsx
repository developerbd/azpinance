'use client';

import { useTimezone } from '@/components/providers/timezone-provider';
import { formatInTimeZone } from 'date-fns-tz';
import { cn } from '@/lib/utils';

interface FormattedDateTimeProps {
    date: string | Date | null | undefined;
    formatStr?: string; // e.g. 'MMM d, yyyy h:mm a'
    className?: string;
}

export function FormattedDateTime({ date, formatStr = 'MMM d, yyyy h:mm a', className }: FormattedDateTimeProps) {
    const { timezone } = useTimezone();

    if (!date) return <span className={className}>-</span>;

    let formatted = '-';
    let isValid = true;

    try {
        const d = new Date(date);
        formatted = formatInTimeZone(d, timezone, formatStr);
    } catch (e) {
        console.error("Date formatting error", e);
        isValid = false;
    }

    if (!isValid) return <span className={className}>Invalid Date</span>;

    return (
        <span className={cn("whitespace-nowrap", className)} title={`${timezone}`}>
            {formatted}
        </span>
    );
}
