'use client';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface ExportButtonProps {
    data: any[];
    dateRange: { start: string; end: string };
}

export function ExportButton({ data, dateRange }: ExportButtonProps) {

    const handleExportCSV = () => {
        const exportData = data.map(item => ({
            Date: format(new Date(item.transaction_date), 'yyyy-MM-dd'),
            'Transaction ID': item.transaction_id || '-',
            Vendor: item.vendor_platform || 'Unknown',
            Category: item.category,
            'Description/Title': item.title,
            'Payment Method': item.payment_method,
            'Amount (USD)': item.amount_usd,
            Status: item.status
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Expenses");
        XLSX.writeFile(wb, `Expenses_${dateRange.start}_to_${dateRange.end}.xlsx`);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();

        // Title
        doc.setFontSize(18);
        doc.text('Digital Expenses Report', 14, 20);

        // Subtitle
        doc.setFontSize(12);
        doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, 30);
        doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 36);

        // Table
        const tableColumn = ["Date", "Vendor", "Category", "Description", "Method", "Amount ($)", "Status"];
        const tableRows = data.map(item => [
            format(new Date(item.transaction_date), 'yyyy-MM-dd'),
            item.vendor_platform || '-',
            item.category,
            item.title,
            item.payment_method,
            `$${Number(item.amount_usd).toFixed(2)}`,
            item.status
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185] }
        });

        doc.save(`Expenses_Report_${dateRange.start}_to_${dateRange.end}.pdf`);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export Data
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV}>
                    Download Excel/CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>
                    Download PDF
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
