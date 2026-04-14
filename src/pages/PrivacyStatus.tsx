import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Eye, User, Info, MessageSquare, Shield, Clock, Ban, Check, Loader2 } from 'lucide-react';
import { insforge } from '../lib/insforge';
import { useCurrentUserId } from '../hooks/useCurrentUser';
import { useData } from '../context/DataContext';
import FloatingActionSheet from '../components/FloatingActionSheet';
import LoadingOverlay from '../components/LoadingOverlay';

const SettingRow = ({ icon, title, value, onClick, isLast }: { icon: any, title: string, value?: string, onClick?: () => void, isLast?: boolean }) => (
    <div
        className="settings-row ripple"
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: isLast ? 'none' : '1px solid var(--border-color)',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
        }}
    >
        <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            backgroundColor: 'var(--secondary-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary-color)',
            marginRight: '16px',
            flexShrink: 0
        }}>
            {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '2px' }}>{title}</div>
            <div style={{ fontSize: '13px', color: 'var(--primary-color)', fontWeight: 600 }}>{value}</div>
        </div>
        <ChevronRight size={18} color="var(--text-secondary)" />
    </div>
);

const Switch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <button
        onClick={onChange}
        className={`premium-switch ${checked ? 'active' : ''}`}
    >
        <div className="switch-knob" />
    </button>
);

