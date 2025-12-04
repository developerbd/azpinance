'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createSupplierPayment } from '@/app/actions/create-supplier-payment';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2, Upload, X, Plus } from 'lucide-react';

interface MakePaymentDialogProps {
    supplierId: string;
    onSuccess?: () => void;
    trigger?: React.ReactNode;
}

export function MakePaymentDialog({ supplierId, onSuccess, trigger }: MakePaymentDialogProps) {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [accountId, setAccountId] = useState('');
    const [method, setMethod] = useState('bank_transfer');
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [attachments, setAttachments] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([]);

    const supabase = createClient();

    useEffect(() => {
        if (open) {
            const fetchAccounts = async () => {
                const { data } = await supabase
                    .from('financial_accounts')
                    .select('id, name, currency')
                    .eq('category', 'third_party')
                    .eq('contact_id', supplierId)
                    .eq('status', 'active'); // Filter inactive accounts

                if (data) setAccounts(data);
            };
            fetchAccounts();
        }
    }, [open, supplierId, supabase]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `payment-attachments/${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('attachments')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('attachments')
                .getPublicUrl(filePath);

            setAttachments([...attachments, publicUrl]);
            toast.success('File uploaded');
        } catch (error: any) {
            toast.error('Upload failed: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const removeAttachment = (index: number) => {
        const newAttachments = [...attachments];
        newAttachments.splice(index, 1);
        setAttachments(newAttachments);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const result = await createSupplierPayment({
            supplier_id: supplierId,
            amount: parseFloat(amount),
            date,
            destination_account_id: accountId || null,
            transaction_method: method,
            reference_id: reference,
            notes,
            attachments,
        });

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success('Payment recorded');
            setOpen(false);
            setAmount('');
            setReference('');
            setNotes('');
            setAttachments([]);
            if (onSuccess) onSuccess();
        }
        setSubmitting(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button><Plus className="mr-2 h-4 w-4" /> Make Payment</Button>}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Record Payment to Supplier</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Date</Label>
                        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label>Amount (BDT)</Label>
                        <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Destination Account (Supplier's Account)</Label>
                            <a href="/accounts/new" target="_blank" rel="noopener noreferrer" className="text-xs flex items-center text-primary hover:underline">
                                <Plus className="h-3 w-3 mr-1" /> Add New
                            </a>
                        </div>
                        <Select value={accountId} onValueChange={setAccountId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Account" />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.map(acc => (
                                    <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Method</Label>
                        <Select value={method} onValueChange={setMethod}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="check">Check</SelectItem>
                                <SelectItem value="mfs">MFS</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Reference ID</Label>
                        <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Txn ID, Check No, etc." />
                    </div>
                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                        <Label>Attachments</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="payment-file-upload"
                                type="file"
                                onChange={handleFileUpload}
                                disabled={uploading}
                                className="hidden"
                            />
                            <Label
                                htmlFor="payment-file-upload"
                                className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
                            >
                                <Upload className="mr-2 h-4 w-4" /> Upload Proof
                            </Label>
                            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {attachments.map((url, index) => (
                                <div key={index} className="relative group border p-2 rounded">
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline break-all">
                                        Attachment {index + 1}
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => removeAttachment(index)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={submitting || uploading}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Record Payment
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
