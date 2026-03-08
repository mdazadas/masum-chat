// App icon for badge
const APP_ICON = '/icon-192.png';

interface NotificationPayload {
    text?: string;
    image_url?: string;
    video_url?: string;
    audio_url?: string;
    sender_id: string;
}

interface ContactInfo {
    name?: string;
    avatar?: string;
    username?: string;
    contact_id?: string;
}

interface UserSettings {
    message_notifications?: boolean;
    preview_messages?: boolean;
    high_priority_notifications?: boolean;
    vibration?: boolean;
}

/**
 * Request browser notification permission.
 * Returns the final permission status.
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (typeof Notification === 'undefined') return 'denied';
    if (Notification.permission === 'granted') return 'granted';
    try {
        return await Notification.requestPermission();
    } catch {
        return 'denied';
    }
};

/**
 * Get current browser notification permission status.
 */
export const getNotificationPermission = (): NotificationPermission => {
    if (typeof Notification === 'undefined') return 'denied';
    return Notification.permission;
};

/**
 * Build the notification body based on message type and preview setting.
 */
const buildBody = (payload: NotificationPayload, showPreview: boolean): string => {
    if (!showPreview) return 'You have a new message';
    if (payload.video_url) return '📹 Sent a video';
    if (payload.image_url) return '📷 Sent a photo';
    if (payload.audio_url) return '🎤 Sent a voice message';
    return payload.text || 'New message';
};

/**
 * Show a browser push notification for an incoming message.
 * Respects all user settings.
 * @param payload - The raw message payload from the real-time event
 * @param contact - The sender's contact info
 * @param settings - The user's notification settings
 */
export const showMessageNotification = (
    payload: NotificationPayload,
    contact: ContactInfo,
    settings: UserSettings | null
) => {
    // 1. Master toggle check
    if (settings?.message_notifications === false) return;

    // 2. Permission check
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    const senderName = contact?.name || contact?.username || 'Someone';
    const senderAvatar = contact?.avatar || APP_ICON;
    const chatUsername = contact?.username || '';

    const showPreview = settings?.preview_messages !== false;
    const requireInteraction = settings?.high_priority_notifications !== false;
    const shouldVibrate = settings?.vibration !== false;

    const body = buildBody(payload, showPreview);

    try {
        const notification = new Notification(`${senderName}`, {
            body,
            icon: senderAvatar,
            badge: APP_ICON,
            // Collapse multiple messages from the same contact
            tag: `masum-msg-${contact?.contact_id || payload.sender_id}`,
            requireInteraction,
            silent: false,
        } as NotificationOptions);

        // Vibrate on incoming notification
        if (shouldVibrate && navigator.vibrate) {
            navigator.vibrate([150, 80, 150]);
        }

        // Click → focus window and navigate to sender's chat
        notification.onclick = () => {
            window.focus();
            if (chatUsername) {
                // Use hash navigation compatible with react-router
                window.location.hash = `#/chat/${chatUsername}`;
            }
            notification.close();
        };

        // Auto-close after 5s if not high priority
        if (!requireInteraction) {
            setTimeout(() => notification.close(), 5000);
        }
    } catch (err) {
        console.warn('Browser notification failed:', err);
    }
};
