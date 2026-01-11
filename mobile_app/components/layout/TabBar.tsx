import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { LayoutDashboard, ArrowLeftRight, User, CreditCard } from 'lucide-react-native';

import { useColorScheme } from 'nativewind';

export function TabBar() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const pathname = usePathname();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const tabs = [
        { name: 'Home', icon: LayoutDashboard, path: '/(drawer)/dashboard' },
        { name: 'Trans.', icon: ArrowLeftRight, path: '/(drawer)/transactions' },
        { name: 'Payments', icon: CreditCard, path: '/(drawer)/payments' },
        { name: 'Profile', icon: User, path: '/(drawer)/contacts' }, // Placeholder for Profile
    ];

    return (
        <View
            className="absolute bottom-0 w-full bg-white/90 dark:bg-slate-900/90 border-t border-slate-200/60 dark:border-slate-800 backdrop-blur-xl"
            style={{ paddingBottom: Math.max(insets.bottom, 20), paddingTop: 12 }}
        >
            <View className="flex-row justify-around items-center px-2">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.path || (pathname.includes(tab.path) && tab.path !== '/');
                    return (
                        <TouchableOpacity
                            key={tab.name}
                            onPress={() => router.push(tab.path as any)}
                            className="items-center justify-center w-16"
                        >
                            <View className={`mb-1 ${isActive ? 'bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full' : ''}`}>
                                <tab.icon
                                    size={24}
                                    color={isActive ? '#2563eb' : (isDark ? '#cbd5e1' : '#94a3b8')} // slate-300 vs slate-400
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                            </View>
                            <Text className={`text-[10px] font-medium ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                {tab.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}
