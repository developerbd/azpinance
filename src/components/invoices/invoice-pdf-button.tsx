'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface InvoicePdfButtonProps {
    invoice: any;
}

export default function InvoicePdfButton({ invoice }: InvoicePdfButtonProps) {
    const generatePdf = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.text(invoice.type === 'invoice' ? 'INVOICE' : 'BILL', 14, 22);

        doc.setFontSize(10);
        doc.text(`Number: ${invoice.invoice_number}`, 14, 30);
        doc.text(`Date: ${format(new Date(invoice.issue_date), 'MMM d, yyyy')}`, 14, 35);
        doc.text(`Due Date: ${format(new Date(invoice.due_date), 'MMM d, yyyy')}`, 14, 40);

        // From/To (Simplified for MVP)
        doc.text('From:', 14, 50);
        doc.text('My Agency', 14, 55); // Should come from settings

        doc.text('To:', 120, 50);
        doc.text(invoice.contacts?.name || 'Unknown', 120, 55);
        if (invoice.contacts?.email) doc.text(invoice.contacts.email, 120, 60);

        // Items Table
        const tableColumn = ["Description", "Quantity", "Unit Price", "Amount"];
        const tableRows = invoice.invoice_items.map((item: any) => [
            item.description,
            item.quantity,
            `${invoice.currency} ${item.unit_price}`,
            `${invoice.currency} ${item.amount}`
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 70,
        });

        // Totals
        // @ts-ignore
        const finalY = doc.lastAutoTable.finalY || 70;

        doc.text(`Subtotal: ${invoice.currency} ${invoice.subtotal}`, 140, finalY + 10);
        doc.text(`Tax (${invoice.tax_rate}%): ${invoice.currency} ${invoice.tax_amount}`, 140, finalY + 15);
        doc.setFontSize(12);
        doc.text(`Total: ${invoice.currency} ${invoice.total_amount}`, 140, finalY + 25);

        // Notes
        if (invoice.notes) {
            doc.setFontSize(10);
            doc.text('Notes:', 14, finalY + 40);
            doc.text(invoice.notes, 14, finalY + 45);
        }

        doc.save(`${invoice.invoice_number}.pdf`);
    };

    return (
        <Button onClick={generatePdf} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Download PDF
        </Button>
    );
}
