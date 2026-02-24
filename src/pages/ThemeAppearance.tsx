import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, accentColors } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { insforge } from '../lib/insforge';
import { useCurrentUserId } from '../hooks/useCurrentUser';

const ThemeAppearance = () => {
    const navigate = useNavigate();
    const userId = useCurrentUserId();
    const {
        themeMode, setThemeMode,
        accentColor, setAccentColor,
        fontSize, setFontSize,
        chatWallpaper, setChatWallpaper
    } = useTheme();
    const { showToast } = useToast();

    const handleUpdateSetting = async (key: string, value: any) => {
        if (!userId) return;
        try {
            await insforge.database
                .from('user_settings')
                .upsert({ user_id: userId, [key]: value });
        } catch (err) {
            console.error(`Error updating theme setting ${key}:`, err);
        }
    };

    const handleBack = () => navigate(-1);

    const resetTheme = async () => {
        setThemeMode('system');
        setAccentColor('#00a884');
        setFontSize('medium');
        setChatWallpaper(null);

        if (userId) {
            try {
                await insforge.database.from('user_settings').upsert({
                    user_id: userId,
                    theme_mode: 'system',
                    accent_color: '#00a884',
                    font_size: 'medium',
                    chat_wallpaper: null
                });
                showToast('Theme settings reset to default', 'info');
            } catch (err) {
                showToast('Failed to reset theme', 'error');
            }
        }
    };

    const wallpapers = [
        { id: 'none', color: '#efeae2', label: 'Default' },
        { id: 'dark', color: '#0b141a', label: 'Dark Solid' },
        { id: 'blue', color: '#e7f3ff', label: 'Sky Blue' },
        { id: 'green', color: '#e9f7eb', label: 'Mint' },
        { id: 'pink', color: '#fcecf2', label: 'Rose' },
        { id: 'purple', color: '#f6f0fb', label: 'Lavender' }
    ];

    return (
        <div className="home-container" style={{ backgroundColor: 'var(--surface-color)' }}>
            {/* Header */}
            <nav className="top-nav">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="nav-icon-btn" onClick={handleBack}>
                        <ArrowLeft size={24} />
                    </button>
                    <div className="top-nav-title">Theme & Appearance</div>
                </div>
            </nav>

            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '40px' }}>

                {/* Live Preview Section */}
                <div style={{
                    padding: '24px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: 'var(--secondary-color)',
                    borderBottom: '1px solid var(--border-color)'
                }}>
                    <div style={{
                        width: '100%',
                        maxWidth: '280px',
                        height: '140px',
                        borderRadius: '16px',
                        backgroundColor: chatWallpaper || '#efeae2',
                        backgroundImage: chatWallpaper ? 'none' : 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
                        backgroundSize: 'contain',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        overflow: 'hidden',
                        position: 'relative'
                    }}>
                        <div style={{
                            alignSelf: 'flex-start',
                            backgroundColor: 'var(--message-received)',
                            color: 'var(--text-primary)',
                            padding: '6px 10px',
                            borderRadius: '0 8px 8px 8px',
                            fontSize: '13px',
                            maxWidth: '80%',
                            boxShadow: '0 1px 0.5px rgba(0,0,0,0.1)'
                        }}>
                            Check out this new theme! 🎨
                        </div>
                        <div style={{
                            alignSelf: 'flex-end',
                            backgroundColor: 'var(--message-sent)',
                            color: 'var(--text-primary)',
                            padding: '6px 10px',
                            borderRadius: '8px 0 8px 8px',
                            fontSize: '13px',
                            maxWidth: '80%',
                            boxShadow: '0 1px 0.5px rgba(0,0,0,0.1)',
                            borderLeft: themeMode === 'dark' ? 'none' : `3px solid var(--primary-color)`
                        }}>
                            Wow, it looks amazing! ✨
                        </div>
                    </div>
                    <div style={{ marginTop: '12px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Live Theme Preview
                    </div>
                </div>

                <SectionHeader title="Theme Mode" />
                <div style={{ padding: '0 20px' }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                        <ThemeCard
                            active={themeMode === 'light'}
                            onClick={() => {
                                setThemeMode('light');
                                handleUpdateSetting('theme_mode', 'light');
                                showToast('Light mode applied', 'info');
                            }}
                            icon={<Sun size={24} />}
                            label="Light"
                        />
                        <ThemeCard
                            active={themeMode === 'dark'}
                            onClick={() => {
                                setThemeMode('dark');
                                handleUpdateSetting('theme_mode', 'dark');
                                showToast('Dark mode applied', 'info');
                            }}
                            icon={<Moon size={24} />}
                            label="Dark"
                        />
                        <ThemeCard
                            active={themeMode === 'system'}
                            onClick={() => {
                                setThemeMode('system');
                                handleUpdateSetting('theme_mode', 'system');
                                showToast('System theme applied', 'info');
                            }}
                            icon={<Monitor size={24} />}
                            label="System"
                        />
                    </div>
                </div>

                <div style={{ height: '8px', backgroundColor: 'var(--secondary-color)' }}></div>

                {/* Accent Color Section */}
                <SectionHeader title="Accent Color" />
                <div style={{
                    display: 'flex',
                    overflowX: 'auto',
                    gap: '12px',
                    padding: '8px 20px 20px 20px',
                    scrollbarWidth: 'none'
                }}>
                    {accentColors.map(color => (
                        <div
                            key={color.value}
                            onClick={() => {
                                setAccentColor(color.value);
                                handleUpdateSetting('accent_color', color.value);
                                showToast(`${color.name} theme set`, 'success');
                            }}
                            style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                backgroundColor: color.value,
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                border: accentColor === color.value ? '3px solid var(--text-primary)' : 'none',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                        >
                            {accentColor === color.value && <Check size={24} color="white" />}
                        </div>
                    ))}
                </div>

                <div style={{ height: '8px', backgroundColor: 'var(--secondary-color)' }}></div>

                {/* Font Size Section */}
                <SectionHeader title="Font Size" />
                <div style={{ padding: '0 20px 20px 20px' }}>
                    <div style={{
                        display: 'flex',
                        backgroundColor: 'var(--secondary-color)',
                        borderRadius: '12px',
                        padding: '4px'
                    }}>
                        {(['small', 'medium', 'large'] as const).map(size => (
                            <button
                                key={size}
                                onClick={() => {
                                    setFontSize(size);
                                    handleUpdateSetting('font_size', size);
                                    showToast(`${size.charAt(0).toUpperCase() + size.slice(1)} font applied`, 'info');
                                }}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    border: 'none',
                                    borderRadius: '10px',
                                    backgroundColor: fontSize === size ? 'var(--surface-color)' : 'transparent',
                                    color: fontSize === size ? 'var(--primary-color)' : 'var(--text-secondary)',
                                    fontWeight: 600,
                                    fontSize: size === 'small' ? '13px' : size === 'medium' ? '15px' : '17px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {size.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ height: '8px', backgroundColor: 'var(--secondary-color)' }}></div>

                {/* Chat Wallpaper Section */}
                <SectionHeader title="Chat Wallpaper" />
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px',
                    padding: '0 20px 20px 20px'
                }}>
                    {wallpapers.map(wp => {
                        const isSelected = chatWallpaper === wp.color || (!chatWallpaper && wp.id === 'none');
                        return (
                            <div
                                key={wp.id}
                                onClick={() => {
                                    const wallpaperValue = wp.id === 'none' ? null : wp.color;
                                    setChatWallpaper(wallpaperValue);
                                    handleUpdateSetting('chat_wallpaper', wallpaperValue);
                                    showToast(`${wp.label} wallpaper applied`, 'info');
                                }}
                                style={{
                                    height: '80px',
                                    borderRadius: '16px',
                                    backgroundColor: wp.color,
                                    border: isSelected ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <span style={{
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    color: wp.id === 'dark' ? '#ffffff' : '#444444',
                                    opacity: 0.9,
                                    textAlign: 'center',
                                    padding: '0 8px'
                                }}>
                                    {wp.label}
                                </span>
                                {isSelected && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '8px',
                                        right: '8px',
                                        backgroundColor: 'var(--primary-color)',
                                        borderRadius: '50%',
                                        width: '20px',
                                        height: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}>
                                        <Check size={12} color="white" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div style={{ padding: '30px 20px', textAlign: 'center' }}>
                    <button
                        onClick={resetTheme}
                        style={{
                            background: 'var(--surface-color)',
                            border: '1.5px solid var(--border-color)',
                            padding: '12px 24px',
                            borderRadius: '24px',
                            color: 'var(--primary-color)',
                            fontWeight: 700,
                            fontSize: '14px',
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-sm)'
                        }}
                    >
                        Reset All Appearance Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

const SectionHeader = ({ title }: { title: string }) => (
    <div style={{
        padding: '20px 20px 12px 20px',
        fontSize: '13px',
        fontWeight: 700,
        color: 'var(--primary-color)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    }}>
        {title}
    </div>
);

const ThemeCard = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
    <div
        onClick={onClick}
        style={{
            flex: 1,
            height: '80px',
            backgroundColor: active ? 'var(--secondary-color)' : 'var(--surface-color)',
            border: `2px solid ${active ? 'var(--primary-color)' : 'var(--border-color)'}`,
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s'
        }}
    >
        <div style={{ color: active ? 'var(--primary-color)' : 'var(--text-secondary)' }}>
            {icon}
        </div>
        <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: active ? 'var(--primary-color)' : 'var(--text-primary)'
        }}>
            {label}
        </div>
    </div>
);

export default ThemeAppearance;
