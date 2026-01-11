import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator, Animated, Platform } from 'react-native';
import { Bell, X, CheckCircle, AlertTriangle, AlertCircle, Info, ExternalLink } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    link?: string;
    read: boolean;
    created_at: string;
}

export function NotificationsBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const insets = useSafeAreaInsets();

    // Toast State
    const [toast, setToast] = useState<Notification | null>(null);
    const toastOpacity = useRef(new Animated.Value(0)).current;

    const fetchNotifications = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (data) {
            setNotifications(data as Notification[]);
            setUnreadCount(data.filter((n: any) => !n.read).length);
        }
        setLoading(false);
    };

    // Realtime Subscription
    useEffect(() => {
        fetchNotifications();

        const channel = supabase
            .channel('notifications_bell')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                },
                async (payload) => {
                    // Fetch user to confirm ownership (or trust RLS if enabled)
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user && payload.new.user_id === user.id) {
                        const newNote = payload.new as Notification;
                        setNotifications(prev => [newNote, ...prev]);
                        setUnreadCount(prev => prev + 1);
                        showToast(newNote);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Toast Animation Logic
    const showToast = (note: Notification) => {
        setToast(note);
        Animated.sequence([
            Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.delay(4000),
            Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true })
        ]).start(() => setToast(null));
    };

    const markAsRead = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        await supabase.from('notifications').update({ read: true }).eq('id', id);
    };

    const markAllAsRead = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle size={16} color="#16a34a" />;
            case 'warning': return <AlertTriangle size={16} color="#ca8a04" />;
            case 'error': return <AlertCircle size={16} color="#dc2626" />;
            default: return <Info size={16} color="#2563eb" />;
        }
    };

    return (
        <>
            {/* 1. Bell Icon Trigger */}
            <TouchableOpacity
                onPress={() => { setModalVisible(true); fetchNotifications(); }}
                className="p-2 relative active:bg-slate-50 rounded-full"
            >
                <Bell size={20} color="#475569" strokeWidth={2} />
                {unreadCount > 0 && (
                    <View className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white ring-2 ring-white" />
                )}
            </TouchableOpacity>

            {/* 2. Modal (Popover) */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    className="flex-1 bg-black/20"
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={{ marginTop: insets.top + 60, marginRight: 16 }}
                        className="ml-auto w-[85%] max-w-[320px] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden"
                    >
                        <View className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex-row items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                            <Text className="font-bold text-slate-800 dark:text-slate-200 text-[15px]">Notifications</Text>
                            <View className="flex-row items-center gap-3">
                                {unreadCount > 0 && (
                                    <TouchableOpacity onPress={markAllAsRead}>
                                        <Text className="text-xs font-medium text-blue-600 dark:text-blue-400">Mark all read</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={10}>
                                    <X size={18} color="#94a3b8" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <ScrollView className="max-h-[350px]">
                            {loading && notifications.length === 0 ? (
                                <View className="p-8 items-center">
                                    <ActivityIndicator size="small" color="#64748b" />
                                </View>
                            ) : notifications.length === 0 ? (
                                <View className="p-8 items-center justify-center">
                                    <Bell size={32} color="#e2e8f0" />
                                    <Text className="text-sm text-slate-400 mt-2 font-medium">No notifications</Text>
                                </View>
                            ) : (
                                notifications.map((item, index) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        onPress={() => markAsRead(item.id)}
                                        className={`px-4 py-3 flex-row gap-3 ${item.read ? 'bg-white dark:bg-slate-900' : 'bg-blue-50/40 dark:bg-blue-900/20'} ${index !== notifications.length - 1 ? 'border-b border-slate-50 dark:border-slate-800' : ''}`}
                                    >
                                        <View className="mt-0.5">{getIcon(item.type)}</View>
                                        <View className="flex-1">
                                            <View className="flex-row justify-between items-start mb-0.5">
                                                <Text className={`text-[13px] ${item.read ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-900 dark:text-white font-bold'}`}>
                                                    {item.title}
                                                </Text>
                                                <Text className="text-[10px] text-slate-400 ml-2 mt-0.5">
                                                    {formatTimeAgo(item.created_at)}
                                                </Text>
                                            </View>
                                            <Text className="text-[12px] text-slate-500 dark:text-slate-400 leading-tight">
                                                {item.message}
                                            </Text>
                                        </View>
                                        {!item.read && <View className="self-center w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>

                        <View className="border-t border-slate-100 dark:border-slate-800 p-2">
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                className="w-full py-2 items-center justify-center active:bg-slate-50 dark:active:bg-slate-800 rounded-lg"
                            >
                                <Text className="text-xs font-bold text-slate-500 dark:text-slate-400">Close</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* 3. In-App Toast Notification Banner */}
            {toast && (
                <Animated.View
                    style={{
                        opacity: toastOpacity,
                        top: insets.top + 70, // Position below header
                        transform: [{ translateY: toastOpacity.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }]
                    }}
                    className="absolute left-4 right-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl shadow-lg rounded-2xl border border-slate-200 dark:border-slate-700 p-4 z-[200] flex-row gap-3 items-start"
                >
                    <View className="mt-0.5">{getIcon(toast.type)}</View>
                    <View className="flex-1">
                        <Text className="font-bold text-slate-900 dark:text-white text-sm">{toast.title}</Text>
                        <Text className="text-slate-600 dark:text-slate-300 text-xs mt-0.5 leading-snug">{toast.message}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setToast(null)} className="p-1">
                        <X size={14} color="#94a3b8" />
                    </TouchableOpacity>
                </Animated.View>
            )}
        </>
    );
}
