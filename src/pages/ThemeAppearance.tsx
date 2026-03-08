import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Sun, Moon, Monitor, RotateCcw, Palette, Type, Image as ImageIcon } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { insforge } from '../lib/insforge';
import { useCurrentUserId } from '../hooks/useCurrentUser';
import { accentColors } from '../context/ThemeContext';

const ThemeAppearance = () => {
    const navigate = useNavigate();
    const userId = useCurrentUserId();
    const { settings, setSettings, executeSecurely } = useData();
    const { showToast } = useToast();

    // Derived values with defaults
    const themeMode = settings?.theme_mode || 'system';
    const accentColor = settings?.accent_color || '#00a884';
    const fontSize = settings?.font_size || 'medium';
    const chatWallpaper = settings?.chat_wallpaper || null;

    const handleUpdateSetting = async (key: string, value: any) => {
        if (!userId) return;

        let settingsToUpdate: Record<string, any> = { [key]: value };

        // If switching to dark mode, automatically switch to dark wallpaper
        if (key === 'theme_mode' && value === 'dark') {
            settingsToUpdate['chat_wallpaper'] = '#0b141a';
        }

        // Optimistic update
        const previousSettings = { ...settings };
        setSettings?.((prev: any) => ({ ...prev, ...settingsToUpdate }));

        const result = await executeSecurely(async () => {
            const { data: record, error: fetchError } = await insforge.database
                .from('user_settings')
                .select()
                .eq('user_id', userId)
                .maybeSingle();

            if (fetchError) throw fetchError;

            if (!record) {
                await insforge.database
                    .from('user_settings')
                    .insert([{ user_id: userId, ...settingsToUpdate }]);
            } else {
                await insforge.database
                    .from('user_settings')
                    .update(settingsToUpdate)
                    .eq('user_id', userId);
            }
            return true;
        }, `Failed to update ${key.replace('_', ' ')}`);

        if (result === undefined) {
            // Rollback on failure
            setSettings?.(previousSettings);
        }
    };

    const resetTheme = async () => {
        if (!userId) return;

        const defaultData = {
            theme_mode: 'system',
            accent_color: '#00a884',
            font_size: 'medium',
            chat_wallpaper: null
        };

        const previousSettings = { ...settings };
        setSettings?.((prev: any) => ({ ...prev, ...defaultData }));

        const result = await executeSecurely(async () => {
            const { data: record, error } = await insforge.database
                .from('user_settings')
                .select()
                .eq('user_id', userId)
                .maybeSingle();

            if (error) throw error;

            if (record) {
                const { error: updErr } = await insforge.database
                    .from('user_settings')
                    .update(defaultData)
                    .eq('user_id', userId);
                if (updErr) throw updErr;
            } else {
                const { error: insErr } = await insforge.database
                    .from('user_settings')
                    .insert([{ user_id: userId, ...defaultData }]);
                if (insErr) throw insErr;
            }
            return true;
        }, 'Failed to reset appearance');

        if (result === undefined) {
            // Rollback on failure
            setSettings?.(previousSettings);
        } else {
            showToast('Appearance reset to default', 'info');
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
        <div className="profile-container premium-bg">
            <style>{`
                .preview-container {
                    padding: 32px 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .chat-preview-box {
                    width: 100%;
                    max-width: 320px;
                    height: 150px;
                    border-radius: 24px;
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    box-shadow: 0 15px 35px rgba(0,0,0,0.15);
                    position: relative;
                    overflow: hidden;
                    border: 1px solid rgba(255,255,255,0.15);
                    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .preview-msg {
                    padding: 10px 14px;
                    border-radius: 14px;
                    font-size: 13px;
                    max-width: 85%;
                    font-weight: 600;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                    animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .preview-received {
                    align-self: flex-start;
                    background: var(--message-received-bg);
                    color: var(--message-received-text);
                    border-bottom-left-radius: 4px;
                    border: 1px solid var(--glass-border);
                }
                .preview-sent {
                    align-self: flex-end;
                    background: var(--message-sent-bg);
                    color: var(--message-sent-text);
                    border-bottom-right-radius: 4px;
                    box-shadow: 0 4px 15px var(--primary-glow);
                }
                .section-card {
                    margin-bottom: 24px;
                    padding: 24px;
                }
                .accent-circle {
                    width: 34px;
                    height: 34px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    position: relative;
                    flex-shrink: 0;
                    border: 1.5px solid transparent;
                }
                .accent-circle:hover { transform: scale(1.1); }
                .accent-circle:active { transform: scale(0.95); }
                .accent-active-ring {
                    position: absolute;
                    inset: -4px;
                    border: 2px solid var(--primary-color);
                    border-radius: 50%;
                    animation: pulseRing 2s infinite;
                }
                @keyframes pulseRing {
                    0% { transform: scale(0.95); opacity: 0.5; }
                    50% { transform: scale(1.05); opacity: 0.2; }
                    100% { transform: scale(0.95); opacity: 0.5; }
                }
                .wallpaper-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                }
                .wallpaper-item {
                    aspect-ratio: 1;
                    border-radius: 20px;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 2px solid rgba(255,255,255,0.05);
                    box-shadow: var(--shadow-sm);
                }
                .wallpaper-item:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
                .wallpaper-item.active {
                    border-color: var(--primary-color);
                    transform: scale(0.96);
                    box-shadow: 0 0 20px rgba(0, 168, 132, 0.2);
                }
                .font-btn {
                    flex: 1;
                    padding: 14px;
                    border: none;
                    background: transparent;
                    color: var(--text-secondary);
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border-radius: 14px;
                    letter-spacing: 0.5px;
                    opacity: 0.7;
                }
                .font-btn:hover { opacity: 1; color: var(--text-primary); }
                .font-btn.active {
                    background: var(--surface-color);
                    color: var(--primary-color);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    transform: scale(1.02);
                    opacity: 1;
                }
                .theme-card-icon-container {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 2px;
                    transition: all 0.3s ease;
                }
                .active-theme-icon {
                    background: var(--primary-color);
                    color: white !important;
                    box-shadow: 0 8px 20px rgba(0, 168, 132, 0.3);
                }
                .inactive-theme-icon {
                    background: rgba(0,0,0,0.04);
                    color: var(--text-secondary);
                }
            `}</style>

            <div className="profile-nav glass-header">
                <div className="max-w-content" style={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%', gap: '16px', padding: '0 16px' }}>
                    <button className="nav-icon-btn ripple" onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowLeft size={24} />
                    </button>
                    <span className="profile-nav-title" style={{ margin: 0, fontSize: '20px', color: 'var(--primary-dark)', fontWeight: 800 }}>Theme & Appearance</span>
                </div>
            </div>

            <div className="profile-content" style={{ paddingBottom: '120px', paddingTop: '16px' }}>
                <div className="max-w-content">
                    {/* Live Preview */}
                    <div className="preview-container">
                        <div
                            className="chat-preview-box"
                            style={{
                                backgroundColor: chatWallpaper || '#efeae2',
                                backgroundImage: chatWallpaper ? 'none' : 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
                                backgroundSize: 'cover',
                                boxShadow: themeMode === 'dark' ? '0 20px 40px rgba(0,0,0,0.4)' : '0 20px 40px rgba(0,0,0,0.15)'
                            }}
                        >
                            <div className="preview-msg preview-received">
                                Check out this premium design! 🎨
                            </div>
                            <div className="preview-msg preview-sent" style={{
                                backgroundColor: accentColor,
                                boxShadow: `0 4px 15px ${accentColor}40`
                            }}>
                                Looks absolutely stunning! ✨
                            </div>
                        </div>
                        <div style={{ marginTop: '20px', fontSize: '12px', fontWeight: 800, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1.2px', opacity: 0.8 }}>
                            Live Appearance Preview
                        </div>
                    </div>

                    <div style={{ padding: '0 16px' }}>
                        {/* Theme Mode */}
                        <SectionLabel icon={<Sun size={18} />} title="Theme Mode" />
                        <div className="profile-glass-card section-card" style={{ display: 'flex', gap: '8px', padding: '10px' }}>
                            <ThemeToggleCard
                                active={themeMode === 'light'}
                                onClick={() => handleUpdateSetting('theme_mode', 'light')}
                                icon={<Sun size={20} strokeWidth={2.5} />}
                                label="Light"
                            />
                            <ThemeToggleCard
                                active={themeMode === 'dark'}
                                onClick={() => handleUpdateSetting('theme_mode', 'dark')}
                                icon={<Moon size={20} strokeWidth={2.5} />}
                                label="Dark"
                            />
                            <ThemeToggleCard
                                active={themeMode === 'system'}
                                onClick={() => handleUpdateSetting('theme_mode', 'system')}
                                icon={<Monitor size={20} strokeWidth={2.5} />}
                                label="System"
                            />
                        </div>

                        {/* Accent Color */}
                        <SectionLabel icon={<Palette size={18} />} title="Accent Color" />
                        <div className="profile-glass-card section-card">
                            <div style={{
                                display: 'flex',
                                gap: '16px',
                                overflowX: 'auto',
                                padding: '4px 0 8px',
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none'
                            }}>
                                {accentColors.map(color => (
                                    <div
                                        key={color.value}
                                        className="accent-circle ripple"
                                        onClick={() => handleUpdateSetting('accent_color', color.value)}
                                        style={{ backgroundColor: color.value }}
                                    >
                                        {accentColor === color.value && (
                                            <>
                                                <div className="accent-active-ring" style={{ borderColor: color.value }} />
                                                <Check size={20} color="white" strokeWidth={4} />
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Font Size */}
                        <SectionLabel icon={<Type size={18} />} title="Font Size" />
                        <div className="profile-glass-card section-card" style={{ padding: '8px' }}>
                            <div style={{ display: 'flex', background: 'var(--secondary-color)', border: '1px solid var(--glass-border)', borderRadius: '18px', padding: '6px' }}>
                                {(['small', 'medium', 'large'] as const).map(size => (
                                    <button
                                        key={size}
                                        className={`font-btn ${fontSize === size ? 'active' : ''}`}
                                        onClick={() => handleUpdateSetting('font_size', size)}
                                        style={{
                                            fontSize: size === 'small' ? '12px' : size === 'medium' ? '14px' : '16px'
                                        }}
                                    >
                                        {size.charAt(0).toUpperCase() + size.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chat Wallpaper */}
                        <SectionLabel icon={<ImageIcon size={18} />} title="Chat Wallpaper" />
                        <div className="profile-glass-card section-card">
                            <div className="wallpaper-grid">
                                {wallpapers.map(wp => {
                                    const isSelected = chatWallpaper === wp.color || (!chatWallpaper && wp.id === 'none');
                                    return (
                                        <div
                                            key={wp.id}
                                            className={`wallpaper-item ${isSelected ? 'active' : ''}`}
                                            onClick={() => handleUpdateSetting('chat_wallpaper', wp.id === 'none' ? null : wp.color)}
                                            style={{
                                                backgroundColor: wp.color,
                                                backgroundImage: wp.id === 'none' ? 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' : 'none',
                                                backgroundSize: 'cover'
                                            }}
                                        >
                                            <div style={{
                                                position: 'absolute',
                                                inset: 0,
                                                background: isSelected ? 'rgba(0, 168, 132, 0.15)' : 'rgba(0,0,0,0.15)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backdropFilter: isSelected ? 'none' : 'blur(0.5px)'
                                            }}>
                                                <span style={{
                                                    fontSize: '11px',
                                                    fontWeight: 900,
                                                    color: 'white',
                                                    textAlign: 'center',
                                                    textShadow: '0 1px 4px rgba(0,0,0,0.4)',
                                                    letterSpacing: '0.3px',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {wp.label}
                                                </span>
                                            </div>
                                            {isSelected && (
                                                <div style={{
                                                    position: 'absolute', top: 10, right: 10,
                                                    background: 'var(--primary-color)', borderRadius: '50%',
                                                    padding: 4, boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    zIndex: 2
                                                }}>
                                                    <Check size={12} color="white" strokeWidth={5} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Reset Button */}
                        <div style={{ padding: '24px 0 40px', textAlign: 'center' }}>
                            <button
                                className="premium-btn-secondary"
                                onClick={resetTheme}
                                style={{ gap: '12px', width: '100%', maxWidth: '300px', height: '56px', borderRadius: '18px' }}
                            >
                                <RotateCcw size={20} /> Reset All Appearance
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SectionLabel = ({ icon, title }: { icon: any, title: string }) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '0 4px 12px',
        fontSize: '13px',
        fontWeight: 800,
        color: 'var(--primary-color)',
        textTransform: 'uppercase',
        letterSpacing: '0.8px'
    }}>
        {icon}
        {title}
    </div>
);

const ThemeToggleCard = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
    <div
        className={`profile-glass-card ripple ${active ? 'active-gradient' : ''}`}
        onClick={onClick}
        style={{
            flex: 1,
            height: '88px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
            border: active ? '2px solid var(--primary-color)' : '1px solid rgba(0,0,0,0.05)',
            background: active ? 'var(--secondary-color)' : 'rgba(255,255,255,0.05)',
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            transform: active ? 'translateY(-2px)' : 'none',
            boxShadow: active ? '0 8px 20px rgba(0, 168, 132, 0.12)' : 'var(--shadow-sm)',
            borderRadius: '20px'
        }}
    >
        <div className={`theme-card-icon-container ${active ? 'active-theme-icon' : 'inactive-theme-icon'}`}>
            {icon}
        </div>
        <div style={{
            fontSize: '13px',
            fontWeight: 900,
            color: active ? 'var(--primary-color)' : 'var(--text-primary)',
            letterSpacing: '0.6px',
            opacity: active ? 1 : 0.85
        }}>
            {label}
        </div>
    </div>
);

export default ThemeAppearance;
