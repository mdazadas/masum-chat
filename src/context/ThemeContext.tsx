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
    const { settings, loading: dataLoading } = useData();
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
        // Create variations of the primary color using opacity for better harmony
        root.style.setProperty('--primary-glow', `${accentColor}4d`); // 30% opacity
        root.style.setProperty('--primary-light', `${accentColor}26`); // 15% opacity
        root.style.setProperty('--primary-dark', `${accentColor}cc`); // 80% opacity

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
            root.classList.add('dark-theme'); // for legacy support if needed
        } else {
            root.setAttribute('data-theme', 'light');
            root.classList.remove('dark-theme');
        }
    }, [themeMode, accentColor, fontSize]);

    // Listen for system theme changes — applyTheme in dep array ensures no stale closure
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (themeMode === 'system') applyTheme();
        };
        // Also apply immediately when themeMode changes to 'system' so it picks up current OS state
        if (themeMode === 'system') applyTheme();
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
