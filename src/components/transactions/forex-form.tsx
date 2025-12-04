'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Loader2, Upload, X, Check, ChevronsUpDown } from 'lucide-react';

type Contact = {
    id: string;
    name: string;
    type: string;
};

interface ForexFormProps {
    contacts?: Contact[];
    initialData?: any; // For edit mode
    mode?: 'create' | 'edit';
}

export function ForexForm({ contacts, initialData, mode = 'edit' }: ForexFormProps) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);

    // Form State
    const [transactionDate, setTransactionDate] = useState<string>(
        initialData?.transaction_date || new Date().toISOString().split('T')[0]
    );
    const [contactType, setContactType] = useState<string>('supplier');
    const [contactId, setContactId] = useState<string>(initialData?.contact_id || '');
    const [accountType, setAccountType] = useState<string>(initialData?.account_type || 'payoneer');
    const [currency, setCurrency] = useState<string>(initialData?.currency || 'USD');
    const [amount, setAmount] = useState<string>(initialData?.amount?.toString() || '');
    const [rate, setRate] = useState<string>(initialData?.exchange_rate?.toString() || '');
    const [amountBdt, setAmountBdt] = useState<string>(initialData?.amount_bdt?.toString() || '');
    const [transactionId, setTransactionId] = useState<string>(initialData?.transaction_id || '');
    const [note, setNote] = useState<string>(initialData?.note || '');
    const [attachments, setAttachments] = useState<string[]>(initialData?.attachments || []);
    const [receivingAccounts, setReceivingAccounts] = useState<any[]>([]);
    const [receivingAccountId, setReceivingAccountId] = useState<string>(initialData?.receiving_account_id || '');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const fetchAccounts = async () => {
            const { data } = await supabase
                .from('financial_accounts')
                .select('id, name, currency')
                .eq('category', 'receiving')
                .eq('status', 'active'); // Filter inactive accounts
            if (data) setReceivingAccounts(data);
        };
        fetchAccounts();
    }, []);

    const [localContacts, setLocalContacts] = useState<Contact[]>(contacts || []);

    useEffect(() => {
        if (!contacts) {
            const fetchContacts = async () => {
                const { data } = await supabase
                    .from('contacts')
                    .select('id, name, type')
                    .eq('status', 'active') // Filter inactive contacts
                    .order('name');
                if (data) setLocalContacts(data);
            };
            fetchContacts();
        } else {
            setLocalContacts(contacts);
        }
    }, [contacts]);

    // Filter contacts based on type
    const filteredContacts = contactType === 'all'
        ? localContacts
        : localContacts.filter(c => c.type === contactType);

    // Calculations
    const handleAmountChange = (val: string) => {
        setAmount(val);
        if (val && rate) {
            const calculated = parseFloat(val) * parseFloat(rate);
            setAmountBdt(calculated.toFixed(2));
        }
    };

    const handleRateChange = (val: string) => {
        setRate(val);
        if (val && amount) {
            const calculated = parseFloat(amount) * parseFloat(val);
            setAmountBdt(calculated.toFixed(2));
        }
    };

    const handleBdtChange = (val: string) => {
        setAmountBdt(val);
        if (val && rate) {
            const calculated = parseFloat(val) / parseFloat(rate);
            setAmount(calculated.toFixed(2));
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `forex-attachments/${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('attachments') // Assuming bucket name is 'attachments'
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

        const formData = {
            contact_id: contactId,
            receiving_account_id: receivingAccountId,
            account_type: accountType,
            currency,
            amount: parseFloat(amount),
            exchange_rate: parseFloat(rate),
            amount_bdt: parseFloat(amountBdt),
            transaction_id: transactionId,
            transaction_date: transactionDate,
            note,
            attachments,
        };

        try {
            if (initialData) {
                // Update
                const { updateForexTransaction } = await import('@/app/actions/update-forex-transaction');
                const result = await updateForexTransaction(initialData.id, formData);
                if (result.error) throw new Error(result.error);
                toast.success('Transaction updated');
            } else {
                // Create
                const { createForexTransaction } = await import('@/app/actions/create-forex-transaction');
                const result = await createForexTransaction(formData);
                if (result.error) throw new Error(result.error);
                toast.success('Transaction created');
            }
            router.push('/transactions/forex');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                        type="date"
                        value={transactionDate}
                        onChange={(e) => setTransactionDate(e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label>Contact Type</Label>
                    <Select value={contactType} onValueChange={setContactType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="supplier">Supplier</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2 flex flex-col">
                    <Label>Contact</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                    "w-full justify-between",
                                    !contactId && "text-muted-foreground"
                                )}
                            >
                                {contactId
                                    ? filteredContacts.find(
                                        (c) => c.id === contactId
                                    )?.name
                                    : "Select Contact"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search contact..." />
                                <CommandList>
                                    <CommandEmpty>No contact found.</CommandEmpty>
                                    <CommandGroup>
                                        {filteredContacts.map((c) => (
                                            <CommandItem
                                                value={c.name}
                                                key={c.id}
                                                onSelect={() => {
                                                    setContactId(c.id);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        c.id === contactId
                                                            ? "opacity-100"
                                                            : "opacity-0"
                                                    )}
                                                />
                                                {c.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="space-y-2 flex flex-col">
                    <Label>Receiving Account</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                    "w-full justify-between",
                                    !receivingAccountId && "text-muted-foreground"
                                )}
                            >
                                {receivingAccountId
                                    ? receivingAccounts.find(
                                        (acc) => acc.id === receivingAccountId
                                    )?.name
                                    : "Select Receiving Account"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
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
                                                    setReceivingAccountId(acc.id);
                                                    setCurrency(acc.currency); // Auto-set currency
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        acc.id === receivingAccountId
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
                </div>

                <div className="space-y-2">
                    <Label>Sending via</Label>
                    <Select value={accountType} onValueChange={setAccountType} required>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Account Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="bank">Bank</SelectItem>
                            <SelectItem value="mfs">MFS</SelectItem>
                            <SelectItem value="crypto">Crypto</SelectItem>
                            <SelectItem value="wallet">Wallet</SelectItem>
                            <SelectItem value="credit_card">Credit Card</SelectItem>
                            <SelectItem value="paypal">Paypal</SelectItem>
                            <SelectItem value="payoneer">Payoneer</SelectItem>
                            <SelectItem value="wise">Wise</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={currency} onValueChange={setCurrency} required>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Currency" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="USDT">USDT</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="AUD">AUD</SelectItem>
                            <SelectItem value="CAD">CAD</SelectItem>
                            <SelectItem value="SGD">SGD</SelectItem>
                            <SelectItem value="BDT">BDT</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Receiving Amount ({currency})</Label>
                    <Input
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label>Exchange Rate</Label>
                    <Input
                        type="number"
                        step="0.01"
                        value={rate}
                        onChange={(e) => handleRateChange(e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label>Amount (BDT)</Label>
                    <Input
                        type="number"
                        step="0.01"
                        value={amountBdt}
                        onChange={(e) => handleBdtChange(e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label>Transaction ID</Label>
                    <Input
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="e.g. TXN123456"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Note</Label>
                <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Additional details..."
                />
            </div>

            <div className="space-y-2">
                <Label>Attachments</Label>
                <div className="flex items-center gap-2">
                    <Input
                        id="file-upload"
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                    />
                    <Label
                        htmlFor="file-upload"
                        className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
                    >
                        <Upload className="mr-2 h-4 w-4" /> Choose File
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

            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={loading || uploading}>
                    {loading ? 'Saving...' : (initialData ? 'Update Record' : 'Add Record')}
                </Button>
            </div>
        </form>
    );
}
