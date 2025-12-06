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
        whatsapp_enabled: false,
        discord_enabled: false,
        discord_webhook_url: '',
        whatsapp_number: '',
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
                    whatsapp_enabled: data.whatsapp_enabled || false,
                    discord_enabled: data.discord_enabled || false,
                    discord_webhook_url: data.discord_webhook_url || '',
                    whatsapp_number: data.whatsapp_number || '',
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
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Discord Integration
                    </CardTitle>
                    <CardDescription>
                        Receive real-time alerts in your Discord server via Webhooks.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="discord-toggle" className="flex flex-col gap-1">
                            <span>Enable Discord Notifications</span>
                            <span className="font-normal text-xs text-muted-foreground">Send alerts to a Discord channel</span>
                        </Label>
                        <Switch
                            id="discord-toggle"
                            checked={settings.discord_enabled}
                            onCheckedChange={(checked) => setSettings(s => ({ ...s, discord_enabled: checked }))}
                        />
                    </div>
                    {settings.discord_enabled && (
                        <div className="space-y-2">
                            <Label>Webhook URL</Label>
                            <Input
                                placeholder="https://discord.com/api/webhooks/..."
                                value={settings.discord_webhook_url}
                                onChange={(e) => setSettings(s => ({ ...s, discord_webhook_url: e.target.value }))}
                            />
                            <p className="text-xs text-muted-foreground">
                                Go to Server Settings &gt; Integrations &gt; Webhooks to create one.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

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
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>WhatsApp Notifications</CardTitle>
                    <CardDescription>
                        Receive alerts directly on WhatsApp.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="whatsapp-toggle" className="flex flex-col gap-1">
                            <span>Enable WhatsApp Notifications</span>
                            <span className="font-normal text-xs text-muted-foreground">Send alerts to a Discord channel</span>
                        </Label>
                        <Switch
                            id="whatsapp-toggle"
                            checked={settings.whatsapp_enabled}
                            onCheckedChange={(checked) => setSettings(s => ({ ...s, whatsapp_enabled: checked }))}
                        />
                    </div>
                    {settings.whatsapp_enabled && (
                        <div className="space-y-2">
                            <Label>WhatsApp Number</Label>
                            <Input
                                placeholder="+88017..."
                                value={settings.whatsapp_number}
                                onChange={(e) => setSettings(s => ({ ...s, whatsapp_number: e.target.value }))}
                            />
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
