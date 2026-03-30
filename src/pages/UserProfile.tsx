import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Ban, Trash2, Mail, Phone, Video, Info, ImageIcon, Calendar } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { insforge } from '../lib/insforge';
import { useCurrentUserId } from '../hooks/useCurrentUser';
import Avatar from '../components/Avatar';
import { useData } from '../context/DataContext';
import ClearChatModal from '../components/ClearChatModal';
import BlockUserModal from '../components/BlockUserModal';

const UserProfile = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const currentUserId = useCurrentUserId();
    const { showToast } = useToast();
    const { profileData, refreshProfile, userPresence, contacts, clearLocalChat } = useData();

    const [showBlockConfirm, setShowBlockConfirm] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);

    const isMe = username === 'me' || (profileData && username === profileData.username);
    const location = useLocation();
    const [profile, setProfile] = useState<any>(() => {
        if (location.state?.profile) return location.state.profile;
        if (isMe) return profileData;
        // Fallback to contacts cache
        return contacts.find(c => c.username === username);
    });
    const [loading, setLoading] = useState(() => {
        if (location.state?.profile) return false;
        if (isMe && profileData) return false;
        if (contacts.find(c => c.username === username)) return false;
        return true;
    });
    const [mediaCount, setMediaCount] = useState(0);

    // Get Presence Info
    const presenceInfo = useMemo(() => {
        if (!profile?.id) return null;
        const lastSeen = userPresence[profile.id];
        if (!lastSeen) return null;

        const isOnline = (Date.now() - new Date(lastSeen).getTime()) < 65000;
        if (isOnline) return 'Online';

        const date = new Date(lastSeen);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        return isToday ? `Last seen today at ${timeStr}` : `Last seen ${date.toLocaleDateString()}`;
    }, [userPresence, profile?.id]);

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!profile) setLoading(true);
            try {
                if (isMe) {
                    const data = await refreshProfile();
                    if (data) setProfile(data);
                } else {
                    const { data, error } = await insforge.database
                        .from('profiles')
                        .select()
                        .eq('username', username)
                        .maybeSingle();

                    if (data) setProfile(data);
                    if (error) throw error;

                    // Fetch Media Count & Block Status
                    if (data && currentUserId) {
                        const pid = data.id || data.contact_id;
                        
                        // Media Count
                        insforge.database
                            .from('messages')
                            .select('*', { count: 'exact', head: true })
                            .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${pid},image_url.neq.null),and(sender_id.eq.${currentUserId},receiver_id.eq.${pid},video_url.neq.null),and(sender_id.eq.${pid},receiver_id.eq.${currentUserId},image_url.neq.null),and(sender_id.eq.${pid},receiver_id.eq.${currentUserId},video_url.neq.null)`)
                            .then(res => setMediaCount(res.count || 0));
                            
                        // Block Status
                        insforge.database
                            .from('blocked_users')
                            .select('blocker_id,blocked_id')
                            .or(`and(blocker_id.eq.${currentUserId},blocked_id.eq.${pid}),and(blocker_id.eq.${pid},blocked_id.eq.${currentUserId})`)
                            .then(({ data: blockRows }) => {
                                if (blockRows) {
                                    setIsBlocked(blockRows.some((r: any) => r.blocker_id === currentUserId && r.blocked_id === pid));
                                }
                            });
                    }
                }
            } catch (err) {
                console.error("Error fetching user profile:", err);
                showToast('Failed to load profile', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [username, isMe, currentUserId]);

    // Listen for real-time contact updates
    useEffect(() => {
        if (!isMe && profile) {
            const updatedContact = contacts.find(c => c.username === username);
            if (updatedContact) {
                setProfile((prev: any) => {
                    const newProfile = { ...prev };
                    let changed = false;

                    if (updatedContact.name !== undefined && updatedContact.name !== prev.name) { newProfile.name = updatedContact.name; changed = true; }
                    if (updatedContact.avatar !== undefined && updatedContact.avatar !== prev.avatar_url) { newProfile.avatar_url = updatedContact.avatar; changed = true; }
                    if (updatedContact.lastSeen !== undefined && updatedContact.lastSeen !== prev.last_seen) { newProfile.last_seen = updatedContact.lastSeen; changed = true; }
                    if (updatedContact.bio !== undefined && updatedContact.bio !== prev.bio) { newProfile.bio = updatedContact.bio; changed = true; }

                    return changed ? newProfile : prev;
                });
            }
        }
        // Exclude profile from deps to prevent infinite loops, we use `prev` inside setState
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contacts, username, isMe]);

    const handleBlockUser = async () => {
        if (!currentUserId || !profile) return;
        setShowBlockConfirm(false);

        try {
            const { error } = await insforge.database
                .from('blocked_users')
                .upsert([{
                    blocker_id: currentUserId,
                    blocked_id: profile.contact_id || profile.id
                }], { onConflict: 'blocker_id,blocked_id' });

            if (error) throw error;
            setIsBlocked(true);

            // Real-time broadcast to both users' channels to trigger instant UI updates
            const targetId = profile.contact_id || profile.id;
            const payload = { type: 'block', blocker_id: currentUserId, blocked_id: targetId };
            insforge.realtime.publish(`user:${targetId}`, 'UPDATE_block_status', payload).catch(console.error);
            insforge.realtime.publish(`user:${currentUserId}`, 'UPDATE_block_status', payload).catch(console.error);

            showToast(`${profile.name || profile.username} blocked`, 'info');
            // Navigate to the chat page — pass isBlocked locally to prevent flash
            navigate(`/chat/${profile.username}`, { state: { profile, isBlockedInitially: true } });
        } catch (err: any) {
            console.error("Block user error:", err);
            showToast('Failed to block user', 'error');
        }
    };

    const handleUnblockUser = async () => {
        if (!currentUserId || !profile) return;
        setIsBlocked(false); // Optimistic

        try {
            const { error } = await insforge.database
                .from('blocked_users')
                .delete()
                .eq('blocker_id', currentUserId)
                .eq('blocked_id', profile.contact_id || profile.id);

            if (error) throw error;

            // Real-time broadcast to both users' channels to trigger instant UI updates
            const targetId = profile.contact_id || profile.id;
            const payload = { type: 'unblock', blocker_id: currentUserId, blocked_id: targetId };
            insforge.realtime.publish(`user:${targetId}`, 'UPDATE_block_status', payload).catch(console.error);
            insforge.realtime.publish(`user:${currentUserId}`, 'UPDATE_block_status', payload).catch(console.error);

            showToast(`${profile.name || profile.username} unblocked`, 'info');
        } catch (err: any) {
            console.error("Unblock user error:", err);
            setIsBlocked(true); // Rollback
            showToast('Failed to unblock user', 'error');
        }
    };

    const handleClearChat = async () => {
        if (!currentUserId || !profile || isClearing) return;
        setShowClearConfirm(false);
        setIsClearing(true);

        try {
            // Step 1: Delete messages sent by current user to profile
            const targetId = profile.contact_id || profile.id;
            const { error: err1 } = await insforge.database
                .from('messages')
                .delete()
                .eq('sender_id', currentUserId)
                .eq('receiver_id', targetId);

            if (err1) throw err1;

            // Step 2: Delete messages sent by profile to current user
            const { error: err2 } = await insforge.database
                .from('messages')
                .delete()
                .eq('sender_id', targetId)
                .eq('receiver_id', currentUserId);

            if (err2) throw err2;

            // Step 3: Clear local cache instantly (removes optimistic/unsent messages too)
            if (profile.username) clearLocalChat(profile.username);

            showToast('Chat history cleared permanently', 'info');
            navigate('/home');
        } catch (err: any) {
            console.error('Clear chat error:', err);
            showToast('Failed to clear chat', 'error');
        } finally {
            setIsClearing(false);
        }
    };

    if (loading) {
        return (
            <div className="profile-container premium-bg w-full h-[100dvh] flex items-center justify-center flex-col">
                <div className="empty-state-container flex flex-col items-center">
                    <div className="spinner" style={{ width: 42, height: 42, borderTopColor: 'var(--primary-color)' }} />
                    <p style={{ marginTop: '16px', fontWeight: 700, color: 'var(--text-secondary)' }}>Loading Profile...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="profile-container premium-bg w-full h-[100dvh] flex items-center justify-center flex-col px-6">
                <div className="empty-state-container flex flex-col items-center text-center">
                    <div className="empty-icon-box">
                        <Info size={40} />
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '20px' }}>User Not Found</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>The user you are looking for does not exist or has changed their username.</p>
                    <button className="premium-btn-primary" onClick={() => navigate(-1)} style={{ marginTop: '24px' }}>
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-container w-full h-[100dvh] bg-surface-color flex flex-col relative overflow-hidden text-text-primary mx-auto max-w-md">
            <style>{`
                .profile-header-card {
                    padding: 32px 24px 24px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    margin-bottom: 16px;
                }
                .presence-badge {
                    margin-top: 8px;
                    font-size: 13px;
                    font-weight: 700;
                    color: var(--primary-color);
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .presence-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: var(--primary-color);
                    box-shadow: 0 0 8px var(--primary-color);
                }
                .action-fab-group {
                    display: flex;
                    justify-content: center;
                    gap: 24px;
                    margin-top: 24px;
                }
                .action-fab {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                }
                .fab-icon {
                    width: 52px;
                    height: 52px;
                    border-radius: 18px;
                    background: var(--primary-light);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--primary-color);
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .action-fab:active .fab-icon { transform: scale(0.9); }
                .fab-label {
                    font-size: 13px;
                    font-weight: 700;
                    color: var(--text-primary);
                    letter-spacing: 0.2px;
                }
                .detail-section {
                    padding: 0 16px 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .premium-field-card {
                    background: var(--surface-color);
                    border-radius: 20px;
                    border: 1px solid var(--border-color);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.02);
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .field-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 4px;
                }
                .field-label-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--primary-color);
                    font-size: 13px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .field-value {
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--text-primary);
                    word-break: break-word;
                    line-height: 1.5;
                }
                .media-card {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 20px;
                    cursor: pointer;
                    background: var(--surface-color);
                    border-radius: 20px;
                    border: 1px solid var(--border-color);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.02);
                }
                .danger-section {
                    margin-top: 16px;
                    padding: 0 16px 40px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .danger-action-btn {
                    width: 100%;
                    padding: 16px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    font-size: 15px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    border: none;
                    outline: none;
                }
                .danger-action-btn:active {
                    transform: scale(0.98);
                }
                .btn-block {
                    background: rgba(220, 53, 69, 0.1);
                    color: #dc3545;
                }
                .btn-block:hover {
                    background: rgba(220, 53, 69, 0.15);
                }
                .btn-clear {
                    background: transparent;
                    border: 1px solid rgba(220, 53, 69, 0.2);
                    color: #dc3545;
                }
                .btn-clear:hover {
                    background: rgba(220, 53, 69, 0.05);
                }
                .profile-content {
                    flex: 1;
                    overflow-y: auto;
                }
            `}</style>

            <div className="profile-nav glass-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px' }}>
                    <button className="nav-icon-btn ripple" onClick={() => navigate(-1)}>
                        <ArrowLeft size={24} />
                    </button>
                    <span className="profile-nav-title">Contact Information</span>
                </div>
            </div>

            <div className="profile-content">
                <div className="profile-header-card">
                    <div style={{ position: 'relative' }} onClick={() => setIsPhotoPreviewOpen(true)}>
                        <Avatar
                            src={profile.avatar_url}
                            name={profile.name || profile.username}
                            size={120}
                        />
                        {presenceInfo === 'Online' && (
                            <div style={{
                                position: 'absolute', bottom: 6, right: 6,
                                width: 24, height: 24, borderRadius: '50%',
                                background: 'var(--surface-color)', padding: 4
                            }}>
                                <div className="presence-dot" style={{ width: '100%', height: '100%' }} />
                            </div>
                        )}
                    </div>

                    <h2 style={{ marginTop: '16px', fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {profile.name || profile.username}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '15px', marginTop: '2px' }}>
                        @{profile.username}
                    </p>

                    {presenceInfo && (
                        <div className="presence-badge" style={{ color: presenceInfo === 'Online' ? 'var(--primary-color)' : 'var(--text-secondary)' }}>
                            {presenceInfo === 'Online' && <div className="presence-dot" />}
                            {presenceInfo}
                        </div>
                    )}

                    <div className="action-fab-group">
                        <div className="action-fab" onClick={() => navigate(`/chat/${profile.username}`, { state: { profile, isBlockedInitially: isBlocked } })}>
                            <div className="fab-icon ripple"><MessageSquare size={24} /></div>
                            <span className="fab-label">Message</span>
                        </div>
                        <div className="action-fab" onClick={() => navigate(`/call/${profile.username}?type=voice`)}>
                            <div className="fab-icon ripple"><Phone size={24} /></div>
                            <span className="fab-label">Audio</span>
                        </div>
                        <div className="action-fab" onClick={() => navigate(`/call/${profile.username}?type=video`)}>
                            <div className="fab-icon ripple"><Video size={24} /></div>
                            <span className="fab-label">Video</span>
                        </div>
                    </div>
                </div>

                <div className="detail-section">
                    <div className="media-card ripple" onClick={() => navigate(`/media/${profile.username}`)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div className="terms-icon-box"><ImageIcon size={20} /></div>
                            <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>Shared Media</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{mediaCount} items</span>
                            <ArrowLeft size={16} style={{ transform: 'rotate(180deg)', opacity: 0.5 }} />
                        </div>
                    </div>

                    <div className="premium-field-card">
                        <div className="field-header">
                            <div className="field-label-wrapper">
                                <Info size={16} /> About
                            </div>
                        </div>
                        <div className="field-value">
                            {profile.bio || "Hey there! I am using Masum Chat."}
                        </div>
                    </div>

                    <div className="premium-field-card">
                        <div className="field-header">
                            <div className="field-label-wrapper">
                                <Calendar size={16} /> Joined
                            </div>
                        </div>
                        <div className="field-value">
                            {new Date(profile.created_at).toLocaleDateString([], { month: 'long', year: 'numeric' })}
                        </div>
                    </div>

                    <div className="premium-field-card">
                        <div className="field-header">
                            <div className="field-label-wrapper">
                                <Mail size={16} /> Identity
                            </div>
                        </div>
                        <div className="field-value" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: 'var(--primary-color)', fontSize: '14px', fontWeight: 700 }}>Verified Account</span>
                            </div>
                            {profile.email && (
                                <span style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: 500 }}>
                                    {(() => {
                                        const email = profile.email;
                                        const [user, domain] = email.split('@');
                                        if (user.length <= 2) return `${user[0]}***@${domain}`;
                                        return `${user.substring(0, 2)}***${user.substring(user.length - 1)}@${domain}`;
                                    })()}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="danger-section">
                    {isBlocked ? (
                        <button className="danger-action-btn btn-block" onClick={handleUnblockUser} style={{ color: 'var(--text-secondary)' }}>
                            <Ban size={18} /> Unblock {profile.name || profile.username}
                        </button>
                    ) : (
                        <button className="danger-action-btn btn-block" onClick={() => setShowBlockConfirm(true)}>
                            <Ban size={18} /> Block {profile.name || profile.username}
                        </button>
                    )}
                    <button className="danger-action-btn btn-clear" onClick={() => setShowClearConfirm(true)} disabled={isClearing} style={{ opacity: isClearing ? 0.6 : 1 }}>
                        <Trash2 size={18} /> {isClearing ? 'Clearing...' : 'Clear Chat History'}
                    </button>
                </div>
            </div>

            {showBlockConfirm && (
                <BlockUserModal
                    contactName={profile?.name || profile?.username || username || 'this contact'}
                    isLoading={false}
                    onConfirm={handleBlockUser}
                    onCancel={() => setShowBlockConfirm(false)}
                />
            )}

            {showClearConfirm && (
                <ClearChatModal
                    contactName={profile?.name || profile?.username || username || 'this contact'}
                    isLoading={isClearing}
                    onConfirm={handleClearChat}
                    onCancel={() => setShowClearConfirm(false)}
                />
            )}

            {/* Photo Preview Modal */}
            {isPhotoPreviewOpen && profile.avatar_url && (
                <div
                    className="overlay-backdrop"
                    style={{ zIndex: 4000, backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => setIsPhotoPreviewOpen(false)}
                >
                    <div style={{ position: 'relative', width: '90%', maxWidth: '500px', aspectRatio: '1/1', animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        <img
                            src={profile.avatar_url}
                            alt={profile.name}
                            style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '24px' }}
                        />
                        <div style={{ position: 'absolute', top: -60, left: 0, right: 0, textAlign: 'center', color: 'white' }}>
                            <h4 style={{ fontSize: '18px', fontWeight: 700 }}>{profile.name || profile.username}</h4>
                            <p style={{ opacity: 0.7, fontSize: '13px' }}>Profile Photo</p>
                        </div>
                    </div>
                    <style>{`
                        @keyframes scaleIn {
                            from { opacity: 0; transform: scale(0.9); }
                            to { opacity: 1; transform: scale(1); }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
