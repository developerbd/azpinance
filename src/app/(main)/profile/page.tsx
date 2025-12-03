'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FileUpload } from '@/components/file-upload';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Shield, Check, X, Smartphone } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";


export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string[]>([]);
    const [headerPreference, setHeaderPreference] = useState('avatar_only');
    const [loading, setLoading] = useState(false);

    // Password Change State
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    // 2FA State
    const [mfaFactors, setMfaFactors] = useState<any[]>([]);
    const [isMfaEnabled, setIsMfaEnabled] = useState(false);
    const [showMfaDialog, setShowMfaDialog] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [mfaSecret, setMfaSecret] = useState('');
    const [mfaFactorId, setMfaFactorId] = useState('');
    const [mfaLoading, setMfaLoading] = useState(false);

    const [mfaError, setMfaError] = useState('');
    const [showDisableDialog, setShowDisableDialog] = useState(false);

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        fetchProfile();
        fetchMfaStatus();
    }, []);

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUser(user);
            // Fetch profile details from public.users
            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile) {
                setFullName(profile.full_name || '');
                setUsername(profile.username || '');
                setAvatarUrl(profile.avatar_url ? [profile.avatar_url] : []);
                setHeaderPreference(profile.header_display_preference || 'avatar_only');
            }
        }
    };

    const fetchMfaStatus = async () => {
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error) {
            console.error('Error fetching MFA factors:', error);
            return;
        }

        setMfaFactors(data.all);
        const totpFactor = data.all.find(factor => factor.factor_type === 'totp' && factor.status === 'verified');
        setIsMfaEnabled(!!totpFactor);
    };

    const handleEnableMFA = async () => {
        setMfaLoading(true);
        setMfaError('');
        try {
            // Cleanup any unverified factors first
            const { data: factors } = await supabase.auth.mfa.listFactors();
            if (factors?.all) {
                const unverifiedFactors = factors.all.filter(f => f.factor_type === 'totp' && f.status === 'unverified');
                for (const factor of unverifiedFactors) {
                    await supabase.auth.mfa.unenroll({ factorId: factor.id });
                }
            }

            const { data, error } = await supabase.auth.mfa.enroll({
                factorType: 'totp',
            });

            if (error) throw error;

            setMfaFactorId(data.id);
            setMfaSecret(data.totp.secret);

            // Generate QR Code
            const QRCode = (await import('qrcode')).default;
            const qrUrl = await QRCode.toDataURL(data.totp.uri);
            setQrCodeUrl(qrUrl);
            setShowMfaDialog(true);

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setMfaLoading(false);
        }
    };

    const handleVerifyMFA = async () => {
        setMfaLoading(true);
        setMfaError('');
        try {
            const { data, error } = await supabase.auth.mfa.challengeAndVerify({
                factorId: mfaFactorId,
                code: verificationCode,
            });

            if (error) throw error;

            toast.success('Two-Factor Authentication enabled successfully');
            setShowMfaDialog(false);
            setVerificationCode('');
            fetchMfaStatus();

        } catch (error: any) {
            setMfaError(error.message);
        } finally {
            setMfaLoading(false);
        }
    };

    const handleDisableMFA = async () => {
        setShowDisableDialog(true);
    };

    const confirmDisableMFA = async () => {
        setShowDisableDialog(false);

        setMfaLoading(true);
        try {
            // Unenroll all verified TOTP factors
            const verifiedFactors = mfaFactors.filter(f => f.factor_type === 'totp' && f.status === 'verified');

            for (const factor of verifiedFactors) {
                const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
                if (error) throw error;
            }

            toast.success('Two-Factor Authentication disabled');
            fetchMfaStatus();

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setMfaLoading(false);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        console.log("Starting profile update...");

        const updates = {
            full_name: fullName,
            username: username,
            avatar_url: avatarUrl[0] || null,
            header_display_preference: headerPreference,
            updated_at: new Date().toISOString(),
        };

        try {
            const { error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;

            toast.success('Profile updated successfully');
            router.refresh();
        } catch (error: any) {
            console.error("Profile update error:", error);
            toast.error(error.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setPasswordLoading(true);
        const { error } = await supabase.auth.updateUser({ password: password });

        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Password updated successfully');
            setPassword('');
            setConfirmPassword('');
        }
        setPasswordLoading(false);
    };

    return (
        <div className="container mx-auto py-10 max-w-2xl">
            <h1 className="mb-6 text-3xl font-bold">My Profile</h1>

            <div className="grid gap-6">
                {/* Profile Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>Update your personal details.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input value={user?.email || ''} disabled />
                            </div>
                            <div className="space-y-2">
                                <Label>Username</Label>
                                <Input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="username"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Your Name"
                                />
                            </div>
                            <div className="space-y-4">
                                <Label>Avatar</Label>
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-20 w-20">
                                        <AvatarImage src={avatarUrl[0]} alt={fullName || username || 'User'} />
                                        <AvatarFallback className="bg-muted">
                                            <User className="h-10 w-10 text-muted-foreground" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <FileUpload
                                            bucket="avatars"
                                            existingFiles={avatarUrl}
                                            onUploadComplete={setAvatarUrl}
                                            maxFiles={1}
                                        />
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Upload a new avatar or remove the current one.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4">
                                <Label>Header Display Preference</Label>
                                <RadioGroup value={headerPreference} onValueChange={setHeaderPreference}>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="avatar_only" id="r1" />
                                        <Label htmlFor="r1">Avatar Only</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="avatar_full_name" id="r2" />
                                        <Label htmlFor="r2">Avatar & Full Name</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="full_name_only" id="r3" />
                                        <Label htmlFor="r3">Full Name Only</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="avatar_username" id="r4" />
                                        <Label htmlFor="r4">Avatar & Username</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <Button type="submit" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Password Change */}
                <Card>
                    <CardHeader>
                        <CardTitle>Change Password</CardTitle>
                        <CardDescription>Update your password securely.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div className="space-y-2">
                                <Label>New Password</Label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="New Password"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Confirm Password</Label>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm New Password"
                                />
                            </div>
                            <Button type="submit" disabled={passwordLoading} variant="outline">
                                {passwordLoading ? 'Updating...' : 'Update Password'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Two-Factor Authentication */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Two-Factor Authentication (2FA)
                        </CardTitle>
                        <CardDescription>
                            Add an extra layer of security to your account using an authenticator app.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {isMfaEnabled ? (
                                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-medium">
                                        <Check className="h-4 w-4" />
                                        Enabled
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full text-sm font-medium">
                                        <X className="h-4 w-4" />
                                        Disabled
                                    </div>
                                )}
                            </div>

                            {isMfaEnabled ? (
                                <Button
                                    variant="destructive"
                                    onClick={handleDisableMFA}
                                    disabled={mfaLoading}
                                >
                                    {mfaLoading ? 'Disabling...' : 'Disable 2FA'}
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleEnableMFA}
                                    disabled={mfaLoading}
                                >
                                    {mfaLoading ? 'Setting up...' : 'Enable 2FA'}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* MFA Setup Dialog */}
                <Dialog open={showMfaDialog} onOpenChange={setShowMfaDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
                            <DialogDescription>
                                Scan the QR code below with your authenticator app (like Google Authenticator or Authy).
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col items-center gap-4 py-4">
                            {qrCodeUrl && (
                                <div className="border p-2 rounded-lg bg-white">
                                    <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                                </div>
                            )}

                            <div className="text-sm text-center text-muted-foreground">
                                <p>Or enter this code manually:</p>
                                <code className="bg-muted px-2 py-1 rounded mt-1 block select-all font-mono">
                                    {mfaSecret}
                                </code>
                            </div>

                            <div className="w-full space-y-2">
                                <Label htmlFor="verification-code">Verification Code</Label>
                                <Input
                                    id="verification-code"
                                    placeholder="Enter 6-digit code"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="text-center text-lg tracking-widest"
                                />
                            </div>

                            {mfaError && (
                                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                                    <p className="font-medium">Error</p>
                                    <p>{mfaError}</p>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowMfaDialog(false)}>Cancel</Button>
                            <Button onClick={handleVerifyMFA} disabled={verificationCode.length !== 6 || mfaLoading}>
                                {mfaLoading ? 'Verifying...' : 'Verify & Enable'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Disable MFA Confirmation Dialog */}
                <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Disable Two-Factor Authentication?</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to disable 2FA? This will lower your account security.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowDisableDialog(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={confirmDisableMFA} disabled={mfaLoading}>
                                {mfaLoading ? 'Disabling...' : 'Disable 2FA'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
