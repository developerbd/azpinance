
import React, { useEffect, useState } from 'react';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, Animated } from 'react-native';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Menu, Bell, User, Search, Activity, ArrowDownRight, DollarSign, CheckCircle, CreditCard, ArrowLeftRight, Plus, Zap, FileText } from 'lucide-react-native';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { LiquidityChart } from '../../components/dashboard/LiquidityChart';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Dashboard() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(false);
    const [userName, setUserName] = useState('User');
    const [metrics, setMetrics] = useState({
        active_float_usd: 0,
        total_supplier_dues: 0,
        total_volume_usd: 0,
        settlement_score: 100
    });
    const [liquidity, setLiquidity] = useState({
        avg_daily_usd: 0,
        projected_30d_usd: 0,
        projected_30d_liability: 0,
        chart_data_bdt: [] as any[],
        chart_data_usd: [] as any[]
    });
    const [chartMode, setChartMode] = useState<'bdt' | 'usd'>('bdt');
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    // FAB Animation State
    const [fabOpen, setFabOpen] = useState(false);
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const rotateAnim = React.useRef(new Animated.Value(0)).current;

    const toggleFab = () => {
        const toValue = fabOpen ? 0 : 1;
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue, duration: 200, useNativeDriver: true }),
            Animated.spring(rotateAnim, { toValue, friction: 5, useNativeDriver: true })
        ]).start();
        setFabOpen(!fabOpen);
    };

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg']
    });

    const fabStyle = {
        transform: [
            { scale: fadeAnim },
            { translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }
        ],
        opacity: fadeAnim
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUserName(user.email?.split('@')[0] || 'User');

        // ... Same calculation logic as before ...
        const { data: forexData } = await supabase.from('forex_transactions').select('id, amount, amount_bdt, contact_id, transaction_date, status').eq('status', 'approved').order('transaction_date', { ascending: false }).limit(500);
        const { data: paymentsData } = await supabase.from('supplier_payments').select('id, amount, date, supplier_id').order('date', { ascending: false }).limit(200);
        const { data: invoicesData } = await supabase.from('invoices').select('id, total_amount, status, created_at, invoice_number').order('created_at', { ascending: false }).limit(10);

        // Logic
        const total_volume_usd = forexData?.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0) || 0;
        // --- Per-Supplier Net Calculation (Accurate Liability) ---
        const supplierMap = new Map<string, { liability: number, paid: number, total_usd: number }>();

        // 1. Process Forex (Liability)
        forexData?.forEach(tx => {
            const current = supplierMap.get(tx.contact_id) || { liability: 0, paid: 0, total_usd: 0 };
            current.liability += (Number(tx.amount_bdt) || 0);
            current.total_usd += (Number(tx.amount) || 0);
            supplierMap.set(tx.contact_id, current);
        });

        // 2. Process Payments (Paid)
        paymentsData?.forEach(pay => {
            const current = supplierMap.get(pay.supplier_id) || { liability: 0, paid: 0, total_usd: 0 };
            current.paid += (Number(pay.amount) || 0);
            supplierMap.set(pay.supplier_id, current);
        });

        // 3. Calculate Aggregates
        let total_supplier_dues = 0; // Only positive payables
        let active_float_usd = 0;

        supplierMap.forEach(stats => {
            const net = stats.liability - stats.paid;

            // Dues: Sum of money we OWE (ignore overpayments/receivables for this metric)
            if (net > 0) total_supplier_dues += net;

            // Float: Net / Avg Rate
            const avg_rate = stats.total_usd > 0 ? (stats.liability / stats.total_usd) : 120;
            active_float_usd += (net / avg_rate);
        });

        // 4. Global Settlement Score (Paid / Liability) - This considers ALL history
        const global_liability = Array.from(supplierMap.values()).reduce((sum, s) => sum + s.liability, 0);
        const global_paid = Array.from(supplierMap.values()).reduce((sum, s) => sum + s.paid, 0);

        let settlement_score = 100;
        if (global_liability > 0) settlement_score = Math.min(100, (global_paid / global_liability) * 100);

        setMetrics({ total_volume_usd, active_float_usd, total_supplier_dues, settlement_score });

        // --- Liquidity Forecast Logic ---
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentForex = forexData?.filter(tx => new Date(tx.transaction_date) >= thirtyDaysAgo) || [];
        const volume30d = recentForex.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

        // Calculate Active Days
        const dates = recentForex.map(tx => new Date(tx.transaction_date).getTime());
        const firstTxDate = dates.length > 0 ? new Date(Math.min(...dates)) : new Date();
        const daysActive = Math.max(1, Math.min(30, Math.ceil((new Date().getTime() - firstTxDate.getTime()) / (1000 * 60 * 60 * 24))));

        const avg_daily_usd = volume30d / daysActive;
        const projected_30d_usd = avg_daily_usd * 30;

        // Global Avg Rate (Total active history)
        const total_usd_all = forexData?.reduce((s, t) => s + (Number(t.amount) || 0), 0) || 1;
        const total_bdt_all = forexData?.reduce((s, t) => s + (Number(t.amount_bdt) || 0), 0) || 120;
        const avg_rate = total_bdt_all / total_usd_all;

        const projected_30d_liability_increase = projected_30d_usd * avg_rate;

        // Generate Chart Data
        const chart_data_bdt = [];
        const chart_data_usd = [];

        let cumulative_liability = total_supplier_dues;
        const daily_liability_build = (avg_daily_usd * avg_rate);

        // USD Calculation starts from 0 cumulative inflow for the forecast period
        let cumulative_usd_inflow = 0;

        for (let i = 0; i <= 30; i += 5) {
            chart_data_bdt.push({
                day: i,
                label: i === 0 ? 'Today' : `+${i}d`,
                value: cumulative_liability + (daily_liability_build * i)
            });
            chart_data_usd.push({
                day: i,
                label: i === 0 ? 'Today' : `+${i}d`,
                value: cumulative_usd_inflow + (avg_daily_usd * i)
            });
        }

        setLiquidity({
            avg_daily_usd,
            projected_30d_usd,
            projected_30d_liability: projected_30d_liability_increase,
            chart_data_bdt,
            chart_data_usd
        });

        // --- Recent Activity Logic ---
        const r_forex = (forexData || []).map(tx => ({
            type: 'forex',
            id: tx.id,
            date: tx.transaction_date,
            amount: tx.amount,
            description: 'Forex Inflow',
            status: tx.status
        }));
        const r_payments = (paymentsData || []).map(pay => ({
            type: 'payment',
            id: pay.id,
            date: pay.date,
            amount: pay.amount,
            description: 'Supplier Payment',
            status: 'completed'
        }));
        const r_invoices = (invoicesData || []).map(inv => ({
            type: 'invoice',
            id: inv.id,
            date: inv.created_at,
            amount: inv.total_amount,
            description: `Invoice #${inv.invoice_number}`,
            status: inv.status
        }));

        const merged = [...r_forex, ...r_payments, ...r_invoices]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);

        setRecentActivity(merged);

        setLoading(false);
    };

    const getGreeting = () => {
        const hours = new Date().getHours();
        if (hours < 12) return 'Good Morning';
        if (hours < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <View className="flex-1 bg-[#F2F2F7] dark:bg-slate-900">
            <Header />

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 130, paddingTop: 100 }}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
            >
                {/* 1. Rich Header (Greeting & Date) */}
                <View className="px-5 pt-4 pb-2">
                    <Text className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
                        {getGreeting()}, {userName}
                    </Text>
                    <Text className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </Text>
                </View>

                {/* 2. Quick Actions Removed (Replaced by FAB) */}
                <View className="h-4" />

                {/* 3. Metrics Grid (4 Color Cards) */}
                {/* 3. Metrics List (Single Card vertical stack) */}
                <View className="mx-5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">

                    {/* Active Float */}
                    <View className="flex-row items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700/50">
                        <View className="flex-row items-center gap-4">
                            <View className="w-10 h-10 bg-blue-50 dark:bg-blue-900/40 rounded-full items-center justify-center">
                                <Activity size={20} color="#2563eb" />
                            </View>
                            <View>
                                <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">Active Float</Text>
                                <Text className="text-[10px] text-slate-400">Unsettled USD</Text>
                            </View>
                        </View>
                        <Text className="text-lg font-bold text-slate-900 dark:text-white">${metrics.active_float_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
                    </View>

                    {/* Supplier Dues */}
                    <View className="flex-row items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700/50">
                        <View className="flex-row items-center gap-4">
                            <View className="w-10 h-10 bg-rose-50 dark:bg-rose-900/40 rounded-full items-center justify-center">
                                <ArrowDownRight size={20} color="#e11d48" />
                            </View>
                            <View>
                                <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">Payables</Text>
                                <Text className="text-[10px] text-slate-400">Total Liability</Text>
                            </View>
                        </View>
                        <Text className="text-[17px] font-bold text-slate-900 dark:text-white">৳{metrics.total_supplier_dues.toLocaleString()}</Text>
                    </View>

                    {/* Total Volume */}
                    <View className="flex-row items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700/50">
                        <View className="flex-row items-center gap-4">
                            <View className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/40 rounded-full items-center justify-center">
                                <DollarSign size={20} color="#059669" />
                            </View>
                            <View>
                                <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">Volume</Text>
                                <Text className="text-[10px] text-slate-400">Processed USD</Text>
                            </View>
                        </View>
                        <Text className="text-lg font-bold text-slate-900 dark:text-white">${metrics.total_volume_usd.toLocaleString()}</Text>
                    </View>

                    {/* Settlement Score */}
                    <View className="flex-row items-center justify-between p-4">
                        <View className="flex-row items-center gap-4">
                            <View className="w-10 h-10 bg-violet-50 dark:bg-violet-900/40 rounded-full items-center justify-center">
                                <CheckCircle size={20} color="#7c3aed" />
                            </View>
                            <View>
                                <Text className="text-sm font-semibold text-slate-500 dark:text-slate-400">Efficiency</Text>
                                <Text className="text-[10px] text-slate-400">Settlement Score</Text>
                            </View>
                        </View>
                        <Text className="text-lg font-bold text-slate-900 dark:text-white">{metrics.settlement_score.toFixed(0)}%</Text>
                    </View>

                </View>

                {/* 4. Liquidity Forecast */}
                <View className="px-5 mt-6 mb-3">
                    <Text className="text-base font-bold text-slate-900 dark:text-white">Liquidity Forecast (30d)</Text>
                </View>
                <View className="mx-5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden p-5">
                    <View className="flex-row justify-between items-start mb-4">
                        <View>
                            <Text className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                {chartMode === 'bdt' ? 'Est. Liability Build (30d)' : 'Proj. USD Inflow (30d)'}
                            </Text>
                            <Text className={`text-3xl font-bold mt-1 ${chartMode === 'bdt' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {chartMode === 'bdt'
                                    ? `৳${((metrics.total_supplier_dues + liquidity.projected_30d_liability) / 1000000).toFixed(1)}M`
                                    : `$${(liquidity.projected_30d_usd / 1000).toFixed(0)}k`
                                }
                            </Text>
                            <Text className="text-[10px] text-slate-400 mt-1">
                                {chartMode === 'bdt'
                                    ? `Current ৳${(metrics.total_supplier_dues / 1000000).toFixed(1)}M + New ৳${(liquidity.projected_30d_liability / 1000000).toFixed(1)}M`
                                    : `Avg. daily inflow: $${(liquidity.avg_daily_usd / 1000).toFixed(1)}k`
                                }
                            </Text>
                        </View>

                        {/* Toggle */}
                        <View className="flex-row bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
                            <TouchableOpacity
                                onPress={() => setChartMode('bdt')}
                                className={`px-3 py-1.5 rounded-md ${chartMode === 'bdt' ? 'bg-white shadow-sm' : ''}`}
                            >
                                <Text className={`text-[10px] font-bold ${chartMode === 'bdt' ? 'text-rose-600' : 'text-slate-500'}`}>BDT</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setChartMode('usd')}
                                className={`px-3 py-1.5 rounded-md ${chartMode === 'usd' ? 'bg-white shadow-sm' : ''}`}
                            >
                                <Text className={`text-[10px] font-bold ${chartMode === 'usd' ? 'text-emerald-600' : 'text-slate-500'}`}>USD</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Chart */}
                    <View className="-ml-2">
                        <LiquidityChart
                            data={chartMode === 'bdt' ? liquidity.chart_data_bdt : liquidity.chart_data_usd}
                            height={180}
                            color={chartMode === 'bdt' ? '#e11d48' : '#059669'}
                            isCurrency={chartMode === 'bdt'}
                        />
                    </View>
                </View>

                {/* 5. Recent Activity (Placeholder) */}
                {/* 5. Recent Activity */}
                <View className="px-5 mt-6 mb-3 flex-row items-center justify-between">
                    <Text className="text-base font-bold text-slate-900 dark:text-white">Recent Activity</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('(drawer)/transactions' as any)}>
                        <Text className="text-sm font-semibold text-blue-600 dark:text-blue-400">View All</Text>
                    </TouchableOpacity>
                </View>
                <View className="mx-5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    {recentActivity.length > 0 ? (
                        recentActivity.map((item, index) => (
                            <View
                                key={`${item.type}-${item.id}`}
                                className={`flex-row items-center justify-between p-4 ${index !== recentActivity.length - 1 ? 'border-b border-slate-100 dark:border-slate-700/50' : ''}`}
                            >
                                <View className="flex-row items-center gap-4">
                                    <View className={`w-10 h-10 rounded-full items-center justify-center ${item.type === 'forex' ? 'bg-blue-50 dark:bg-blue-900/40' :
                                        item.type === 'payment' ? 'bg-rose-50 dark:bg-rose-900/40' :
                                            'bg-slate-100 dark:bg-slate-800'
                                        }`}>
                                        {item.type === 'forex' && <ArrowLeftRight size={18} color="#2563eb" />}
                                        {item.type === 'payment' && <CreditCard size={18} color="#e11d48" />}
                                        {item.type === 'invoice' && <FileText size={18} color="#64748b" />}
                                    </View>
                                    <View>
                                        <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.description}</Text>
                                        <Text className="text-xs text-slate-400 font-medium">
                                            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </Text>
                                    </View>
                                </View>
                                <View className="items-end">
                                    <Text className={`text-sm font-bold ${item.type === 'forex' ? 'text-emerald-600 dark:text-emerald-400' :
                                        'text-slate-900 dark:text-white'
                                        }`}>
                                        {item.type === 'forex' ? '+' : ''}
                                        {item.type === 'payment' || item.type === 'invoice' ? '৳' : '$'}
                                        {item.amount?.toLocaleString()}
                                    </Text>
                                    <Text className="text-[10px] text-slate-400 capitalize">{item.status}</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View className="p-6 items-center justify-center">
                            <Text className="text-slate-400 text-sm">No recent activity detected.</Text>
                        </View>
                    )}
                </View>



            </ScrollView>

            {/* Floating Action Button Group */}
            {
                fabOpen && (
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={toggleFab}
                        className="absolute inset-0 bg-black/20 dark:bg-black/40 z-[40]" // Overlay
                    />
                )
            }

            <View className="absolute bottom-[110px] right-6 items-end z-[50] gap-4">
                {/* Action: New Forex */}
                <Animated.View style={[fabStyle, { transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }] as any}>
                    <TouchableOpacity
                        onPress={() => { toggleFab(); navigation.navigate('(drawer)/transactions' as any); }}
                        className="flex-row items-center gap-3"
                    >
                        <View className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <Text className="text-slate-800 dark:text-slate-100 font-bold text-sm">New Forex</Text>
                        </View>
                        <View className="w-12 h-12 bg-blue-600 rounded-full items-center justify-center shadow-lg shadow-blue-500/30">
                            <ArrowLeftRight size={22} color="white" />
                        </View>
                    </TouchableOpacity>
                </Animated.View>

                {/* Action: Make Payment */}
                <Animated.View style={fabStyle as any}>
                    <TouchableOpacity className="flex-row items-center gap-3">
                        <View className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <Text className="text-slate-800 dark:text-slate-100 font-bold text-sm">Make Payment</Text>
                        </View>
                        <View className="w-12 h-12 bg-emerald-600 rounded-full items-center justify-center shadow-lg shadow-emerald-500/30">
                            <CreditCard size={22} color="white" />
                        </View>
                    </TouchableOpacity>
                </Animated.View>

                {/* Action: Add Expense */}
                <Animated.View style={fabStyle as any}>
                    <TouchableOpacity
                        onPress={() => { toggleFab(); navigation.navigate('(drawer)/expenses' as any); }}
                        className="flex-row items-center gap-3"
                    >
                        <View className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <Text className="text-slate-800 dark:text-slate-100 font-bold text-sm">Add Expense</Text>
                        </View>
                        <View className="w-12 h-12 bg-violet-600 rounded-full items-center justify-center shadow-lg shadow-violet-500/30">
                            <Zap size={22} color="white" />
                        </View>
                    </TouchableOpacity>
                </Animated.View>

                {/* Main Trigger Button */}
                <TouchableOpacity
                    onPress={toggleFab}
                    activeOpacity={0.9}
                    className="w-14 h-14 bg-slate-900 dark:bg-blue-600 rounded-full items-center justify-center shadow-xl shadow-slate-900/30 z-[60]"
                >
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                        <Plus size={30} color="white" strokeWidth={2.5} />
                    </Animated.View>
                </TouchableOpacity>
            </View>

            <TabBar />
        </View>
    );
}
