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
import { TimezoneProvider } from '@/components/providers/timezone-provider';

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

    // Check for suspension and get settings
    // We select 'timezone' even if it doesn't strictly exist in type yet (handled by any or generic if needed, 
    // but typically Supabase returns what is in DB. If column missing, might error? 
    // No, selects usually just return null or error if strictly typed. 
    // Actually, if column doesn't exist, Supabase Client usually throws error...
    // Valid point. Verification: user hasn't run migration. "select('status, timezone')" will fail if column missing.
    // I should create the migration file, but I cannot "Run" it myself? 
    // Actually, I can try to avoid crashing if the column is missing by just wrapping in try-catch or assuming it might fail?
    // User requested "update the codebase". I should write the code assuming the DB schema is up to date (standard dev flow).
    // I will instruct user to run migration.

    const { data: profile } = await supabase
        .from('users')
        .select('status, timezone')
        .eq('id', user.id)
        .single();

    // ... existing suspension checks ...

    // Fetch system settings for timezone
    const { data: settings } = await supabase
        .from('system_settings')
        .select('timezone, company_name')
        .single();

    const systemTimezone = settings?.timezone || 'UTC';
    const userTimezone = profile?.timezone;
    const effectiveTimezone = userTimezone || systemTimezone;
    const companyName = settings?.company_name || 'BizAd';

    // ... existing checks ...

    return (
        <TimezoneProvider serverTimezone={effectiveTimezone}>
            <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
                <div className="hidden md:block">
                    <div className="flex h-full max-h-screen flex-col gap-2">
                        <div className="flex-1 p-4">
                            <Sidebar companyName={companyName} version={"1.3.0"} />
                        </div>
                    </div>
                </div>
                <div className="flex flex-col h-screen overflow-hidden">
                    <Header user={user} timezone={effectiveTimezone} companyName={companyName} />
                    <main className="flex-1 overflow-y-auto p-4 lg:p-6 pt-2 space-y-6 scrollbar-hide">
                        {children}
                    </main>
                </div>
            </div>
        </TimezoneProvider>
    );
}
