import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Ban, Trash2, Mail, Phone, Video } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { insforge } from '../lib/insforge';
import { useCurrentUserId } from '../hooks/useCurrentUser';
import LoadingOverlay from '../components/LoadingOverlay';
import BlurImage from '../components/BlurImage';
import { useData } from '../context/DataContext';

const UserProfile = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const userId = useCurrentUserId();
    const { showToast } = useToast();
    const { profileData, refreshProfile } = useData();
    const [showBlockConfirm, setShowBlockConfirm] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);
    const isMe = username === 'me' || username === profileData?.username;
    const [profile, setProfile] = useState<any>(isMe ? profileData : null);
    const [loading, setLoading] = useState(!profile);
    const [actionLoading, setActionLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (isMe) {
                if (!profileData) setLoading(true);
                try {
                    const data = await refreshProfile();
                    if (data && JSON.stringify(data) !== JSON.stringify(profile)) {
                        setProfile(data);
                    }
                } catch (err) {
                    console.error("Error refreshing own profile:", err);
                } finally {
                    setLoading(false);
                }
                return;
            }

            setLoading(true);
            try {
                const { data: dataArr } = await insforge.database
                    .from('profiles')
                    .select('*')
                    .eq('username', username);

                const data = dataArr?.[0];

                if (data) setProfile(data);
            } catch (err) {
                console.error("Error fetching user profile:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [username, isMe, profileData, refreshProfile]);

    const handleBlockUser = async () => {
        if (!userId || !profile) return;
        setActionLoading(true);
        setLoadingMessage('Blocking user...');
        try {
            const { error } = await insforge.database
                .from('blocked_users')
                .upsert({
                    blocker_id: userId,
                    blocked_id: profile.id
                });

            if (error) throw error;
            showToast(`${profile.name || username} has been blocked`, 'error');
            navigate('/home');
        } catch (err) {
            showToast('Failed to block user', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--surface-color)', gap: '16px' }}>
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', animation: 'pulse 2s infinite' }}>Loading profile...</p>
            </div>
        );
    }

    const user = profile || {
        name: username || "Unknown User",
        username: username || "unknown",
        avatar_url: null,
        bio: "Hey there! I am using Masum Chat.",
        email: 'N/A',
        created_at: new Date().toISOString()
    };

    return (
        <div className="profile-container" style={{ position: 'relative' }}>
            {actionLoading && <LoadingOverlay message={loadingMessage} transparent />}
            {loading && <LoadingOverlay transparent />}
            {/* Header Nav */}
            <div className="profile-nav">
                <button className="nav-icon-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <h3>Contact Info</h3>
            </div>

            <div className="profile-content">
                {/* Profile Header */}
                <div className="profile-header" style={{ padding: '20px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ position: 'relative', margin: '0 auto', width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden' }} onClick={() => setIsPhotoPreviewOpen(true)}>
                        <BlurImage
                            src={user.avatar_url}
                            alt={user.name}
                            style={{ cursor: 'pointer', transition: 'transform 0.2s', width: '120px', height: '120px' }}
                        />
                    </div>
                    <div className="profile-main-info" style={{ marginTop: '16px' }}>
                        <h2 style={{ fontSize: '22px', fontWeight: 800 }}>{user.name}</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>@{user.username}</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
                            Joined {new Date(user.created_at).toLocaleDateString([], { month: 'long', year: 'numeric' })}
                        </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={() => navigate(`/chat/${user.username}`)}>
                            <div style={{ padding: '14px', background: 'var(--secondary-color)', color: 'var(--primary-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MessageSquare size={24} />
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-color)' }}>Message</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={() => navigate(`/call/${user.username}?type=voice`)}>
                            <div style={{ padding: '14px', background: 'var(--secondary-color)', color: 'var(--primary-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Phone size={24} />
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-color)' }}>Audio</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={() => navigate(`/call/${user.username}?type=video`)}>
                            <div style={{ padding: '14px', background: 'var(--secondary-color)', color: 'var(--primary-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Video size={24} />
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-color)' }}>Video</span>
                        </div>
                    </div>
                </div>

                {/* Media Section */}
                <div className="profile-section" style={{ padding: '16px 20px', borderBottom: '8px solid var(--secondary-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Media, links, and docs</span>
                        </div>
                        <div
                            onClick={() => navigate(`/media/${user.username}`)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', fontSize: '14px', cursor: 'pointer' }}
                        >
                            <span>0</span>
                            <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                        </div>
                    </div>
                    <div style={{ padding: '8px 0', fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                        No media shared yet
                    </div>
                </div>

                {/* Details */}
                <div className="profile-section">
                    <div className="profile-row">
                        <div className="profile-row-label">About</div>
                        <div className="profile-row-value">{user.bio || 'Hey there! I am using Masum Chat.'}</div>
                    </div>

                    <div className="profile-row">
                        <div className="profile-row-label">Username</div>
                        <div className="profile-row-value">@{user.username}</div>
                        <Mail size={18} style={{ position: 'absolute', right: '28px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                    </div>
                </div>

                {/* Actions */}
                <div className="profile-actions">
                    <button
                        className="btn-danger-outline"
                        onClick={() => setShowBlockConfirm(true)}
                    >
                        <Ban size={20} /> Block {user.name}
                    </button>
                    <button
                        className="btn-danger-outline"
                        style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                        onClick={() => setShowClearConfirm(true)}
                    >
                        <Trash2 size={20} /> Clear Chat
                    </button>
                </div>

                {/* Block Confirmation Modal */}
                {showBlockConfirm && (
                    <div className="overlay-backdrop" style={{ zIndex: 3000 }}>
                        <div className="context-menu-card" style={{ padding: '24px', width: '85%', maxWidth: '340px', backgroundColor: 'var(--surface-color)' }}>
                            <h3 style={{ marginBottom: '12px' }}>Block {user.name}?</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                                Blocked contacts will no longer be able to call you or send you messages.
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="btn btn-outline" style={{ flex: 1, padding: '10px', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }} onClick={() => setShowBlockConfirm(false)}>Cancel</button>
                                <button className="btn btn-primary" style={{ flex: 1, padding: '10px', backgroundColor: '#dc3545', color: '#ffffff' }} onClick={handleBlockUser}>Block</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Clear Chat Confirmation Modal */}
                {showClearConfirm && (
                    <div className="overlay-backdrop" style={{ zIndex: 3000 }}>
                        <div className="context-menu-card" style={{ padding: '24px', width: '85%', maxWidth: '340px', backgroundColor: 'var(--surface-color)' }}>
                            <h3 style={{ marginBottom: '12px' }}>Clear Chat?</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                                Are you sure you want to clear all messages in this chat? This cannot be undone.
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="btn btn-outline" style={{ flex: 1, padding: '10px', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }} onClick={() => setShowClearConfirm(false)}>Cancel</button>
                                <button className="btn btn-primary" style={{ flex: 1, padding: '10px', backgroundColor: '#dc3545', color: '#ffffff' }} onClick={() => {
                                    showToast('Chat cleared', 'info');
                                    setShowClearConfirm(false);
                                }}>Clear</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Photo Preview Modal */}
                {isPhotoPreviewOpen && (
                    <div
                        className="overlay-backdrop"
                        style={{ zIndex: 4000, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => setIsPhotoPreviewOpen(false)}
                    >
                        <div style={{ position: 'relative', width: '100%', maxWidth: '400px', aspectRatio: '1/1' }}>
                            <img
                                src={user.avatar_url}
                                alt={user.name}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                            <button
                                style={{ position: 'absolute', top: '-40px', right: '10px', background: 'none', border: 'none', color: 'white', fontSize: '30px', cursor: 'pointer' }}
                                onClick={() => setIsPhotoPreviewOpen(false)}
                            >
                                &times;
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;
