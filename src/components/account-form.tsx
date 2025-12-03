'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { createFinancialAccount } from '@/app/actions/create-financial-account';
import { updateFinancialAccount } from '@/app/actions/update-financial-account';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import CustomFieldInput from './custom-field-input';
import { FileUpload } from './file-upload';

interface AccountFormProps {
    account?: any;
    mode?: 'create' | 'edit';
}

export function AccountForm({ account, mode = 'edit' }: AccountFormProps) {
    const [name, setName] = useState(account?.name || '');
    const [scope, setScope] = useState(account?.scope || 'local');
    const [type, setType] = useState(account?.type || 'bank');
    const [currency, setCurrency] = useState(account?.currency || 'BDT');
    const [details, setDetails] = useState(account?.details || {});
    const [customFields, setCustomFields] = useState(account?.custom_fields || {});
    const [attachments, setAttachments] = useState<string[]>(account?.attachments || []);
    const [category, setCategory] = useState(account?.category || 'internal');
    const [contactId, setContactId] = useState(account?.contact_id || '');
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const fetchContacts = async () => {
            const { data } = await supabase.from('contacts').select('id, name').eq('type', 'supplier');
            if (data) setContacts(data);
        };
        fetchContacts();
    }, []);

    // Reset type and currency when scope changes
    useEffect(() => {
        if (!account) { // Only reset defaults for new accounts
            if (scope === 'local') {
                setType('bank');
                setCurrency('BDT');
            } else {
                setType('payoneer');
                setCurrency('USD');
            }
        }
    }, [scope, account]);

    const handleDetailChange = (key: string, value: any) => {
        setDetails((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const data = {
            name,
            scope,
            type,
            currency,
            category,
            contact_id: category === 'third_party' ? contactId : null,
            details,
            custom_fields: customFields,
            attachments,
        };

        let result;
        if (account) {
            result = await updateFinancialAccount(account.id, data);
        } else {
            result = await createFinancialAccount(data);
        }

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(account ? 'Account updated' : 'Account created');
            router.push('/accounts');
            router.refresh();
        }
        setLoading(false);
    };

    const renderLocalFields = () => {
        if (type === 'bank') {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Bank Name</Label>
                        <Input value={details.bank_name || ''} onChange={(e) => handleDetailChange('bank_name', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Branch Name</Label>
                        <Input value={details.branch_name || ''} onChange={(e) => handleDetailChange('branch_name', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Account Name</Label>
                        <Input value={details.account_name || ''} onChange={(e) => handleDetailChange('account_name', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Account No</Label>
                        <Input value={details.account_no || ''} onChange={(e) => handleDetailChange('account_no', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>SWIFT Code</Label>
                        <Input value={details.swift_code || ''} onChange={(e) => handleDetailChange('swift_code', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Address</Label>
                        <Input value={details.address || ''} onChange={(e) => handleDetailChange('address', e.target.value)} />
                    </div>
                </div>
            );
        } else if (type === 'mobile_finance') {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Provider</Label>
                        <Select value={details.provider || ''} onValueChange={(val) => handleDetailChange('provider', val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Provider" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="bkash">bKash</SelectItem>
                                <SelectItem value="nagad">Nagad</SelectItem>
                                <SelectItem value="upay">Upay</SelectItem>
                                <SelectItem value="rocket">Rocket</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Account Number</Label>
                        <Input value={details.account_no || ''} onChange={(e) => handleDetailChange('account_no', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Account Type</Label>
                        <Select value={details.mfs_type || ''} onValueChange={(val) => handleDetailChange('mfs_type', val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="personal">Personal</SelectItem>
                                <SelectItem value="merchant">Merchant</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            );
        }
        return null;
    };

    const renderCryptoFields = () => {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Exchange / Wallet Name</Label>
                    <Input
                        value={details.exchange_name || ''}
                        onChange={(e) => handleDetailChange('exchange_name', e.target.value)}
                        placeholder="e.g. Binance, Trust Wallet"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Pay ID (if applicable)</Label>
                    <Input
                        value={details.pay_id || ''}
                        onChange={(e) => handleDetailChange('pay_id', e.target.value)}
                        placeholder="e.g. 123456789"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Wallet Address</Label>
                    <Input
                        value={details.wallet_address || ''}
                        onChange={(e) => handleDetailChange('wallet_address', e.target.value)}
                        placeholder="0x..."
                    />
                </div>
                <div className="space-y-2">
                    <Label>Network</Label>
                    <Select value={details.network || ''} onValueChange={(val) => handleDetailChange('network', val)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Network" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="TRC20">TRC20 (Tron)</SelectItem>
                            <SelectItem value="ERC20">ERC20 (Ethereum)</SelectItem>
                            <SelectItem value="BEP20">BEP20 (BSC)</SelectItem>
                            <SelectItem value="SOL">Solana</SelectItem>
                            <SelectItem value="BTC">Bitcoin</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        );
    };

    const renderInternationalFields = () => {
        if (type === 'payoneer') {
            return (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={details.name || ''} onChange={(e) => handleDetailChange('name', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={details.email || ''} onChange={(e) => handleDetailChange('email', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Account Type</Label>
                            <Select value={details.payoneer_type || ''} onValueChange={(val) => handleDetailChange('payoneer_type', val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="personal">Personal</SelectItem>
                                    <SelectItem value="business">Business</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Verified</Label>
                            <Select value={details.verified || 'no'} onValueChange={(val) => handleDetailChange('verified', val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Verified?" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="yes">Yes</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Cards</Label>
                        <div className="border rounded-md p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Card Type</Label>
                                    <Select value={details.card_type || 'virtual'} onValueChange={(val) => handleDetailChange('card_type', val)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="virtual">Virtual</SelectItem>
                                            <SelectItem value="physical">Physical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Card Last 4 Digits</Label>
                                    <Input value={details.card_last4 || ''} onChange={(e) => handleDetailChange('card_last4', e.target.value)} maxLength={4} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Expiry (MM/YY)</Label>
                                    <Input value={details.card_expiry || ''} onChange={(e) => handleDetailChange('card_expiry', e.target.value)} placeholder="MM/YY" />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">Use Custom Fields below to add more cards if needed.</p>
                        </div>
                    </div>
                </div>
            );
        } else if (type === 'paypal' || type === 'wise') {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={details.email || ''} onChange={(e) => handleDetailChange('email', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Account Name</Label>
                        <Input value={details.account_name || ''} onChange={(e) => handleDetailChange('account_name', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Address</Label>
                        <Input value={details.address || ''} onChange={(e) => handleDetailChange('address', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Country</Label>
                        <Input value={details.country || ''} onChange={(e) => handleDetailChange('country', e.target.value)} />
                    </div>
                </div>
            );
        } else if (type === 'bank') {
            // International Bank (Reuse local bank fields roughly)
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Bank Name</Label>
                        <Input value={details.bank_name || ''} onChange={(e) => handleDetailChange('bank_name', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Account Name</Label>
                        <Input value={details.account_name || ''} onChange={(e) => handleDetailChange('account_name', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Account No / IBAN</Label>
                        <Input value={details.account_no || ''} onChange={(e) => handleDetailChange('account_no', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>SWIFT / BIC</Label>
                        <Input value={details.swift_code || ''} onChange={(e) => handleDetailChange('swift_code', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Address</Label>
                        <Input value={details.address || ''} onChange={(e) => handleDetailChange('address', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Country</Label>
                        <Input value={details.country || ''} onChange={(e) => handleDetailChange('country', e.target.value)} />
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="w-full max-w-3xl mx-auto">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <CardTitle>{account ? 'Edit Account' : 'New Account'}</CardTitle>
                    <CardDescription>Manage your financial accounts.</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Category Selection */}
                    <div className="space-y-3">
                        <Label>Account Category</Label>
                        <RadioGroup defaultValue="internal" value={category} onValueChange={setCategory} className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="internal" id="cat_internal" />
                                <Label htmlFor="cat_internal">Internal</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="receiving" id="cat_receiving" />
                                <Label htmlFor="cat_receiving">Receiving</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="third_party" id="cat_third_party" />
                                <Label htmlFor="cat_third_party">3rd Party (Supplier)</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {category === 'third_party' && (
                        <div className="space-y-2">
                            <Label>Linked Supplier</Label>
                            <Select value={contactId} onValueChange={setContactId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Supplier" />
                                </SelectTrigger>
                                <SelectContent>
                                    {contacts.map((contact) => (
                                        <SelectItem key={contact.id} value={contact.id}>
                                            {contact.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Scope Selection */}
                    <div className="space-y-3">
                        <Label>Account Scope</Label>
                        <RadioGroup defaultValue="local" value={scope} onValueChange={setScope} className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="local" id="local" />
                                <Label htmlFor="local">Local</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="international" id="international" />
                                <Label htmlFor="international">International</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Account Type</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {scope === 'local' ? (
                                        <>
                                            <SelectItem value="bank">Bank</SelectItem>
                                            <SelectItem value="mobile_finance">MFS (Mobile Finance)</SelectItem>
                                            <SelectItem value="cash">Cash</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </>
                                    ) : (
                                        <>
                                            <SelectItem value="payoneer">Payoneer</SelectItem>
                                            <SelectItem value="paypal">PayPal</SelectItem>
                                            <SelectItem value="wise">Wise</SelectItem>
                                            <SelectItem value="crypto">Crypto / Binance</SelectItem>
                                            <SelectItem value="bank">Bank</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Account Name (Display Name)</Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Binance USDT" required />
                        </div>

                        <div className="space-y-2">
                            <Label>Currency</Label>
                            <Select value={currency} onValueChange={setCurrency}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BDT">BDT</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                    <SelectItem value="POUND">POUND</SelectItem>
                                    <SelectItem value="USDT">USDT</SelectItem>
                                    <SelectItem value="BTC">BTC</SelectItem>
                                    <SelectItem value="ETH">ETH</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Dynamic Fields based on Scope & Type */}
                    <div className="border-t pt-4">
                        <h3 className="mb-4 text-sm font-medium text-muted-foreground">Account Details</h3>
                        {scope === 'local' ? renderLocalFields() : (type === 'crypto' ? renderCryptoFields() : renderInternationalFields())}
                    </div>

                    <div className="space-y-2">
                        <Label>Attachments</Label>
                        <FileUpload
                            bucket="attachments"
                            existingFiles={attachments}
                            onUploadComplete={setAttachments}
                        />
                    </div>

                    <div className="space-y-2">
                        <CustomFieldInput
                            value={customFields}
                            onChange={setCustomFields}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button type="button" variant="outline" className="w-full" onClick={() => router.back()}>
                            Cancel
                        </Button>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Account'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
