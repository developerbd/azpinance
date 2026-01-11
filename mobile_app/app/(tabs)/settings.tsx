import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function SettingsScreen() {
    const router = useRouter();

    async function signOut() {
        await supabase.auth.signOut({ scope: 'local' });
        router.replace('/');
    }

    return (
        <View className="flex-1 p-6 bg-gray-50">
            <Text className="text-2xl font-bold mb-6 text-gray-900">Menu</Text>

            <TouchableOpacity
                onPress={signOut}
                className="bg-white p-4 rounded-xl border border-gray-200"
            >
                <Text className="text-red-500 font-bold text-center">Sign Out</Text>
            </TouchableOpacity>
        </View>
    );
}
