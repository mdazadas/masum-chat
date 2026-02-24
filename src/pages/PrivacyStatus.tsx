import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Eye, User, Info, MessageSquare, ShieldCheck, Clock, Ban, X, Check } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { insforge } from '../lib/insforge';
import { useCurrentUserId } from '../hooks/useCurrentUser';
import LoadingOverlay from '../components/LoadingOverlay';
import { useData } from '../context/DataContext';

const PrivacyStatus = () => {
    const navigate = useNavigate();
    const userId = useCurrentUserId();
    const { showToast } = useToast();
    const { settings, setSettings, refreshSettings } = useData();
    const [loading, setLoading] = useState(!settings);
    const [actionLoading, setActionLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

    // Privacy States
    const [lastSeen, setLastSeen] = useState('My Contacts');
    const [profilePhoto, setProfilePhoto] = useState('Everyone');
    const [about, setAbout] = useState('My Contacts');
    const [groups, setGroups] = useState('My Contacts');
    const [disappearingMessages, setDisappearingMessages] = useState('Off');

    // Toggle States
    const [readReceipts, setReadReceipts] = useState(true);
    const [activeStatus, setActiveStatus] = useState(true);
    const [securityNotifications, setSecurityNotifications] = useState(true);

    // Modal State
    const [activeModal, setActiveModal] = useState<{
        type: 'lastSeen' | 'profilePhoto' | 'about' | 'groups' | 'disappearingMessages' | null,
        title: string,
        currentValue: string,
        options: string[]
    }>({
        type: null,
        title: '',
        currentValue: '',
        options: []
    });

    const [blockedCount, setBlockedCount] = useState(0);

    useEffect(() => {
        if (!userId) return;

        const syncSettings = () => {
            if (settings) {
                setLastSeen(settings.last_seen || 'Everyone');
                setProfilePhoto(settings.profile_photo_visibility || 'Everyone');
                setAbout(settings.about_visibility || 'Everyone');
                setGroups(settings.groups_visibility || 'Everyone');
                setDisappearingMessages(settings.disappearing_messages_duration || 'Off');
                setReadReceipts(settings.read_receipts !== false);
                setActiveStatus(settings.active_status !== false);
                setSecurityNotifications(settings.security_notifications !== false);
            }
        };

        const fetchData = async () => {
            if (!settings) setLoading(true);
            try {
                await refreshSettings();

                // Fetch blocked users count (not in global context yet)
                const { count } = await insforge.database
                    .from('blocked_users')
                    .select('*', { count: 'exact', head: true })
                    .eq('blocker_id', userId);

                setBlockedCount(count || 0);
            } catch (err) {
                console.error("Error fetching privacy data:", err);
            } finally {
                setLoading(false);
            }
        };

        syncSettings();
        fetchData();
    }, [userId, settings, refreshSettings]);

    const handleUpdateSetting = async (key: string, value: any, silent = false) => {
        if (!userId) return;
        if (!silent) {
            setActionLoading(true);
            setLoadingMessage('Updating...');
        }
        try {
            const { error } = await insforge.database
                .from('user_settings')
                .upsert({ user_id: userId, [key]: value });
            if (error) throw error;

            // Update context
            setSettings?.((prev: any) => ({ ...prev, [key]: value }));
        } catch (err) {
            console.error(`Error updating setting ${key}:`, err);
            showToast('Failed to update setting', 'error');
        } finally {
            if (!silent) setActionLoading(false);
        }
    };

    const handleBack = () => navigate(-1);

    const openModal = (type: 'lastSeen' | 'profilePhoto' | 'about' | 'groups', title: string, currentValue: string) => {
        const options = ['Everyone', 'My Contacts', 'Nobody'];
        setActiveModal({ type, title, currentValue, options });
    };

    const selectOption = async (option: string) => {
        const typeMapping: any = {
            'lastSeen': 'last_seen',
            'profilePhoto': 'profile_photo_visibility',
            'about': 'about_visibility',
            'groups': 'groups_visibility',
            'disappearingMessages': 'disappearing_messages_duration'
        };

        const dbKey = typeMapping[activeModal.type as string];

        if (activeModal.type === 'lastSeen') setLastSeen(option);
        else if (activeModal.type === 'profilePhoto') setProfilePhoto(option);
        else if (activeModal.type === 'about') setAbout(option);
        else if (activeModal.type === 'groups') setGroups(option);
        else if (activeModal.type === 'disappearingMessages') setDisappearingMessages(option);

        await handleUpdateSetting(dbKey, option);

        showToast(`${activeModal.title} updated to ${option}`, 'success');
        setActiveModal({ ...activeModal, type: null, title: '', currentValue: '', options: [] });
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
                    <div className="top-nav-title">Privacy & Status</div>
                </div>
            </nav>

            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px' }}>

                <div style={{
                    padding: '20px 20px 10px 20px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--primary-color)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    Who can see my personal info
                </div>

                <PrivacyRow
                    icon={<Eye size={20} />}
                    title="Last Seen & Online"
                    value={lastSeen}
                    onClick={() => openModal('lastSeen', 'Last Seen & Online', lastSeen)}
                />
                <PrivacyRow
                    icon={<User size={20} />}
                    title="Profile Photo"
                    value={profilePhoto}
                    onClick={() => openModal('profilePhoto', 'Profile Photo', profilePhoto)}
                />
                <PrivacyRow
                    icon={<Info size={20} />}
                    title="About"
                    value={about}
                    onClick={() => openModal('about', 'About', about)}
                />
                <PrivacyRow
                    icon={<MessageSquare size={20} />}
                    title="Groups"
                    value={groups}
                    onClick={() => openModal('groups', 'Groups', groups)}
                />
                <PrivacyRow
                    icon={<Ban size={20} />}
                    title="Blocked Contacts"
                    value={`${blockedCount} users`}
                    onClick={() => navigate('/blocked-users')}
                />
                <PrivacyRow
                    icon={<Clock size={20} />}
                    title="Disappearing Messages"
                    value={disappearingMessages}
                    onClick={() => {
                        const options = ['Off', '24 Hours', '7 Days', '90 Days'];
                        setActiveModal({ type: 'disappearingMessages', title: 'Disappearing Messages', currentValue: disappearingMessages, options });
                    }}
                />

                <div style={{ height: '8px', backgroundColor: 'var(--secondary-color)', marginTop: '10px' }}></div>

                <div style={{
                    padding: '20px 20px 10px 20px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--primary-color)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    Chat & Status
                </div>

                <div className="chat-item" style={{ alignItems: 'flex-start', padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)' }}>Read Receipts</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                            If turned off, you won't send or receive read receipts. Read receipts are always sent for group chats.
                        </div>
                    </div>
                    <Switch checked={readReceipts} onChange={() => {
                        const newVal = !readReceipts;
                        setReadReceipts(newVal);
                        handleUpdateSetting('read_receipts', newVal);
                        showToast(`Read receipts ${newVal ? 'enabled' : 'disabled'}`, 'success');
                    }} />
                </div>

                <div className="chat-item" style={{ alignItems: 'flex-start', padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)' }}>Active Status</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                            Show when you're active or were recently active on Masum Chat.
                        </div>
                    </div>
                    <Switch checked={activeStatus} onChange={() => {
                        const newVal = !activeStatus;
                        setActiveStatus(newVal);
                        handleUpdateSetting('active_status', newVal);
                        showToast(`Active status ${newVal ? 'enabled' : 'disabled'}`, 'success');
                    }} />
                </div>

                <div className="chat-item" style={{ alignItems: 'flex-start', padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)' }}>Security Notifications</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                            Get notified when your security code changes for any of your contacts.
                        </div>
                    </div>
                    <Switch checked={securityNotifications} onChange={() => {
                        const newVal = !securityNotifications;
                        setSecurityNotifications(newVal);
                        handleUpdateSetting('security_notifications', newVal);
                        showToast(`Security notifications ${newVal ? 'enabled' : 'disabled'}`, 'success');
                    }} />
                </div>

                <div style={{ height: '8px', backgroundColor: 'var(--secondary-color)', marginTop: '10px' }}></div>

                <div style={{
                    padding: '20px 20px 10px 20px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--primary-color)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    Encryption & Transparency
                </div>

                <div style={{ padding: '0 20px 20px 20px' }}>
                    <div style={{
                        backgroundColor: 'var(--secondary-color)',
                        padding: '16px',
                        borderRadius: '12px',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start'
                    }}>
                        <ShieldCheck size={24} color="var(--primary-color)" style={{ flexShrink: 0 }} />
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Your privacy is our priority. Masum Chat uses end-to-end encryption for all personal messages and calls. Only you and the person you're communicating with can read or listen to them.
                        </div>
                    </div>
                </div>

            </div>

            {/* Selection Modal */}
            {activeModal.type && (
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
                        <div style={{ padding: '24px 24px 16px 24px', position: 'relative' }}>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{activeModal.title}</div>
                            <button
                                onClick={() => setActiveModal({ ...activeModal, type: null })}
                                style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-secondary)' }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{ padding: '0 8px 16px 8px' }}>
                            {activeModal.options.map(option => (
                                <div
                                    key={option}
                                    onClick={() => selectOption(option)}
                                    style={{
                                        padding: '16px 16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        cursor: 'pointer',
                                        borderRadius: '12px',
                                        backgroundColor: activeModal.currentValue === option ? 'var(--secondary-color)' : 'transparent',
                                        margin: '0 8px'
                                    }}
                                >
                                    <div style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        border: `2px solid ${activeModal.currentValue === option ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {activeModal.currentValue === option && <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--primary-color)' }} />}
                                    </div>
                                    <span style={{
                                        flex: 1,
                                        fontWeight: activeModal.currentValue === option ? 600 : 500,
                                        color: activeModal.currentValue === option ? 'var(--primary-color)' : 'var(--text-primary)'
                                    }}>
                                        {option}
                                    </span>
                                    {activeModal.currentValue === option && <Check size={18} color="var(--primary-color)" />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const PrivacyRow = ({ icon, title, value, onClick }: { icon: any, title: string, value: string, onClick?: () => void }) => (
    <div
        onClick={onClick}
        className="chat-item"
        style={{
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            cursor: 'pointer'
        }}
    >
        <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'var(--secondary-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)'
        }}>
            {icon}
        </div>
        <div style={{ flex: 1, marginLeft: '4px' }}>
            <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)' }}>{title}</div>
            <div style={{ fontSize: '13px', color: 'var(--primary-color)', fontWeight: 500 }}>{value}</div>
        </div>
        <ChevronRight size={18} color="var(--border-color)" />
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

export default PrivacyStatus;
