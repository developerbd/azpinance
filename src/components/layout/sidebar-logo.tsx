'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LayoutDashboard } from 'lucide-react';

export function SidebarLogo() {
    const [appSettings, setAppSettings] = useState<{ company_name: string; company_logo_url: string | null }>({
        company_name: 'Finance',
        company_logo_url: null
    });
    const supabase = createClient();

    useEffect(() => {
        const fetchSettings = async () => {
            const { data: settings } = await supabase
                .from('system_settings')
                .select('company_name, company_logo_url')
                .single();

            if (settings) {
                setAppSettings({
                    company_name: settings.company_name || 'Finance',
                    company_logo_url: settings.company_logo_url
                });
            }
        };
        fetchSettings();
    }, []);

    return (
        <div className="flex items-center gap-2 px-4 pt-6 pb-2">
            {appSettings.company_logo_url ? (
                <img src={appSettings.company_logo_url} alt="Logo" className="h-8 w-8 object-contain" />
            ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <LayoutDashboard className="h-5 w-5" />
                </div>
            )}
            <span className="font-bold text-lg tracking-tight">{appSettings.company_name}</span>
        </div>
    );
}
