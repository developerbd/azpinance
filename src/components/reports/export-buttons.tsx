'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface ExportButtonsProps {
    data: any;
}

export function ExportButtons({ data }: ExportButtonsProps) {
    const handleExportCSV = () => {
        if (!data || !data.daily_trend) return;

        const headers = ['Date', 'Volume (USD)', 'Volume (BDT)', 'Avg Rate', 'Count'];
        const rows = data.daily_trend.map((row: any) => [
            row.date,
            row.volume_usd,
            row.volume_bdt,
            row.avg_rate,
            row.tx_count
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map((row: any[]) => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'forex_report.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            {/* PDF Export can be added here later */}
        </div>
    );
}
