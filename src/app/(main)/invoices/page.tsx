import { createClient } from '@/lib/supabase/server';
import { getInvoices } from '@/app/actions/invoices';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Plus, FileText, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { format } from 'date-fns';
import { PageHeader } from '@/components/ui/page-header';
import { InvoicesList } from '@/components/invoices/invoices-list';

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
    const { data: invoices, error } = await getInvoices();

    if (error) {
        return <div className="text-destructive p-4">Error loading invoices</div>;
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20';
            case 'overdue': return 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-500/20';
            case 'sent': return 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20';
            case 'draft': return 'bg-slate-500/10 text-slate-600 hover:bg-slate-500/20 border-slate-500/20';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user?.id)
        .single();

    return (
        <div className="container mx-auto p-2 space-y-6">
            <PageHeader
                title="Invoices & Bills"
                description="Manage your receivables and payables."
            >
                <Link href="/invoices/new?type=bill">
                    <Button variant="outline" size="sm" className="rounded-full border-primary/20 hover:bg-primary/5 hover:text-primary transition-all">
                        <ArrowDownLeft className="mr-2 h-4 w-4" />
                        New Bill
                    </Button>
                </Link>
                <Link href="/invoices/new?type=invoice">
                    <Button size="sm" className="rounded-full shadow-lg hover:shadow-primary/25 transition-all">
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        New Invoice
                    </Button>
                </Link>
            </PageHeader>

            <Card className="border-border/50 shadow-sm">
                <CardHeader className="px-6 pt-6 pb-4 border-b border-border/40">
                    <CardTitle className="text-lg font-semibold tracking-tight">Recent Documents</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <InvoicesList invoices={invoices || []} userRole={profile?.role || 'guest'} />
                </CardContent>
            </Card>
        </div>
    );
}
