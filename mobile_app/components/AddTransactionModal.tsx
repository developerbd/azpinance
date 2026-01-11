import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import Dropdown from './Dropdown';

interface AddTransactionModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddTransactionModal({ visible, onClose, onSuccess }: AddTransactionModalProps) {
    // Form State
    const [contactId, setContactId] = useState('');
    const [accountId, setAccountId] = useState('');
    const [accountType, setAccountType] = useState('bank');
    const [currency, setCurrency] = useState('USD');
    const [amount, setAmount] = useState('');
    const [exchangeRate, setExchangeRate] = useState('');
    const [amountBdt, setAmountBdt] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    // Data State
    const [contacts, setContacts] = useState<{ label: string, value: string }[]>([]);
    const [accounts, setAccounts] = useState<{ label: string, value: string }[]>([]);

    useEffect(() => {
        if (visible) {
            fetchData();
        }
    }, [visible]);

    // Auto-calculate BDT
    useEffect(() => {
        const amt = parseFloat(amount);
        const rate = parseFloat(exchangeRate);
        if (!isNaN(amt) && !isNaN(rate)) {
            setAmountBdt((amt * rate).toFixed(2));
        }
    }, [amount, exchangeRate]);

    async function fetchData() {
        // Fetch Contacts
        const { data: contactsData } = await supabase
            .from('contacts')
            .select('id, name')
            .eq('status', 'active')
            .order('name');

        if (contactsData) {
            setContacts(contactsData.map(c => ({ label: c.name, value: c.id })));
        }

        // Fetch Accounts
        const { data: accountsData } = await supabase
            .from('financial_accounts')
            .select('id, name, currency')
            .eq('status', 'active')
            .order('name');

        if (accountsData) {
            setAccounts(accountsData.map(a => ({ label: `${a.name} (${a.currency})`, value: a.id })));
        }
    }

    async function handleSubmit() {
        // Validation
        if (!contactId || !accountId || !amount || !exchangeRate || !date) {
            Alert.alert('Missing Fields', 'Please fill in all required fields.');
            return;
        }

        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            Alert.alert('Error', 'Unauthorized');
            return;
        }

        const payload = {
            contact_id: contactId,
            receiving_account_id: accountId,
            account_type: accountType,
            currency,
            amount: parseFloat(amount),
            exchange_rate: parseFloat(exchangeRate),
            amount_bdt: parseFloat(amountBdt),
            transaction_date: date,
            note,
            user_id: user.id
        };

        const { error } = await supabase
            .from('forex_transactions')
            .insert([payload]);

        setLoading(false);

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert('Success', 'Transaction created successfully');
            resetForm();
            onSuccess();
            onClose();
        }
    }

    function resetForm() {
        setContactId('');
        setAccountId('');
        setAmount('');
        setExchangeRate('');
        setAmountBdt('');
        setNote('');
    }

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View className="flex-1 bg-gray-50">
                <View className="p-4 bg-white border-b border-gray-200 flex-row justify-between items-center shadow-sm">
                    <Text className="text-xl font-bold text-gray-900">Add Transaction</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text className="text-blue-600 font-medium">Cancel</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 p-4">
                    <Dropdown
                        label="Contact (Client)"
                        options={contacts}
                        value={contactId}
                        onSelect={setContactId}
                        placeholder="Select Client"
                    />

                    <Dropdown
                        label="Receiving Account"
                        options={accounts}
                        value={accountId}
                        onSelect={setAccountId}
                        placeholder="Select Account"
                    />

                    <Dropdown
                        label="Account Type"
                        options={[
                            { label: 'Bank', value: 'bank' },
                            { label: 'MFS (Bkash/Nagad)', value: 'mfs' },
                            { label: 'Wise', value: 'wise' },
                            { label: 'Payoneer', value: 'payoneer' },
                            { label: 'PayPal', value: 'paypal' },
                            { label: 'Crypto', value: 'crypto' },
                            { label: 'Cash', value: 'cash' },
                            { label: 'Other', value: 'other' },
                        ]}
                        value={accountType}
                        onSelect={setAccountType}
                    />

                    <View className="flex-row gap-4 mb-4">
                        <View className="flex-1">
                            <Text className="text-gray-700 font-medium mb-1">Currency</Text>
                            <TextInput
                                className="w-full border border-gray-300 rounded-lg p-3 bg-white"
                                value={currency}
                                onChangeText={setCurrency}
                                placeholder="USD"
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="text-gray-700 font-medium mb-1">Amount (USD)</Text>
                            <TextInput
                                className="w-full border border-gray-300 rounded-lg p-3 bg-white"
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                                placeholder="0.00"
                            />
                        </View>
                    </View>

                    <View className="flex-row gap-4 mb-4">
                        <View className="flex-1">
                            <Text className="text-gray-700 font-medium mb-1">Rate</Text>
                            <TextInput
                                className="w-full border border-gray-300 rounded-lg p-3 bg-white"
                                value={exchangeRate}
                                onChangeText={setExchangeRate}
                                keyboardType="numeric"
                                placeholder="0.00"
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="text-gray-700 font-medium mb-1">Amount (BDT)</Text>
                            <TextInput
                                className="w-full border border-gray-300 rounded-lg p-3 bg-gray-100 text-gray-500"
                                value={amountBdt}
                                editable={false}
                            />
                        </View>
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-700 font-medium mb-1">Date (YYYY-MM-DD)</Text>
                        <TextInput
                            className="w-full border border-gray-300 rounded-lg p-3 bg-white"
                            value={date}
                            onChangeText={setDate}
                            placeholder="2024-01-01"
                        />
                    </View>

                    <View className="mb-6">
                        <Text className="text-gray-700 font-medium mb-1">Note (Optional)</Text>
                        <TextInput
                            className="w-full border border-gray-300 rounded-lg p-3 bg-white h-24"
                            value={note}
                            onChangeText={setNote}
                            multiline
                            textAlignVertical="top"
                            placeholder="Add details..."
                        />
                    </View>

                    <TouchableOpacity
                        className={`w-full p-4 rounded-lg items-center mb-10 ${loading ? 'bg-gray-400' : 'bg-green-600'}`}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Create Transaction</Text>}
                    </TouchableOpacity>

                </ScrollView>
            </View>
        </Modal>
    );
}
