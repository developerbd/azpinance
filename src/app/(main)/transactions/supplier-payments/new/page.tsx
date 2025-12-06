'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SupplierPaymentForm } from '@/components/transactions/supplier-payment-form';
import { Loader2 } from 'lucide-react';

import RoleGuard from '@/components/role-guard';

export default function NewSupplierPaymentPage() {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchSuppliers = async () => {
            const { data } = await supabase
                .from('contacts')
                .select('id, name')
                .eq('type', 'supplier')
                .eq('status', 'active') // Filter inactive suppliers
                .order('name');

            if (data) {
                setSuppliers(data);
            }
            setLoading(false);
        };
        fetchSuppliers();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <RoleGuard allowedRoles={['admin', 'supervisor', 'accountant']}>
            <div className="container mx-auto py-10 max-w-3xl">
                <div className="mb-8">
                    <h1 className="text-2xl font-heading font-semibold tracking-tight">New Supplier Payment</h1>
                    <p className="text-muted-foreground">Select a supplier to initiate a payment.</p>
                </div>

                {!selectedSupplierId ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Select Supplier</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label>Supplier</Label>
                                <Select onValueChange={setSelectedSupplierId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a supplier..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map((supplier) => (
                                            <SelectItem key={supplier.id} value={supplier.id}>
                                                {supplier.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Selected Supplier</p>
                                <p className="font-semibold">{suppliers.find(s => s.id === selectedSupplierId)?.name}</p>
                            </div>
                            <button
                                onClick={() => setSelectedSupplierId('')}
                                className="text-sm text-primary hover:underline"
                            >
                                Change
                            </button>
                        </div>

                        <SupplierPaymentForm
                            supplierId={selectedSupplierId}
                            mode="create"
                            onSuccess={() => {
                                // Form handles redirect, or we can do something here
                            }}
                        />
                    </div>
                )}
            </div>
        </RoleGuard>
    );
}
