'use client';

import { useEffect, useState } from 'react';
import { getAuditLogs, AuditLogEntry } from '@/app/actions/digital-expenses/get-audit-logs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, formatDistanceToNow } from 'date-fns';
import { Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function ActivityHistory({ expenseId }: { expenseId: string }) {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAuditLogs(expenseId)
            .then(data => {
                setLogs(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load audit logs:', err);
                setLogs([]);
                setLoading(false);
            });
    }, [expenseId]);

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>;

    if (logs.length === 0) return <div className="text-center text-muted-foreground p-4">No activity history found.</div>;

    return (
        <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
                {logs.map((log) => (
                    <div key={log.id} className="relative pl-6 pb-2 border-l border-border/50 last:border-0 ml-2">
                        <div className="absolute left-[-5px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />

                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="font-semibold text-foreground">
                                    {log.users?.full_name || 'Unknown User'}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                    {log.action} this record
                                </span>
                                <span className="text-muted-foreground text-xs ml-auto">
                                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                </span>
                            </div>

                            <div className="mt-2 text-sm bg-muted/40 p-3 rounded-md space-y-2">
                                {Object.keys(log.change_log).length === 0 ? (
                                    <span className="text-muted-foreground italic">
                                        {log.action === 'Created' ? 'Expense created' : 'No fields changed'}
                                    </span>
                                ) : (
                                    Object.entries(log.change_log).map(([field, diff]) => (
                                        <div key={field} className="grid grid-cols-[100px_1fr] gap-2 items-center">
                                            <span className="font-medium text-muted-foreground capitalize">
                                                {field.replace('_', ' ')}
                                            </span>
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <Badge variant="outline" className="bg-background text-muted-foreground shrink-0 max-w-[120px] truncate">
                                                    {String(diff.from)}
                                                </Badge>
                                                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                                <Badge variant="secondary" className="bg-primary/10 text-primary shrink-0 max-w-[120px] truncate">
                                                    {String(diff.to)}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="text-[10px] text-muted-foreground/50 text-right mt-1">
                                {format(new Date(log.timestamp), 'PPpp')}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}
