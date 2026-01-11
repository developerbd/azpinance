import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { getSignupSettings } from '@/app/actions/get-signup-settings';

export default async function LoginPage() {
    const { signup_enabled } = await getSignupSettings();

    return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <LoginForm signupEnabled={signup_enabled} />
            </Suspense>
        </div>
    );
}
