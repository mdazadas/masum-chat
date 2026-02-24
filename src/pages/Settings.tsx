import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Shield,
    Ban,
    Bell,
    Palette,
    HelpCircle,
    LogOut,
    Trash2,
    ChevronRight,
    Key,
    Info
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { insforge } from '../lib/insforge';
import { useCurrentUserId } from '../hooks/useCurrentUser';
import Avatar from '../components/Avatar';
import BottomNav from '../components/BottomNav';
import LoadingOverlay from '../components/LoadingOverlay';
import { useData } from '../context/DataContext';

const Settings = () => {
    const navigate = useNavigate();
    const userId = useCurrentUserId();
    const { showToast } = useToast();
    const { profileData: globalProfile, refreshProfile } = useData();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteUsername, setDeleteUsername] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

    useEffect(() => {
        if (!userId || globalProfile) return;
        refreshProfile();
    }, [userId, globalProfile, refreshProfile]);

    const handleLogout = async () => {
        setShowLogoutConfirm(false); // Close modal immediately
        setActionLoading(true);
        setLoadingMessage('Logging out...');
        try {
            await insforge.auth.signOut();
            localStorage.clear();
            sessionStorage.clear();
            showToast('Logged out successfully', 'info');
            setTimeout(() => { window.location.replace('/'); }, 500);
        } catch (err) {
            console.error('Logout error:', err);
            localStorage.clear();
            sessionStorage.clear();
            window.location.replace('/');
        }
    };

    const handleDeleteAccount = async () => {
        if (!userId) return;
        try {
            setActionLoading(true);
            setLoadingMessage('Deleting account...');
            const { error: profileError } = await insforge.database
                .from('profiles')
                .update({ deleted_at: new Date().toISOString(), bio: 'This account has been deleted' })
                .eq('id', userId);

            if (profileError) throw profileError;

            showToast('Account successfully deleted. You will be redirected...', 'success');

            // Wait a bit for feedback
            setTimeout(async () => {
                await insforge.auth.signOut();
                navigate('/');
            }, 3000);
        } catch (err) {
            console.error("Delete account error:", err);
            showToast('Failed to delete account', 'error');
            setActionLoading(false);
        }
        setShowDeleteConfirm(false);
    };

    const userData = globalProfile || {
        name: "User",
        username: "user",
        bio: "Available",
        avatar_url: null
    };

    return (
        <div className="home-container" style={{ backgroundColor: 'var(--surface-color)' }}>
            {/* Header - Unified with Home/Calls */}
            <nav className="top-nav">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        className="nav-icon-btn"
                        onClick={() => navigate('/home')}
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="top-nav-title">Settings</div>
                </div>
            </nav>

            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px', position: 'relative' }}>
                {actionLoading && <LoadingOverlay message={loadingMessage} transparent />}

                {/* Profile Section - Consistent with MyProfile */}
                <div
                    onClick={() => navigate('/profile/me')}
                    style={{
                        padding: '24px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        borderBottom: '8px solid var(--secondary-color)',
                        cursor: 'pointer'
                    }}
                >
                    <Avatar
                        src={userData.avatar_url}
                        name={userData.name}
                        size={64}
                        style={{ border: '2px solid var(--border-color)' }}
                    />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{userData.name}</div>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{userData.bio || 'Available'}</div>
                    </div>
                    <ChevronRight size={20} color="var(--text-secondary)" />
                </div>

                {/* Settings Groups */}
                <div style={{ backgroundColor: 'var(--surface-color)' }}>
                    {/* Security & Account */}
                    <div style={{
                        padding: '16px 20px 8px 20px',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--primary-color)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Security & Account
                    </div>
                    <SettingRow
                        icon={<Key size={20} />}
                        title="Change Password"
                        subtitle="Protect your account with a new password"
                        onClick={() => navigate('/change-password')}
                    />
                    <SettingRow
                        icon={<Shield size={20} />}
                        title="Privacy & Status"
                        subtitle="Manage visibility and active status"
                        onClick={() => navigate('/privacy-status')}
                    />
                    <SettingRow
                        icon={<Ban size={20} />}
                        title="Blocked Contacts"
                        subtitle="Manage blocked users list"
                        onClick={() => navigate('/blocked-users')}
                    />

                    <div style={{ height: '8px', backgroundColor: 'var(--secondary-color)' }}></div>

                    {/* Notifications & Display */}
                    <div style={{
                        padding: '16px 20px 8px 20px',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--primary-color)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Notifications & Display
                    </div>
                    <SettingRow
                        icon={<Bell size={20} />}
                        title="Notifications"
                        subtitle="Alerts, sounds & previews"
                        onClick={() => navigate('/notifications-settings')}
                    />
                    <SettingRow
                        icon={<Palette size={20} />}
                        title="Theme & Appearance"
                        subtitle="Dark mode and color options"
                        onClick={() => navigate('/theme-appearance')}
                    />

                    <div style={{ height: '8px', backgroundColor: 'var(--secondary-color)' }}></div>

                    {/* Support & Legal */}
                    <div style={{
                        padding: '16px 20px 8px 20px',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--primary-color)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Information & Support
                    </div>
                    <SettingRow
                        icon={<HelpCircle size={20} />}
                        title="Help Center"
                        subtitle="FAQs and contact info"
                        onClick={() => navigate('/help-center')}
                    />
                    <SettingRow
                        icon={<Info size={20} />}
                        title="About Masum Chat"
                        subtitle="Version, licensing and developer"
                        onClick={() => navigate('/about')}
                    />
                </div>

                {/* Account Actions */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="btn btn-outline"
                        style={{
                            color: '#dc3545',
                            borderColor: '#dc3545',
                            background: 'var(--surface-color)',
                            padding: '12px',
                            fontWeight: 600
                        }}
                    >
                        <LogOut size={18} /> Logout
                    </button>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="btn"
                        style={{
                            backgroundColor: 'var(--surface-color)',
                            border: '1px solid var(--border-color)',
                            color: '#dc3545',
                            padding: '12px',
                            fontWeight: 600
                        }}
                    >
                        <Trash2 size={18} /> Delete Account Permanently
                    </button>
                </div>
            </div>

            {/* Logout Modal */}
            {showLogoutConfirm && (
                <div className="overlay-backdrop">
                    <div className="context-menu-card" style={{ padding: '24px', width: '85%', maxWidth: '340px', backgroundColor: 'var(--surface-color)' }}>
                        <h3 style={{ marginBottom: '12px' }}>Logout?</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>Are you sure you want to logout from Masum Chat?</p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                className="btn btn-outline"
                                style={{ flex: 1, padding: '10px', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}
                                onClick={() => setShowLogoutConfirm(false)}
                                disabled={actionLoading}
                            >Cancel</button>
                            <button
                                className="btn btn-primary"
                                style={{ flex: 1, padding: '10px', backgroundColor: '#dc3545', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                onClick={handleLogout}
                                disabled={actionLoading}
                            >
                                {actionLoading ? (
                                    <>
                                        <span style={{
                                            display: 'inline-block', width: '16px', height: '16px',
                                            border: '2px solid rgba(255,255,255,0.3)',
                                            borderTopColor: '#ffffff',
                                            borderRadius: '50%',
                                            animation: 'spin 0.8s linear infinite'
                                        }} />
                                        Logging out...
                                    </>
                                ) : 'Logout'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteConfirm && (
                <div className="overlay-backdrop">
                    <div className="context-menu-card" style={{ padding: '24px', width: '85%', maxWidth: '340px', backgroundColor: 'var(--surface-color)' }}>
                        <h3 style={{ marginBottom: '12px', color: '#dc3545' }}>Delete Account?</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
                            This is permanent. Type your username <strong>{userData.username}</strong> to confirm.
                        </p>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Enter username"
                            value={deleteUsername}
                            onChange={(e) => setDeleteUsername(e.target.value)}
                            style={{ margin: 0, padding: '12px' }}
                        />
                        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                            <button className="btn btn-outline" style={{ flex: 1, padding: '10px', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                            <button
                                className="btn btn-primary"
                                style={{ flex: 1, padding: '10px', backgroundColor: '#dc3545', color: '#ffffff', opacity: deleteUsername === userData.username ? 1 : 0.5 }}
                                disabled={deleteUsername !== userData.username}
                                onClick={handleDeleteAccount}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav activeTab="settings" />
        </div>
    );
};

const SettingRow = ({ icon, title, subtitle, onClick }: { icon: any, title: string, subtitle: string, onClick?: () => void }) => (
    <div
        onClick={onClick}
        className="chat-item"
        style={{
            alignItems: 'center',
            padding: '12px 20px',
            borderBottom: '1px solid var(--border-color)'
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
            color: 'var(--primary-color)'
        }}>
            {icon}
        </div>
        <div style={{ flex: 1, marginLeft: '4px' }}>
            <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)' }}>{title}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{subtitle}</div>
        </div>
        <ChevronRight size={18} color="var(--border-color)" />
    </div>
);

export default Settings;
