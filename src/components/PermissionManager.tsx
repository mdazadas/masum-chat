import { useEffect } from 'react';
import { useData } from '../context/DataContext';

/**
 * PermissionManager
 * Silently requests browser notification permission once the user is logged in.
 * Does not render any visible UI.
 * Runs only once per session — if already granted/denied, it does nothing.
 */
const PermissionManager = () => {
    const { userId } = useData();

    useEffect(() => {
        if (!userId) return;
        if (typeof Notification === 'undefined') return;
        if (Notification.permission !== 'default') return;

        // Small delay so it doesn't fire immediately on app mount
        const timer = setTimeout(() => {
            Notification.requestPermission().catch(() => { });
        }, 3000);

        return () => clearTimeout(timer);
    }, [userId]);

    return null;
};

export default PermissionManager;
