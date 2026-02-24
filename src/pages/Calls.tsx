import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Video, Search, ArrowLeft, PhoneIncoming, PhoneMissed } from 'lucide-react';
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
                const { data: callHistory, error } = await insforge.database
                    .from('calls')
                    .select('*')
                    .or(`caller_id.eq.${userId},receiver_id.eq.${userId}`)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (error) throw error;
                if (!callHistory || callHistory.length === 0) {
                    setCalls([]);
                    setLoading(false);
                    return;
                }

                // Step 2: Collect all unique other-party IDs in ONE set
                const otherPartyIds = [...new Set(
                    callHistory.map((call: any) =>
                        call.caller_id === userId ? call.receiver_id : call.caller_id
                    )
                )];

                // Step 3: Fetch ALL profiles in ONE batch query (not N+1)
                const { data: profiles } = await insforge.database
                    .from('profiles')
                    .select('id, name, username, avatar_url')
                    .in('id', otherPartyIds);

                // Step 4: Build a lookup map for O(1) access
                const profileMap: Record<string, any> = {};
                (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });

                // Step 5: Combine without any extra queries
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

    const formatCallTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        if (diffInDays === 1) return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        return date.toLocaleDateString([], { month: 'long', day: 'numeric' }) + `, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    const filteredCalls = calls.filter(call => {
        const party = call.otherParty;
        return party.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            party.username?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="home-container">
            {/* Header */}
            <nav className="top-nav">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button className="nav-icon-btn" onClick={() => navigate('/home')}>
                        <ArrowLeft size={24} />
                    </button>
                    <div className="top-nav-title">Calls</div>
                </div>
                <div className="top-nav-right">
                    <div className="user-avatar-container" onClick={() => navigate('/profile/me')} style={{ cursor: 'pointer' }}>
                        <Avatar
                            src={profileData?.avatar_url}
                            name={profileData?.name}
                            size={40}
                            className="user-avatar"
                        />
                    </div>
                </div>
            </nav>

            {/* Inline Search Bar */}
            <div style={{ padding: '12px 16px', backgroundColor: 'var(--surface-color)', position: 'sticky', top: '72px', zIndex: 100 }}>
                <div style={{ position: 'relative' }}>
                    <input
                        type="search"
                        className="input-field"
                        placeholder="Search calls..."
                        style={{
                            padding: '10px 16px 10px 40px',
                            borderRadius: '12px',
                            marginBottom: 0,
                            backgroundColor: 'var(--secondary-color)',
                            border: 'none',
                            fontSize: '15px'
                        }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        inputMode="search"
                    />
                    <Search
                        size={18}
                        style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.7 }}
                    />
                </div>
            </div>

            {/* Calls List */}
            <div className="chat-list" style={{ flex: 1, overflowY: 'auto' }}>
                <p style={{
                    padding: '16px 20px',
                    fontSize: '12px',
                    fontWeight: 800,
                    color: 'var(--primary-color)',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    opacity: 0.8
                }}>
                    {searchQuery.trim() ? `Search Results (${filteredCalls.length})` : "Recent"}
                </p>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
                        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3, marginBottom: 12 }} />
                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', animation: 'pulse 2s infinite' }}>Loading history...</p>
                    </div>
                ) : filteredCalls.length > 0 ? (
                    filteredCalls.map(call => {
                        const party = call.otherParty;
                        const isMissed = call.status === 'missed';
                        const callColor = isMissed ? '#ef4444' : call.isIncoming ? '#22c55e' : '#3b82f6';
                        const CallIcon = isMissed ? PhoneMissed : call.isIncoming ? PhoneIncoming : Phone;
                        const callLabel = isMissed ? 'Missed' : call.isIncoming ? 'Incoming' : 'Outgoing';

                        return (
                            <div
                                key={call.id}
                                className="chat-item"
                                style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                                onClick={() => navigate(`/chat/${party.username}`)}
                            >
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                    <Avatar src={party.avatar_url} name={party.name || party.username} size={48} />
                                    <span style={{
                                        position: 'absolute', bottom: -2, right: -2,
                                        width: 18, height: 18, borderRadius: '50%',
                                        background: callColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '2px solid var(--bg-primary)'
                                    }}>
                                        <CallIcon size={9} color="white" strokeWidth={2.5} />
                                    </span>
                                </div>
                                <div className="chat-info">
                                    <div className="chat-row">
                                        <span className="chat-name" style={{ fontWeight: 700 }}>
                                            {party.name || `@${party.username}`}
                                        </span>
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatCallTime(call.created_at)}</span>
                                    </div>
                                    <div className="chat-row" style={{ marginTop: 2 }}>
                                        <span style={{ fontSize: '13px', color: callColor, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            {call.type === 'voice' ? <Phone size={12} /> : <Video size={12} />}
                                            {call.type === 'voice' ? 'Voice' : 'Video'} · {callLabel}
                                        </span>
                                    </div>
                                </div>
                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                                    <button
                                        style={{
                                            width: 38, height: 38, borderRadius: '50%', border: 'none',
                                            background: '#dcfce7', color: '#16a34a',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                                        }}
                                        onClick={() => navigate(`/call/${party.username}?type=voice`)}
                                        title="Voice call"
                                    >
                                        <Phone size={17} />
                                    </button>
                                    <button
                                        style={{
                                            width: 38, height: 38, borderRadius: '50%', border: 'none',
                                            background: '#dbeafe', color: '#2563eb',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                                        }}
                                        onClick={() => navigate(`/call/${party.username}?type=video`)}
                                        title="Video call"
                                    >
                                        <Video size={17} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <p style={{ fontSize: '16px', fontWeight: 500 }}>No call history yet.</p>
                    </div>
                )}
            </div>

            {/* Bottom Nav */}
            <BottomNav activeTab="calls" />
        </div>
    );
};

export default Calls;
