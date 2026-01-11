import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import {
    LayoutDashboard,
    CreditCard,
    Zap,
    Users,
    Wallet,
    BarChart3,
    ScrollText,
    Settings,
    LogOut,
    ChevronDown,
    ChevronRight,
    X,
    MessageSquare
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Constants from 'expo-constants';

export function SidebarContent(props: DrawerContentComponentProps) {
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const [expanded, setExpanded] = useState<string | null>(null);

    // Dynamic App Info with Azpinance fallback
    const configName = Constants.expoConfig?.name;
    const appName = (configName && configName !== 'mobile_app') ? configName : 'Azpinance';
    const appVersion = Constants.expoConfig?.version || '1.0.0';

    // Exact items from Web Sidebar
    const menuItems = [
        { title: 'Dashboard', icon: LayoutDashboard, path: '/(drawer)/dashboard' },
        {
            title: 'Transactions',
            icon: CreditCard,
            path: '/(drawer)/transactions',
            submenu: [
                { title: 'Forex', path: '/(drawer)/transactions' },
                { title: 'Supplier Payments', path: '/(drawer)/transactions' },
                { title: 'Invoices & Bills', path: '/(drawer)/transactions' },
            ]
        },
        {
            title: 'Digital Expenses',
            icon: Zap,
            path: '/(drawer)/expenses',
            submenu: [
                { title: 'All Expenses', path: '/(drawer)/expenses' },
                { title: 'Recurring', path: '/(drawer)/expenses' },
                { title: 'Reports & Analytics', path: '/(drawer)/expenses' }
            ]
        },
        { title: 'Contacts', icon: Users, path: '/(drawer)/contacts' },
        { title: 'Financial Accounts', icon: Wallet, path: '/(drawer)/contacts' }, // Placeholder
        {
            title: 'Reports',
            icon: BarChart3,
            path: '/(drawer)/contacts', // Placeholder
            submenu: [
                { title: 'Forex Report', path: '/(drawer)/contacts' },
                { title: 'Supplier Payments', path: '/(drawer)/contacts' },
                { title: 'Cash Flow', path: '/(drawer)/contacts' }
            ]
        },
        { title: 'Activity Log', icon: ScrollText, path: '/(drawer)/activity' },
        { title: 'Settings', icon: Settings, path: '/(drawer)/settings' }
    ];

    const handlePress = (item: any) => {
        if (item.submenu) {
            setExpanded(expanded === item.title ? null : item.title);
        } else {
            router.push(item.path);
            props.navigation.closeDrawer();
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut({ scope: 'local' });
        router.replace('/');
    };

    return (
        <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
            {/* Sidebar Header (Matches Web: SidebarLogo logic) */}
            <View className="p-6 pb-6 flex-row items-center gap-3 border-b border-gray-100">
                <View className="h-10 w-10 rounded-xl bg-blue-600 items-center justify-center shadow-lg shadow-blue-600/20">
                    <Zap size={20} color="white" fill="white" />
                </View>
                <View>
                    <Text className="font-bold text-xl tracking-tight text-slate-900">{appName}</Text>
                    <View className="flex-row items-center gap-2">
                        <Text className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Finance OS</Text>
                        <View className="bg-slate-100 px-1.5 py-0.5 rounded">
                            <Text className="text-[9px] font-mono text-slate-500">v{appVersion}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Menu List */}
            <ScrollView className="flex-1 px-3 py-4">
                {menuItems.map((item) => {
                    const isActive = pathname.includes(item.path) && !item.submenu; // Simple active check

                    return (
                        <View key={item.title} className="mb-1">
                            <TouchableOpacity
                                onPress={() => handlePress(item)}
                                className={`flex-row items-center justify-between px-3 py-2.5 rounded-lg transition-all ${isActive ? 'bg-blue-50' : ''}`}
                            >
                                <View className="flex-row items-center gap-3">
                                    <item.icon size={16} color={isActive ? '#2563eb' : '#64748b'} />
                                    <Text className={`text-[13px] tracking-wide ${isActive ? 'text-blue-600 font-semibold' : 'text-slate-500'}`}>
                                        {item.title}
                                    </Text>
                                </View>
                                {item.submenu && (
                                    expanded === item.title ? <ChevronDown size={14} color="#94a3b8" /> : <ChevronRight size={14} color="#94a3b8" />
                                )}
                                {isActive && <View className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full" />}
                            </TouchableOpacity>

                            {/* Submenu */}
                            {item.submenu && expanded === item.title && (
                                <View className="ml-4 border-l border-blue-600/10 pl-3 mt-1 space-y-1">
                                    {item.submenu.map((sub: any) => (
                                        <TouchableOpacity
                                            key={sub.title}
                                            onPress={() => {
                                                router.push(sub.path);
                                                props.navigation.closeDrawer();
                                            }}
                                            className="py-2 px-2 rounded-md active:bg-slate-50"
                                        >
                                            <Text className="text-[12.5px] font-medium text-slate-400 tracking-wide">{sub.title}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    );
                })}
            </ScrollView>

            {/* Footer */}
            <View className="p-4 border-t border-gray-100">
                <TouchableOpacity onPress={handleSignOut} className="flex-row items-center gap-3 p-3 rounded-xl active:bg-red-50">
                    <LogOut size={18} color="#ef4444" />
                    <Text className="text-sm font-medium text-red-600">Log Out</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
