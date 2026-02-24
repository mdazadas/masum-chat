import { useState, useEffect } from 'react';
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
                const { data: blockedRecords, error } = await insforge.database
                    .from('blocked_users')
                    .select('*')
                    .eq('blocker_id', userId);

                if (error) throw error;
                if (!blockedRecords || blockedRecords.length === 0) {
                    setBlockedList([]);
                    return;
                }

                // Batch fetch all profiles in ONE query (not N+1)
                const blockedIds = blockedRecords.map((r: any) => r.blocked_id);
                const { data: profiles } = await insforge.database
                    .from('profiles')
                    .select('id, name, username, avatar_url')
                    .in('id', blockedIds);

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

    const handleBack = () => navigate(-1);

    const handleUnblock = async () => {
        if (userToUnblock && userId) {
            setActionLoading(true);
            setLoadingMessage('Unblocking...');
            try {
                const { error } = await insforge.database
                    .from('blocked_users')
                    .delete()
                    .eq('blocker_id', userId)
                    .eq('blocked_id', userToUnblock.profile.id);

                if (error) throw error;

                setBlockedList(prev => prev.filter(item => item.profile.id !== userToUnblock.profile.id));
                showToast(`${userToUnblock.profile.name} has been unblocked`, 'success');
            } catch (err) {
                showToast('Failed to unblock user', 'error');
            } finally {
                setActionLoading(false);
                setUserToUnblock(null);
            }
        }
    };

    const filteredUsers = blockedList.filter(item => {
        const p = item.profile;
        return p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.username?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="home-container" style={{ backgroundColor: 'var(--surface-color)' }}>
            {actionLoading && <LoadingOverlay message={loadingMessage} transparent />}
            {/* Header */}
            <nav className="top-nav">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="nav-icon-btn" onClick={handleBack}>
                        <ArrowLeft size={24} />
                    </button>
                    <div className="top-nav-title">Blocked Users</div>
                </div>
            </nav>

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

            <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Blocked contacts will no longer be able to call you or send you messages.
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '16px' }}>
                        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', animation: 'pulse 2s infinite' }}>Loading list...</p>
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
                                        style={{
                                            backgroundColor: 'var(--secondary-color)',
                                            color: 'var(--primary-color)',
                                            border: 'none',
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            fontWeight: 600,
                                            fontSize: '13px',
                                            cursor: 'pointer'
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
                            <Shield size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
                            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>No blocked users</div>
                            <div style={{ fontSize: '14px', marginTop: '8px' }}>Users you block will appear here.</div>
                        </div>
                    )}
            </div>

            {/* Confirmation Modal */}
            {userToUnblock && (
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
                    padding: '24px'
                }}>
                    <div style={{
                        backgroundColor: 'var(--surface-color)',
                        borderRadius: '24px',
                        width: '100%',
                        maxWidth: '320px',
                        padding: '24px',
                        textAlign: 'center',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                    }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px 0' }}>Unblock {userToUnblock.profile.name}?</h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 24px 0' }}>
                            After unblocking, {userToUnblock.profile.name} will be able to message you and see your status updates.
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setUserToUnblock(null)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border-color)',
                                    background: 'none',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUnblock}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    backgroundColor: 'var(--primary-color)',
                                    color: '#ffffff',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Unblock
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BlockedUsers;
