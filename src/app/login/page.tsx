'use client';

import { useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, Shield } from 'lucide-react';

function LoginForm() {
    const [identifier, setIdentifier] = useState(''); // Email or Username
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // MFA State
    const [showMfaChallenge, setShowMfaChallenge] = useState(false);
    const [mfaCode, setMfaCode] = useState('');
    const [mfaFactorId, setMfaFactorId] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        let emailToUse = identifier;

        // Simple check: if no '@', assume it's a username
        if (!identifier.includes('@')) {
            const { data: email, error: lookupError } = await supabase.rpc('get_email_by_username', {
                p_username: identifier,
            });

            if (lookupError || !email) {
                toast.error('Invalid username or password'); // Generic error for security
                setLoading(false);
                return;
            }
            emailToUse = email;
        }

        const { error } = await supabase.auth.signInWithPassword({
            email: emailToUse,
            password,
        });

        if (error) {
            toast.error(error.message);
            setLoading(false);
        } else {
            // Check for MFA enrollment
            const { data: factors } = await supabase.auth.mfa.listFactors();
            const totpFactor = factors?.all?.find(f => f.factor_type === 'totp' && f.status === 'verified');

            if (totpFactor) {
                setMfaFactorId(totpFactor.id);
                setShowMfaChallenge(true);
                setLoading(false);
            } else {
                toast.success('Logged in successfully');
                window.location.href = '/dashboard';
            }
        }
    };

    const handleMfaVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.mfa.challengeAndVerify({
            factorId: mfaFactorId,
            code: mfaCode,
        });

        if (error) {
            toast.error(error.message);
            setLoading(false);
        } else {
            toast.success('Logged in successfully');
            window.location.href = '/dashboard';
        }
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Sign in to your account to continue.</CardDescription>
            </CardHeader>
            <CardContent>
                {error === 'suspended' && (
                    <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">
                        Your account has been suspended. Please contact the administrator.
                    </div>
                )}
                <form onSubmit={showMfaChallenge ? handleMfaVerify : handleLogin} className="space-y-4">
                    {showMfaChallenge ? (
                        <div className="space-y-4">
                            <div className="flex flex-col items-center justify-center p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                                <Shield className="h-12 w-12 text-primary mb-2" />
                                <p className="text-sm text-center text-neutral-600">
                                    Enter the 6-digit code from your authenticator app.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mfa-code">Authentication Code</Label>
                                <Input
                                    id="mfa-code"
                                    type="text"
                                    placeholder="000000"
                                    value={mfaCode}
                                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="text-center text-lg tracking-widest"
                                    autoFocus
                                    required
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="identifier">Username or Email</Label>
                                <Input
                                    id="identifier"
                                    type="text"
                                    placeholder="username or name@example.com"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (showMfaChallenge ? 'Verifying...' : 'Signing in...') : (showMfaChallenge ? 'Verify' : 'Sign In')}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 justify-center">
                <Button variant="link" className="text-sm text-neutral-500" onClick={() => router.push('/forgot-password')}>
                    Forgot your password?
                </Button>
                <Button variant="link" className="text-sm text-neutral-500" onClick={() => router.push('/signup')}>
                    Don't have an account? Sign Up
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
