'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function RoleGuard({
    children,
    allowedRoles = ['admin', 'supervisor', 'accountant', 'guest'],
}: {
    children: React.ReactNode;
    allowedRoles?: string[];
}) {
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const checkUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            const { data: userProfile } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();

            if (userProfile && allowedRoles.includes(userProfile.role)) {
                setAuthorized(true);
            } else {
                router.push('/dashboard'); // Redirect to dashboard if unauthorized
            }
            setLoading(false);
        };

        checkUser();
    }, [allowedRoles, router, supabase]);

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    return authorized ? <>{children}</> : null;
}
