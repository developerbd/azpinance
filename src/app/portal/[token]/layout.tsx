import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Supplier Portal',
    description: 'View your transaction history and payments',
    robots: 'noindex, nofollow', // Important: prevent indexing
}

import { createAdminClient } from '@/lib/supabase/admin'
import { Zap } from 'lucide-react'

export default async function PortalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Fetch branding settings using admin client (public portal access)
    const supabase = createAdminClient()
    const { data: settings } = await supabase
        .from('system_settings')
        .select('company_name, company_logo_url')
        .single()

    const companyName = settings?.company_name || 'My Agency'

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <header className="border-b bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    {/* Left: Company Branding */}
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20 ring-1 ring-white/20">
                            <Zap className="h-6 w-6 text-primary-foreground fill-current" />
                        </div>
                        <div>
                            <h1 className="font-bold text-xl tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                                {companyName}
                            </h1>
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Finance OS</p>
                        </div>
                    </div>

                    {/* Right: Portal Label */}
                    <div className="text-sm font-medium text-muted-foreground bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                        Supplier Portal
                    </div>
                </div>
            </header>
            <main className="container mx-auto px-4 py-8">
                {children}
            </main>
            <footer className="border-t bg-white dark:bg-slate-800 py-6 mt-auto">
                <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} {companyName}. All rights reserved.
                </div>
            </footer>
        </div>
    )
}
