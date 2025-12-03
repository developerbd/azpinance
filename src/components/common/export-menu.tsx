'use client';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';

interface ExportMenuProps {
    onExport: (type: 'csv' | 'xlsx' | 'pdf') => void;
    isExporting: boolean;
}

export function ExportMenu({ onExport, isExporting }: ExportMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isExporting}>
                    {isExporting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="mr-2 h-4 w-4" />
                    )}
                    Export
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onExport('csv')}>
                    <FileText className="mr-2 h-4 w-4" /> CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport('xlsx')}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel (XLSX)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport('pdf')}>
                    <FileText className="mr-2 h-4 w-4" /> PDF
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
