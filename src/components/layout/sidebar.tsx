'use client';
import { SystemStatus } from './system-status';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import {
    LayoutDashboard,
    CreditCard,
    Users,
    Wallet,
    BarChart3,
    Settings,
    ChevronDown,
    ChevronRight,
    ScrollText,
    Plus,
    Activity,
    Zap,
    AlertTriangle,
} from 'lucide-react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { SidebarLogo } from './sidebar-logo';

const items = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Transactions',
        href: '/transactions',
        icon: CreditCard,
        submenu: [
            {
                title: 'Forex',
                href: '/transactions/forex',
                action: {
                    icon: Plus,
                    href: '/transactions/forex/new',
                },
            },
            {
                title: 'Supplier Payments',
                href: '/transactions/supplier-payments',
                action: {
                    icon: Plus,
                    href: '/transactions/supplier-payments/new',
                },
            },
            {
                title: 'Invoices & Bills',
                href: '/invoices',
            },
        ],
    },
    {
        title: 'Digital Expenses',
        href: '/digital-expenses',
        icon: Zap,
        submenu: [
            {
                title: 'All Expenses',
                href: '/digital-expenses',
                action: {
                    icon: Plus,
                    href: '/digital-expenses/new',
                },
            },
            {
                title: 'Recurring',
                href: '/digital-expenses/recurring',
            },
            {
                title: 'Reports & Analytics',
                href: '/digital-expenses/analytics',
                icon: BarChart3
            }
        ],
    },
    {
        title: 'Contacts',
        href: '/contacts',
        icon: Users,
        action: {
            icon: Plus,
            href: '/contacts/new',
        },
    },
    {
        title: 'Financial Accounts',
        href: '/accounts',
        icon: Wallet,
        action: {
            icon: Plus,
            href: '/accounts/new',
        },
    },
    {
        title: 'Reports',
        href: '/reports',
        icon: BarChart3,
        submenu: [
            {
                title: 'Forex Report',
                href: '/reports/forex',
            },
            {
                title: 'Supplier Payments',
                href: '/reports/supplier-payments',
            },
            {
                title: 'Cash Flow',
                href: '/reports/cash-flow',
            },
        ],
    },
    {
        title: 'Activity Log',
        href: '/activity-log',
        icon: ScrollText,
    },
    {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
        submenu: [
            {
                title: 'General',
                href: '/settings/general',
            },
            {
                title: 'User Management',
                href: '/settings/users',
            },
            {
                title: 'Security',
                href: '/settings/security',
            },
            {
                title: 'Integrations',
                href: '/settings/integrations',
            },
            {
                title: 'Notifications',
                href: '/settings/notifications',
            },
        ],
    },
];

