'use client';

import { Activity, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type HealthStatus = {
    status: 'ok' | 'error';
    latency?: number;
    message?: string;
};

export function SystemStatus() {
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [loading, setLoading] = useState(true);

    const checkHealth = async () => {
        try {
            const res = await fetch('/api/health');
            if (res.ok) {
                const data = await res.json();
                setHealth(data);
            } else {
                setHealth({ status: 'error', message: 'System unreachable' });
            }
        } catch (error) {
            setHealth({ status: 'error', message: 'Connection failed' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkHealth();
        // Poll every 60 seconds
        const interval = setInterval(checkHealth, 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return null;

    const isOperational = health?.status === 'ok';
    const isDegraded = isOperational && (health?.latency || 0) > 800;
    const statusColor = !isOperational
        ? 'text-red-500 bg-red-500/10'
        : isDegraded
            ? 'text-yellow-500 bg-yellow-500/10'
            : 'text-emerald-500 bg-emerald-500/10'; // Using emerald for a distinct green

    // Gradient background for the container
    const containerGradient = !isOperational
        ? 'from-red-500/20 to-red-500/5'
        : isDegraded
            ? 'from-yellow-500/20 to-yellow-500/5'
            : 'from-primary/20 to-primary/5';

    return (
        <div className={cn("mt-auto p-4")}>
            <div className={cn(
                "rounded-xl p-4 border border-border/50 backdrop-blur-sm shadow-sm transition-all duration-500",
                "bg-gradient-to-br", containerGradient
            )}>
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center ring-1 ring-inset ring-white/10",
                        statusColor
                    )}>
                        {isOperational ? (
                            <Activity className="h-4 w-4 animate-pulse" />
                        ) : (
                            <AlertCircle className="h-4 w-4" />
                        )}
                    </div>
                    <div>
                        <p className="text-xs font-medium text-foreground/90">
                            {isOperational ? 'System Status' : 'System Issue'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={cn("h-1.5 w-1.5 rounded-full", !isOperational ? "bg-red-500" : isDegraded ? "bg-yellow-500" : "bg-emerald-500")} />
                            <p className="text-[10px] text-muted-foreground/80 font-medium">
                                {!isOperational
                                    ? 'Service Disruption'
                                    : isDegraded
                                        ? `Degraded (${health?.latency}ms)`
                                        : 'All systems operational'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
