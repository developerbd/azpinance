import React, { useEffect, useState } from 'react';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import { View, Text, ScrollView, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Zap, Calendar, Layers, Menu, Search } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Expense {
    id: string;
    platform_name: string;
    amount: number;
    billing_cycle: string;
    next_payment_date: string;
    status: string;
}

export default function ExpensesScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({ totalMonthly: 0, activeSubs: 0 });

    useEffect(() => { fetchExpenses(); }, []);

    const fetchExpenses = async () => {
        setLoading(true);
        const { data } = await supabase.from('digital_expenses').select('*').order('next_payment_date', { ascending: true });
        if (data) {
            setExpenses(data);
            const active = data.filter(e => e.status === 'active');
            const total = active.reduce((sum, e) => {
                let amt = Number(e.amount) || 0;
                if (e.billing_cycle === 'yearly') amt = amt / 12;
                return sum + amt;
            }, 0);
            setMetrics({ totalMonthly: total, activeSubs: active.length });
        }
        setLoading(false);
    };

    return (
        <View className="flex-1 bg-[#F2F2F7]">
            <Header />

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 130, paddingTop: 100 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchExpenses} />}>
                <View className="px-5 pt-2 pb-4">
                    <Text className="text-[34px] font-bold text-black tracking-tight">Subscriptions</Text>
                </View>

                {/* Summary Section */}
                <View className="flex-row gap-3 mx-4 mb-6">
                    <View className="flex-1 bg-white p-4 rounded-[14px] shadow-sm">
                        <Text className="text-[13px] font-semibold text-blue-500 uppercase">Monthly</Text>
                        <Text className="text-[28px] font-bold text-black mt-1">${Math.round(metrics.totalMonthly)}</Text>
                    </View>
                    <View className="flex-1 bg-white p-4 rounded-[14px] shadow-sm">
                        <Text className="text-[13px] font-semibold text-gray-500 uppercase">Active</Text>
                        <Text className="text-[28px] font-bold text-black mt-1">{metrics.activeSubs}</Text>
                    </View>
                </View>

                <View className="mx-4 bg-white rounded-[12px] overflow-hidden">
                    {expenses.length === 0 && !loading ? (
                        <Text className="text-gray-400 text-center py-6">No subscriptions found.</Text>
                    ) : (
                        expenses.map((expense, index) => (
                            <View key={expense.id} className={`p-4 flex-row justify-between items-center ${index !== expenses.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                <View className="flex-row gap-3 items-center">
                                    <View className="w-10 h-10 rounded-[10px] bg-gray-100 items-center justify-center">
                                        <Layers size={20} color="#1f2937" />
                                    </View>
                                    <View>
                                        <Text className="text-[17px] font-semibold text-black">{expense.platform_name}</Text>
                                        <Text className="text-[13px] text-gray-500">{new Date(expense.next_payment_date).toLocaleDateString()}</Text>
                                    </View>
                                </View>
                                <View className="items-end">
                                    <Text className="text-[17px] font-semibold text-black">${expense.amount}</Text>
                                    <View className={`px-2 py-0.5 rounded-full mt-1 ${expense.status === 'active' ? 'bg-green-100' : 'bg-gray-100'}`}>
                                        <Text className={`text-[11px] font-bold ${expense.status === 'active' ? 'text-green-700' : 'text-gray-500'}`}>{expense.status.toUpperCase()}</Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
            <TabBar />
        </View>
    );
}
