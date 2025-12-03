'use client';

import { useState, useEffect, useCallback } from 'react';
import { getActivityLogs } from '@/app/actions/get-activity-logs';
import { createClient } from '@/lib/supabase/client';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { Loader2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
export function ActivityLogTable() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [actionType, setActionType] = useState('all');
    const [userId, setUserId] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [users, setUsers] = useState<any[]>([]);

    const supabase = createClient();

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const { data, count, error } = await getActivityLogs(
                page,
                limit,
                actionType,
                userId,
                dateFrom,
                dateTo
            );

            if (!error) {
                setLogs(data || []);
                setTotalCount(count || 0);
                setError(null);
            } else {
                console.error('Error fetching logs:', error);
                setLogs([]);
                setError(typeof error === 'string' ? error : 'Failed to fetch logs');
            }
        } catch (err: any) {
            console.error('Exception fetching logs:', err);
            setLogs([]);
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    }, [page, limit, actionType, userId, dateFrom, dateTo]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    useEffect(() => {
        const fetchUsers = async () => {
            const { data } = await supabase.from('users').select('id, full_name, email');
            if (data) setUsers(data);
        };
        fetchUsers();
    }, [supabase]);

    const totalPages = Math.ceil(totalCount / limit);

    const formatDate = (dateString: string) => {
        try {
            if (!dateString) return '-';
            return format(new Date(dateString), 'MMM d, yyyy HH:mm:ss');
        } catch (e) {
            return 'Invalid Date';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Activity Logs</h2>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="space-y-1">
                            <span className="text-sm font-medium">Action Type</span>
                            <Select value={actionType} onValueChange={(val) => { setActionType(val); setPage(1); }}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="All Actions" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Actions</SelectItem>
                                    <SelectItem value="CREATE">Create</SelectItem>
                                    <SelectItem value="UPDATE">Update</SelectItem>
                                    <SelectItem value="DELETE">Delete</SelectItem>
                                    <SelectItem value="LOGIN">Login</SelectItem>
                                    <SelectItem value="PURGE_CACHE">Purge Cache</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <span className="text-sm font-medium">User</span>
                            <Select value={userId} onValueChange={(val) => { setUserId(val); setPage(1); }}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="All Users" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Users</SelectItem>
                                    {users.map(u => (
                                        <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <span className="text-sm font-medium">From Date</span>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                                className="w-[150px]"
                            />
                        </div>

                        <div className="space-y-1">
                            <span className="text-sm font-medium">To Date</span>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                                className="w-[150px]"
                            />
                        </div>

                        <Button variant="outline" size="icon" onClick={fetchLogs} title="Refresh">
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Entity Type</TableHead>
                            <TableHead>Entity ID</TableHead>
                            <TableHead>IP Address</TableHead>
                            <TableHead>Device Info</TableHead>
                            <TableHead>Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                    {error ? (
                                        <span className="text-destructive font-medium">{error}</span>
                                    ) : (
                                        "No activity logs found."
                                    )}
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="whitespace-nowrap">
                                        {formatDate(log.created_at)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{log.users?.full_name || 'Unknown'}</span>
                                            <span className="text-xs text-muted-foreground">{log.users?.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{log.action_type}</Badge>
                                    </TableCell>
                                    <TableCell className="text-xs font-mono">{log.entity_type}</TableCell>
                                    <TableCell className="text-xs font-mono text-muted-foreground">
                                        {log.entity_id || '-'}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {log.ip_address || '-'}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate" title={log.user_agent}>
                                        {log.user_agent || '-'}
                                    </TableCell>
                                    <TableCell className="max-w-[300px]">
                                        <pre className="text-[10px] bg-muted p-1 rounded overflow-x-auto">
                                            {JSON.stringify(log.details, null, 2)}
                                        </pre>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Showing {logs.length} of {totalCount} records
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => p + 1)}
                        disabled={page >= totalPages}
                    >
                        Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
