// Settings Manager with Cookies
export interface AppSettings {
    notifications: {
        enabled: boolean;
        sound: boolean;
        vibration: boolean;
        callRingtone: string;
        messageSound: string;
    };
    calls: {
        autoAnswer: boolean;
        videoQuality: 'low' | 'medium' | 'high';
        audioOnly: boolean;
    };
    privacy: {
        readReceipts: boolean;
        lastSeen: boolean;
        onlineStatus: boolean;
    };
    theme: 'dark' | 'light' | 'auto';
}

const DEFAULT_SETTINGS: AppSettings = {
    notifications: {
        enabled: true,
        sound: true,
        vibration: true,
        callRingtone: 'default',
        messageSound: 'default'
    },
    calls: {
        autoAnswer: false,
        videoQuality: 'high',
        audioOnly: false
    },
    privacy: {
        readReceipts: true,
        lastSeen: true,
        onlineStatus: true
    },
    theme: 'dark'
};

// Cookie helpers
const setCookie = (name: string, value: string, days: number = 365) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
};

const getCookie = (name: string): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};

// Settings Manager
class SettingsManager {
    private settings: AppSettings;
    private listeners: Set<(settings: AppSettings) => void> = new Set();

    constructor() {
        this.settings = this.loadSettings();
    }

    private loadSettings(): AppSettings {
        try {
            const saved = getCookie('app_settings');
            if (saved) {
                return { ...DEFAULT_SETTINGS, ...JSON.parse(decodeURIComponent(saved)) };
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
        return DEFAULT_SETTINGS;
    }

    private saveSettings() {
        try {
            setCookie('app_settings', encodeURIComponent(JSON.stringify(this.settings)));
            this.notifyListeners();
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    getSettings(): AppSettings {
        return { ...this.settings };
    }

    updateSettings(updates: Partial<AppSettings>) {
        this.settings = { ...this.settings, ...updates };
        this.saveSettings();
    }

    updateNotificationSettings(updates: Partial<AppSettings['notifications']>) {
        this.settings.notifications = { ...this.settings.notifications, ...updates };
        this.saveSettings();
    }

    updateCallSettings(updates: Partial<AppSettings['calls']>) {
        this.settings.calls = { ...this.settings.calls, ...updates };
        this.saveSettings();
    }

    updatePrivacySettings(updates: Partial<AppSettings['privacy']>) {
        this.settings.privacy = { ...this.settings.privacy, ...updates };
        this.saveSettings();
    }

    setTheme(theme: 'dark' | 'light' | 'auto') {
        this.settings.theme = theme;
        this.saveSettings();
    }

    subscribe(listener: (settings: AppSettings) => void): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    private notifyListeners() {
        this.listeners.forEach(listener => listener(this.settings));
    }

    // Permission helpers
    async requestNotificationPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }

    isNotificationEnabled(): boolean {
        return this.settings.notifications.enabled &&
            ('Notification' in window) &&
            Notification.permission === 'granted';
    }
}

// Export singleton instance
export const settingsManager = new SettingsManager();

// React hook for settings
import { useState, useEffect } from 'react';

export function useSettings() {
    const [settings, setSettings] = useState<AppSettings>(settingsManager.getSettings());

    useEffect(() => {
        const unsubscribe = settingsManager.subscribe(setSettings);
        return unsubscribe;
    }, []);

    return {
        settings,
        updateSettings: (updates: Partial<AppSettings>) => settingsManager.updateSettings(updates),
        updateNotificationSettings: (updates: Partial<AppSettings['notifications']>) =>
            settingsManager.updateNotificationSettings(updates),
        updateCallSettings: (updates: Partial<AppSettings['calls']>) =>
            settingsManager.updateCallSettings(updates),
        updatePrivacySettings: (updates: Partial<AppSettings['privacy']>) =>
            settingsManager.updatePrivacySettings(updates),
        setTheme: (theme: 'dark' | 'light' | 'auto') => settingsManager.setTheme(theme),
        requestNotificationPermission: () => settingsManager.requestNotificationPermission(),
        isNotificationEnabled: () => settingsManager.isNotificationEnabled()
    };
}
