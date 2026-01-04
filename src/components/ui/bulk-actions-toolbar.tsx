'use client';

import { Button } from '@/components/ui/button';
import { Trash2, Download, X } from 'lucide-react';

interface BulkActionsToolbarProps {
    selectedCount: number;
    onDelete?: () => void;
    onExport?: (type: 'xlsx' | 'pdf') => void;
    onCancel?: () => void;
    loading?: boolean;
}

export function BulkActionsToolbar({
    selectedCount,
    onDelete,
    onExport,
    onCancel,
    loading = false,
}: BulkActionsToolbarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-background border rounded-lg shadow-lg p-2 flex items-center gap-4 animate-in slide-in-from-bottom-2 w-[90%] md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2 px-2 border-r">
                <span className="font-medium text-sm">{selectedCount} selected</span>
                {onCancel && (
                    <Button variant="ghost" size="icon" onClick={onCancel} className="h-6 w-6">
                        <X className="h-3 w-3" />
                    </Button>
                )}
            </div>
            <div className="flex items-center gap-2">
                {onExport && (
                    <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => onExport('xlsx')} disabled={loading}>
                            <Download className="mr-2 h-4 w-4" />
                            Excel
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onExport('pdf')} disabled={loading}>
                            <Download className="mr-2 h-4 w-4" />
                            PDF
                        </Button>
                    </div>
                )}
                {onDelete && (
                    <Button variant="destructive" size="sm" onClick={onDelete} disabled={loading}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                )}
            </div>
        </div>
    );
}
