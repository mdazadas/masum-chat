import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useData } from './DataContext';

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
    { name: 'Teal (Default)', value: '#10b981' },
    { name: 'Blue', value: '#60a5fa' },
    { name: 'Purple', value: '#a78bfa' },
    { name: 'Pink', value: '#f472b6' },
    { name: 'Orange', value: '#fb923c' },
    { name: 'Gold', value: '#fbbf24' },
    { name: 'Crimson', value: '#f87171' },
    { name: 'Slate', value: '#94a3b8' }
];

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const { settings, loading: dataLoading } = useData();
    const [themeMode, setThemeMode] = useState<ThemeMode>(() =>
        (sessionStorage.getItem('themeMode') as ThemeMode) ||
        (settings?.theme_mode as ThemeMode) ||
        'system'
    );
    const [accentColor, setAccentColor] = useState(() =>
        sessionStorage.getItem('accentColor') ||
        settings?.accent_color ||
        '#10b981'
    );
    const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(() =>
        (sessionStorage.getItem('fontSize') as any) ||
        settings?.font_size ||
        'medium'
    );
    const [chatWallpaper, setChatWallpaper] = useState<string | null>(() =>
        sessionStorage.getItem('chatWallpaper') ||
        settings?.chat_wallpaper ||
        null
    );

    // Sync from DataContext settings
    useEffect(() => {
        if (settings) {
            if (settings.theme_mode) setThemeMode(settings.theme_mode as any);
            if (settings.accent_color) setAccentColor(settings.accent_color);
            if (settings.font_size) setFontSize(settings.font_size as any);
            if (settings.chat_wallpaper !== undefined) setChatWallpaper(settings.chat_wallpaper);
        }
    }, [settings]);

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

    const applyTheme = useCallback(() => {
        const root = document.documentElement;

        // Apply Accent Color & Variations
        root.style.setProperty('--primary-color', accentColor);

        // Helper to adjust hex color brightness
        const adjust = (color: string, amount: number) => {
            return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).slice(-2));
        };

        root.style.setProperty('--primary-dark', adjust(accentColor, -20));
        root.style.setProperty('--primary-glow', `${accentColor}4d`); // 30% opacity
        root.style.setProperty('--primary-light', `${accentColor}26`); // 15% opacity

        // Apply Font Size
        const fontSizes = {
            small: '14px',
            medium: '16px',
            large: '18px'
        };
        root.style.setProperty('--base-font-size', fontSizes[fontSize]);

        // Theme Mode Logic - Delegate to CSS classes
        const isDark = themeMode === 'dark' || (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

        if (isDark) {
            root.setAttribute('data-theme', 'dark');
            root.classList.add('dark-theme');
        } else {
            root.setAttribute('data-theme', 'light');
            root.classList.remove('dark-theme');
        }
    }, [themeMode, accentColor, fontSize]);

    // Listen for system theme changes — applyTheme in dep array ensures no stale closure
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = () => {
            if (themeMode === 'system') {
                applyTheme();
                // User Request: Auto wallpaper switch when in system mode
                if (mediaQuery.matches) {
                    setChatWallpaper('#0b141a');
                } else {
                    setChatWallpaper(null);
                }
            }
        };

        // Also apply immediately when themeMode changes to 'system' so it picks up current OS state
        if (themeMode === 'system') {
            applyTheme();
            if (mediaQuery.matches) {
                setChatWallpaper('#0b141a');
            } else {
                setChatWallpaper(null);
            }
        }

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [themeMode, applyTheme]);

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
            loadingSettings: dataLoading
        }}>
            {children}
        </ThemeContext.Provider>
    );
};
