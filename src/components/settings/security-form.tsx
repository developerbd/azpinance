'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { purgeCache } from '@/app/actions/purge-cache';

export default function SecuritySettingsForm({ settings }: { settings: any }) {
    const [loading, setLoading] = useState(false);
    const supabase = createClient();
    const [formData, setFormData] = useState({
        security_allowed_ips: settings?.security_allowed_ips || '',
        security_blocked_ips: settings?.security_blocked_ips || '',
    });

    const handleSave = async () => {
        setLoading(true);
        const { error } = await supabase
            .from('system_settings')
            .update(formData)
            .eq('id', 1);

        if (error) {
            toast.error('Failed to save security settings');
        } else {
            toast.success('Security settings saved');
        }
        setLoading(false);
    };

    const [purging, setPurging] = useState(false);
    const [gracePeriod, setGracePeriod] = useState<{ days: number, hours: number, minutes: number } | null>(null);
    const [isGracePeriodExpired, setIsGracePeriodExpired] = useState(false);
    const [showTimer, setShowTimer] = useState(false);

    // Initial fetch for grace period
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        const checkGracePeriod = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch user profile for role and grace period start
            const { data: profile } = await supabase.from('users').select('role, admin_grace_period_start, is_2fa_exempt').eq('id', user.id).single();
            if (!profile || profile.role !== 'admin') {
                setShowTimer(false);
                return;
            }

            // Check if user is exempt from 2FA
            if (profile.is_2fa_exempt) {
                setShowTimer(false);
                return;
            }

            // Check if 2FA is enabled
            const { data: { user: authUser } } = await supabase.auth.getUser(); // re-fetch for factors
            const has2FA = authUser?.factors?.some(f => f.status === 'verified');

            if (has2FA) {
                setShowTimer(false);
                return;
            }

            if (profile.admin_grace_period_start) {
                setShowTimer(true);
                const start = new Date(profile.admin_grace_period_start);
                const now = new Date();
                const expiry = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
                const diff = expiry.getTime() - now.getTime();

                if (diff <= 0) {
                    setIsGracePeriodExpired(true);
                } else {
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    setGracePeriod({ days, hours, minutes });
                }
            }
        };
        checkGracePeriod();
    }, []);

    const handlePurgeCache = async () => {
        setPurging(true);
        const { success, error } = await purgeCache();
        if (success) {
            toast.success('System cache purged successfully');
        } else {
            toast.error(error || 'Failed to purge cache');
        }
        setPurging(false);
    };

    return (
        <div className="space-y-4">
            {mounted && showTimer && (
                <div className={`p-4 rounded-md border mb-6 ${isGracePeriodExpired ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                    <h3 className="font-semibold flex items-center gap-2">
                        {isGracePeriodExpired ? 'Action Required: Grace Period Expired' : 'Action Required: Enable 2FA'}
                    </h3>
                    <p className="text-sm mt-1">
                        {isGracePeriodExpired
                            ? 'Your 7-day grace period to enable 2FA has expired. You may be demoted to Supervisor shortly.'
                            : 'You must enable Two-Factor Authentication to maintain your Admin status.'
                        }
                    </p>
                    {!isGracePeriodExpired && gracePeriod && (
                        <div className="mt-3 font-mono text-xl font-bold">
                            {gracePeriod.days}d : {gracePeriod.hours}h : {gracePeriod.minutes}m Remaining
                        </div>
                    )}
                </div>
            )}
            <div className="grid gap-2">
                <Label htmlFor="allowedIPs">Allowed IPs (Comma separated)</Label>
                <Textarea
                    id="allowedIPs"
                    value={formData.security_allowed_ips}
                    onChange={(e) => setFormData({ ...formData, security_allowed_ips: e.target.value })}
                    placeholder="192.168.1.1, 10.0.0.0/24"
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="blockedIPs">Blocked IPs (Comma separated)</Label>
                <Textarea
                    id="blockedIPs"
                    value={formData.security_blocked_ips}
                    onChange={(e) => setFormData({ ...formData, security_blocked_ips: e.target.value })}
                />
            </div>
            <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save Security Settings'}
            </Button>

            <div className="pt-6 border-t">
                <h3 className="text-lg font-medium mb-2">System Maintenance</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Clear the application cache to ensure all users see the latest data.
                </p>
                <Button variant="destructive" onClick={handlePurgeCache} disabled={purging}>
                    {purging ? 'Purging...' : 'Purge System Cache'}
                </Button>
            </div>
        </div>
    );
}
