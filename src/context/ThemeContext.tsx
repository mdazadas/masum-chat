import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { insforge } from '../lib/insforge';
import { useCurrentUserId } from '../hooks/useCurrentUser';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    themeMode: ThemeMode;
    accentColor: string;
    fontSize: 'small' | 'medium' | 'large';
    chatWallpaper: string | null;
    setThemeMode: (mode: ThemeMode) => void;
    setAccentColor: (color: string) => void;
    setFontSize: (size: 'small' | 'medium' | 'large') => void;
    setChatWallpaper: (wallpaper: string | null) => void;
    loadingSettings: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const accentColors = [
    { name: 'Teal (Default)', value: '#00a884' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Gold', value: '#eab308' },
    { name: 'Crimson', value: '#dc2626' },
    { name: 'Slate', value: '#475569' }
];

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const userId = useCurrentUserId();
    const [themeMode, setThemeMode] = useState<ThemeMode>(() =>
        (sessionStorage.getItem('themeMode') as ThemeMode) || 'system'
    );
    const [accentColor, setAccentColor] = useState(() =>
        sessionStorage.getItem('accentColor') || '#00a884'
    );
    const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(() =>
        (sessionStorage.getItem('fontSize') as any) || 'medium'
    );
    const [chatWallpaper, setChatWallpaper] = useState<string | null>(() =>
        sessionStorage.getItem('chatWallpaper') || null
    );
    const [loadingSettings, setLoadingSettings] = useState(true);

    // Fetch settings from DB on mount/user load
    useEffect(() => {
        if (!userId) {
            setLoadingSettings(false);
            return;
        }

        const fetchRemoteSettings = async () => {
            try {
                const { data: remoteData, error } = await insforge.database
                    .from('user_settings')
                    .select('*')
                    .eq('user_id', userId);

                const data = remoteData?.[0];

                if (data) {
                    if (data.theme_mode) setThemeMode(data.theme_mode);
                    if (data.accent_color) setAccentColor(data.accent_color);
                    if (data.font_size) setFontSize(data.font_size as any);
                    if (data.chat_wallpaper !== undefined) setChatWallpaper(data.chat_wallpaper);
                } else if (error) {
                    // If doesn't exist, create it
                    await insforge.database
                        .from('user_settings')
                        .upsert({
                            user_id: userId,
                            theme_mode: themeMode,
                            accent_color: accentColor,
                            font_size: fontSize
                        });
                }
            } catch (err) {
                console.error("Error syncing theme from DB:", err);
            } finally {
                setLoadingSettings(false);
            }
        };

        fetchRemoteSettings();
    }, [userId]);

    const handleSetThemeMode = (mode: ThemeMode) => {
        setThemeMode(mode);
        // Force Dark Solid wallpaper when switching to Dark Mode
        if (mode === 'dark') {
            setChatWallpaper('#0b141a');
        }
    };

    useEffect(() => {
        sessionStorage.setItem('themeMode', themeMode);
        sessionStorage.setItem('accentColor', accentColor);
        sessionStorage.setItem('fontSize', fontSize);
        if (chatWallpaper) sessionStorage.setItem('chatWallpaper', chatWallpaper);
        else sessionStorage.removeItem('chatWallpaper');

        applyTheme();
    }, [themeMode, accentColor, fontSize, chatWallpaper]);

    const applyTheme = () => {
        const root = document.documentElement;

        // Apply Accent Color
        root.style.setProperty('--primary-color', accentColor);
        // Create variations of the primary color
        root.style.setProperty('--primary-dark', accentColor + 'ee');
        root.style.setProperty('--primary-light', accentColor + '33');

        // Apply Font Size
        const fontSizes = {
            small: '14px',
            medium: '16px',
            large: '18px'
        };
        root.style.setProperty('--base-font-size', fontSizes[fontSize]);

        // Theme Mode Logic
        const isDark = themeMode === 'dark' || (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

        if (isDark) {
            root.classList.add('dark-theme');
            root.style.setProperty('--surface-color', '#111b21');
            root.style.setProperty('--secondary-color', '#202c33');
            root.style.setProperty('--text-primary', '#e9edef');
            root.style.setProperty('--text-secondary', '#8696a0');
            root.style.setProperty('--border-color', '#222d34');
            root.style.setProperty('--input-bg', '#2a3942');
            root.style.setProperty('--message-sent', '#005c4b');
            root.style.setProperty('--message-received', '#202c33');
            root.style.setProperty('--chat-bg-default', '#0b141a');
            root.style.setProperty('--chat-doodle-opacity', '0.05');
        } else {
            root.classList.remove('dark-theme');
            root.style.setProperty('--surface-color', '#ffffff');
            root.style.setProperty('--secondary-color', '#f0f2f5');
            root.style.setProperty('--text-primary', '#111b21');
            root.style.setProperty('--text-secondary', '#667781');
            root.style.setProperty('--border-color', '#e9edef');
            root.style.setProperty('--input-bg', '#ffffff');
            root.style.setProperty('--message-sent', '#dcf8c6');
            root.style.setProperty('--message-received', '#ffffff');
            root.style.setProperty('--chat-bg-default', '#efeae2');
            root.style.setProperty('--chat-doodle-opacity', '0.4');
        }
    };

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (themeMode === 'system') applyTheme();
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [themeMode]);

    return (
        <ThemeContext.Provider value={{
            themeMode,
            accentColor,
            fontSize,
            chatWallpaper,
            setThemeMode: handleSetThemeMode,
            setAccentColor,
            setFontSize,
            setChatWallpaper,
            loadingSettings
        }}>
            {children}
        </ThemeContext.Provider>
    );
};