const PrivacyStatus = () => {
    const navigate = useNavigate();
    const userId = useCurrentUserId();
    const { settings, setSettings, loading: globalLoading, executeSecurely } = useData();
    const [blockedCount, setBlockedCount] = useState(0);

    // Modal State
    const [showSelectionModal, setShowSelectionModal] = useState(false);
    const [modalConfig, setModalConfig] = useState<{
        type: string,
        title: string,
        currentValue: string,
        options: string[]
    }>({
        type: '',
        title: '',
        currentValue: '',
        options: []
    });

    useEffect(() => {
        if (!userId) return;

        const fetchData = async () => {
            await executeSecurely(async () => {
                // Fetch blocked users count
                const { count, error: countErr } = await insforge.database
                    .from('blocked_users')
                    .select('*', { count: 'exact', head: true })
                    .eq('blocker_id', userId);

                if (countErr) throw countErr;
                setBlockedCount(count || 0);
            }, 'Failed to fetch blocked users count');
        };

        fetchData();
    }, [userId, executeSecurely]);

    const handleUpdateSetting = async (key: string, value: any) => {
        if (!userId || !settings) return;

        const previousValue = settings[key];

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

        if (result === undefined) {
            // Rollback
            setSettings?.((prev: any) => ({ ...prev, [key]: previousValue }));
        }
    };

    const handleSelectionUpdate = (option: string) => {
        const typeMapping: any = {
            'lastSeen': 'last_seen',
            'profilePhoto': 'profile_photo_visibility',
            'about': 'about_visibility',
            'groups': 'groups_visibility',
            'disappearingMessages': 'disappearing_messages_duration'
        };

        const dbKey = typeMapping[modalConfig.type];
        handleUpdateSetting(dbKey, option);
        setShowSelectionModal(false);
    };

    const openModal = (type: string, title: string, currentValue: string, options = ['everyone', 'my_contacts', 'nobody']) => {
        setModalConfig({ type, title, currentValue, options });
        setShowSelectionModal(true);
    };

    if (globalLoading && !settings) {
        return (
            <div className="premium-loader">
                <Loader2 className="spinner" size={40} />
                <p>Securing your privacy...</p>
            </div>
        );
    }

    const formatValue = (value: string) => {
        switch (value) {
            case 'everyone': return 'Everyone';
            case 'my_contacts': return 'My Contacts';
            case 'nobody': return 'Nobody';
            case '24_hours': return '24 Hours';
            case '7_days': return '7 Days';
            case '90_days': return '90 Days';
            case 'off': return 'Off';
            default: return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');
        }
    };


    const currentSettings = settings || {};

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
                    margin: 0;
                    border-left: none;
                    border-right: none;
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
                    background: var(--border-color);
                    margin: 0 20px;
                }
                .premium-switch {
                    width: 48px;
                    height: 26px;
                    background: var(--border-color);
                    border-radius: 20px;
                    position: relative;
                    cursor: pointer;
                    transition: all 0.3s;
                    border: none;
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
                .encryption-banner {
                    margin: 20px;
                    background: var(--glass-bg);
                    backdrop-filter: blur(10px);
                    padding: 16px;
                    border-radius: 16px;
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                    border: 1px solid var(--glass-border);
                }
                .encryption-banner p {
                    font-size: 13px;
                    color: var(--text-secondary);
                    line-height: 1.5;
                    font-weight: 500;
                    margin: 0;
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
                .sound-option-item:hover { background: var(--secondary-color); }
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
                .sound-option-item span {
                    flex: 1;
                    font-size: 15px;
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .sound-option-item.active span { color: var(--primary-color); }
                .check-icon { color: var(--primary-color); }
                @keyframes scaleIn {
                    from { transform: scale(0); }
                    to { transform: scale(1); }
                }
            `}</style>

            <div className="screen-header">
                <div className="max-w-content" style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '16px' }}>
                    <button className="nav-icon-btn ripple" onClick={() => navigate(-1)}>
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="screen-header-title">Privacy &amp; Status</h2>
                </div>
            </div>

            <div className="profile-content" style={{ paddingBottom: '100px', paddingTop: '16px' }}>
                <div className="max-w-content">
                    {globalLoading && <LoadingOverlay message="Loading privacy settings..." />}

                    <div className="settings-group">
                        <div className="settings-group-title">Who can see my personal info</div>
                        <div className="profile-glass-card settings-card">
                            <SettingRow
                                icon={<Eye size={20} />}
                                title="Last Seen & Online"
                                value={formatValue(settings?.last_seen || 'everyone')}
                                onClick={() => openModal('lastSeen', 'Last Seen & Online', settings?.last_seen || 'everyone', ['everyone', 'my_contacts', 'nobody'])}
                            />
                            <SettingRow
                                icon={<User size={20} />}
                                title="Profile Photo"
                                value={formatValue(settings?.profile_photo_visibility || 'everyone')}
                                onClick={() => openModal('profilePhoto', 'Profile Photo', settings?.profile_photo_visibility || 'everyone', ['everyone', 'my_contacts', 'nobody'])}
                            />
                            <SettingRow
                                icon={<Info size={20} />}
                                title="About"
                                value={formatValue(settings?.about_visibility || 'everyone')}
                                onClick={() => openModal('about', 'About', settings?.about_visibility || 'everyone', ['everyone', 'my_contacts', 'nobody'])}
                            />
                            <SettingRow
                                icon={<MessageSquare size={20} />}
                                title="Groups"
                                value={formatValue(settings?.groups_visibility || 'everyone')}
                                onClick={() => openModal('groups', 'Groups', settings?.groups_visibility || 'everyone', ['everyone', 'my_contacts', 'nobody'])}
                            />
                            <SettingRow
                                icon={<Ban size={20} />}
                                title="Blocked Contacts"
                                value={blockedCount === 0 ? "None" : `${blockedCount} user${blockedCount > 1 ? 's' : ''}`}
                                onClick={() => navigate('/blocked-users')}
                                isLast
                            />
                        </div>
                    </div>

                    <div className="settings-group">
                        <div className="settings-group-title">Disappearing Messages</div>
                        <div className="profile-glass-card settings-card">
                            <SettingRow
                                icon={<Clock size={20} />}
                                title="Default Message Timer"
                                value={formatValue(settings?.disappearing_messages_duration || 'off')}
                                onClick={() => openModal('disappearingMessages', 'Default Timer', settings?.disappearing_messages_duration || 'off', ['off', '24_hours', '7_days', '90_days'])}
                                isLast
                            />
                            <div style={{ padding: '0 20px 20px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: 1.4 }}>
                                When enabled, all new individual chats will start with disappearing messages set to the duration you select.
                            </div>
                        </div>
                    </div>

                    <div className="settings-group">
                        <div className="settings-group-title">Chat & Status</div>
                        <div className="profile-glass-card settings-card">
                            <div className="privacy-toggle-item">
                                <div style={{ flex: 1 }}>
                                    <div className="toggle-title">Read Receipts</div>
                                    <div className="toggle-desc">If turned off, you won't send or receive read receipts. Receipts are always sent for groups.</div>
                                </div>
                                <Switch
                                    checked={currentSettings.read_receipts !== false}
                                    onChange={() => handleUpdateSetting('read_receipts', !(currentSettings.read_receipts !== false))}
                                />
                            </div>
                            <div className="privacy-toggle-divider" />
                            <div className="privacy-toggle-item">
                                <div style={{ flex: 1 }}>
                                    <div className="toggle-title">Active Status</div>
                                    <div className="toggle-desc">Show when you're active or were recently active on Masum Chat.</div>
                                </div>
                                <Switch
                                    checked={currentSettings.active_status !== false}
                                    onChange={() => handleUpdateSetting('active_status', !(currentSettings.active_status !== false))}
                                />
                            </div>
                            <div className="privacy-toggle-divider" />
                            <div className="privacy-toggle-item" style={{ borderBottom: 'none' }}>
                                <div style={{ flex: 1 }}>
                                    <div className="toggle-title">Security Notifications</div>
                                    <div className="toggle-desc">Get notified when your security code changes for any of your contacts.</div>
                                </div>
                                <Switch
                                    checked={currentSettings.security_notifications !== false}
                                    onChange={() => handleUpdateSetting('security_notifications', !(currentSettings.security_notifications !== false))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="encryption-banner">
                        <Shield size={24} color="var(--primary-color)" />
                        <p>
                            Your privacy is our priority. Masum Chat uses end-to-end encryption. Only you and the people you talk to can read or listen to them.
                        </p>
                    </div>
                </div>
            </div>

            <FloatingActionSheet
                isOpen={showSelectionModal}
                onClose={() => setShowSelectionModal(false)}
                title={modalConfig.title}
            >
                <div className="sound-options-list" style={{ padding: '10px 0' }}>
                    {modalConfig.options.map(option => (
                        <button
                            key={option}
                            className={`sound-option-item ${modalConfig.currentValue === option ? 'active' : ''}`}
                            onClick={() => handleSelectionUpdate(option)}
                        >
                            <div className="radio-circle">
                                {modalConfig.currentValue === option && <div className="radio-dot" />}
                            </div>
                            <span>{formatValue(option)}</span>
                            {modalConfig.currentValue === option && <Check size={18} className="check-icon" />}
                        </button>
                    ))}
                </div>
            </FloatingActionSheet>
        </div>
    );
};

export default PrivacyStatus;
