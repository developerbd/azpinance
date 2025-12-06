import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';

export default async function ActivityLogPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch logs with user details
    const { data: logs, error } = await supabase
        .from('audit_logs')
        .select(`
            id,
            action,
            details,
            created_at,
            users (
                full_name,
                email
            )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error fetching audit logs:', error);
    }

    return (
        <div className="container mx-auto py-10 space-y-6">
            <div>
                <h1 className="text-2xl font-heading font-semibold tracking-tight">Activity Log</h1>
                <p className="text-muted-foreground">
                    System-wide audit trail of user actions.
                </p>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs?.map((log: any) => (
                            <TableRow key={log.id}>
                                <TableCell className="whitespace-nowrap">
                                    {format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{log.users?.full_name || 'Unknown'}</span>
                                        <span className="text-xs text-muted-foreground">{log.users?.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="font-medium">{log.action}</span>
                                </TableCell>
                                <TableCell className="font-mono text-xs max-w-[300px] truncate">
                                    {JSON.stringify(log.details)}
                                </TableCell>
                            </TableRow>
                        ))}
                        {logs?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No activity recorded.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
