'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, User, ChevronDown } from 'lucide-react';

export function UserNav({ user }: { user: any }) {
    const router = useRouter();
    const supabase = createClient();
    const [profile, setProfile] = React.useState<any>(null);

    React.useEffect(() => {
        const fetchProfile = async () => {
            if (user?.id) {
                const { data } = await supabase
                    .from('users')
                    .select('full_name, username, avatar_url, email, header_display_preference')
                    .eq('id', user.id)
                    .single();
                setProfile(data);
            }
        };
        fetchProfile();
    }, [user, supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const displayName = profile?.full_name || profile?.username || user?.email?.split('@')[0] || 'User';
    const email = profile?.email || user?.email;
    const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
    const preference = profile?.header_display_preference || 'avatar_only';



    const showAvatar = preference !== 'full_name_only';
    const showName = preference !== 'avatar_only';
    const nameToDisplay = preference === 'avatar_username' ? (profile?.username || displayName) : displayName;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 flex items-center gap-2 rounded-full px-0 hover:bg-transparent">
                    {showName && (
                        <span className="text-sm font-medium hidden md:block">
                            {nameToDisplay}
                        </span>
                    )}
                    {showAvatar && (
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={avatarUrl} alt={displayName} />
                            <AvatarFallback className="bg-muted">
                                <User className="h-4 w-4 text-muted-foreground" />
                            </AvatarFallback>
                        </Avatar>
                    )}
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => router.push('/profile')}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/settings')}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
