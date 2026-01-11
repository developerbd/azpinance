'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [signupEnabled, setSignupEnabled] = useState(true);
    const [checkingSettings, setCheckingSettings] = useState(true);
    const [successMessage, setSuccessMessage] = useState('');

    const router = useRouter();
    const supabase = createClient();

    // Fetch Signup Settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { getSignupSettings } = await import('@/app/actions/get-signup-settings');
                const { signup_enabled } = await getSignupSettings();
                setSignupEnabled(signup_enabled);
            } catch (error) {
                console.error('Failed to fetch settings', error);
            } finally {
                setCheckingSettings(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }

        setLoading(true);

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
                data: {
                    username,
                },
            },
        });

        if (error) {
            toast.error(error.message);
        } else {
            // Force sign out just in case auto-login happened, so they don't hit dashboard with pending error immediately
            await supabase.auth.signOut();

            setSuccessMessage('Your account has been created and is currently pending administrator approval. You will be able to log in once your account is approved.');
            toast.success('Account created successfully');
        }
        setLoading(false);
    };

    if (checkingSettings) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
                <div>Loading...</div>
            </div>
        );
    }

    if (!signupEnabled) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Sign Up Closed</CardTitle>
                        <CardDescription>New account registration is currently disabled by the administrator.</CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-center">
                        <Button variant="link" onClick={() => router.push('/login')}>
                            Back to Login
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if (successMessage) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-green-600">Registration Successful</CardTitle>
                        <CardDescription>
                            {successMessage}
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-center">
                        <Button onClick={() => router.push('/login')}>
                            Back to Login
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Create Account</CardTitle>
                    <CardDescription>Enter your details to create a new account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                placeholder="johndoe"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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
                                    minLength={6}
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
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Creating account...' : 'Sign Up'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button variant="link" className="text-sm text-neutral-500" onClick={() => router.push('/login')}>
                        Already have an account? Sign In
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