export function Sidebar({ companyName = 'BizAd', className, version }: { companyName?: string; className?: string; version?: string }) {
    const pathname = usePathname();
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
    const [userRole, setUserRole] = useState<string>('guest');
    const [gracePeriodStart, setGracePeriodStart] = useState<string | null>(null);
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [is2FAExempt, setIs2FAExempt] = useState(false);
    const [urgentRenewalsCount, setUrgentRenewalsCount] = useState(0);
    const [isMounted, setIsMounted] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        setIsMounted(true);
        const newOpenMenus: Record<string, boolean> = {};
        items.forEach(item => {
            if (item.submenu && pathname.startsWith(item.href)) {
                newOpenMenus[item.title] = true;
            }
        });
        setOpenMenus(newOpenMenus);
    }, []);

    useEffect(() => {
        const fetchRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('role, admin_grace_period_start, is_2fa_exempt')
                    .eq('id', user.id)
                    .single();
                setUserRole(profile?.role || 'guest');
                setGracePeriodStart(profile?.admin_grace_period_start || null);
                setIs2FAExempt(profile?.is_2fa_exempt || false);
                setIs2FAEnabled(user.factors?.some(f => f.status === 'verified') ?? false);
            }
        };
        const fetchBadge = async () => {
            const { getUrgentRenewalsCount } = await import('@/app/actions/digital-expenses/get-urgent-count');
            const count = await getUrgentRenewalsCount();
            setUrgentRenewalsCount(count);
        };
        fetchRole();
        fetchBadge();
    }, []);

    if (!isMounted) {
        return (
            <div className={cn("flex flex-col h-full bg-background/80 backdrop-blur-xl border border-border/40 shadow-2xl shadow-primary/5 rounded-3xl overflow-hidden", className)}>
                <div className="p-6 pb-6 flex items-center gap-3 border-b border-border/10">
                    <div className="h-10 w-10 rounded-xl bg-muted/20 animate-pulse" />
                    <div className="space-y-2">
                        <div className="h-4 w-24 bg-muted/20 rounded animate-pulse" />
                        <div className="h-2 w-16 bg-muted/20 rounded animate-pulse" />
                    </div>
                </div>
                <div className="flex-1 px-3 py-4 space-y-1">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-10 w-full bg-muted/10 rounded-lg animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    const toggleMenu = (title: string) => {
        setOpenMenus(prev => ({
            ...prev,
            [title]: !prev[title]
        }));
    };

    const filteredItems = items.map(item => {
        // Explicitly hide Reports for guest users immediately
        if (item.title === 'Reports') {
            if (userRole === 'guest') return null;
        }
        if (item.title === 'Activity Log') {
            if (userRole !== 'admin') return null;
        }

        if (item.title === 'Settings' && item.submenu) {
            let filteredSubmenu = item.submenu;
            if (['admin', 'supervisor'].includes(userRole)) {
                // Admin and Supervisor see everything (no filtering needed)
            } else if (userRole === 'accountant') {
                filteredSubmenu = filteredSubmenu.filter(sub =>
                    ['General', 'Integrations', 'Notifications'].includes(sub.title)
                );
            } else {
                // Everyone else (Guest, unknown, etc.) ONLY sees General
                filteredSubmenu = filteredSubmenu.filter(sub => sub.title === 'General');
            }
            return { ...item, submenu: filteredSubmenu };
        }

        if (item.submenu) {
            let filteredSubmenu = item.submenu;
            if (userRole === 'guest') {
                if (item.title === 'Transactions') return null;
            }
            filteredSubmenu = filteredSubmenu.filter(sub => {
                if (sub.title === 'Reports & Analytics' && userRole === 'guest') return false;
                return true;
            });
            filteredSubmenu = filteredSubmenu.map(sub => {
                if ((sub as any).action) {
                    if (userRole === 'guest') {
                        return { ...sub, action: undefined };
                    }
                }
                return sub;
            });
            return { ...item, submenu: filteredSubmenu };
        }
        if (item.action) {
            if (['Contacts', 'Financial Accounts'].includes(item.title)) {
                if (userRole !== 'admin') {
                    return { ...item, action: undefined };
                }
            }
        }

        return item;
    }).filter(Boolean) as typeof items;

    return (
        <div className={cn("flex flex-col h-full bg-background/80 backdrop-blur-xl border border-border/40 shadow-2xl shadow-primary/5 rounded-3xl overflow-hidden", className)}>
            <div className="p-6 pb-6 flex items-center gap-3 border-b border-border/10">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20 ring-1 ring-white/20">
                    <Zap className="h-6 w-6 text-primary-foreground fill-current" />
                </div>
                <div>
                    <h1 className="font-bold text-xl tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">{companyName}</h1>
                    <div className="flex items-center gap-2">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Finance OS</p>
                        {version && (
                            <span className="text-[9px] font-mono bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground">v{version}</span>
                        )}
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
                {filteredItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.submenu && pathname.startsWith(item.href));
                    const isOpen = openMenus[item.title];

                    if (item.submenu && item.submenu.length > 0) {
                        return (
                            <Collapsible
                                key={index}
                                open={!!isOpen}
                                onOpenChange={() => toggleMenu(item.title)}
                                className="w-full space-y-0.5"
                            >
                                <CollapsibleTrigger asChild>
                                    <button
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-300 group relative overflow-hidden",
                                            isActive
                                                ? "bg-primary/10 text-primary font-semibold shadow-[0_0_20px_-10px_rgba(var(--primary),0.3)]"
                                                : "text-muted-foreground/80 hover:bg-muted/50 hover:text-foreground"
                                        )}
                                    >
                                        {isActive && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-r-full" />}
                                        <div className="flex items-center gap-3 z-10">
                                            <Icon className={cn("h-4 w-4 transition-transform duration-300 group-hover:scale-110", isActive && "fill-current/20")} />
                                            <span className="text-[13px] tracking-wide">{item.title}</span>
                                            {item.title === 'Digital Expenses' && urgentRenewalsCount > 0 && (
                                                <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold bg-red-500 text-white rounded-full animate-pulse shadow-sm">
                                                    {urgentRenewalsCount}
                                                </span>
                                            )}
                                            {item.title === 'Settings' && userRole === 'admin' && gracePeriodStart && !is2FAEnabled && !is2FAExempt && (
                                                <AlertTriangle
                                                    className={cn(
                                                        "h-3.5 w-3.5 animate-pulse ml-2",
                                                        (new Date().getTime() - new Date(gracePeriodStart).getTime()) / (1000 * 3600 * 24) > 7
                                                            ? "text-red-500"
                                                            : "text-orange-500"
                                                    )}
                                                />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 z-10">
                                            {isOpen ? (
                                                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                                            ) : (
                                                <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                                            )}
                                        </div>
                                    </button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="pl-4 space-y-0.5 pt-0.5">
                                    <div className="border-l border-primary/10 pl-3 space-y-0.5 ml-1.5">
                                        {item.submenu.map((subItem, subIndex) => (
                                            <div key={subIndex} className="relative group flex items-center justify-between">
                                                <Link
                                                    href={subItem.href}
                                                    className={cn(
                                                        "flex-1 py-1.5 px-3 rounded-md text-[12.5px] font-medium transition-colors tracking-wide",
                                                        pathname === subItem.href
                                                            ? "text-primary bg-primary/5"
                                                            : "text-muted-foreground/70 hover:text-foreground hover:bg-muted/30"
                                                    )}
                                                >
                                                    {subItem.title}
                                                    {subItem.title === 'Security' && userRole === 'admin' && gracePeriodStart && !is2FAEnabled && !is2FAExempt && (
                                                        <span className="ml-2 inline-flex">
                                                            <AlertTriangle
                                                                className={cn(
                                                                    "h-3.5 w-3.5 animate-pulse",
                                                                    (new Date().getTime() - new Date(gracePeriodStart).getTime()) / (1000 * 3600 * 24) > 7
                                                                        ? "text-red-500"
                                                                        : "text-orange-500"
                                                                )}
                                                            />
                                                        </span>
                                                    )}
                                                </Link>
                                                {/* @ts-ignore */}
                                                {subItem.action && (
                                                    <Link
                                                        // @ts-ignore
                                                        href={subItem.action.href}
                                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-primary/10 hover:text-primary rounded-md transition-all"
                                                    >
                                                        {/* @ts-ignore */}
                                                        <subItem.action.icon className="h-3 w-3" />
                                                    </Link>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        );
                    }

                    return (
                        <div key={index} className="relative group">
                            <Link
                                href={item.href}
                                className={cn(
                                    "flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-300 group relative overflow-hidden",
                                    isActive
                                        ? "bg-primary/10 text-primary font-semibold shadow-[0_0_20px_-10px_rgba(var(--primary),0.3)]"
                                        : "text-muted-foreground/80 hover:bg-muted/50 hover:text-foreground"
                                )}
                            >
                                {isActive && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-r-full" />}
                                <div className="flex items-center gap-3 z-10">
                                    <Icon className={cn("h-4 w-4 transition-transform duration-300 group-hover:scale-110", isActive && "fill-current/20")} />
                                    <span className="text-[13px] tracking-wide">{item.title}</span>
                                </div>
                            </Link>
                            {/* @ts-ignore */}
                            {item.action && (
                                <Link
                                    // @ts-ignore
                                    href={item.action.href}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:bg-background shadow-sm border border-border/50 rounded-md transition-all z-20"
                                >
                                    {/* @ts-ignore */}
                                    <item.action.icon className="h-3 w-3 text-primary" />
                                </Link>
                            )}
                        </div>
                    );
                })}
            </nav>

            <SystemStatus />
        </div>
    );
}
