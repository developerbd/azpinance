'use client';

import { usePathname } from 'next/navigation';
import { UserNav } from '@/components/layout/user-nav';
import { Clock } from '@/components/ui/clock';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { NotificationsBell } from '@/components/layout/notifications-bell';
import { Search, ChevronRight, Home } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { MobileNav } from '@/components/layout/mobile-nav';

interface HeaderProps {
    user: User;
    timezone: string;
    companyName?: string;
}

export function Header({ user, timezone, companyName }: HeaderProps) {
    const pathname = usePathname();
    const paths = pathname.split('/').filter(Boolean);

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
