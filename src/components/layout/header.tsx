'use client';

import { usePathname } from 'next/navigation';
import { UserNav } from '@/components/layout/user-nav';
import { Clock } from '@/components/ui/clock';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { NotificationsBell } from '@/components/layout/notifications-bell';
import { Search, ChevronRight, Home, Crown, ShieldCheck, User as UserIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { MobileNav } from '@/components/layout/mobile-nav';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface HeaderProps {
    user: User;
    timezone: string;
    companyName?: string;
}

export function Header({ user, timezone, companyName }: HeaderProps) {
    const pathname = usePathname();
    const paths = pathname.split('/').filter(Boolean);
    const [userDetails, setUserDetails] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        const fetchRole = async () => {
            const { data } = await supabase.from('users').select('role').eq('id', user.id).single();
            if (data) setUserDetails(data);
        };
        fetchRole();
    }, [user.id]);

    return (
        <header className="sticky top-0 z-50 flex h-14 md:h-16 items-center gap-4 px-4 md:px-6 transition-all">
            {/* Mobile Nav Trigger */}
            <div className="flex flex-1 items-center gap-4 bg-background/60 backdrop-blur-xl border border-border/40 dark:border-white/10 shadow-sm rounded-full px-4 py-2 mt-4 mx-2">
                {/* Mobile Nav Trigger */}
                <MobileNav companyName={companyName} />

                {/* Mobile Clock - Left side next to menu */}
                <Clock timezone={timezone} className="md:hidden items-start mr-0 ml-2" />

                {/* Breadcrumbs */}
                <nav className="hidden md:flex items-center text-xs text-muted-foreground/70 font-medium tracking-wide uppercase">
                    <Link href="/dashboard" className="flex items-center hover:text-primary transition-colors">
                        <Home className="h-3.5 w-3.5" />
                    </Link>
                    {paths.map((path, index) => {
                        const href = `/${paths.slice(0, index + 1).join('/')}`;
                        const isLast = index === paths.length - 1;
                        const title = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');

                        return (
                            <div key={path} className="flex items-center">
                                <ChevronRight className="h-3 w-3 mx-2 opacity-30" />
                                {isLast ? (
                                    <span className="text-foreground font-semibold">{title}</span>
                                ) : (
                                    <Link href={href} className="hover:text-primary transition-colors">
                                        {title}
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className="flex-1" />

                {/* Search Bar */}
                <div className="relative hidden md:block w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                    <Input
                        type="search"
                        placeholder="Search..."
                        className="w-full h-8 bg-muted/30 pl-9 rounded-full border-transparent focus:bg-background focus:border-primary/20 transition-all text-xs"
                    />
                </div>

                {/* Role Badge */}
                <div className="hidden md:flex items-center mx-2">
                    <span className={cn(
                        "flex items-center gap-1.5 text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border shadow-sm",
                        // Admin: Red/Rose
                        userDetails?.role === 'admin' && "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50",
                        // Supervisor: Blue
                        userDetails?.role === 'supervisor' && "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50",
                        // Staff / Default: Slate
                        !['admin', 'supervisor'].includes(userDetails?.role) && "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                    )}>
                        {userDetails?.role === 'admin' && <Crown className="h-3 w-3 mb-0.5" />}
                        {userDetails?.role === 'supervisor' && <ShieldCheck className="h-3 w-3 mb-0.5" />}
                        {!['admin', 'supervisor'].includes(userDetails?.role) && <UserIcon className="h-3 w-3 mb-0.5" />}
                        {userDetails?.role || 'Guest'}
                    </span>
                </div>

                <div className="flex items-center gap-1 pl-3 border-l border-border/10">
                    <Clock timezone={timezone} className="hidden md:flex" />

                    <NotificationsBell />
                    <ModeToggle />
                    <UserNav user={user} />
                </div>
            </div>
        </header>
    );
}
