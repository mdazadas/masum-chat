import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
    ArrowLeft,
    Ban,
    Bell,
    Palette,
    HelpCircle,
    LogOut,
    Trash2,
    ChevronRight,
    Key,
    Info,
    User,
    ShieldCheck
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
        setShowLogoutConfirm(false);
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

            const { error } = await insforge.database
                .from('profiles')
                .update({
                    deleted_at: new Date().toISOString(),
                    bio: 'This account has been deleted'
                })
                .eq('id', userId);

            if (error) throw error;

            showToast('Account successfully deleted. You will be redirected...', 'success');

            setTimeout(async () => {
                await insforge.auth.signOut();
                localStorage.clear();
                sessionStorage.clear();
                window.location.replace('/');
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
                .logout-btn-premium {
                    margin: 24px auto 12px;
                    max-width: 320px;
                    width: 100%;
                    background: rgba(220, 53, 69, 0.1);
                    border: 1px solid rgba(220, 53, 69, 0.2);
                    color: #dc3545;
                    font-weight: 700;
                    padding: 16px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    transition: all 0.2s;
                }
                .logout-btn-premium:active { transform: scale(0.98); background: rgba(220, 53, 69, 0.2); }
                
                .delete-btn-premium {
                    margin: 0 auto 24px;
                    max-width: 320px;
                    width: 100%;
                    background: transparent;
                    color: #dc3545;
                    font-size: 13px;
                    font-weight: 600;
                    padding: 12px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    opacity: 0.7;
                    transition: all 0.2s;
                    border: 1px dashed rgba(220, 53, 69, 0.2);
                }
                .delete-btn-premium:active { opacity: 1; background: rgba(220, 53, 69, 0.05); }

                .modal-premium {
                    background: var(--surface-color);
                    backdrop-filter: blur(20px);
                    border: 1.5px solid var(--border-color);
                    border-radius: 28px;
                    padding: 32px 24px;
                    width: 90%;
                    max-width: 360px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.25);
                    text-align: center;
                    animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                @keyframes modalIn {
                    from { transform: scale(0.9) translateY(20px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }
            `}</style>

            <div className="profile-nav glass-header">
                <div className="max-w-content" style={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%', gap: '16px', padding: '0 16px' }}>
                    <button className="nav-icon-btn ripple" onClick={() => navigate('/home')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowLeft size={24} />
                    </button>
                    <span className="profile-nav-title" style={{ margin: 0, fontSize: '20px', color: 'var(--primary-dark)', fontWeight: 800 }}>Settings</span>
                </div>
            </div>

            <div className="profile-content" style={{ paddingBottom: '100px' }}>
                <div className="max-w-content">
                    {actionLoading && <LoadingOverlay message={loadingMessage} transparent />}

                    {/* Profile Preview Card */}
                    <div
                        className="profile-glass-card ripple"
                        style={{ margin: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
                        onClick={() => navigate('/profile/me')}
                    >
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            <Avatar
                                src={userData.avatar_url}
                                name={userData.name}
                                size={64}
                                style={{ border: '3px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <div style={{
                                position: 'absolute', bottom: 0, right: 0,
                                width: '22px', height: '22px', borderRadius: '50%',
                                background: 'var(--primary-color)', border: '3px solid white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                            }}>
                                <User size={12} strokeWidth={3} />
                            </div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userData.name}</div>
                            <div style={{ fontSize: '13px', color: 'var(--primary-color)', fontWeight: 700, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{userData.username}</div>
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {userData.bio || 'Available'}
                            </div>
                        </div>
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: 'var(--primary-light)', color: 'var(--primary-color)', flexShrink: 0,
                            boxShadow: '0 2px 8px rgba(0, 168, 132, 0.2)', transition: 'transform 0.2s'
                        }}>
                            <ChevronRight size={22} strokeWidth={2.5} />
                        </div>
                    </div>

                    {/* Security & Account Group */}
                    <div className="settings-group">
                        <div className="settings-group-title">Security & Account</div>
                        <div className="profile-glass-card settings-card">
                            <SettingRow
                                icon={<Key size={20} />}
                                title="Change Password"
                                subtitle="Update your security credentials"
                                onClick={() => navigate('/change-password')}
                            />
                            <SettingRow
                                icon={<ShieldCheck size={20} />}
                                title="Privacy & Status"
                                subtitle="Visibility and active status"
                                onClick={() => navigate('/privacy-status')}
                            />
                            <SettingRow
                                icon={<Ban size={20} />}
                                title="Blocked Contacts"
                                subtitle="Manage restricted users"
                                onClick={() => navigate('/blocked-users')}
                                isLast
                            />
                        </div>
                    </div>

                    {/* Notifications & Display Group */}
                    <div className="settings-group">
                        <div className="settings-group-title">Preferences</div>
                        <div className="profile-glass-card settings-card">
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
                                isLast
                            />
                        </div>
                    </div>

                    {/* Support & Legal Group */}
                    <div className="settings-group">
                        <div className="settings-group-title">Information & Support</div>
                        <div className="profile-glass-card settings-card">
                            <SettingRow
                                icon={<HelpCircle size={20} />}
                                title="Help Center"
                                subtitle="FAQs and support info"
                                onClick={() => navigate('/help-center')}
                            />
                            <SettingRow
                                icon={<Info size={20} />}
                                title="About Masum Chat"
                                subtitle="Version, licensing & developer"
                                onClick={() => navigate('/about')}
                                isLast
                            />
                        </div>
                    </div>

                    {/* Account Actions */}
                    <button className="logout-btn-premium ripple" onClick={() => setShowLogoutConfirm(true)}>
                        <LogOut size={18} strokeWidth={2.5} /> Logout from Account
                    </button>
                    <button className="delete-btn-premium ripple" onClick={() => setShowDeleteConfirm(true)}>
                        <Trash2 size={16} /> Delete Account Permanently
                    </button>
                </div>
            </div>

            {/* Logout Modal */}
            {showLogoutConfirm && createPortal(
                <div className="overlay-backdrop" style={{ zIndex: 3000, position: 'fixed', inset: 0, transform: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)' }} onClick={() => setShowLogoutConfirm(false)}>
                    <div className="modal-premium" onClick={(e) => e.stopPropagation()}>
                        <div className="empty-icon-box" style={{ margin: '0 auto 24px', background: 'rgba(220, 53, 69, 0.1)', color: '#dc3545' }}>
                            <LogOut size={32} />
                        </div>
                        <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>Logout?</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '15px', fontWeight: 500, lineHeight: 1.5 }}>
                            Are you sure you want to end your current session on Masum Chat?
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    borderRadius: '16px',
                                    fontWeight: 700,
                                    fontSize: '15px',
                                    backgroundColor: 'transparent',
                                    border: '1.5px solid var(--border-color)',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer'
                                }}
                                onClick={() => setShowLogoutConfirm(false)}
                                disabled={actionLoading}
                            >Cancel</button>
                            <button
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    borderRadius: '16px',
                                    fontWeight: 700,
                                    fontSize: '15px',
                                    border: 'none',
                                    backgroundColor: '#dc3545',
                                    color: '#ffffff',
                                    cursor: 'pointer'
                                }}
                                onClick={handleLogout}
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Logging out...' : 'Logout'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Modal */}
            {showDeleteConfirm && createPortal(
                <div className="overlay-backdrop" style={{ zIndex: 3000, position: 'fixed', inset: 0, transform: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)' }} onClick={() => setShowDeleteConfirm(false)}>
                    <div className="modal-premium" onClick={(e) => e.stopPropagation()}>
                        <div className="empty-icon-box" style={{ margin: '0 auto 24px', background: 'rgba(220, 53, 69, 0.1)', color: '#dc3545' }}>
                            <Trash2 size={32} />
                        </div>
                        <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#dc3545', marginBottom: '12px' }}>Delete Account?</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '15px', fontWeight: 500, lineHeight: 1.5 }}>
                            This action is irreversible. To confirm, please type your username: <strong style={{ color: 'var(--text-primary)' }}>{userData.username}</strong>
                        </p>
                        <input
                            type="text"
                            placeholder="Enter username"
                            value={deleteUsername}
                            onChange={(e) => setDeleteUsername(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '14px',
                                border: '2px solid var(--border-color)',
                                marginBottom: '24px',
                                textAlign: 'center',
                                outline: 'none',
                                fontSize: '15px',
                                fontWeight: 700,
                                background: 'var(--background-color)',
                                color: 'var(--text-primary)'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    borderRadius: '16px',
                                    fontWeight: 700,
                                    fontSize: '15px',
                                    backgroundColor: 'transparent',
                                    border: '1.5px solid var(--border-color)',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer'
                                }}
                                onClick={() => setShowDeleteConfirm(false)}
                            >Cancel</button>
                            <button
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    borderRadius: '16px',
                                    fontWeight: 700,
                                    fontSize: '15px',
                                    border: 'none',
                                    backgroundColor: '#dc3545',
                                    color: '#ffffff',
                                    cursor: deleteUsername === userData.username ? 'pointer' : 'not-allowed',
                                    opacity: deleteUsername === userData.username ? 1 : 0.5,
                                    boxShadow: deleteUsername === userData.username ? '0 8px 16px rgba(220, 53, 69, 0.25)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                                disabled={deleteUsername !== userData.username}
                                onClick={handleDeleteAccount}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <BottomNav activeTab="settings" />
        </div>
    );
};

const SettingRow = ({ icon, title, subtitle, onClick, isLast }: { icon: any, title: string, subtitle: string, onClick?: () => void, isLast?: boolean }) => (
    <div
        onClick={onClick}
        className="ripple"
        style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: isLast ? 'none' : '1px solid rgba(0,0,0,0.05)',
            gap: '16px',
            cursor: 'pointer'
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
            flexShrink: 0
        }}>
            {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '2px' }}>{title}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{subtitle}</div>
        </div>
        <ChevronRight size={18} color="rgba(0,0,0,0.2)" />
    </div>
);

export default Settings;
