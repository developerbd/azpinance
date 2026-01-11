import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import { Zap, Bell, User, Sun, Moon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { NotificationsBell } from '../NotificationsBell';
import { UserNav } from '../UserNav';
import { useColorScheme } from 'nativewind';

export function Header({ title }: { title?: string }) {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { colorScheme, toggleColorScheme } = useColorScheme();

    // Dynamic App Info Logic (Same as Sidebar)
    const configName = Constants.expoConfig?.name;
    const appName = (configName && configName !== 'mobile_app') ? configName : 'Azpinance';
    const appVersion = Constants.expoConfig?.version || '1.0.0';

    const toggleMenu = () => {
        try {
            navigation.dispatch(DrawerActions.openDrawer());
        } catch (e) {
            try {
                navigation.getParent()?.dispatch(DrawerActions.openDrawer());
            } catch (e2) {
                if (navigation.openDrawer) navigation.openDrawer();
                else if (navigation.toggleDrawer) navigation.toggleDrawer();
            }
        }
    };

    return (
        <View
            className="absolute top-0 left-0 right-0 z-[100] bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 shadow-sm"
            style={{ paddingTop: insets.top + 16, paddingBottom: 18 }}
        >
            <View className="flex-row items-center justify-between px-4">

                {/* Left: Branding (Clickable to Toggle Sidebar as Sidebar Header Replacement) */}
                <TouchableOpacity
                    onPress={toggleMenu}
                    activeOpacity={0.7}
                    className="flex-row items-center gap-3"
                >
                    {/* Logo Box */}
                    <View className="h-9 w-9 rounded-xl bg-blue-600 items-center justify-center shadow-lg shadow-blue-600/20">
                        <Zap size={18} color="white" fill="white" />
                    </View>

                    {/* Text Details */}
                    <View>
                        <Text className="font-bold text-lg tracking-tight text-slate-900 dark:text-white leading-tight">
                            {appName}
                        </Text>
                        <View className="flex-row items-center gap-2">
                            <Text className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">Finance OS</Text>
                            <View className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-[4px]">
                                <Text className="text-[8px] font-mono text-slate-500 dark:text-slate-400 font-bold">v{appVersion}</Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Right: Actions */}
                <View className="flex-row items-center gap-1">
                    {/* Notification */}
                    <NotificationsBell />

                    {/* Theme Toggle */}
                    <TouchableOpacity
                        onPress={toggleColorScheme}
                        className="p-2 active:bg-slate-50 dark:active:bg-slate-800 rounded-full"
                    >
                        {colorScheme === 'dark' ? (
                            <Sun size={20} color="#94a3b8" strokeWidth={2} />
                        ) : (
                            <Moon size={20} color="#475569" strokeWidth={2} />
                        )}
                    </TouchableOpacity>

                    {/* Profile */}
                    <UserNav />
                </View>

            </View>
        </View>
    );
}
