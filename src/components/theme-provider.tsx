'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';

export function ThemeProvider({
    children,
    userTheme,
    ...props
}: React.ComponentProps<typeof NextThemesProvider> & { userTheme?: string | null }) {
    return (
        <NextThemesProvider {...props}>
            <ThemeSync userTheme={userTheme} />
            {children}
        </NextThemesProvider>
    );
}

function ThemeSync({ userTheme }: { userTheme?: string | null }) {
    const { setTheme, theme } = useTheme();
    const mounted = React.useRef(false);

    React.useEffect(() => {
        if (!mounted.current && userTheme && userTheme !== theme) {
            setTheme(userTheme);
        }
        mounted.current = true;
    }, [userTheme, setTheme]);

    return null;
}
