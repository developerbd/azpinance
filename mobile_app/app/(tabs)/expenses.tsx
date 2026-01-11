import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Image } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Zap, Calendar, CreditCard, Layers } from 'lucide-react-native';

interface Expense {
    id: string;
    platform_name: string;
    amount: number;
    billing_cycle: string;
    next_payment_date: string;
    status: string;
    category?: string;
}

export default function ExpensesScreen() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({ totalMonthly: 0, activeSubs: 0 });

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        setLoading(true);
        // Fetch Digital Expenses (Parity with Web)
        const { data, error } = await supabase
            .from('digital_expenses')
            .select('*')
            .order('next_payment_date', { ascending: true });

        if (data) {
            setExpenses(data);

            // Calculate Metrics
            const active = data.filter(e => e.status === 'active');
            // Simple monthly projection logic 
            const total = active.reduce((sum, e) => {
                let amt = Number(e.amount) || 0;
                if (e.billing_cycle === 'yearly') amt = amt / 12;
                return sum + amt;
            }, 0);

            setMetrics({
                totalMonthly: total,
                activeSubs: active.length
            });
        }
        setLoading(false);
    };

    return (
        <View className="flex-1 bg-slate-50 pt-12">
            <View className="px-6 pb-4 border-b border-slate-200/50 mb-2 flex-row justify-between items-center">
                <Text className="text-2xl font-bold text-slate-900">Digital Expenses</Text>
                <View className="bg-blue-100 p-2 rounded-full">
                    <Zap size={20} color="#2563eb" />
                </View>
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 130, paddingHorizontal: 20 }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchExpenses} />}
            >
                {/* Summary Cards */}
                <View className="flex-row gap-4 mb-6 mt-4">
                    <Card className="flex-1 border-blue-200 bg-blue-50/50">
                        <CardHeader className="p-4 pb-2">
                            <Text className="text-xs font-bold text-blue-600 uppercase">Monthly Spend</Text>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <Text className="text-2xl font-bold text-slate-900">${Math.round(metrics.totalMonthly)}</Text>
                            <Text className="text-xs text-slate-500">Projected</Text>
                        </CardContent>
                    </Card>
                    <Card className="flex-1 border-slate-200">
                        <CardHeader className="p-4 pb-2">
                            <Text className="text-xs font-bold text-slate-600 uppercase">Active Subs</Text>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <Text className="text-2xl font-bold text-slate-900">{metrics.activeSubs}</Text>
                            <Text className="text-xs text-slate-500">Services</Text>
                        </CardContent>
                    </Card>
                </View>

                {/* Subscriptions List */}
                <Text className="text-lg font-bold text-slate-900 mb-3">Your Subscriptions</Text>

                {expenses.length === 0 && !loading ? (
                    <Text className="text-slate-400 text-center py-10">No digital expenses found.</Text>
                ) : (
                    expenses.map(expense => (
                        <Card key={expense.id} className="mb-3">
                            <View className="p-4 flex-row justify-between items-start">
                                <View className="flex-row gap-3 items-center">
                                    <View className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center">
                                        <Layers size={20} color="#64748b" />
                                    </View>
                                    <View>
                                        <Text className="text-base font-bold text-slate-900">{expense.platform_name}</Text>
                                        <View className="flex-row items-center gap-1 mt-0.5">
                                            <Calendar size={10} color="#94a3b8" />
                                            <Text className="text-xs text-slate-500">
                                                Next: {new Date(expense.next_payment_date).toLocaleDateString()}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <View className="items-end">
                                    <Text className="text-lg font-bold text-slate-900">${expense.amount}</Text>
                                    <Badge variant={expense.status === 'active' ? 'success' : 'secondary'} className="mt-1">
                                        {expense.status}
                                    </Badge>
                                </View>
                            </View>
                        </Card>
                    ))
                )}
            </ScrollView>
        </View>
    );
}
