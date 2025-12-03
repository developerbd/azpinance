'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function GeneralSettingsForm({ settings, readOnly = false }: { settings: any, readOnly?: boolean }) {
    const [loading, setLoading] = useState(false);
    const supabase = createClient();
    const [formData, setFormData] = useState({
        company_name: settings?.company_name || '',
        company_logo_url: settings?.company_logo_url || '',
        company_email: settings?.company_email || '',
        company_address: settings?.company_address || '',
        timezone: settings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `company-logo-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, file);

        if (uploadError) {
            toast.error('Failed to upload logo');
            setLoading(false);
            return;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

        setFormData(prev => ({ ...prev, company_logo_url: publicUrl }));
        toast.success('Logo uploaded successfully');
        setLoading(false);
    };

    const handleSave = async () => {
        setLoading(true);
        const { error } = await supabase
            .from('system_settings')
            .update(formData)
            .eq('id', 1);

        if (error) {
            toast.error('Failed to save settings');
        } else {
            toast.success('Settings saved successfully');
        }
        setLoading(false);
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                    id="companyName"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    disabled={readOnly}
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="companyEmail">Company Email</Label>
                <Input
                    id="companyEmail"
                    value={formData.company_email}
                    onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                    disabled={readOnly}
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="companyLogo">Logo</Label>
                <div className="flex gap-2 items-center">
                    <Input
                        id="companyLogo"
                        value={formData.company_logo_url}
                        onChange={(e) => setFormData({ ...formData, company_logo_url: e.target.value })}
                        disabled={readOnly}
                        placeholder="https://example.com/logo.png"
                        className="flex-1"
                    />
                    {!readOnly && (
                        <>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileUpload}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={loading}
                            >
                                Upload
                            </Button>
                        </>
                    )}
                </div>
                <p className="text-xs text-muted-foreground">
                    Provide a URL or upload an image.
                </p>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="companyAddress">Address</Label>
                <Textarea
                    id="companyAddress"
                    value={formData.company_address}
                    onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                    disabled={readOnly}
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                    value={formData.timezone}
                    onValueChange={(val) => setFormData({ ...formData, timezone: val })}
                    disabled={readOnly}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select Timezone" />
                    </SelectTrigger>
                    <SelectContent>
                        {Intl.supportedValuesOf('timeZone').map((tz) => (
                            <SelectItem key={tz} value={tz}>
                                {tz}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                    This timezone will be used for all application dates and times.
                </p>
            </div>
            {!readOnly && (
                <Button onClick={handleSave} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                </Button>
            )}
        </div>
    );
}
