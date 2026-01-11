import React, { useEffect, useState } from 'react';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import { View, Text, SectionList, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { ArrowLeftRight, Search, Plus } from 'lucide-react-native';
import AddTransactionModal from '../../components/AddTransactionModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Transaction {
    id: string;
    amount: number;
    amount_bdt: number;
    currency: string;
    transaction_date: string;
    status: string;
    contact_name: string;
    exchange_rate: number;
}

interface Section {
    title: string;
    data: Transaction[];
}

export default function TransactionsScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('forex_transactions')
            .select('id, amount, amount_bdt, currency, transaction_date, status, exchange_rate, contact:contacts(name)')
            .order('transaction_date', { ascending: false })
            .limit(50);

        if (data) {
            const mapped = data.map((t: any) => ({
                id: t.id,
                amount: t.amount,
                amount_bdt: t.amount_bdt,
                currency: t.currency || 'USD',
                transaction_date: t.transaction_date,
                status: t.status,
                contact_name: t.contact?.name || 'Unknown',
                exchange_rate: t.exchange_rate || (t.amount > 0 ? t.amount_bdt / t.amount : 0)
            }));

            const grouped: Record<string, Transaction[]> = {};
            mapped.forEach(tx => {
                const dateKey = new Date(tx.transaction_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                if (!grouped[dateKey]) grouped[dateKey] = [];
                grouped[dateKey].push(tx);
            });

            setSections(Object.keys(grouped).map(date => ({ title: date, data: grouped[date] })));
        }
        setLoading(false);
    };

    return (
        <View className="bg-slate-50 dark:bg-slate-900 flex-1">
            <Header />
            <View className="px-5 pt-4 pb-2 flex-row justify-between items-end">
                <Text className="text-[34px] font-bold text-slate-900 dark:text-white tracking-tight">Transactions</Text>
            </View>

            <SectionList
                sections={sections}
                keyExtractor={item => item.id}
                renderItem={({ item, index, section }) => (
                    <View className={`bg-white dark:bg-slate-800 px-5 py-4 flex-row items-center justify-between ${index !== section.data.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}>
                        <View className="flex-row items-center gap-4 flex-1">
                            <View className="w-10 h-10 rounded-full items-center justify-center bg-blue-50 dark:bg-blue-900/30">
                                <ArrowLeftRight size={20} color="#2563eb" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-[16px] font-semibold text-slate-900 dark:text-white" numberOfLines={1}>{item.contact_name}</Text>
                                <Text className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    Rate: {item.exchange_rate?.toFixed(2) || 'N/A'} • {new Date(item.transaction_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                        </View>
                        <View className="items-end">
                            <Text className="text-[16px] font-bold text-slate-900 dark:text-white">
                                ${item.amount.toLocaleString()}
                            </Text>
                            <Text className="text-[12px] text-slate-500 dark:text-slate-400">
                                ৳{item.amount_bdt?.toLocaleString()}
                            </Text>
                            <View className={`px-2 py-0.5 rounded-full mt-1 ${item.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                                <Text className={`text-[10px] font-bold uppercase ${item.status === 'approved' ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                    {item.status}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
                renderSectionHeader={({ section: { title } }) => (
                    <View className="bg-slate-50/95 dark:bg-slate-900/95 px-5 py-2 backdrop-blur-md sticky top-0 z-10">
                        <Text className="text-[14px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</Text>
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 130, paddingTop: 100 }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchTransactions} />}
                stickySectionHeadersEnabled={true}
            />

            <TouchableOpacity
                className="absolute bottom-24 right-6 w-14 h-14 bg-blue-600 rounded-full items-center justify-center shadow-lg shadow-blue-600/30 z-20"
                onPress={() => setModalVisible(true)}
            >
                <Plus size={28} color="white" />
            </TouchableOpacity>

            <AddTransactionModal visible={modalVisible} onClose={() => setModalVisible(false)} onSuccess={() => { setModalVisible(false); fetchTransactions(); }} />

            <TabBar />
        </View>
    );
}
