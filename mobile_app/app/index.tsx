import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';


export default function LoginScreen() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showMfa, setShowMfa] = useState(false);
    const [mfaCode, setMfaCode] = useState('');
    const [mfaFactorId, setMfaFactorId] = useState('');
    const router = useRouter();

    async function signIn() {
        if (!identifier || !password) {
            Alert.alert('Error', 'Please enter both username/email and password.');
            return;
        }

        setLoading(true);

        let emailToUse = identifier;

        // 1. Username Resolution (RPC)
        if (!identifier.includes('@')) {
            const { data: email, error: lookupError } = await supabase.rpc('get_email_by_username', {
                p_username: identifier,
            });

            if (lookupError || !email) {
                setLoading(false);
                Alert.alert('Error', 'Invalid username or password');
                return;
            }
            emailToUse = email;
        }

        // 2. Authenticate
        const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
            email: emailToUse,
            password,
        });

        if (authError) {
            setLoading(false);
            Alert.alert('Error', authError.message);
            return;
        }

        if (!session?.user) {
            setLoading(false);
            Alert.alert('Error', 'No session created.');
            return;
        }

        // 3. Post-Login Security Check
        const { data: userProfile } = await supabase
            .from('users')
            .select('status')
            .eq('id', session.user.id)
            .single();

        if (userProfile) {
            if (userProfile.status === 'suspended') {
                await supabase.auth.signOut({ scope: 'local' });
                setLoading(false);
                Alert.alert('Account Suspended', 'Your account has been suspended.');
                return;
            }
            if (userProfile.status === 'pending') {
                await supabase.auth.signOut({ scope: 'local' });
                setLoading(false);
                Alert.alert('Account Under Review', 'Your account is waiting approval.');
                return;
            }
        }

        // 4. MFA Check
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totpFactor = factors?.all?.find(f => f.factor_type === 'totp' && f.status === 'verified');

        if (totpFactor) {
            setMfaFactorId(totpFactor.id);
            setShowMfa(true);
            setLoading(false);
            return;
        }

        setLoading(false);
        router.replace('/(tabs)');
    }

    async function verifyMfa() {
        if (mfaCode.length < 6) {
            Alert.alert('Error', 'Please enter a valid 6-digit code.');
            return;
        }
        setLoading(true);

        const { error } = await supabase.auth.mfa.challengeAndVerify({
            factorId: mfaFactorId,
            code: mfaCode,
        });

        setLoading(false);

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            router.replace('/(drawer)/dashboard');
        }
    }

    return (
        <View className="flex-1 justify-center items-center bg-gray-50 p-6">
            <View className="w-full max-w-sm bg-white p-6 rounded-xl shadow-sm border border-gray-200">

                {!showMfa ? (
                    <>
                        <Text className="text-2xl font-bold mb-2 text-center text-gray-900">Welcome Back</Text>
                        <Text className="text-sm text-center text-gray-500 mb-8">Sign in to your account</Text>

                        <Text className="mb-2 text-sm font-medium text-gray-700">Username or Email</Text>
                        <TextInput
                            className="w-full border border-gray-300 rounded-lg p-3 mb-4 bg-white text-gray-900"
                            placeholder="username or name@example.com"
                            value={identifier}
                            onChangeText={setIdentifier}
                            autoCapitalize="none"
                        />

                        <Text className="mb-2 text-sm font-medium text-gray-700">Password</Text>
                        <TextInput
                            className="w-full border border-gray-300 rounded-lg p-3 mb-6 bg-white text-gray-900"
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <TouchableOpacity
                            className={`w-full p-4 rounded-lg items-center ${loading ? 'bg-gray-400' : 'bg-blue-600'}`}
                            onPress={signIn}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-base">Sign In</Text>}
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <Text className="text-2xl font-bold mb-2 text-center text-gray-900">MFA Verification</Text>
                        <Text className="text-sm text-center text-gray-500 mb-8">Enter the code from your authenticator app</Text>

                        <TextInput
                            className="w-full border border-gray-300 rounded-lg p-4 mb-6 bg-white text-gray-900 text-center text-2xl tracking-widest"
                            placeholder="000 000"
                            value={mfaCode}
                            onChangeText={setMfaCode}
                            keyboardType="number-pad"
                            maxLength={6}
                        />

                        <TouchableOpacity
                            className={`w-full p-4 rounded-lg items-center ${loading ? 'bg-gray-400' : 'bg-blue-600'}`}
                            onPress={verifyMfa}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-base">Verify Code</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowMfa(false)} className="mt-4 items-center">
                            <Text className="text-gray-500">Back to Login</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );
}
