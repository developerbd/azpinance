import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { UserNav } from '@/components/layout/user-nav';
import { Clock } from '@/components/ui/clock';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { NotificationsBell } from '@/components/layout/notifications-bell';
import { Header } from '@/components/layout/header';
import Link from 'next/link';
import { Package2 } from 'lucide-react';

export default async function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch system settings for timezone
    // Fetch system settings for timezone and branding
    const { data: settings } = await supabase
        .from('system_settings')
        .select('timezone, company_name')
        .single();

    const timezone = settings?.timezone || 'UTC';
    const companyName = settings?.company_name || 'BizAd';

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <div className="hidden md:block">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    {/* Branding is now handled dynamically inside Sidebar */}
                    <div className="flex-1 p-4">
                        <Sidebar companyName={companyName} />
                    </div>
                </div>
            </div>
            <div className="flex flex-col h-screen overflow-hidden">
                <Header user={user} timezone={timezone} companyName={companyName} />
                <main className="flex-1 overflow-y-auto p-4 lg:p-6 pt-2 space-y-6 scrollbar-hide">
                    {children}
                </main>
            </div>
        </div>
    );
}
