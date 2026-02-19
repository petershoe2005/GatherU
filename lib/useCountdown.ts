import { useState, useEffect } from 'react';

/**
 * Custom hook that returns a live countdown string from an ISO date string.
 * Updates every second. Returns "Ended" if past the deadline.
 */
export function useCountdown(endsAt: string | undefined): string {
    const [timeLeft, setTimeLeft] = useState(() => computeTimeLeft(endsAt));

    useEffect(() => {
        if (!endsAt) return;
        // Update immediately
        setTimeLeft(computeTimeLeft(endsAt));

        const interval = setInterval(() => {
            const remaining = computeTimeLeft(endsAt);
            setTimeLeft(remaining);
            if (remaining === 'Ended') clearInterval(interval);
        }, 1000);

        return () => clearInterval(interval);
    }, [endsAt]);

    return timeLeft;
}

function computeTimeLeft(endsAt: string | undefined): string {
    if (!endsAt) return '';

    const now = Date.now();
    const end = new Date(endsAt).getTime();
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m ${String(seconds % 60).padStart(2, '0')}s`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${String(seconds % 60).padStart(2, '0')}s`;
    if (minutes > 0) return `${minutes}m ${String(seconds % 60).padStart(2, '0')}s`;
    return `${seconds}s`;
}
