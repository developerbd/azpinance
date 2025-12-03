'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { createInvoice, InvoiceItem, InvoiceType } from '@/app/actions/invoices';

import { getContacts } from '@/app/actions/get-contacts';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';

export default function InvoiceForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const defaultType = (searchParams.get('type') as InvoiceType) || 'invoice';

    const [loading, setLoading] = useState(false);
    const [contacts, setContacts] = useState<any[]>([]);

    // Form State
    const [type, setType] = useState<InvoiceType>(defaultType);
    const [contactId, setContactId] = useState('');
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [notes, setNotes] = useState('');
    const [taxRate, setTaxRate] = useState(0);

    const [items, setItems] = useState<InvoiceItem[]>([
        { description: '', quantity: 1, unit_price: 0, amount: 0 }
    ]);

    useEffect(() => {
        const loadContacts = async () => {
            const { data, error } = await getContacts();
            if (data) {
                setContacts(data);
            } else {
                console.error("Failed to load contacts:", error);
                toast.error("Failed to load contacts");
            }
        };
        loadContacts();
    }, []);

    const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };

        // Recalculate amount
        if (field === 'quantity' || field === 'unit_price') {
            newItems[index].amount = newItems[index].quantity * newItems[index].unit_price;
        }

        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { description: '', quantity: 1, unit_price: 0, amount: 0 }]);
    };

    const removeItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const calculateTotals = () => {
        const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
        const taxAmount = (subtotal * taxRate) / 100;
        const total = subtotal + taxAmount;
        return { subtotal, taxAmount, total };
    };

    const { subtotal, taxAmount, total } = calculateTotals();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contactId) {
            toast.error('Please select a contact');
            return;
        }
        if (items.length === 0) {
            toast.error('Please add at least one item');
            return;
        }

        setLoading(true);
        const result = await createInvoice({
            contact_id: contactId,
            type,
            issue_date: issueDate,
            due_date: dueDate,
            currency,
            notes,
            items,
            tax_rate: taxRate,
        });

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success('Invoice created successfully');
            router.push('/invoices');
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={type} onValueChange={(v: InvoiceType) => setType(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="invoice">Invoice (Receivable)</SelectItem>
                                    <SelectItem value="bill">Bill (Payable)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Contact</Label>
                            <Select value={contactId} onValueChange={setContactId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a contact" />
                                </SelectTrigger>
                                <SelectContent>
                                    {contacts.map(c => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name} ({c.type})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Issue Date</Label>
                                <Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Due Date</Label>
                                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Currency</Label>
                            <Select value={currency} onValueChange={setCurrency}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                    <SelectItem value="GBP">GBP</SelectItem>
                                    <SelectItem value="BDT">BDT</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="Additional notes, payment terms, etc."
                            className="h-[200px]"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-4">
                        {items.map((item, index) => (
                            <div key={index} className="flex gap-4 items-end">
                                <div className="flex-1 space-y-2">
                                    <Label>Description</Label>
                                    <Input
                                        value={item.description}
                                        onChange={e => handleItemChange(index, 'description', e.target.value)}
                                        placeholder="Item description"
                                        required
                                    />
                                </div>
                                <div className="w-24 space-y-2">
                                    <Label>Qty</Label>
                                    <Input
                                        type="number"
                                        value={item.quantity}
                                        onChange={e => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                                        min="1"
                                        required
                                    />
                                </div>
                                <div className="w-32 space-y-2">
                                    <Label>Price</Label>
                                    <Input
                                        type="number"
                                        value={item.unit_price}
                                        onChange={e => handleItemChange(index, 'unit_price', parseFloat(e.target.value))}
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                                <div className="w-32 space-y-2">
                                    <Label>Amount</Label>
                                    <Input
                                        value={item.amount.toFixed(2)}
                                        disabled
                                        className="bg-muted"
                                    />
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} disabled={items.length === 1}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <Button type="button" variant="outline" onClick={addItem} className="mt-2">
                        <Plus className="mr-2 h-4 w-4" /> Add Item
                    </Button>

                    <div className="flex justify-end mt-6">
                        <div className="w-64 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal:</span>
                                <span>{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Tax Rate (%):</span>
                                <Input
                                    type="number"
                                    className="w-20 h-8 text-right"
                                    value={taxRate}
                                    onChange={e => setTaxRate(parseFloat(e.target.value))}
                                    min="0"
                                />
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Tax Amount:</span>
                                <span>{taxAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg border-t pt-2">
                                <span>Total:</span>
                                <span>{currency} {total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" /> Create Invoice
                </Button>
            </div>
        </form>
    );
}
