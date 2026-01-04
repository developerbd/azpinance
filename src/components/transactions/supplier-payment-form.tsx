'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2, Upload, X, Save, Plus, Check, ChevronsUpDown } from 'lucide-react';
import { updateSupplierPayment } from '@/app/actions/update-supplier-payment';
import { useRouter } from 'next/navigation';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';

interface SupplierPaymentFormProps {
    initialData?: any;
    onSuccess?: () => void;
    supplierId?: string;
    mode?: 'create' | 'edit';
}

export function SupplierPaymentForm({ initialData, onSuccess, supplierId, mode = 'edit' }: SupplierPaymentFormProps) {
    const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
    const [date, setDate] = useState(initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [accountId, setAccountId] = useState(initialData?.destination_account_id || '');
    const [method, setMethod] = useState(initialData?.transaction_method || 'bank_transfer');
    const [reference, setReference] = useState(initialData?.reference_id || '');
    const [notes, setNotes] = useState(initialData?.notes || '');
    const [attachments, setAttachments] = useState<string[]>(initialData?.attachments || []);

    const [accounts, setAccounts] = useState<any[]>([]);
    const [receivingAccounts, setReceivingAccounts] = useState<any[]>([]);
    const [fromAccountId, setFromAccountId] = useState(initialData?.from_account_id || '');
    const [openFromAccount, setOpenFromAccount] = useState(false);

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const supabase = createClient();
    const router = useRouter();

    const targetSupplierId = supplierId || initialData?.supplier_id;
    const isDesktop = useMediaQuery("(min-width: 768px)");

    useEffect(() => {
        const fetchAccounts = async () => {
            let query = supabase
                .from('financial_accounts')
                .select('id, name, currency')
                .eq('category', 'third_party');

            if (targetSupplierId) {
                query = query.eq('contact_id', targetSupplierId);
            }

            const { data } = await query;
            if (data) setAccounts(data);
        };

        const fetchReceivingAccounts = async () => {
            const { data } = await supabase
                .from('financial_accounts')
                .select('id, name, currency')
                .eq('category', 'receiving')
                .eq('status', 'active');
            if (data) setReceivingAccounts(data);
        };

        fetchAccounts();
        fetchReceivingAccounts();
    }, [supabase, targetSupplierId]);

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
        setLoading(true);

        try {
            if (!accountId) {
                toast.error('Please select a destination account');
                setLoading(false);
                return;
            }

            if (initialData?.id) {
                // Update mode
                const result = await updateSupplierPayment({
                    id: initialData.id,
                    amount: parseFloat(amount),
                    date,
                    destination_account_id: accountId || null,
                    from_account_id: fromAccountId || null,
                    transaction_method: method,
                    reference_id: reference,
                    notes,
                    attachments,
                });

                if (result.error) {
                    toast.error(result.error);
                } else {
                    toast.success('Payment updated successfully');
                    if (onSuccess) {
                        onSuccess();
                    } else {
                        router.refresh();
                        router.push('/transactions/supplier-payments');
                    }
                }
            } else {
                // Create mode
                if (!supplierId) {
                    toast.error('Supplier ID is required');
                    return;
                }

                const { createSupplierPayment } = await import('@/app/actions/create-supplier-payment');
                const result = await createSupplierPayment({
                    supplier_id: supplierId,
                    amount: parseFloat(amount),
                    date,
                    destination_account_id: accountId || null,
                    from_account_id: fromAccountId || null,
                    transaction_method: method,
                    reference_id: reference,
                    notes,
                    attachments,
                });

                if (result.error) {
                    toast.error(result.error);
                } else {
                    toast.success('Payment created successfully');
                    if (onSuccess) {
                        onSuccess();
                    } else {
                        router.refresh();
                        router.push('/transactions/supplier-payments');
                    }
                }
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>

                <div className="space-y-2 flex flex-col">
                    <Label>From Account</Label>
                    {isDesktop ? (
                        <Popover open={openFromAccount} onOpenChange={setOpenFromAccount}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openFromAccount}
                                    className={cn(
                                        "w-full justify-between",
                                        !fromAccountId && "text-muted-foreground"
                                    )}
                                >
                                    {fromAccountId
                                        ? receivingAccounts.find(
                                            (acc) => acc.id === fromAccountId
                                        )?.name
                                        : "Select From Account"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search account..." />
                                    <CommandList>
                                        <CommandEmpty>No account found.</CommandEmpty>
                                        <CommandGroup>
                                            {receivingAccounts.map((acc) => (
                                                <CommandItem
                                                    value={acc.name}
                                                    key={acc.id}
                                                    onSelect={() => {
                                                        setFromAccountId(acc.id);
                                                        setOpenFromAccount(false);
                                                    }}
                                                    className="data-[disabled]:pointer-events-auto data-[disabled]:opacity-100"
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            acc.id === fromAccountId
                                                                ? "opacity-100"
                                                                : "opacity-0"
                                                        )}
                                                    />
                                                    {acc.name} ({acc.currency})
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    ) : (
                        <Dialog open={openFromAccount} onOpenChange={setOpenFromAccount}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openFromAccount}
                                    className={cn(
                                        "w-full justify-between",
                                        !fromAccountId && "text-muted-foreground"
                                    )}
                                >
                                    {fromAccountId
                                        ? receivingAccounts.find(
                                            (acc) => acc.id === fromAccountId
                                        )?.name
                                        : "Select From Account"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="p-0">
                                <DialogHeader className="px-4 pt-4 pb-0">
                                    <DialogTitle>Select From Account</DialogTitle>
                                </DialogHeader>
                                <Command>
                                    <CommandInput placeholder="Search account..." />
                                    <CommandList>
                                        <CommandEmpty>No account found.</CommandEmpty>
                                        <CommandGroup>
                                            {receivingAccounts.map((acc) => (
                                                <CommandItem
                                                    value={acc.name}
                                                    key={acc.id}
                                                    onSelect={() => {
                                                        setFromAccountId(acc.id);
                                                        setOpenFromAccount(false);
                                                    }}
                                                    className="data-[disabled]:pointer-events-auto data-[disabled]:opacity-100"
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            acc.id === fromAccountId
                                                                ? "opacity-100"
                                                                : "opacity-0"
                                                        )}
                                                    />
                                                    {acc.name} ({acc.currency})
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
                <div className="space-y-2">
                    <Label>Amount (BDT)</Label>
                    <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label>Destination Account <span className="text-red-500">*</span></Label>
                        <a href="/accounts/new" target="_blank" rel="noopener noreferrer" className="text-xs flex items-center text-primary hover:underline">
                            <Plus className="h-3 w-3 mr-1" /> Add New
                        </a>
                    </div>
                    <Select value={accountId} onValueChange={setAccountId} required>
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
            </div>

            <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div className="space-y-2">
                <Label>Attachments</Label>
                <div className="flex items-center gap-2">
                    <Input
                        id="edit-payment-file-upload"
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                    />
                    <Label
                        htmlFor="edit-payment-file-upload"
                        className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
                    >
                        <Upload className="mr-2 h-4 w-4" /> Upload New Proof
                    </Label>
                    {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                    {attachments.map((url, index) => (
                        <div key={index} className="relative group border p-2 rounded bg-background">
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

            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={loading || uploading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
            </div>
        </form>
    );
}
