import { useEffect, useRef, useState } from 'react';

interface UseIdleTimeoutOptions {
    warningTimeout: number; // milliseconds until warning
    closeTimeout: number; // milliseconds after warning until auto-close
    onWarning: () => void;
    onClose: () => void;
    enabled: boolean;
}

export function useIdleTimeout({
    warningTimeout,
    closeTimeout,
    onWarning,
    onClose,
    enabled
}: UseIdleTimeoutOptions) {
    const [isIdle, setIsIdle] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
    const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

    const resetTimers = () => {
        // Clear existing timers
        if (warningTimerRef.current) {
            clearTimeout(warningTimerRef.current);
        }
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
        }

        setShowWarning(false);
        setIsIdle(false);

        if (!enabled) return;

        // Set warning timer (10 minutes)
        warningTimerRef.current = setTimeout(() => {
            setShowWarning(true);
            setIsIdle(true);
            onWarning();

            // Set close timer (5 minutes after warning)
            closeTimerRef.current = setTimeout(() => {
                onClose();
            }, closeTimeout);
        }, warningTimeout);
    };

    const dismissWarning = () => {
        resetTimers();
    };

    useEffect(() => {
        if (enabled) {
            resetTimers();
        }

        return () => {
            if (warningTimerRef.current) {
                clearTimeout(warningTimerRef.current);
            }
            if (closeTimerRef.current) {
                clearTimeout(closeTimerRef.current);
            }
        };
    }, [enabled]);

    return {
        isIdle,
        showWarning,
        resetTimers,
        dismissWarning
    };
}
