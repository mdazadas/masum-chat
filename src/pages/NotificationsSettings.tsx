import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Monitor, Music, Check, Bell, MessageSquare, Volume2, Vibrate } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { insforge } from '../lib/insforge';
import { useCurrentUserId } from '../hooks/useCurrentUser';
import LoadingOverlay from '../components/LoadingOverlay';

const NotificationsSettings = () => {
    const navigate = useNavigate();
    const userId = useCurrentUserId();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

    // Toggle States
    const [messageNotifications, setMessageNotifications] = useState(true);
    const [groupNotifications, setGroupNotifications] = useState(true);
    const [reactNotifications, setReactNotifications] = useState(true);
    const [previewMessages, setPreviewMessages] = useState(true);
    const [vibration, setVibration] = useState(true);
    const [sound, setSound] = useState(true);
    const [highPriority, setHighPriority] = useState(true);
    const [notificationSound, setNotificationSound] = useState('Masum Default');

    // Modal State
    const [showSoundModal, setShowSoundModal] = useState(false);
    const soundOptions = ['Masum Default', 'Simple Alert', 'Cheerful', 'Cyber Bell', 'Minimalist', 'Xylophone'];

    useEffect(() => {
        if (!userId) return;

        const fetchSettings = async () => {
            setLoading(true);
            try {
                const { data, error } = await insforge.database
                    .from('user_settings')
                    .select('*')
                    .eq('user_id', userId)
                    .single();

                if (data) {
                    setMessageNotifications(data.message_notifications !== false);
                    setGroupNotifications(data.group_notifications !== false);
                    setReactNotifications(data.react_notifications !== false);
                    setPreviewMessages(data.preview_messages !== false);
                    setVibration(data.vibration !== false);
                    setSound(data.in_app_sound !== false);
                    setHighPriority(data.high_priority_notifications !== false);
                    setNotificationSound(data.notification_sound || 'Masum Default');
                } else if (error) {
                    // Create default settings if missing
                    await insforge.database.from('user_settings').upsert({
                        user_id: userId,
                        message_notifications: true,
                        group_notifications: true,
                        react_notifications: true,
                        preview_messages: true,
                        vibration: true,
                        in_app_sound: true,
                        high_priority_notifications: true,
                        notification_sound: 'Masum Default'
                    });
                }
            } catch (err) {
                console.error("Error fetching notification settings:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [userId]);

    const handleUpdateSetting = async (key: string, value: any, silent = false) => {
        if (!userId) return;
        if (!silent) {
            setActionLoading(true);
            setLoadingMessage('Updating...');
        }
        try {
            await insforge.database
                .from('user_settings')
                .upsert({ user_id: userId, [key]: value });
        } catch (err) {
            console.error(`Error updating setting ${key}:`, err);
        } finally {
            if (!silent) setActionLoading(false);
        }
    };

    const handleBack = () => navigate(-1);

    const resetSettings = async () => {
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

        if (userId) {
            setActionLoading(true);
            setLoadingMessage('Resetting...');
            try {
                await insforge.database.from('user_settings').upsert({ user_id: userId, ...defaults });

                setMessageNotifications(true);
                setGroupNotifications(true);
                setReactNotifications(true);
                setPreviewMessages(true);
                setVibration(true);
                setSound(true);
                setHighPriority(true);
                setNotificationSound('Masum Default');

                showToast('All notifications reset to default', 'info');
            } catch (err) {
                showToast('Failed to reset settings', 'error');
            } finally {
                setActionLoading(false);
            }
        }
    };

    if (loading && userId) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--surface-color)', gap: '16px' }}>
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', animation: 'pulse 2s infinite' }}>Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="home-container" style={{ backgroundColor: 'var(--surface-color)' }}>
            {actionLoading && <LoadingOverlay message={loadingMessage} transparent />}
            {/* Header */}
            <nav className="top-nav">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="nav-icon-btn" onClick={handleBack}>
                        <ArrowLeft size={24} />
                    </button>
                    <div className="top-nav-title">Notifications</div>
                </div>
            </nav>

            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '40px' }}>

                {/* Section: Message Notifications */}
                <SectionHeader title="Message Notifications" />

                <NotificationToggle
                    icon={<Bell size={20} />}
                    title="Allow Notifications"
                    subtitle="Show notifications for new messages"
                    checked={messageNotifications}
                    onChange={() => {
                        const newVal = !messageNotifications;
                        setMessageNotifications(newVal);
                        handleUpdateSetting('message_notifications', newVal);
                        showToast(`Notifications ${newVal ? 'enabled' : 'disabled'}`, 'success');
                    }}
                />

                <NotificationRow
                    icon={<Music size={20} />}
                    title="Notification Sound"
                    value={notificationSound}
                    onClick={() => setShowSoundModal(true)}
                />

                <NotificationToggle
                    icon={<Vibrate size={20} />}
                    title="Vibration"
                    subtitle="Vibrate on incoming messages"
                    checked={vibration}
                    onChange={() => {
                        const newVal = !vibration;
                        setVibration(newVal);
                        handleUpdateSetting('vibration', newVal);
                        showToast(`Vibration ${newVal ? 'enabled' : 'disabled'}`, 'success');
                    }}
                />

                <div style={{ height: '8px', backgroundColor: 'var(--secondary-color)' }}></div>

                {/* Section: Group Notifications */}
                <SectionHeader title="Group & React Notifications" />

                <NotificationToggle
                    icon={<MessageSquare size={20} />}
                    title="Group Notification"
                    subtitle="Show notifications for group messages"
                    checked={groupNotifications}
                    onChange={() => {
                        const newVal = !groupNotifications;
                        setGroupNotifications(newVal);
                        handleUpdateSetting('group_notifications', newVal);
                        showToast(`Group notifications ${newVal ? 'enabled' : 'disabled'}`, 'success');
                    }}
                />

                <NotificationToggle
                    icon={<MessageSquare size={20} />}
                    title="Reactions"
                    subtitle="Show notifications for message reactions"
                    checked={reactNotifications}
                    onChange={() => {
                        const newVal = !reactNotifications;
                        setReactNotifications(newVal);
                        handleUpdateSetting('react_notifications', newVal);
                        showToast(`Reaction notifications ${newVal ? 'enabled' : 'disabled'}`, 'success');
                    }}
                />

                <div style={{ height: '8px', backgroundColor: 'var(--secondary-color)' }}></div>

                {/* Section: Advanced */}
                <SectionHeader title="Advanced Settings" />

                <NotificationToggle
                    icon={<Monitor size={20} />}
                    title="Show Previews"
                    subtitle="Preview message text within notifications"
                    checked={previewMessages}
                    onChange={() => {
                        const newVal = !previewMessages;
                        setPreviewMessages(newVal);
                        handleUpdateSetting('preview_messages', newVal);
                        showToast(`Message previews ${newVal ? 'enabled' : 'disabled'}`, 'success');
                    }}
                />

                <NotificationToggle
                    icon={<Volume2 size={20} />}
                    title="Sounds in App"
                    subtitle="Play sounds for incoming and outgoing messages while using the app"
                    checked={sound}
                    onChange={() => {
                        const newVal = !sound;
                        setSound(newVal);
                        handleUpdateSetting('in_app_sound', newVal);
                        showToast(`In-app sounds ${newVal ? 'enabled' : 'disabled'}`, 'success');
                    }}
                />

                <div className="chat-item" style={{ padding: '16px 20px', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--secondary-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary-color)'
                    }}>
                        <Monitor size={20} />
                    </div>
                    <div style={{ flex: 1, marginLeft: '12px' }}>
                        <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)' }}>High Priority Notifications</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Show previews of notifications at the top of the screen</div>
                    </div>
                    <Switch checked={highPriority} onChange={() => {
                        const newVal = !highPriority;
                        setHighPriority(newVal);
                        handleUpdateSetting('high_priority_notifications', newVal);
                        showToast(`High priority ${newVal ? 'enabled' : 'disabled'}`, 'success');
                    }} />
                </div>

                <div style={{ padding: '30px 20px', textAlign: 'center' }}>
                    <button
                        onClick={resetSettings}
                        className="btn"
                        style={{
                            background: 'var(--surface-color)',
                            border: '1.5px solid var(--border-color)',
                            padding: '12px 24px',
                            borderRadius: '24px',
                            color: 'var(--primary-color)',
                            fontWeight: 700,
                            fontSize: '14px',
                            width: 'auto',
                            margin: '0 auto'
                        }}
                    >
                        Reset All Notification Settings
                    </button>
                </div>

            </div>

            {/* Sound Selection Modal */}
            {showSoundModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: 'var(--surface-color)',
                        borderRadius: '24px',
                        width: '100%',
                        maxWidth: '340px',
                        overflow: 'hidden',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ padding: '24px 24px 16px 24px' }}>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Notification Sound</div>
                        </div>
                        <div style={{ padding: '0 8px 16px 8px', maxHeight: '300px', overflowY: 'auto' }}>
                            {soundOptions.map(option => (
                                <div
                                    key={option}
                                    onClick={() => {
                                        setNotificationSound(option);
                                        setShowSoundModal(false);
                                        handleUpdateSetting('notification_sound', option);
                                        showToast(`Notification sound set to ${option}`, 'success');
                                    }}
                                    style={{
                                        padding: '16px 16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        cursor: 'pointer',
                                        borderRadius: '12px',
                                        backgroundColor: notificationSound === option ? 'var(--secondary-color)' : 'transparent',
                                        margin: '0 8px'
                                    }}
                                >
                                    <div style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        border: `2px solid ${notificationSound === option ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {notificationSound === option && <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--primary-color)' }} />}
                                    </div>
                                    <span style={{
                                        flex: 1,
                                        fontWeight: notificationSound === option ? 600 : 500,
                                        color: notificationSound === option ? 'var(--primary-color)' : 'var(--text-primary)'
                                    }}>
                                        {option}
                                    </span>
                                    {notificationSound === option && <Check size={18} color="var(--primary-color)" />}
                                </div>
                            ))}
                        </div>
                        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)' }}>
                            <button
                                onClick={() => setShowSoundModal(false)}
                                style={{ color: 'var(--primary-color)', fontWeight: 600, background: 'none', border: 'none', fontSize: '15px', cursor: 'pointer' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SectionHeader = ({ title }: { title: string }) => (
    <div style={{
        padding: '16px 20px 8px 20px',
        fontSize: '13px',
        fontWeight: 700,
        color: 'var(--primary-color)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    }}>
        {title}
    </div>
);

const NotificationRow = ({ icon, title, value, onClick }: { icon: any, title: string, value: string, onClick?: () => void }) => (
    <div onClick={onClick} className="chat-item" style={{ padding: '16px 20px', alignItems: 'center', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}>
        <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'var(--secondary-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary-color)'
        }}>
            {icon}
        </div>
        <div style={{ flex: 1, marginLeft: '12px' }}>
            <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)' }}>{title}</div>
            <div style={{ fontSize: '13px', color: 'var(--primary-color)', fontWeight: 500 }}>{value}</div>
        </div>
        <ChevronRight size={18} color="var(--border-color)" />
    </div>
);

const NotificationToggle = ({ icon, title, subtitle, checked, onChange }: { icon: any, title: string, subtitle: string, checked: boolean, onChange: () => void }) => (
    <div className="chat-item" style={{ padding: '16px 20px', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'var(--secondary-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary-color)',
            marginRight: '12px'
        }}>
            {icon}
        </div>
        <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)' }}>{title}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>{subtitle}</div>
        </div>
        <Switch checked={checked} onChange={onChange} />
    </div>
);

const Switch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <button
        onClick={onChange}
        style={{
            width: '44px',
            height: '24px',
            borderRadius: '12px',
            backgroundColor: checked ? 'var(--primary-color)' : 'var(--border-color)',
            position: 'relative',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            flexShrink: 0,
            marginTop: '4px'
        }}
    >
        <div style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            position: 'absolute',
            top: '3px',
            left: checked ? '23px' : '3px',
            transition: 'left 0.2s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }} />
    </button>
);

export default NotificationsSettings;
