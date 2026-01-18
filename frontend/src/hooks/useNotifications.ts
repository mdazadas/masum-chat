'use client';

import { useCallback, useEffect } from 'react';

export function useNotifications() {
    // Request notification permission on mount
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
    }, []);

    const playNotificationSound = useCallback(() => {
        try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
            audio.volume = 0.5;
            audio.play().catch(err => console.log('Audio play failed:', err));

            // Vibrate on mobile
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([100, 50, 100]); // Short double pulse
            }
        } catch (err) {
            console.error('Error playing sound:', err);
        }
    }, []);

    const showNotification = useCallback((title: string, body: string, icon?: string, onClick?: () => void) => {
        // Play sound regardless of native notification permission
        playNotificationSound();

        // Show native notification if permission granted and tab is hidden
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            if (document.visibilityState === 'hidden') {
                const notification = new Notification(title, {
                    body,
                    icon: icon || '/logo.png',
                    badge: '/logo.png',
                    tag: 'masum-chat-msg', // Prevents flooding
                });

                notification.onclick = () => {
                    window.focus();
                    if (onClick) onClick();
                    notification.close();
                };
            }
        }
    }, [playNotificationSound]);

    return { showNotification, playNotificationSound };
}
