'use client';

import { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VolumeTrendChart, ContactVolumeChart, StatusPieChart } from './report-charts';
import { DollarSign, TrendingUp, Users, Activity, Download, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface ReportDashboardProps {
    data: any;
}

export function ReportDashboard({ data }: ReportDashboardProps) {
    const router = useRouter();
    const reportRef = useRef<HTMLDivElement>(null);
    const [exporting, setExporting] = useState(false);

    if (!data) return <div>No data available</div>;

    const { summary, daily_trend, contact_volume, status_breakdown } = data;

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

                pdf.text(`Forex Report`, 14, 20);
                pdf.addImage(imgData, 'PNG', 0, imgY, imgWidth * ratio, imgHeight * ratio);
                pdf.save(`forex-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
            } else {
                const XLSX = await import('xlsx');
                // Sanitize data for security
                const { sanitizeDataForExcel } = await import('@/lib/excel-utils');

                const wb = XLSX.utils.book_new();

                // Sheet 1: Summary
                const summaryData = [
                    ['Metric', 'Value'],
                    ['Total Volume (USD)', summary.total_volume_usd],
                    ['Total Volume (BDT)', summary.total_volume_bdt],
                    ['Avg Rate', summary.avg_rate],
                    ['Total Transactions', summary.total_count]
                ];
                const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
                XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

                // Sheet 2: Daily Trend
                const wsDaily = XLSX.utils.json_to_sheet(daily_trend);
                XLSX.utils.book_append_sheet(wb, wsDaily, 'Daily Trend');

                // Sheet 3: Contact Volume
                const wsContact = XLSX.utils.json_to_sheet(contact_volume);
                XLSX.utils.book_append_sheet(wb, wsContact, 'By Contact');

                // Sheet 4: Status Breakdown
                const wsStatus = XLSX.utils.json_to_sheet(status_breakdown);
                XLSX.utils.book_append_sheet(wb, wsStatus, 'By Status');

                XLSX.writeFile(wb, `forex-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
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
        <div className="space-y-6">
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => router.refresh()} disabled={exporting}>
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

            <div ref={reportRef} className="space-y-6 bg-background p-4 rounded-xl">
                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-gradient-to-br from-emerald-50/50 via-background to-background border-emerald-200/50 dark:from-emerald-950/20 dark:border-emerald-900/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Volume (USD)</CardTitle>
                            <div className="p-2 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-full">
                                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">${summary.total_volume_usd.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-rose-50/50 via-background to-background border-rose-200/50 dark:from-rose-950/20 dark:border-rose-900/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">Total Volume (BDT)</CardTitle>
                            <div className="p-2 bg-rose-100/50 dark:bg-rose-900/30 rounded-full">
                                <TrendingUp className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">৳{summary.total_volume_bdt.toLocaleString()}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-violet-50/50 via-background to-background border-violet-200/50 dark:from-violet-950/20 dark:border-violet-900/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wider">Avg Rate</CardTitle>
                            <div className="p-2 bg-violet-100/50 dark:bg-violet-900/30 rounded-full">
                                <Activity className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{summary.avg_rate.toFixed(2)}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-blue-50/50 via-background to-background border-blue-200/50 dark:from-blue-950/20 dark:border-blue-900/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">Transactions</CardTitle>
                            <div className="p-2 bg-blue-100/50 dark:bg-blue-900/30 rounded-full">
                                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{summary.total_count}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row 1 */}
                <div className="grid gap-4 md:grid-cols-7">
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Daily Volume Trend</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <VolumeTrendChart data={daily_trend} />
                        </CardContent>
                    </Card>
                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Status Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <StatusPieChart data={status_breakdown} />
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row 2 */}
                <div className="grid gap-4 md:grid-cols-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Contacts by Volume</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ContactVolumeChart data={contact_volume} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
