'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function IntegrationsForm({ settings }: { settings: any }) {
    const [loading, setLoading] = useState(false);
    const supabase = createClient();
    const [formData, setFormData] = useState({
        gtm_id: settings?.gtm_id || '',
        pixel_id: settings?.pixel_id || '',
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
            <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save Integrations'}
            </Button>
        </div>
    );
}
