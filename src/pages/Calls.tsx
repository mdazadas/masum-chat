import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Video, Search, ArrowLeft, PhoneIncoming, PhoneMissed, PhoneOutgoing } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { insforge } from '../lib/insforge';
import { useCurrentUserId } from '../hooks/useCurrentUser';
import Avatar from '../components/Avatar';
import { useData } from '../context/DataContext';

const Calls = () => {
    const navigate = useNavigate();
    const userId = useCurrentUserId();
    const { profileData } = useData();
    const [searchQuery, setSearchQuery] = useState('');
    const [calls, setCalls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const fetchCalls = async () => {
            setLoading(true);
            try {
                // Step 1: Fetch all calls
                const { data: callHistory, error: callErr } = await insforge.database
                    .from('calls')
                    .select()
                    .or(`caller_id.eq.${userId},receiver_id.eq.${userId}`)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (callErr) throw callErr;

                if (!callHistory || callHistory.length === 0) {
                    setCalls([]);
                    setLoading(false);
                    return;
                }

                // Step 2: Collect all unique other-party IDs
                const otherPartyIds = [...new Set(
                    callHistory.map((call: any) =>
                        call.caller_id === userId ? call.receiver_id : call.caller_id
                    )
                )];

                // Step 3: Fetch ALL profiles in ONE batch query
                const { data: profiles, error: profileErr } = await insforge.database
                    .from('profiles')
                    .select()
                    .in('id', otherPartyIds);

                if (profileErr) throw profileErr;

                // Step 4: Build a lookup map
                const profileMap: Record<string, any> = {};
                (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });

                // Step 5: Combine
                const detailed = callHistory.map((call: any) => {
                    const otherPartyId = call.caller_id === userId ? call.receiver_id : call.caller_id;
                    const profile = profileMap[otherPartyId];
                    return {
                        ...call,
                        otherParty: profile || { name: 'Unknown', username: 'unknown', avatar_url: null },
                        isIncoming: call.receiver_id === userId
                    };
                });

                setCalls(detailed);
            } catch (err) {
                console.error("Error fetching calls:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCalls();
    }, [userId]);

    const formatCallTime = useCallback((timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const callDate = new Date(date).setHours(0, 0, 0, 0);
        const todayDate = new Date(now).setHours(0, 0, 0, 0);
        const diffInDays = Math.round((todayDate - callDate) / (1000 * 60 * 60 * 24));

        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

        if (diffInDays === 0) return `Today, ${timeStr}`;
        if (diffInDays === 1) return `Yesterday, ${timeStr}`;
        if (diffInDays < 7) {
            const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            return `${weekdays[date.getDay()]}, ${timeStr}`;
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + `, ${timeStr}`;
    }, []);

    const filteredCalls = useMemo(() => {
        return calls.filter(call => {
            const party = call.otherParty;
            return party.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                party.username?.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [calls, searchQuery]);

    return (
        <div className="home-container">
            {/* Header */}
            <div className="screen-header" style={{ padding: 0 }}>
                <div className="max-w-content" style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '12px 16px', gap: '16px' }}>
                    <button className="nav-icon-btn ripple" onClick={() => navigate('/home')}>
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="screen-header-title">Calls</h2>
                    <div className="top-nav-right" style={{ marginLeft: 'auto' }}>
                        <div className="user-avatar-container" onClick={() => navigate('/profile/me')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <Avatar
                                src={profileData?.avatar_url}
                                name={profileData?.name}
                                size={38}
                                className="user-avatar"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Standardized Search Bar */}
            <div style={{ padding: '12px 20px', backgroundColor: 'var(--surface-color)', position: 'sticky', top: '72px', zIndex: 100 }}>
                <div className="max-w-content" style={{
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
                        placeholder="Search call history"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
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

            {/* Calls List */}
            <div className="chat-list fade-in" style={{ flex: 1, overflowY: 'auto' }}>
                <div className="max-w-content">
                    <p style={{
                        padding: '16px 20px',
                        fontSize: '11px',
                        fontWeight: 800,
                        color: 'var(--primary-color)',
                        letterSpacing: '1.5px',
                        textTransform: 'uppercase',
                        opacity: 0.8
                    }}>
                        {searchQuery.trim() ? `Search Results (${filteredCalls.length})` : "Recent Calls"}
                    </p>

                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
                            <div className="spinner" style={{ width: 32, height: 32, marginBottom: 12, borderTopColor: 'var(--primary-color)' }} />
                            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Loading history...</p>
                        </div>
                    ) : filteredCalls.length > 0 ? (
                        Object.entries(
                            filteredCalls.reduce((acc: Record<string, any[]>, call) => {
                                const date = formatCallTime(call.created_at).split(',')[0];
                                if (!acc[date]) acc[date] = [];
                                acc[date].push(call);
                                return acc;
                            }, {})
                        ).map(([date, group]: [string, any[]]) => (
                            <div key={date}>
                                <div style={{
                                    padding: '8px 16px',
                                    backgroundColor: 'var(--surface-color)',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: 'var(--text-secondary)',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 5,
                                    borderBottom: '1px solid var(--border-color)',
                                    backdropFilter: 'blur(8px)',
                                    background: 'var(--surface-color)'
                                }}>
                                    {date}
                                </div>
                                {group.map((call, idx) => {
                                    const party = call.otherParty;
                                    const isMissed = call.status === 'missed';
                                    const callColor = isMissed ? '#ef4444' : call.isIncoming ? '#22c55e' : 'var(--primary-color)';
                                    const CallIcon = isMissed ? PhoneMissed : call.isIncoming ? PhoneIncoming : PhoneOutgoing;
                                    const isVideo = call.type === 'video';

                                    return (
                                        <div
                                            key={call.id}
                                            className="chat-item"
                                            style={{ cursor: 'pointer', padding: '14px 16px', backgroundColor: 'var(--surface-color)' }}
                                            onClick={() => navigate(`/chat/${party.username}`, { state: { profile: party } })}
                                        >
                                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                                <Avatar src={party.avatar_url} name={party.name || party.username} size={48} />
                                            </div>
                                            <div className="chat-info" style={{ marginLeft: '16px', borderBottom: idx !== group.length - 1 ? '1px solid var(--border-color)' : 'none', paddingBottom: '14px', marginBottom: '-14px' }}>
                                                <div className="chat-row">
                                                    <span className="chat-name" style={{
                                                        fontWeight: 600,
                                                        fontSize: '16px',
                                                        color: isMissed ? '#ef4444' : 'var(--text-primary)'
                                                    }}>
                                                        {party.name || `@${party.username}`}
                                                    </span>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                                        {formatCallTime(call.created_at).split(',')[1]}
                                                    </span>
                                                </div>
                                                <div className="chat-row" style={{ marginTop: 4 }}>
                                                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <CallIcon size={16} color={callColor} />
                                                        {call.isIncoming ? (isMissed ? 'Missed' : 'Incoming') : 'Outgoing'}
                                                    </span>

                                                    <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }} onClick={e => e.stopPropagation()}>
                                                        <button
                                                            className="action-btn ripple"
                                                            style={{
                                                                width: 36, height: 36, borderRadius: '50%', border: 'none',
                                                                background: 'transparent', color: 'var(--primary-color)',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                                                            }}
                                                            onClick={() => navigate(`/call/${party.username}?type=${isVideo ? 'video' : 'voice'}`)}
                                                        >
                                                            {isVideo ? <Video size={20} /> : <Phone size={20} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))
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
                            <Phone size={64} style={{ marginBottom: '16px', opacity: 0.3 }} />
                            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                {searchQuery ? 'No calls found' : 'No call history'}
                            </div>
                            <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.6 }}>
                                {searchQuery ? `No matches for "${searchQuery}"` : 'Recent voice and video calls will appear here.'}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Nav */}
            <BottomNav activeTab="calls" />
        </div>
    );
};

export default Calls;
