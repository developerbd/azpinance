'use client';

import { cn } from '@/lib/utils';

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
    className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8", className)}>
            <div>
                <h1 className="text-2xl font-heading font-semibold tracking-tight text-foreground">{title}</h1>
                {description && (
                    <p className="text-sm text-muted-foreground mt-1">{description}</p>
                )}
            </div>
            <div className="flex items-center gap-3">
                {children}
            </div>
        </div>
    );
}
