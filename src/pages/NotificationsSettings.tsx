import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Check, RotateCcw, Loader2, Bell, BellOff, Shield } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { insforge } from '../lib/insforge';
import { useCurrentUserId } from '../hooks/useCurrentUser';
import LoadingOverlay from '../components/LoadingOverlay';
import { useData } from '../context/DataContext';
import FloatingActionSheet from '../components/FloatingActionSheet';
import { requestNotificationPermission, getNotificationPermission } from '../hooks/useNotifications';

const NotificationsSettings = () => {
    const navigate = useNavigate();
    const userId = useCurrentUserId();
    const { showToast } = useToast();
    const { settings, setSettings, loading: globalLoading, executeSecurely } = useData();
    const [actionLoading, setActionLoading] = useState(false);
    const [showSoundModal, setShowSoundModal] = useState(false);
    const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
        () => getNotificationPermission()
    );

    useEffect(() => {
        setNotifPermission(getNotificationPermission());
    }, []);

    const handleGrantPermission = async () => {
        const result = await requestNotificationPermission();
        setNotifPermission(result);
        if (result === 'granted') {
            showToast('Browser notifications enabled!', 'success');
        } else if (result === 'denied') {
            showToast('Notifications blocked. Please enable in browser settings.', 'error');
        }
    };

    const handleUpdateSetting = async (key: string, value: any) => {
        if (!userId) return;

        const previousValue = settings?.[key];

        // Optimistic Update
        setSettings?.((prev: any) => ({ ...prev, [key]: value }));

        const result = await executeSecurely(async () => {
            const { data: record, error: fetchErr } = await insforge.database
                .from('user_settings')
                .select()
                .eq('user_id', userId)
                .maybeSingle();

            if (fetchErr) throw fetchErr;

            if (record) {
                const { error: updateErr } = await insforge.database
                    .from('user_settings')
                    .update({ [key]: value, updated_at: new Date().toISOString() })
                    .eq('id', record.id);
                if (updateErr) throw updateErr;
            } else {
                const { error: insertErr } = await insforge.database
                    .from('user_settings')
                    .insert([{ user_id: userId, [key]: value }]);
                if (insertErr) throw insertErr;
            }
            return true;
        }, `Failed to update ${key.replace(/_/g, ' ')}`);

        // Rollback optimistic update if operation failed
        if (result === undefined) {
            setSettings?.((prev: any) => ({ ...prev, [key]: previousValue }));
        }
    };

    const handleBack = () => navigate(-1);

    const resetSettings = async () => {
        if (!userId) return;

        const previousSettings = { ...settings };
        const defaults = {
            message_notifications: true,
            group_notifications: true,
            react_notifications: true,
            preview_messages: true,
            vibration: true,
            in_app_sound: true,
            high_priority_notifications: true,
            notification_sound: 'Masum Default'
        };

        setActionLoading(true);
        const result = await executeSecurely(async () => {
            // Optimistic reset
            setSettings?.({ ...settings, ...defaults });

            const { error: updateErr } = await insforge.database
                .from('user_settings')
                .update(defaults)
                .eq('user_id', userId);

            if (updateErr) throw updateErr;

            showToast('Notification settings reset to defaults', 'info');
            return true;
        }, 'Failed to reset settings');

        if (result === undefined) {
            setSettings?.(previousSettings);
        }
        setActionLoading(false);
    };

    if (globalLoading && userId && !settings) {
        return (
            <div className="premium-loader">
                <Loader2 className="spinner" size={40} />
                <p>Syncing preferences...</p>
            </div>
        );
    }

    return (
        <div className="profile-container premium-bg">
            <style>{`
                .settings-group {
                    margin-bottom: 24px;
                }
                .settings-group-title {
                    padding: 0 20px 12px;
                    font-size: 13px;
                    font-weight: 800;
                    color: var(--primary-color);
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    opacity: 0.8;
                }
                .settings-card {
                    overflow: hidden;
                    margin: 0 16px;
                }
                .privacy-toggle-item {
                    padding: 16px 20px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .toggle-title {
                    font-weight: 700;
                    color: var(--text-primary);
                    font-size: 16px;
                }
                .toggle-desc {
                    font-size: 13px;
                    color: var(--text-secondary);
                    font-weight: 500;
                    line-height: 1.4;
                    margin-top: 4px;
                }
                .privacy-toggle-divider {
                    height: 1px;
                    background: rgba(0,0,0,0.05);
                    margin: 0 20px;
                }
                .premium-switch {
                    width: 48px;
                    height: 26px;
                    border-radius: 100px;
                    background: #e2e8f0;
                    position: relative;
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    flex-shrink: 0;
                }
                .premium-switch.active {
                    background: var(--primary-color);
                    box-shadow: 0 4px 12px rgba(0, 168, 132, 0.3);
                }
                .switch-knob {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: white;
                    position: absolute;
                    top: 3px;
                    left: 3px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .premium-switch.active .switch-knob {
                    left: 25px;
                }
                .sound-options-list {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .sound-option-item {
                    display: flex;
                    align-items: center;
                    width: 100%;
                    padding: 14px 16px;
                    border: none;
                    background: transparent;
                    border-radius: 12px;
                    gap: 16px;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: left;
                }
                .sound-option-item:hover { background: rgba(0,0,0,0.02); }
                .sound-option-item.active { background: var(--secondary-color); }
                .radio-circle {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    border: 2px solid #cbd5e1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .sound-option-item.active .radio-circle { border-color: var(--primary-color); }
                .radio-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: var(--primary-color);
                    animation: scaleIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                @keyframes scaleIn {
                    from { transform: scale(0); }
                    to { transform: scale(1); }
                }
                .reset-btn {
                    margin: 20px auto;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 24px;
                    border-radius: 100px;
                    border: 1.5px solid #edf2f7;
                    background: white;
                    color: #e53e3e;
                    font-weight: 700;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                }
                .reset-btn:active { transform: scale(0.96); }
            `}</style>

            <div className="profile-nav glass-header">
                <div className="max-w-content" style={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%', gap: '16px', padding: '0 16px' }}>
                    <button className="nav-icon-btn ripple" onClick={handleBack} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowLeft size={24} />
                    </button>
                    <span className="profile-nav-title" style={{ margin: 0, fontSize: '20px', color: 'var(--primary-dark)', fontWeight: 800 }}>Notifications</span>
                </div>
            </div>

            <div className="profile-content" style={{ paddingBottom: '100px', paddingTop: '16px' }}>
                <div className="max-w-content">
                    {actionLoading && <LoadingOverlay message="Updating..." transparent />}

                    {/* ── Browser Permission Card ── */}
                    <div className="settings-group">
                        <div className="settings-group-title">Browser Notifications</div>
                        <div className="profile-glass-card settings-card">
                            <div className="privacy-toggle-item" style={{ gap: '16px', alignItems: 'flex-start' }}>
                                <div style={{
                                    width: 42, height: 42, borderRadius: '12px', flexShrink: 0,
                                    background: notifPermission === 'granted' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {notifPermission === 'granted'
                                        ? <Bell size={20} color="#22c55e" />
                                        : <BellOff size={20} color="#ef4444" />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div className="toggle-title">Permission Status</div>
                                    <div className="toggle-desc" style={{
                                        color: notifPermission === 'granted' ? '#22c55e'
                                            : notifPermission === 'denied' ? '#ef4444' : 'var(--text-secondary)',
                                        fontWeight: 600
                                    }}>
                                        {notifPermission === 'granted' ? '✓ Enabled — notifications will appear'
                                            : notifPermission === 'denied' ? '✗ Blocked — allow in browser address bar'
                                                : 'Not set — tap below to enable'}
                                    </div>
                                    {notifPermission !== 'granted' && (
                                        <button
                                            onClick={handleGrantPermission}
                                            style={{
                                                marginTop: '10px',
                                                padding: '8px 18px',
                                                borderRadius: '100px',
                                                border: 'none',
                                                background: 'var(--primary-color)',
                                                color: 'white',
                                                fontWeight: 700,
                                                fontSize: '13px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            <Shield size={14} /> Grant Permission
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="settings-group">
                        <div className="settings-group-title">Message Notifications</div>
                        <div className="profile-glass-card settings-card">
                            <div className="privacy-toggle-item">
                                <div style={{ flex: 1 }}>
                                    <div className="toggle-title">Alerts</div>
                                    <div className="toggle-desc">Receive push notifications for private messages</div>
                                </div>
                                <Switch
                                    checked={settings?.message_notifications !== false}
                                    onChange={() => handleUpdateSetting('message_notifications', !settings?.message_notifications)}
                                />
                            </div>
                            <div className="privacy-toggle-divider" />
                            <div
                                className="privacy-toggle-item ripple"
                                onClick={() => setShowSoundModal(true)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div style={{ flex: 1 }}>
                                    <div className="toggle-title">Sound</div>
                                    <div className="toggle-desc" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
                                        {settings?.notification_sound || 'Masum Default'}
                                    </div>
                                </div>
                                <ChevronRight size={18} color="rgba(0,0,0,0.2)" />
                            </div>
                            <div className="privacy-toggle-divider" />
                            <div className="privacy-toggle-item">
                                <div style={{ flex: 1 }}>
                                    <div className="toggle-title">Vibration</div>
                                    <div className="toggle-desc">Soft haptic feedback on incoming alerts</div>
                                </div>
                                <Switch
                                    checked={settings?.vibration !== false}
                                    onChange={() => handleUpdateSetting('vibration', !settings?.vibration)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="settings-group">
                        <div className="settings-group-title">Social & Interaction</div>
                        <div className="profile-glass-card settings-card">
                            <div className="privacy-toggle-item">
                                <div style={{ flex: 1 }}>
                                    <div className="toggle-title">Groups</div>
                                    <div className="toggle-desc">Notifications for group chat activity</div>
                                </div>
                                <Switch
                                    checked={settings?.group_notifications !== false}
                                    onChange={() => handleUpdateSetting('group_notifications', !settings?.group_notifications)}
                                />
                            </div>
                            <div className="privacy-toggle-divider" />
                            <div className="privacy-toggle-item">
                                <div style={{ flex: 1 }}>
                                    <div className="toggle-title">Reactions</div>
                                    <div className="toggle-desc">Alerts when someone reacts to your messages</div>
                                </div>
                                <Switch
                                    checked={settings?.react_notifications !== false}
                                    onChange={() => handleUpdateSetting('react_notifications', !settings?.react_notifications)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="settings-group">
                        <div className="settings-group-title">Advanced Experience</div>
                        <div className="profile-glass-card settings-card">
                            <div className="privacy-toggle-item">
                                <div style={{ flex: 1 }}>
                                    <div className="toggle-title">Previews</div>
                                    <div className="toggle-desc">Show message text in banners</div>
                                </div>
                                <Switch
                                    checked={settings?.preview_messages !== false}
                                    onChange={() => handleUpdateSetting('preview_messages', !settings?.preview_messages)}
                                />
                            </div>
                            <div className="privacy-toggle-divider" />
                            <div className="privacy-toggle-item">
                                <div style={{ flex: 1 }}>
                                    <div className="toggle-title">In-App Sounds</div>
                                    <div className="toggle-desc">Play subtle sounds while the app is active</div>
                                </div>
                                <Switch
                                    checked={settings?.in_app_sound !== false}
                                    onChange={() => handleUpdateSetting('in_app_sound', !settings?.in_app_sound)}
                                />
                            </div>
                            <div className="privacy-toggle-divider" />
                            <div className="privacy-toggle-item">
                                <div style={{ flex: 1 }}>
                                    <div className="toggle-title">High Priority</div>
                                    <div className="toggle-desc">Show heads-up banners for all notifications</div>
                                </div>
                                <Switch
                                    checked={settings?.high_priority_notifications !== false}
                                    onChange={() => handleUpdateSetting('high_priority_notifications', !settings?.high_priority_notifications)}
                                />
                            </div>
                        </div>
                    </div>

                    <button onClick={resetSettings} className="reset-btn ripple">
                        <RotateCcw size={18} /> Reset All Notifications
                    </button>
                </div>
            </div>

            <FloatingActionSheet
                isOpen={showSoundModal}
                onClose={() => setShowSoundModal(false)}
                title="Notification Sound"
            >
                <div className="sound-options-list" style={{ padding: '10px 0' }}>
                    {['Masum Default', 'Simple Alert', 'Cheerful', 'Cyber Bell', 'Minimalist', 'Xylophone'].map(option => (
                        <button
                            key={option}
                            className={`sound-option-item ${settings?.notification_sound === option ? 'active' : ''}`}
                            onClick={() => {
                                handleUpdateSetting('notification_sound', option);
                                setShowSoundModal(false);
                            }}
                        >
                            <div className="radio-circle">
                                {settings?.notification_sound === option && <div className="radio-dot" />}
                            </div>
                            <span style={{ flex: 1, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{option}</span>
                            {settings?.notification_sound === option && <Check size={18} color="var(--primary-color)" />}
                        </button>
                    ))}
                </div>
            </FloatingActionSheet>
        </div >
    );
};

const Switch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <button
        onClick={onChange}
        className={`premium-switch ${checked ? 'active' : ''}`}
    >
        <div className="switch-knob" />
    </button>
);

export default NotificationsSettings;
