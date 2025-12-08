'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function IntegrationsForm({ settings }: { settings: any }) {
    const [loading, setLoading] = useState(false);
    const supabase = createClient();
    const [formData, setFormData] = useState({
        gtm_id: settings?.gtm_id || '',
        pixel_id: settings?.pixel_id || '',
        discord_enabled: settings?.discord_enabled || false,
        discord_webhook_url: settings?.discord_webhook_url || '',
    });

    const handleSave = async () => {
        setLoading(true);
        const { error } = await supabase
            .from('system_settings')
            .update(formData)
            .eq('id', 1);

        if (error) {
            toast.error('Failed to save integrations');
        } else {
            toast.success('Integrations saved');
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium mb-4">Analytics</h3>
                <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="gtmId">Google Tag Manager ID</Label>
                        <Input
                            id="gtmId"
                            value={formData.gtm_id}
                            onChange={(e) => setFormData({ ...formData, gtm_id: e.target.value })}
                            placeholder="GTM-XXXXXX"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="pixelId">Meta Pixel ID</Label>
                        <Input
                            id="pixelId"
                            value={formData.pixel_id}
                            onChange={(e) => setFormData({ ...formData, pixel_id: e.target.value })}
                            placeholder="1234567890"
                        />
                    </div>
                </div>
            </div>

            <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Discord Notifications</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="discord-enabled">Enable Discord Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                                Send all admin notifications to Discord
                            </p>
                        </div>
                        <Switch
                            id="discord-enabled"
                            checked={formData.discord_enabled}
                            onCheckedChange={(checked) => setFormData({ ...formData, discord_enabled: checked })}
                        />
                    </div>
                    {formData.discord_enabled && (
                        <div className="grid gap-2">
                            <Label htmlFor="discordWebhook">Discord Webhook URL</Label>
                            <Input
                                id="discordWebhook"
                                value={formData.discord_webhook_url}
                                onChange={(e) => setFormData({ ...formData, discord_webhook_url: e.target.value })}
                                placeholder="https://discord.com/api/webhooks/..."
                                type="url"
                            />
                            <p className="text-xs text-muted-foreground">
                                Get your webhook URL from Discord: Server Settings → Integrations → Webhooks
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save Integrations'}
            </Button>
        </div>
    );
}
