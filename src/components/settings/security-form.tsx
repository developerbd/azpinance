'use client';

import { useState } from 'react';
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
