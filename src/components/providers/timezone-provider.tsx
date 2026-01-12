'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface TimezoneContextType {
    timezone: string;
    setTimezone: (tz: string) => void;
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined);

interface TimezoneProviderProps {
    children: React.ReactNode;
    serverTimezone: string; // Passed from server layout
}

export function TimezoneProvider({ children, serverTimezone }: TimezoneProviderProps) {
    // We use state just in case we want to allow user to toggle it client-side temporarily,
    // though primarily it comes from user profile.
    const [timezone, setTimezone] = useState(serverTimezone);

    useEffect(() => {
        if (serverTimezone) {
            setTimezone(serverTimezone);
        }
    }, [serverTimezone]);

    return (
        <TimezoneContext.Provider value={{ timezone, setTimezone }}>
            {children}
        </TimezoneContext.Provider>
    );
}

export function useTimezone() {
    const context = useContext(TimezoneContext);
    if (context === undefined) {
        throw new Error('useTimezone must be used within a TimezoneProvider');
    }
    return context;
}
