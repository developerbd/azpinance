import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, RefreshControl, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

import {
    Activity,
    ArrowDownRight,
    DollarSign,
    CheckCircle,
    LogOut
} from 'lucide-react-native';

// Metrics Interface
interface DashboardMetrics {
    total_volume_usd: number;
    active_float_usd: number;
    total_supplier_dues: number;
    settlement_score: number;
}

export default function Dashboard() {
    const [loading, setLoading] = useState(false);
    const [userName, setUserName] = useState('User');
    const [metrics, setMetrics] = useState<DashboardMetrics>({
        active_float_usd: 0,
        total_supplier_dues: 0,
        total_volume_usd: 0,
        settlement_score: 100
    });
    const router = useRouter();

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.replace('/');
            return;
        }
        setUserName(user.email?.split('@')[0] || 'User');

        // Fetch Core Data (Same logic as before)
        const { data: forexData } = await supabase
            .from('forex_transactions')
            .select('amount, amount_bdt, contact_id')
            .eq('status', 'approved');

        const { data: paymentsData } = await supabase
            .from('supplier_payments')
            .select('amount, supplier_id');

        // Logic (Same as before)
        const total_volume_usd = forexData?.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0) || 0;

        interface SupplierStats { total_usd: number; total_bdt_liability: number; total_bdt_paid: number; }
        const supplierMap = new Map<string, SupplierStats>();
        const getStats = (id: string) => {
            if (!supplierMap.has(id)) supplierMap.set(id, { total_usd: 0, total_bdt_liability: 0, total_bdt_paid: 0 });
            return supplierMap.get(id)!;
        };
        let global_liability_bdt = 0;
        forexData?.forEach(tx => {
            const stats = getStats(tx.contact_id);
            stats.total_usd += Number(tx.amount) || 0;
            stats.total_bdt_liability += Number(tx.amount_bdt) || 0;
            global_liability_bdt += Number(tx.amount_bdt) || 0;
        });

        let global_paid_bdt = 0;
        paymentsData?.forEach(pay => {
            const stats = getStats(pay.supplier_id);
            stats.total_bdt_paid += Number(pay.amount) || 0;
            global_paid_bdt += Number(pay.amount) || 0;
        });
        const total_supplier_dues = global_liability_bdt - global_paid_bdt;

        let active_float_usd = 0;
        supplierMap.forEach(stats => {
            const dues = stats.total_bdt_liability - stats.total_bdt_paid;
            const avg_rate = stats.total_usd > 0 ? (stats.total_bdt_liability / stats.total_usd) : 120;
            active_float_usd += (dues / avg_rate);
        });

        let settlement_score = 100;
        if (global_liability_bdt > 0) {
            settlement_score = Math.min(100, (global_paid_bdt / global_liability_bdt) * 100);
        }

        setMetrics({ total_volume_usd, active_float_usd, total_supplier_dues, settlement_score });
        setLoading(false);
    }

    async function signOut() {
        await supabase.auth.signOut({ scope: 'local' });
        router.replace('/');
    }

    return (
        <View className="flex-1 bg-slate-50">
            <View className="bg-slate-900 pt-16 pb-24 px-6 rounded-b-[32px] shadow-lg shadow-slate-900/20 z-10 block">
                <View className="flex-row justify-between items-center mb-6">
                    <View>
                        <Text className="text-slate-400 text-xs font-medium uppercase tracking-wider">Welcome Back</Text>
                        <Text className="text-2xl font-bold text-white capitalize">{userName}</Text>
                    </View>
                    <TouchableOpacity onPress={signOut} className="bg-white/10 p-3 rounded-full backdrop-blur-sm border border-white/5">
                        <LogOut size={20} color="#cbd5e1" />
                    </TouchableOpacity>
                </View>

                {/* Main Stat Card - Settlement Score */}
                <View className="bg-white/10 p-4 rounded-2xl border border-white/5 flex-row items-center justify-between backdrop-blur-md">
                    <View className="flex-row items-center gap-3">
                        <View className="w-10 h-10 rounded-full bg-emerald-500/20 items-center justify-center">
                            <CheckCircle size={20} color="#10b981" />
                        </View>
                        <View>
                            <Text className="text-slate-300 text-xs">Payment Efficiency</Text>
                            <Text className="text-white text-lg font-bold">{metrics.settlement_score.toFixed(1)}%</Text>
                        </View>
                    </View>
                    <View className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        <Text className="text-emerald-400 text-xs font-medium">Excellent</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                className="flex-1 -mt-16"
                contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20 }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#fff" />}
            >
                {/* Stats Grid */}
                <View className="flex-row flex-wrap justify-between gap-y-4">
                    {/* Active Float */}
                    <View className="w-[48%] bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                        <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mb-4">
                            <Activity size={20} color="#2563eb" />
                        </View>
                        <Text className="text-slate-500 text-xs font-medium uppercase mb-1">Active Float</Text>
                        <Text className="text-xl font-bold text-slate-900">${metrics.active_float_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
                    </View>

                    {/* Supplier Dues */}
                    <View className="w-[48%] bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                        <View className="w-10 h-10 rounded-full bg-rose-50 items-center justify-center mb-4">
                            <ArrowDownRight size={20} color="#e11d48" />
                        </View>
                        <Text className="text-slate-500 text-xs font-medium uppercase mb-1">Total Liability</Text>
                        <Text className="text-xl font-bold text-slate-900" numberOfLines={1}>৳{metrics.total_supplier_dues.toLocaleString()}</Text>
                    </View>

                    {/* Total Volume */}
                    <View className="w-full bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex-row justify-between items-center">
                        <View>
                            <Text className="text-slate-500 text-xs font-medium uppercase mb-1">Total Processed Volume</Text>
                            <Text className="text-2xl font-bold text-slate-900">${metrics.total_volume_usd.toLocaleString()}</Text>
                        </View>
                        <View className="w-12 h-12 rounded-full bg-emerald-50 items-center justify-center">
                            <DollarSign size={24} color="#059669" />
                        </View>
                    </View>
                </View>

                {/* Quick Actions Title */}
                <View className="mt-8 mb-4">
                    <Text className="text-slate-900 text-lg font-bold">Quick Overview</Text>
                </View>

                <View className="bg-white p-4 rounded-2xl border border-slate-100">
                    <Text className="text-center text-slate-400 py-4">Recent activity will appear here...</Text>
                </View>

            </ScrollView>
        </View>
    );
}
