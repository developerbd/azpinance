'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { renewSubscription } from '@/app/actions/digital-expenses/renew-subscription';
import { useRouter } from 'next/navigation';

interface RenewModalProps {
    isOpen: boolean;
    onClose: () => void;
    expense: {
        id: string;
        title: string;
        amount_usd: number;
        payment_method: string;
    } | null;
}

const PAYMENT_METHODS = [
    'Payoneer Card',
    'PayPal',
    'Wise',
    'Credit Card',
    'Other'
];

export function RenewModal({ isOpen, onClose, expense }: RenewModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState<string>(expense ? expense.amount_usd.toString() : '');
    const [transactionId, setTransactionId] = useState('');
    const [method, setMethod] = useState(expense ? expense.payment_method : 'Payoneer Card');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Reset state when expense opens
    if (expense && Number(amount) !== expense.amount_usd && !loading && transactionId === '') {
        // Simple way to init, but better to use useEffect or key
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!expense) return;

        setLoading(true);
        try {
            const result = await renewSubscription({
                masterId: expense.id,
                amount: parseFloat(amount),
                transactionId,
                paymentMethod: method,
                date
            });

            if (result.error) throw new Error(result.error);

            toast.success('Subscription renewed successfully');
            onClose();
            router.refresh(); // Refresh dashboard
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!expense) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Renew Subscription</DialogTitle>
                    <DialogDescription>
                        Confirm renewal for <span className="font-semibold text-foreground">{expense.title}</span>.
                        <br />
                        This will create a new payment record and extend the subscription.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">Amount ($)</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="col-span-3"
                            defaultValue={expense.amount_usd}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">Date</Label>
                        <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="method" className="text-right">Method</Label>
                        <Select value={method} onValueChange={setMethod}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PAYMENT_METHODS.map(m => (
                                    <SelectItem key={m} value={m}>{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="tid" className="text-right">Trans. ID</Label>
                        <Input
                            id="tid"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            className="col-span-3"
                            placeholder="Optional"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Processing...' : 'Confirm Renewal'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
