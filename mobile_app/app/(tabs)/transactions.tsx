import React, { useEffect, useState } from 'react';
import { View, Text, SectionList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import AddTransactionModal from '../../components/AddTransactionModal';

interface Transaction {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    currency?: string;
    date: string;
    status?: string;
    description: string;
}

interface Section {
    title: string;
    data: Transaction[];
}

export default function TransactionsScreen() {
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        // 1. Fetch Income (Forex)
        const { data: incomeData } = await supabase
            .from('forex_transactions')
            .select('id, amount, currency, transaction_date, status, contact:contacts(name)')
            .order('transaction_date', { ascending: false })
            .limit(20);

        // 2. Fetch Expense (Supplier Payments)
        const { data: expenseData } = await supabase
            .from('supplier_payments')
            .select('id, amount, date, supplier:contacts(name)')
            .order('date', { ascending: false })
            .limit(20);

        // Merge and Map
        const income = (incomeData || []).map((t: any) => ({
            id: t.id,
            type: 'income' as const,
            amount: t.amount,
            currency: t.currency,
            date: t.transaction_date,
            status: t.status,
            description: t.contact?.name || 'Unknown Contact'
        }));

        const expense = (expenseData || []).map((t: any) => ({
            id: t.id,
            type: 'expense' as const,
            amount: t.amount,
            date: t.date,
            description: t.supplier?.name || 'Unknown Supplier'
        }));

        const combined = [...income, ...expense].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // Group by Date for SectionList
        const grouped: Record<string, Transaction[]> = {};
        combined.forEach(tx => {
            const dateKey = new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            // Or use "Today", "Yesterday" logic if desired
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push(tx);
        });

        const sectionsArray: Section[] = Object.keys(grouped).map(date => ({
            title: date,
            data: grouped[date]
        }));

        setSections(sectionsArray);
        setLoading(false);
    };

    const renderItem = ({ item }: { item: Transaction }) => (
        <View className="bg-white p-4 mx-4 mb-3 rounded-2xl border border-slate-100 shadow-sm flex-row items-center justify-between">
            <View className="flex-row items-center gap-3 flex-1">
                <View className={`w-10 h-10 rounded-full items-center justify-center ${item.type === 'income' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                    {item.type === 'income' ? (
                        <ArrowDownLeft size={20} color="#10b981" />
                    ) : (
                        <ArrowUpRight size={20} color="#f43f5e" />
                    )}
                </View>
                <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-800" numberOfLines={1}>{item.description}</Text>
                    <View className="flex-row items-center gap-2 mt-0.5">
                        <Text className="text-[10px] text-slate-400 font-medium">
                            {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        {item.status && (
                            <View className={`px-1.5 py-0.5 rounded-full ${item.status === 'approved' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                                <Text className={`text-[8px] uppercase font-bold ${item.status === 'approved' ? 'text-emerald-700' : 'text-amber-700'}`}>
                                    {item.status}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            <View className="items-end">
                <Text className={`text-base font-bold ${item.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {item.type === 'income' ? '+' : '-'}${item.amount.toLocaleString()}
                </Text>
                {item.currency && (
                    <Text className="text-[10px] text-slate-400 font-medium">{item.currency}</Text>
                )}
            </View>
        </View>
    );

    const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
        <View className="px-6 py-2">
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</Text>
        </View>
    );

    return (
        <View className="flex-1 bg-slate-50 pt-12">
            <View className="px-6 pb-4 border-b border-slate-200/50 mb-2">
                <Text className="text-2xl font-bold text-slate-900">Transactions</Text>
            </View>

            <SectionList
                sections={sections}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchTransactions} />}
                contentContainerStyle={{ paddingBottom: 130 }}
                stickySectionHeadersEnabled={false}
                ListEmptyComponent={!loading ? <Text className="text-center text-slate-400 mt-10">No transactions found</Text> : null}
            />

            <TouchableOpacity
                className="absolute bottom-[110px] right-6 w-14 h-14 bg-slate-900 rounded-2xl items-center justify-center shadow-lg shadow-slate-900/30"
                onPress={() => setModalVisible(true)}
            >
                <Plus size={24} color="white" />
            </TouchableOpacity>

            <AddTransactionModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSuccess={() => {
                    setModalVisible(false);
                    fetchTransactions();
                }}
            />
        </View>
    );
}
