import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Volume2, VolumeX, Phone, PhoneIncoming, PhoneMissed, ArrowLeft } from 'lucide-react';
import { insforge } from '../lib/insforge';
import { useCurrentUserId } from '../hooks/useCurrentUser';
import Avatar from '../components/Avatar';

// ─── Call History Screen ──────────────────────────────────────────────
const CallHistoryView = () => {
    const navigate = useNavigate();
    const userId = useCurrentUserId();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;
        const fetchHistory = async () => {
            try {
                const { data } = await insforge.database
                    .from('calls')
                    .select('*, profiles!calls_caller_id_fkey(name, avatar_url), profiles!calls_receiver_id_fkey(name, avatar_url)')
                    .or(`caller_id.eq.${userId},receiver_id.eq.${userId}`)
                    .order('created_at', { ascending: false });

                if (data) {
                    const mapped = data.map((c: any) => {
                        const isCaller = c.caller_id === userId;
                        const peer = isCaller ? c.profiles_calls_receiver_id_fkey : c.profiles_calls_caller_id_fkey;
                        const type = c.status === 'missed' ? 'missed' : (isCaller ? 'outgoing' : 'incoming');

                        return {
                            id: c.id,
                            name: peer?.name || 'Unknown',
                            type,
                            callType: c.type || 'voice',
                            time: new Date(c.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                            duration: c.duration || '',
                            avatar: peer?.avatar_url || null
                        };
                    });
                    setHistory(mapped);
                }
            } catch (err) {
                console.error('Call history error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [userId]);

    const getTileIcon = (type: string) => {
        if (type === 'missed') return <PhoneMissed size={14} />;
        if (type === 'incoming') return <PhoneIncoming size={14} />;
        return <Phone size={14} />;
    };
    const getTileColor = (type: string) => type === 'missed' ? '#ef4444' : type === 'incoming' ? '#22c55e' : '#3b82f6';

    return (
        <div className="callhist-screen">
            <nav className="callhist-nav">
                <button className="callhist-back" onClick={() => navigate(-1)}>
                    <ArrowLeft size={22} />
                </button>
                <span className="callhist-title">Recent Calls</span>
            </nav>

            <div className="callhist-list">
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '16px' }}>
                        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', animation: 'pulse 2s infinite' }}>Loading calls...</p>
                    </div>
                ) :
                    history.length > 0 ? history.map(call => (
                        <div key={call.id} className="callhist-row">
                            {/* Avatar */}
                            <div className="callhist-avatar-wrap">
                                <Avatar
                                    src={call.avatar}
                                    name={call.name}
                                    size={50}
                                    className="callhist-avatar"
                                />
                                <span className="callhist-type-dot" style={{ background: getTileColor(call.type) }}>
                                    {getTileIcon(call.type)}
                                </span>
                            </div>

                            {/* Info */}
                            <div className="callhist-info" onClick={() => navigate(`/chat/${call.name?.toLowerCase().replace(/\s+/g, '.')}`)}>
                                <span className="callhist-name">{call.name}</span>
                                <span className="callhist-meta" style={{ color: getTileColor(call.type) }}>
                                    {call.callType === 'video' ? '📹 Video' : '📞 Voice'} · {call.type}
                                    {call.duration ? ` · ${call.duration}` : ''}
                                </span>
                                <span className="callhist-time">{call.time}</span>
                            </div>

                            {/* Action buttons */}
                            <div className="callhist-actions">
                                <button
                                    className="callhist-action-btn voice"
                                    title="Voice call"
                                    onClick={() => navigate(`/call/${call.name?.toLowerCase().replace(/\s+/g, '.')}?type=voice`)}
                                >
                                    <Phone size={18} />
                                </button>
                                <button
                                    className="callhist-action-btn video"
                                    title="Video call"
                                    onClick={() => navigate(`/call/${call.name?.toLowerCase().replace(/\s+/g, '.')}?type=video`)}
                                >
                                    <Video size={18} />
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No recent calls</div>
                    )}
            </div>

            <style>{`
                .callhist-screen {
                    min-height: 100dvh;
                    background: var(--bg-primary, #fff);
                    display: flex;
                    flex-direction: column;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                }
                .callhist-nav {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px 16px;
                    border-bottom: 1px solid var(--border-color, #eee);
                    background: var(--bg-primary, #fff);
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
                .callhist-back {
                    background: none;
                    border: none;
                    padding: 6px;
                    cursor: pointer;
                    color: var(--text-secondary, #666);
                    display: flex;
                    border-radius: 50%;
                }
                .callhist-back:active { background: var(--bg-secondary, #f5f5f5); }
                .callhist-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: var(--text-primary, #111);
                }
                .callhist-list { flex: 1; overflow-y: auto; }
                .callhist-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    border-bottom: 1px solid var(--border-color, #f0f0f0);
                    cursor: default;
                    transition: background 0.15s;
                }
                .callhist-row:active { background: var(--bg-secondary, #f9f9f9); }
                .callhist-avatar-wrap {
                    position: relative;
                    flex-shrink: 0;
                }
                .callhist-avatar {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    object-fit: cover;
                }
                .callhist-type-dot {
                    position: absolute;
                    bottom: -2px;
                    right: -2px;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid var(--bg-primary, #fff);
                    color: white;
                }
                .callhist-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    min-width: 0;
                    cursor: pointer;
                }
                .callhist-name {
                    font-size: 15px;
                    font-weight: 600;
                    color: var(--text-primary, #111);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .callhist-meta {
                    font-size: 12px;
                    font-weight: 500;
                    text-transform: capitalize;
                }
                .callhist-time {
                    font-size: 11px;
                    color: var(--text-secondary, #999);
                }
                .callhist-actions {
                    display: flex;
                    gap: 8px;
                    flex-shrink: 0;
                }
                .callhist-action-btn {
                    width: 38px;
                    height: 38px;
                    border: none;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: transform 0.15s, opacity 0.15s;
                }
                .callhist-action-btn:active { transform: scale(0.88); }
                .callhist-action-btn.voice {
                    background: #dcfce7;
                    color: #16a34a;
                }
                .callhist-action-btn.video {
                    background: #dbeafe;
                    color: #2563eb;
                }
            `}</style>
        </div>
    );
};

// ─── Active Call Screen ────────────────────────────────────────────────
const ActiveCallView = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const userId = useCurrentUserId();
    const isVideoCall = searchParams.get('type') === 'video';

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(!isVideoCall);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [callDuration, setCallDuration] = useState(0);
    const [isConnecting, setIsConnecting] = useState(true);

    const localVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => setIsConnecting(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (isConnecting) return;
        const interval = setInterval(() => setCallDuration(prev => prev + 1), 1000);
        return () => clearInterval(interval);
    }, [isConnecting]);

    useEffect(() => {
        if (isVideoCall && !isVideoOff) {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then(stream => { if (localVideoRef.current) localVideoRef.current.srcObject = stream; })
                .catch(err => console.error('Camera error:', err));
        }
    }, [isVideoCall, isVideoOff]);

    const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    const handleEndCall = async () => {
        const stream = localVideoRef.current?.srcObject as MediaStream;
        stream?.getTracks().forEach(t => t.stop());

        // Record call to database if we have duration
        if (userId && username) {
            try {
                // Find receiver profile by username
                const { data: receiverProfile } = await insforge.database
                    .from('profiles')
                    .select('id')
                    .eq('username', username)
                    .single();

                if (receiverProfile) {
                    await insforge.database.from('calls').insert({
                        caller_id: userId,
                        receiver_id: receiverProfile.id,
                        type: isVideoCall ? 'video' : 'voice',
                        status: callDuration > 0 ? 'completed' : 'missed',
                        duration: callDuration
                    });
                }
            } catch (err) {
                console.error("Failed to save call log:", err);
            }
        }

        navigate(-1);
    };

    return (
        <div className={`call-container ${isVideoCall ? 'video-mode' : 'voice-mode'}`}>
            <div className="call-bg-blur" style={{ backgroundColor: 'var(--primary-color)', opacity: 0.2 }}>
                {/* Removed hardcoded background image */}
            </div>

            <div className="call-main-area">
                {isVideoCall && !isVideoOff ? (
                    <div className="video-full-preview">
                        <div className="remote-video-placeholder">
                            <Avatar
                                src={null} // Remote user may not have URL easily available in this simplified view, use initials
                                name={username}
                                size={140}
                                className="remote-avatar-large"
                            />
                            <div className="remote-status-badge">Waiting for {username}...</div>
                        </div>
                        <div className="local-video-pip">
                            <video ref={localVideoRef} autoPlay playsInline muted />
                            {!isVideoOff && <div className="pip-label">You</div>}
                        </div>
                    </div>
                ) : (
                    <div className="voice-info-card">
                        <div className={`avatar-pulse-container ${isConnecting ? 'pulsing' : ''}`}>
                            <Avatar
                                src={null}
                                name={username}
                                size={160}
                                className="call-avatar"
                            />
                        </div>
                        <h2 className="call-username">{username}</h2>
                        <p className="call-status">{isConnecting ? 'Ringing...' : fmt(callDuration)}</p>
                    </div>
                )}
            </div>

            <div className="call-controls-bar">
                <div className="call-controls-glass">
                    <button className={`call-action-btn ${isSpeakerOn ? 'active' : ''}`} onClick={() => setIsSpeakerOn(!isSpeakerOn)}>
                        {isSpeakerOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
                        <span>Speaker</span>
                    </button>
                    <button className={`call-action-btn ${isVideoOff ? '' : 'active'}`} onClick={() => setIsVideoOff(!isVideoOff)}>
                        {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                        <span>Video</span>
                    </button>
                    <button className={`call-action-btn ${isMuted ? 'active' : ''}`} onClick={() => setIsMuted(!isMuted)}>
                        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                        <span>Mute</span>
                    </button>
                    <button className="call-end-btn" onClick={handleEndCall}>
                        <PhoneOff size={28} color="white" />
                    </button>
                </div>
            </div>

            <style>{`
                .call-container { position:fixed;inset:0;background:#000;color:white;display:flex;flex-direction:column;overflow:hidden;z-index:9999;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
                .call-bg-blur { position:absolute;inset:0;z-index:1;overflow:hidden; }
                .call-bg-blur img { width:110%;height:110%;object-fit:cover;filter:blur(40px) brightness(0.4);transform:translate(-5%,-5%); }
                .call-main-area { position:relative;flex:1;z-index:2;display:flex;align-items:center;justify-content:center; }
                .voice-info-card { text-align:center; }
                .avatar-pulse-container { position:relative;width:160px;height:160px;margin:0 auto 24px; }
                .avatar-pulse-container.pulsing::after { content:'';position:absolute;inset:-10px;border:2px solid rgba(255,255,255,0.3);border-radius:50%;animation:pulse-ring 2s infinite; }
                @keyframes pulse-ring { 0%{transform:scale(0.9);opacity:1} 100%{transform:scale(1.5);opacity:0} }
                .call-avatar { width:100%;height:100%;border-radius:50%;border:4px solid rgba(255,255,255,0.1);object-fit:cover;box-shadow:0 10px 40px rgba(0,0,0,0.5); }
                .call-username { font-size:32px;font-weight:700;margin-bottom:8px;text-shadow:0 2px 10px rgba(0,0,0,0.5); }
                .call-status { font-size:18px;opacity:0.8;letter-spacing:0.5px; }
                .video-full-preview { position:absolute;inset:0;background:#111; }
                .remote-video-placeholder { width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#000; }
                .remote-avatar-large { width:140px;height:140px;border-radius:50%;margin-bottom:20px;filter:grayscale(0.5); }
                .remote-status-badge { font-size:14px;opacity:0.7; }
                .local-video-pip { position:absolute;top:60px;right:20px;width:120px;height:180px;background:#222;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.2);z-index:10; }
                .local-video-pip video { width:100%;height:100%;object-fit:cover;transform:scaleX(-1); }
                .pip-label { position:absolute;bottom:8px;left:8px;font-size:10px;background:rgba(0,0,0,0.5);padding:2px 6px;border-radius:4px; }
                .call-controls-bar { position:relative;z-index:10;padding:20px 20px 40px;display:flex;justify-content:center; }
                .call-controls-glass { background:rgba(255,255,255,0.1);backdrop-filter:blur(20px);padding:16px 32px;border-radius:40px;border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;gap:30px;box-shadow:0 20px 50px rgba(0,0,0,0.3); }
                .call-action-btn { background:none;border:none;color:white;display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer;transition:transform 0.2s;min-width:50px; }
                .call-action-btn span { font-size:11px;font-weight:600;opacity:0.8; }
                .call-action-btn.active { color:#55efc4; }
                .call-action-btn:active { transform:scale(0.9); }
                .call-end-btn { width:64px;height:64px;background:#ff4757;border:none;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 20px rgba(255,71,87,0.4);transition:transform 0.2s; }
                .call-end-btn:active { transform:scale(0.85);background:#ee5253; }
            `}</style>
        </div>
    );
};

// ─── Main Export: decides which view to show ─────────────────────────
const CallView = () => {
    const { username } = useParams();
    const [searchParams] = useSearchParams();
    const callType = searchParams.get('type'); // null = history, 'voice'/'video' = active call

    // If there's a type param AND username we're in an active call
    // If username is "history" (from /call/history route) or no type, show history
    const showHistory = !callType || username === 'history';

    return showHistory ? <CallHistoryView /> : <ActiveCallView />;
};

export default CallView;
