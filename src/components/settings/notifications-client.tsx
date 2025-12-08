'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getNotificationSettings } from '@/app/actions/get-notification-settings';
import { updateNotificationSettings } from '@/app/actions/update-notification-settings';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

export default function NotificationSettingsClient() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [settings, setSettings] = useState({
        email_enabled: false,
        email_address: '',
    });

    useEffect(() => {
        const loadSettings = async () => {
            const data = await getNotificationSettings();
            if (data.error) {
                toast.error(data.error);
            } else {
                setSettings({
                    email_enabled: data.email_enabled || false,
                    email_address: data.email_address || '',
                });
            }
            setLoading(false);
        };
        loadSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const result = await updateNotificationSettings(settings);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success('Notification settings saved');
        }
        setSaving(false);
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h3 className="text-lg font-medium">Notification Channels</h3>
                <p className="text-sm text-muted-foreground">
                    Configure how you want to receive alerts and notifications.
                </p>
                <p className="text-sm text-amber-600 mt-2">
                    💡 Discord notifications are now configured system-wide in Settings → Integrations
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Email Notifications</CardTitle>
                    <CardDescription>
                        Receive important updates via email.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="email-toggle" className="flex flex-col gap-1">
                            <span>Enable Email Notifications</span>
                        </Label>
                        <Switch
                            id="email-toggle"
                            checked={settings.email_enabled}
                            onCheckedChange={(checked) => setSettings(s => ({ ...s, email_enabled: checked }))}
                        />
                    </div>
                    {settings.email_enabled && (
                        <div className="space-y-2">
                            <Label>Email Address</Label>
                            <Input
                                type="email"
                                placeholder="you@example.com"
                                value={settings.email_address}
                                onChange={(e) => setSettings(s => ({ ...s, email_address: e.target.value }))}
                            />
                            <p className="text-xs text-muted-foreground">
                                Leave empty to use your account email
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" /> Save Changes
                </Button>
            </div>
        </div>
    );
}
