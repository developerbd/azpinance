import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();



    // Protected routes
    if (request.nextUrl.pathname.startsWith('/dashboard') ||
        request.nextUrl.pathname.startsWith('/settings') ||
        request.nextUrl.pathname.startsWith('/reports') ||
        request.nextUrl.pathname.startsWith('/contacts') ||
        request.nextUrl.pathname.startsWith('/accounts') ||
        request.nextUrl.pathname.startsWith('/transactions')) {

        if (!user) {

            return NextResponse.redirect(new URL('/login', request.url));
        }

        // Check for suspended status
        const { data: userProfile } = await supabase
            .from('users')
            .select('status, role')
            .eq('id', user.id)
            .single();



        if (userProfile?.status === 'suspended') {
            // Sign out and redirect to suspended page or login with error
            await supabase.auth.signOut();
            return NextResponse.redirect(new URL('/login?error=suspended', request.url));
        }

        // Admin-only routes check removed to allow granular RBAC in pages
        // if (request.nextUrl.pathname.startsWith('/settings') && userProfile?.role !== 'admin') {
        //     return NextResponse.redirect(new URL('/dashboard', request.url));
        // }
    }

    // Auth routes (redirect to dashboard if already logged in)
    if (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup')) {
        if (user) {

            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
