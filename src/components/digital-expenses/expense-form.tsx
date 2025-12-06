'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Upload, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { DigitalExpenseInput } from '@/lib/schemas';

interface ExpenseFormProps {
    initialData?: any;
    mode?: 'create' | 'edit';
}

const CATEGORIES = [
    'Domain',
    'Hosting',
    'Software License',
    'SaaS Subscription',
    'Ad Spend',
    'Digital Asset',
    'Other'
];

const PAYMENT_METHODS = [
    'Payoneer Card',
    'PayPal',
    'Wise',
    'Credit Card',
    'Other'
];

export function ExpenseForm({ initialData, mode = 'create' }: ExpenseFormProps) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState<Partial<Omit<DigitalExpenseInput, 'amount_usd'>> & { amount_usd: string | number }>({
        title: initialData?.title || '',
        category: initialData?.category || '',
        vendor_platform: initialData?.vendor_platform || '',
        amount_usd: initialData?.amount_usd?.toString() || '',
        transaction_date: initialData?.transaction_date || new Date().toISOString().split('T')[0],
        payment_method: initialData?.payment_method || 'Payoneer Card',
        is_recurring: initialData?.is_recurring || false,
        frequency: initialData?.frequency || undefined,
        transaction_id: initialData?.transaction_id || '',
        attachment_url: initialData?.attachment_url || '',
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `digital-expenses/${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('attachments')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('attachments')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, attachment_url: publicUrl }));
            toast.success('File uploaded');
        } catch (error: any) {
            toast.error('Upload failed: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                amount_usd: parseFloat(formData.amount_usd?.toString() || '0'),
                frequency: formData.is_recurring ? formData.frequency : undefined,
            };

            if (mode === 'create') {
                const { createDigitalExpense } = await import('@/app/actions/digital-expenses/create-expense');
                const result = await createDigitalExpense(payload);
                if (result.error) throw new Error(result.error);
                toast.success('Expense created');
            } else {
                const { updateDigitalExpense } = await import('@/app/actions/digital-expenses/update-expense');
                const result = await updateDigitalExpense(initialData.id, payload);
                if (result.error) throw new Error(result.error);
                toast.success('Expense updated');
            }
            router.push('/digital-expenses');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-card p-6 rounded-lg border shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                    <Label>Title / Description</Label>
                    <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. Google Workspace Dec 2024"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                        value={formData.category}
                        onValueChange={(val) => setFormData({ ...formData, category: val })}
                        required
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                            {CATEGORIES.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Vendor / Platform</Label>
                    <Input
                        value={formData.vendor_platform}
                        onChange={(e) => setFormData({ ...formData, vendor_platform: e.target.value })}
                        placeholder="e.g. Google, Namecheap"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Amount (USD)</Label>
                    <Input
                        type="number"
                        step="0.01"
                        value={formData.amount_usd}
                        onChange={(e) => setFormData({ ...formData, amount_usd: e.target.value })}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label>Transaction Date</Label>
                    <Input
                        type="date"
                        value={formData.transaction_date}
                        onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select
                        value={formData.payment_method}
                        onValueChange={(val) => setFormData({ ...formData, payment_method: val })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Method" />
                        </SelectTrigger>
                        <SelectContent>
                            {PAYMENT_METHODS.map(method => (
                                <SelectItem key={method} value={method}>{method}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Transaction ID (Optional)</Label>
                    <Input
                        value={formData.transaction_id}
                        onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                        placeholder="Payoneer ID, etc."
                    />
                </div>

                <div className="space-y-2 col-span-2">
                    <div className="flex items-center space-x-2 border p-4 rounded-md">
                        <Checkbox
                            id="recurring"
                            checked={formData.is_recurring}
                            onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: !!checked })}
                        />
                        <Label htmlFor="recurring" className="cursor-pointer">Is this a recurring subscription?</Label>
                    </div>
                </div>

                {formData.is_recurring && (
                    <div className="space-y-2 col-span-2 animate-in fade-in slide-in-from-top-2">
                        <Label>Frequency</Label>
                        <Select
                            value={formData.frequency}
                            onValueChange={(val: any) => setFormData({ ...formData, frequency: val })}
                            required={formData.is_recurring}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Frequency" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="quarterly">Quarterly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="space-y-2 col-span-2">
                    <Label>Invoice Attachment</Label>
                    <div className="flex items-center gap-4">
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
                                <Upload className="mr-2 h-4 w-4" /> Upload Invoice
                            </Label>
                            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                        </div>
                        {formData.attachment_url && (
                            <div className="flex items-center gap-2 border p-2 rounded bg-muted/50 text-sm">
                                <a href={formData.attachment_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    View Attachment
                                </a>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, attachment_url: '' })}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={loading || uploading}>
                    {loading ? 'Saving...' : (mode === 'create' ? 'Create Expense' : 'Update Expense')}
                </Button>
            </div>
        </form>
    );
}
