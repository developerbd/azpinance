import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Image } from 'react-native';
import { User, Settings, LogOut, ChevronRight, X } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function UserNav() {
    const [visible, setVisible] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const fetchProfile = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase
                .from('users')
                .select('full_name, username, avatar_url, email')
                .eq('id', user.id)
                .single();
            setProfile({ ...data, email: user.email });
        }
        setLoading(false);
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.replace('/');
    };

    const openMenu = () => {
        setVisible(true);
        fetchProfile();
    };

    const displayName = profile?.full_name || profile?.username || profile?.email?.split('@')[0] || 'User';

    // Avatar Logic: Use custom URL or fallback to "Mysterious" Initials
    const avatarSource = profile?.avatar_url
        ? { uri: profile.avatar_url }
        : { uri: `https://ui-avatars.com/api/?name=${displayName}&background=0F172A&color=fff&size=128&bold=true` };

    return (
        <>
            <TouchableOpacity onPress={openMenu} className="ml-1">
                <Image
                    source={avatarSource}
                    className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                />
            </TouchableOpacity>

            <Modal
                transparent
                visible={visible}
                animationType="fade"
                onRequestClose={() => setVisible(false)}
            >
                <TouchableOpacity
                    className="flex-1 bg-black/20 dark:bg-black/50"
                    activeOpacity={1}
                    onPress={() => setVisible(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={{ marginTop: insets.top + 60, marginRight: 16 }}
                        className="ml-auto w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden"
                    >
                        {/* User Header */}
                        <View className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                            {loading ? (
                                <ActivityIndicator size="small" color="#64748b" />
                            ) : (
                                <View>
                                    <Text className="font-bold text-slate-900 dark:text-white text-base">{displayName}</Text>
                                    <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{profile?.email}</Text>
                                </View>
                            )}
                        </View>

                        {/* Menu Items */}
                        <View className="p-2">
                            <TouchableOpacity
                                onPress={() => { setVisible(false); router.push('/(drawer)/profile' as any); }}
                                className="flex-row items-center justify-between p-3 rounded-xl active:bg-slate-50 dark:active:bg-slate-800"
                            >
                                <View className="flex-row items-center gap-3">
                                    <User size={18} color="#64748b" />
                                    <Text className="font-medium text-slate-700 dark:text-slate-200">Profile</Text>
                                </View>
                                <ChevronRight size={14} color="#cbd5e1" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => { setVisible(false); router.push('/(drawer)/settings' as any); }}
                                className="flex-row items-center justify-between p-3 rounded-xl active:bg-slate-50 dark:active:bg-slate-800"
                            >
                                <View className="flex-row items-center gap-3">
                                    <Settings size={18} color="#64748b" />
                                    <Text className="font-medium text-slate-700 dark:text-slate-200">Settings</Text>
                                </View>
                                <ChevronRight size={14} color="#cbd5e1" />
                            </TouchableOpacity>
                        </View>

                        {/* Footer (Logout) */}
                        <View className="border-t border-slate-100 dark:border-slate-800 p-2">
                            <TouchableOpacity
                                onPress={handleSignOut}
                                className="flex-row items-center gap-3 p-3 rounded-xl active:bg-red-50 dark:active:bg-red-900/20"
                            >
                                <LogOut size={18} color="#ef4444" />
                                <Text className="font-medium text-red-600">Log out</Text>
                            </TouchableOpacity>
                        </View>

                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </>
    );
}
