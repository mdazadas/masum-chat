import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Shield } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { insforge } from '../lib/insforge';
import { useCurrentUserId } from '../hooks/useCurrentUser';
import Avatar from '../components/Avatar';
import LoadingOverlay from '../components/LoadingOverlay';

const BlockedUsers = () => {
    const navigate = useNavigate();
    const userId = useCurrentUserId();
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [blockedList, setBlockedList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

    // Confirmation State
    const [userToUnblock, setUserToUnblock] = useState<any>(null);

    useEffect(() => {
        if (!userId) return;

        const fetchBlockedUsers = async () => {
            setLoading(true);
            try {
                const { data: blockedRecords, error: blockErr } = await insforge.database
                    .from('blocked_users')
                    .select()
                    .eq('blocker_id', userId);

                if (blockErr) throw blockErr;

                if (!blockedRecords || blockedRecords.length === 0) {
                    setBlockedList([]);
                    return;
                }

                // Batch fetch all profiles in ONE query
                const blockedIds = blockedRecords.map((r: any) => r.blocked_id);
                const { data: profiles, error: profileErr } = await insforge.database
                    .from('profiles')
                    .select()
                    .in('id', blockedIds);

                if (profileErr) throw profileErr;

                const profileMap: Record<string, any> = {};
                (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });

                const detailedList = blockedRecords.map((record: any) => ({
                    ...record,
                    profile: profileMap[record.blocked_id] || {
                        id: record.blocked_id,
                        name: 'Unknown User',
                        username: 'unknown',
                        avatar_url: null
                    }
                }));

                setBlockedList(detailedList);
            } catch (err) {
                console.error("Error fetching blocked users:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchBlockedUsers();
    }, [userId]);

    const handleBack = useCallback(() => navigate(-1), [navigate]);

    const handleUnblock = useCallback(async () => {
        if (userToUnblock && userId) {
            setActionLoading(true);
            setLoadingMessage('Unblocking...');
            try {
                const { error: deleteErr } = await insforge.database
                    .from('blocked_users')
                    .delete()
                    .eq('id', userToUnblock.id);

                if (deleteErr) throw deleteErr;

                setBlockedList(prev => prev.filter(item => item.id !== userToUnblock.id));
                showToast(`${userToUnblock.profile.name} has been unblocked`, 'success');
            } catch (err) {
                showToast('Failed to unblock user', 'error');
            } finally {
                setActionLoading(false);
                setUserToUnblock(null);
            }
        }
    }, [userToUnblock, userId, showToast]);

    const filteredUsers = blockedList.filter(item => {
        const p = item.profile;
        return p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.username?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="profile-container premium-bg">
            {actionLoading && <LoadingOverlay message={loadingMessage} transparent />}
            <div className="profile-nav glass-header">
                <div className="max-w-content" style={{ display: 'flex', alignItems: 'center', height: '100%', width: '100%', gap: '16px', padding: '0 16px' }}>
                    <button className="nav-icon-btn ripple" onClick={handleBack} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowLeft size={24} />
                    </button>
                    <span className="profile-nav-title" style={{ margin: 0, fontSize: '20px', color: 'var(--primary-dark)', fontWeight: 800 }}>Blocked Users</span>
                </div>
            </div>

            {/* Search Bar */}
            <div style={{ padding: '12px 20px', backgroundColor: 'var(--surface-color)' }}>
                <div style={{
                    backgroundColor: 'var(--secondary-color)',
                    borderRadius: '12px',
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <Search size={18} color="var(--text-secondary)" />
                    <input
                        type="search"
                        placeholder="Search blocked contacts"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        inputMode="search"
                        style={{
                            border: 'none',
                            background: 'none',
                            outline: 'none',
                            fontSize: '15px',
                            width: '100%',
                            color: 'var(--text-primary)'
                        }}
                    />
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }} className="fade-in">
                <div style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, opacity: 0.8 }}>
                    Blocked contacts will no longer be able to call you or send you messages.
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '16px' }}>
                        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', animation: 'pulse 2s infinite' }}>Syncing list...</p>
                    </div>
                ) :
                    filteredUsers.length > 0 ? (
                        filteredUsers.map(item => {
                            const p = item.profile;
                            return (
                                <div
                                    key={item.id}
                                    className="chat-item"
                                    style={{ padding: '12px 20px', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}
                                >
                                    <Avatar
                                        src={p.avatar_url}
                                        name={p.name}
                                        size={48}
                                    />
                                    <div style={{ flex: 1, marginLeft: '16px' }}>
                                        <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-primary)' }}>{p.name}</div>
                                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>@{p.username}</div>
                                    </div>
                                    <button
                                        onClick={() => setUserToUnblock(item)}
                                        className="btn-unblock"
                                        style={{
                                            backgroundColor: 'var(--secondary-color)',
                                            color: 'var(--primary-color)',
                                            border: 'none',
                                            padding: '8px 18px',
                                            borderRadius: '20px',
                                            fontWeight: 700,
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        Unblock
                                    </button>
                                </div>
                            );
                        })
                    ) : (
                        <div style={{
                            marginTop: '100px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            color: 'var(--border-color)',
                            padding: '0 40px',
                            textAlign: 'center'
                        }}>
                            <Shield size={64} color="var(--primary-color)" style={{ marginBottom: '16px', opacity: 0.8 }} />
                            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-color)' }}>
                                {searchTerm ? 'No matches found' : 'No blocked users'}
                            </div>
                            <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7, color: 'var(--text-secondary)' }}>
                                {searchTerm ? `No results for "${searchTerm}"` : 'Users you block will appear here for management.'}
                            </div>
                        </div>
                    )}
            </div>

            {/* Standardized Confirmation Modal */}
            {userToUnblock && createPortal(
                <div className="overlay-backdrop" style={{ zIndex: 3000, position: 'fixed', inset: 0, transform: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)' }} onClick={() => setUserToUnblock(null)}>
                    <div className="context-menu-card" style={{ padding: '24px', width: '90%', maxWidth: '340px' }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>
                            Unblock {userToUnblock.profile.name}?
                        </h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 24px 0', opacity: 0.9 }}>
                            They will be able to message you and see your status updates again.
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setUserToUnblock(null)}
                                className="btn btn-outline"
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '14px',
                                    fontWeight: 700,
                                    backgroundColor: 'transparent',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-secondary)'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUnblock}
                                className="btn btn-primary"
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '14px',
                                    fontWeight: 700,
                                    border: 'none',
                                    backgroundColor: 'var(--primary-color)',
                                    color: '#ffffff'
                                }}
                            >
                                Unblock
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default BlockedUsers;
