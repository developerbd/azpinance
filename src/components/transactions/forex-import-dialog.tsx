'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog';
import { Upload, Download, FileSpreadsheet, Loader2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { validateImportRefs } from '@/app/actions/data/validate-import-refs';
import { bulkImportForex, ForexImportData } from '@/app/actions/forex/bulk-import-forex';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ParsedRow {
    index: number;
    transaction_date: string;
    note: string;
    transaction_id?: string;
    contact_name: string;
    receiving_account: string;
    account_type: string;
    currency: string;
    amount: number;
    exchange_rate: number;
    amount_bdt: number;

    // Validation State
    isValid: boolean;
    errors: string[];

    // Resolved IDs
    contact_id?: string;
    receiving_account_id?: string;
}

export function ForexImportDialog() {
    const [open, setOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
    const [step, setStep] = useState<'upload' | 'preview'>('upload');
    const [isDragging, setIsDragging] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    const reset = () => {
        setParsedRows([]);
        setStep('upload');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDownloadTemplate = () => {
        const headers = [
            'Transaction Date',
            'Transaction ID',
            'Contact Name',
            'Contact Type',
            'Receiving Account',
            'Sending Via (Account Type)',
            'Currency',
            'Amount',
            'Exchange Rate',
            'Amount BDT',
            'Note'
        ];
        // Example Row
        const data = [
            headers,
            ['2024-01-01', 'TRX-101', 'John Doe Inc', 'Client', 'City Bank USD', 'Bank', 'USD', 1000, 110, 110000, 'Service Payment']
        ];

        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "Forex_Import_Template.xlsx");
    };

    const processFile = async (file: File) => {
        setIsAnalyzing(true);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

            if (jsonData.length === 0) {
                toast.error('File is empty');
                setIsAnalyzing(false);
                return;
            }

            // 1. Collect Names for Bulk Validation
            const contactNames = new Set<string>();
            const accountNames = new Set<string>();

            jsonData.forEach(row => {
                if (row['Contact Name']) contactNames.add(String(row['Contact Name']).trim());
                if (row['Receiving Account']) accountNames.add(String(row['Receiving Account']).trim());
            });

            // 2. Validate Refs on Server
            const { contacts, accounts } = await validateImportRefs(
                Array.from(contactNames),
                Array.from(accountNames)
            );

            // 3. Process Rows
            const processedRows: ParsedRow[] = jsonData.map((row, idx) => {
                const errors: string[] = [];
                const contactName = String(row['Contact Name'] || '').trim();
                const accountName = String(row['Receiving Account'] || '').trim();
                const amt = Number(row['Amount']);
                const rate = Number(row['Exchange Rate']);
                const givenBdt = Number(row['Amount BDT']);

                // --- Validation Logic ---
                // Contact
                const contactId = contacts[contactName];
                if (!contactId) errors.push(`Contact '${contactName}' not found`);

                // Account
                const accountId = accounts[accountName];
                if (!accountId) errors.push(`Account '${accountName}' not found`);

                // Amount
                if (isNaN(amt) || amt <= 0) errors.push('Invalid Amount');
                if (isNaN(rate) || rate <= 0) errors.push('Invalid Rate');

                // Date Parsing
                let dateStr = row['Transaction Date'];
                if (typeof dateStr === 'number') {
                    const date = new Date((dateStr - (25567 + 2)) * 86400 * 1000);
                    dateStr = date.toISOString().split('T')[0];
                } else if (dateStr) {
                    const date = new Date(dateStr);
                    if (!isNaN(date.getTime())) {
                        dateStr = date.toISOString().split('T')[0];
                    } else {
                        errors.push('Invalid Date');
                    }
                } else {
                    errors.push('Missing Date');
                }

                // Account Type Normalization
                // Header: 'Sending Via (Account Type)' or 'Account Type'
                const rawType = String(row['Sending Via (Account Type)'] || row['Account Type'] || 'other').toLowerCase();
                let accType = rawType;
                const validTypes = ['bank', 'mfs', 'crypto', 'wallet', 'credit_card', 'paypal', 'payoneer', 'wise', 'cash', 'other'];
                if (!validTypes.includes(accType)) {
                    if (accType.includes('bank')) accType = 'bank';
                    else if (accType.includes('cash')) accType = 'cash';
                    else if (accType.includes('card')) accType = 'credit_card';
                    else if (accType.includes('paypal')) accType = 'paypal';
                    else if (accType.includes('payoneer')) accType = 'payoneer';
                    else accType = 'other';
                }

                // BDT Calculation & Validation
                const calculatedBdt = amt * rate;
                let bdt = calculatedBdt;

                if (!isNaN(givenBdt) && givenBdt > 0) {
                    // Check for mismatch
                    const diff = Math.abs(givenBdt - calculatedBdt);
                    if (diff > 1.0) { // Tolerance of 1 BDT
                        errors.push(`BDT Mismatch: Calc ${calculatedBdt.toLocaleString()} vs Given ${givenBdt.toLocaleString()}`);
                    }
                    bdt = givenBdt;
                }

                return {
                    index: idx,
                    transaction_date: dateStr,
                    transaction_id: row['Transaction ID'] ? String(row['Transaction ID']) : undefined,
                    note: String(row['Note'] || row['Description'] || ''),
                    contact_name: contactName,
                    receiving_account: accountName,
                    account_type: accType,
                    currency: row['Currency'] || 'USD',
                    amount: amt,
                    exchange_rate: rate,
                    amount_bdt: bdt,
                    isValid: errors.length === 0,
                    errors,
                    contact_id: contactId || undefined,
                    receiving_account_id: accountId || undefined
                };
            });

            setParsedRows(processedRows);
            setStep('preview');

        } catch (error) {
            console.error(error);
            toast.error('Failed to parse Excel file');
        } finally {
            setIsAnalyzing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await processFile(file);
    };

    const handleImport = async () => {
        const validRows = parsedRows.filter(r => r.isValid);
        if (validRows.length === 0) return;

        setIsImporting(true);
        try {
            const payload: ForexImportData[] = validRows.map(r => ({
                contact_id: r.contact_id!,
                receiving_account_id: r.receiving_account_id!,
                account_type: r.account_type,
                currency: r.currency,
                amount: r.amount,
                exchange_rate: r.exchange_rate,
                amount_bdt: r.amount_bdt,
                transaction_date: r.transaction_date,
                transaction_id: r.transaction_id,
                note: r.note,
                status: 'pending' // Default to pending as requested
            }));

            const result = await bulkImportForex(payload);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`Successfully imported ${result.count} transactions`);
                setOpen(false);
                reset();
            }
        } catch (e) {
            toast.error('Import failed');
        } finally {
            setIsImporting(false);
        }
    };

    const validCount = parsedRows.filter(r => r.isValid).length;
    const errorCount = parsedRows.length - validCount;

    return (
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) reset(); }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Import
                </Button>
            </DialogTrigger>
            <DialogContent className={cn("max-w-5xl max-h-[90vh] flex flex-col", step === 'upload' ? "h-auto" : "h-[800px]")}>
                <DialogHeader>
                    <DialogTitle>Import Forex Transactions</DialogTitle>
                    <DialogDescription>
                        Upload an Excel file to bulk import transactions.
                    </DialogDescription>
                </DialogHeader>

                {step === 'upload' ? (
                    <div
                        className={cn(
                            "flex flex-col items-center justify-center space-y-6 py-8 border-2 border-dashed rounded-lg transition-colors cursor-pointer",
                            isDragging ? "border-primary bg-primary/5" : "bg-muted/10 border-muted"
                        )}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                        }}
                        onDrop={async (e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            const file = e.dataTransfer.files?.[0];
                            if (file) {
                                // Manually trigger file processing
                                // We need to refactor handleFileUpload to accept file object or extract logic
                                // Quick fix: Call logic directly
                                setIsAnalyzing(true);
                                try {
                                    const data = await file.arrayBuffer();
                                    const workbook = XLSX.read(data);
                                    // ... reusing logic?
                                    // Properly, I should extract logic.
                                    // For now, I will extract logic to `processFile` function.
                                    await processFile(file);
                                } catch (err) {
                                    console.error(err);
                                    toast.error('Failed to parse file');
                                    setIsAnalyzing(false);
                                }
                            }
                        }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <FileSpreadsheet className={cn("h-16 w-16", isDragging ? "text-primary" : "text-muted-foreground/50")} />
                        <div className="text-center space-y-2">
                            <h3 className="font-medium">Drag and drop your Excel file here</h3>
                            <p className="text-sm text-muted-foreground">Supported format: .xlsx, .xls</p>
                        </div>
                        <div className="flex gap-4">
                            <Button variant="outline" onClick={(e) => { e.stopPropagation(); handleDownloadTemplate(); }} className="gap-2">
                                <Download className="h-4 w-4" />
                                Download Template
                            </Button>
                            <div className="relative">
                                {/* Hidden Input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx, .xls"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                                <Button
                                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                    disabled={isAnalyzing}
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
                                        </>
                                    ) : (
                                        "Select File"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col min-h-0 space-y-4">
                        {/* Summary Bar */}
                        <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border">
                            <div className="flex gap-4 text-sm">
                                <div className="flex items-center gap-2 text-emerald-600 font-medium">
                                    <CheckCircle2 className="h-4 w-4" /> {validCount} Ready
                                </div>
                                {errorCount > 0 && (
                                    <div className="flex items-center gap-2 text-red-600 font-medium">
                                        <XCircle className="h-4 w-4" /> {errorCount} Errors
                                    </div>
                                )}
                            </div>
                            <Button variant="ghost" size="sm" onClick={reset}>Re-upload</Button>
                        </div>

                        {/* Table */}
                        <ScrollArea className="flex-1 border rounded-md">
                            <Table>
                                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                    <TableRow>
                                        <TableHead className="w-[50px]"></TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Ref ID</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Account</TableHead>
                                        <TableHead className="text-right">Amount (USD)</TableHead>
                                        <TableHead className="text-right">Rate</TableHead>
                                        <TableHead className="text-right">BDT</TableHead>
                                        <TableHead>Note</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parsedRows.map((row) => (
                                        <TableRow key={row.index} className={!row.isValid ? "bg-red-50/50 hover:bg-red-50" : ""}>
                                            <TableCell>
                                                {row.isValid ? (
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                ) : (
                                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                                )}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs whitespace-nowrap">{row.transaction_date}</TableCell>
                                            <TableCell className="font-mono text-xs">{row.transaction_id || '-'}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{row.contact_name}</span>
                                                    {!row.contact_id && <span className="text-[10px] text-red-500">Not Found</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm">{row.receiving_account}</span>
                                                    <span className="text-[10px] text-muted-foreground">{row.account_type}</span>
                                                    {!row.receiving_account_id && <span className="text-[10px] text-red-500">Not Found</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">{row.amount?.toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-mono">{row.exchange_rate}</TableCell>
                                            <TableCell className="text-right font-mono">{row.amount_bdt?.toLocaleString()}</TableCell>
                                            <TableCell className="text-xs max-w-[150px] truncate">{row.note}</TableCell>
                                            <TableCell>
                                                {row.isValid ? (
                                                    <Badge variant="outline" className="text-emerald-600 border-emerald-200">Valid</Badge>
                                                ) : (
                                                    <div className="flex flex-col gap-1">
                                                        {row.errors.map((err, i) => (
                                                            <Badge key={i} variant="destructive" className="text-[10px] px-1 py-0">{err}</Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button
                                onClick={handleImport}
                                disabled={isImporting || validCount === 0}
                                className={errorCount > 0 ? "bg-amber-600 hover:bg-amber-700" : ""}
                            >
                                {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {errorCount > 0 ? `Import ${validCount} Valid Rows` : 'Import All'}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
