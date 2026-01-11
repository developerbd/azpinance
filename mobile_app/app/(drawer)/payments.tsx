import React, { useEffect, useState } from 'react';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import { View, Text, SectionList, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { CreditCard, FileText, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Payment {
    id: string;
    amount: number;
    date: string;
    method: string;
    remarks: string;
    supplier_name: string;
    check_number?: string;
}

interface Section {
    title: string;
    data: Payment[];
}

export default function PaymentsScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        setLoading(true);
        // Fetch Payments joined with Contacts (Suppliers)
        const { data } = await supabase
            .from('supplier_payments')
            .select('id, amount, date, method, check_number, remarks, supplier:contacts(name)')
            .order('date', { ascending: false })
            .limit(50);

        if (data) {
            const mapped = data.map((p: any) => ({
                id: p.id,
                amount: p.amount,
                date: p.date,
                method: p.method,
                check_number: p.check_number,
                remarks: p.remarks,
                supplier_name: p.supplier?.name || 'Unknown',
            }));

            const grouped: Record<string, Payment[]> = {};
            mapped.forEach(pay => {
                const dateKey = new Date(pay.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                if (!grouped[dateKey]) grouped[dateKey] = [];
                grouped[dateKey].push(pay);
            });

            setSections(Object.keys(grouped).map(date => ({ title: date, data: grouped[date] })));
        }
        setLoading(false);
    };

    return (
        <View className="bg-slate-50 dark:bg-slate-900 flex-1">
            <Header />
            <View className="px-5 pt-4 pb-2 flex-row justify-between items-end">
                <Text className="text-[34px] font-bold text-slate-900 dark:text-white tracking-tight">Payments</Text>
            </View>

            <SectionList
                sections={sections}
                keyExtractor={item => item.id}
                renderItem={({ item, index, section }) => (
                    <View className={`bg-white dark:bg-slate-800 px-5 py-4 flex-row items-center justify-between ${index !== section.data.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}>
                        <View className="flex-row items-center gap-4 flex-1">
                            <View className="w-10 h-10 rounded-full items-center justify-center bg-rose-50 dark:bg-rose-900/30">
                                <CreditCard size={20} color="#e11d48" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-[16px] font-semibold text-slate-900 dark:text-white" numberOfLines={1}>{item.supplier_name}</Text>
                                <Text className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    {item.method.toUpperCase()} {item.check_number ? `#${item.check_number}` : ''} • {item.remarks || 'No remarks'}
                                </Text>
                            </View>
                        </View>
                        <View className="items-end">
                            <Text className="text-[16px] font-bold text-slate-900 dark:text-white">
                                ৳{item.amount.toLocaleString()}
                            </Text>
                            <Text className="text-[12px] text-slate-400">
                                {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    </View>
                )}
                renderSectionHeader={({ section: { title } }) => (
                    <View className="bg-slate-50/95 dark:bg-slate-900/95 px-5 py-2 backdrop-blur-md sticky top-0 z-10">
                        <Text className="text-[14px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</Text>
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 130, paddingTop: 100 }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchPayments} />}
                stickySectionHeadersEnabled={true}
            />

            {/* TODO: Add FAB for New Payment if requested, currently just listing */}
            <TabBar />
        </View>
    );
}
