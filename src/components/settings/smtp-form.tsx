'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateSmtpSettings } from '@/app/actions/update-smtp-settings';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

interface SmtpFormProps {
    initialSettings: {
        host: string;
        port: number;
        user: string;
        from_email: string;
        sender_name?: string;
    };
    readOnly?: boolean;
}

export default function SmtpSettingsForm({ initialSettings, readOnly }: SmtpFormProps) {
    const [settings, setSettings] = useState(initialSettings);
    const [password, setPassword] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const result = await updateSmtpSettings({
            ...settings,
            sender_name: settings.sender_name || '',
            password: password || undefined, // Only send if changed
        });

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success('SMTP settings saved');
            setPassword(''); // Clear password field after save
        }
        setSaving(false);
    };

    if (readOnly) return <div className="text-muted-foreground">You do not have permission to view or edit SMTP settings.</div>;

    return (
        <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>SMTP Host</Label>
                    <Input
                        value={settings.host || ''}
                        onChange={(e) => setSettings({ ...settings, host: e.target.value })}
                        placeholder="smtp.gmail.com"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>Port</Label>
                    <Input
                        type="number"
                        value={settings.port}
                        onChange={(e) => setSettings({ ...settings, port: parseInt(e.target.value) })}
                        placeholder="587"
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Sender Name</Label>
                    <Input
                        value={settings.sender_name || ''}
                        onChange={(e) => setSettings({ ...settings, sender_name: e.target.value })}
                        placeholder="Biz Ad Finance"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>From Email</Label>
                    <Input
                        type="email"
                        value={settings.from_email || ''}
                        onChange={(e) => setSettings({ ...settings, from_email: e.target.value })}
                        placeholder="notifications@yourcompany.com"
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Username</Label>
                    <Input
                        value={settings.user || ''}
                        onChange={(e) => setSettings({ ...settings, user: e.target.value })}
                        placeholder="user@example.com"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label>App Password / API Key</Label>
                    <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="e.g. xxxx-xxxx-xxxx-xxxx (Gmail App Password)"
                    />
                    <p className="text-[0.8rem] text-muted-foreground">
                        For Gmail, use an <strong>App Password</strong>. Do not use your main login password.
                    </p>
                </div>
            </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" /> Save SMTP Settings
                </Button>
            </div>
        </form>
    );
}
