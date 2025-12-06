'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getContactsWithDue } from '@/app/actions/get-contacts-with-due';
import { Download, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function SupplierPaymentsReportClient() {
    const [payments, setPayments] = useState<any[]>([]);
    const [dues, setDues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

    const reportRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    const fetchData = async () => {
        setLoading(true);

        // Fetch Payments
        const { data: paymentData, error: paymentError } = await supabase
            .from('supplier_payments')
            .select(`
                amount,
                date,
                supplier:contacts(name),
                transaction_method,
                destination_account:financial_accounts(name)
            `)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true });

        if (!paymentError) {
            setPayments(paymentData || []);
        }

        // Fetch Dues
        const { data: duesData } = await getContactsWithDue();
        if (duesData) {
            // Filter only suppliers with non-zero due
            setDues(duesData.filter((c: any) => c.type === 'supplier' && c.current_due !== 0));
        }

        setLoading(false);
    };

    // Process Data for Charts

    // 1. Daily Trend
    const dailyData = eachDayOfInterval({
        start: new Date(startDate),
        end: new Date(endDate)
    }).map(day => {
        const dayPayments = payments.filter(p => isSameDay(new Date(p.date), day));
        const total = dayPayments.reduce((sum, p) => sum + p.amount, 0);
        return {
            date: format(day, 'MMM d'),
            amount: total
        };
    });

    // 2. By Supplier
    const supplierMap = new Map<string, number>();
    payments.forEach(p => {
        const name = p.supplier?.name || 'Unknown';
        const current = supplierMap.get(name) || 0;
        supplierMap.set(name, current + p.amount);
    });

    const supplierData = Array.from(supplierMap.entries()).map(([name, value]) => ({
        name,
        value
    })).sort((a, b) => b.value - a.value);

    const handleExport = async (type: 'pdf' | 'xlsx') => {
        setExporting(true);
        try {
            if (type === 'pdf') {
                const html2canvas = (await import('html2canvas')).default;
                const jsPDF = (await import('jspdf')).default;

                if (!reportRef.current) return;

                const canvas = await html2canvas(reportRef.current, {
                    scale: 2,
                    useCORS: true,
                    logging: false
                } as any);

                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const imgWidth = canvas.width;
                const imgHeight = canvas.height;
                const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
                const imgX = (pdfWidth - imgWidth * ratio) / 2;
                const imgY = 30;

                pdf.text(`Supplier Payments Report (${startDate} to ${endDate})`, 14, 20);
                pdf.addImage(imgData, 'PNG', 0, imgY, imgWidth * ratio, imgHeight * ratio);
                pdf.save(`supplier-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
            } else {
                const XLSX = await import('xlsx');
                const wb = XLSX.utils.book_new();

                // Sheet 1: Summary
                const summaryData = [
                    ['Metric', 'Value'],
                    ['Total Payments', payments.reduce((sum, p) => sum + p.amount, 0)],
                    ['Transaction Count', payments.length],
                    ['Date Range', `${startDate} to ${endDate}`]
                ];
                const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
                XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

                // Sheet 2: Payments List
                const listData = payments.map(p => ({
                    Date: format(new Date(p.date), 'yyyy-MM-dd'),
                    Supplier: p.supplier?.name,
                    Amount: p.amount,
                    Account: p.destination_account?.name,
                    Method: p.transaction_method
                }));
                // Sanitize data for security
                const { sanitizeDataForExcel } = await import('@/lib/excel-utils');
                const sanitizedListData = sanitizeDataForExcel(listData);

                const wsList = XLSX.utils.json_to_sheet(sanitizedListData);
                XLSX.utils.book_append_sheet(wb, wsList, 'Payments List');

                // Sheet 3: Daily Trend
                const wsDaily = XLSX.utils.json_to_sheet(dailyData);
                XLSX.utils.book_append_sheet(wb, wsDaily, 'Daily Trend');

                // Sheet 4: Supplier Breakdown
                const wsSupplier = XLSX.utils.json_to_sheet(supplierData);
                XLSX.utils.book_append_sheet(wb, wsSupplier, 'By Supplier');

                // Sheet 5: All Dues
                const wsDues = XLSX.utils.json_to_sheet(dues.map(d => ({
                    Supplier: d.name,
                    'Current Due': d.current_due
                })));
                XLSX.utils.book_append_sheet(wb, wsDues, 'All Dues');

                XLSX.writeFile(wb, `supplier-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
            }
            toast.success('Export successful');
        } catch (error) {
            console.error(error);
            toast.error('Export failed');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <h1 className="text-2xl font-heading font-semibold tracking-tight">Supplier Payments Report</h1>
                <div className="flex items-end gap-2">
                    <div className="space-y-1">
                        <Label className="text-xs">From</Label>
                        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">To</Label>
                        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                    <div className="flex gap-2 ml-4">
                        <Button variant="outline" onClick={fetchData} disabled={loading}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                        <Button variant="outline" onClick={() => handleExport('pdf')} disabled={exporting}>
                            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            PDF
                        </Button>
                        <Button variant="outline" onClick={() => handleExport('xlsx')} disabled={exporting}>
                            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Excel
                        </Button>
                    </div>
                </div>
            </div>

            <div ref={reportRef} className="space-y-8 bg-background p-4 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Daily Trend Chart */}
                    <Card className="col-span-1 md:col-span-2">
                        <CardHeader>
                            <CardTitle>Daily Payment Trend</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dailyData}>
                                    <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `৳${value}`} />
                                    <Tooltip formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Amount']} />
                                    <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Supplier Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Payments by Supplier</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={supplierData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }: { name?: string | number, percent?: number }) => `${name || ''} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {supplierData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Amount']} />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Summary Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-muted-foreground">Total Payments</span>
                                    <span className="text-xl font-bold">
                                        ৳{payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-muted-foreground">Transaction Count</span>
                                    <span className="font-medium">{payments.length}</span>
                                </div>
                                <div className="flex justify-between items-center border-b pb-2">
                                    <span className="text-muted-foreground">Average Payment</span>
                                    <span className="font-medium">
                                        ৳{payments.length > 0
                                            ? (payments.reduce((sum, p) => sum + p.amount, 0) / payments.length).toLocaleString(undefined, { maximumFractionDigits: 0 })
                                            : 0}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* All Dues Supplier Wise */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Dues (Supplier Wise)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dues} layout="vertical" margin={{ left: 20 }}>
                                <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `৳${value}`} />
                                <YAxis dataKey="name" type="category" width={100} fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Due Amount']} />
                                <Bar dataKey="current_due" fill="#ef4444" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
