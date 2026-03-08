import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Volume2, VolumeX } from 'lucide-react';
import { insforge } from '../lib/insforge';
import { useCurrentUserId } from '../hooks/useCurrentUser';
import Avatar from '../components/Avatar';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';

const STUN_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

const ActiveCallView = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const userId = useCurrentUserId();
    const { profileData, incomingCall, setIncomingCall } = useData();
    const { showToast } = useToast();
    const isVideoCall = searchParams.get('type') === 'video';

    const [peerProfile, setPeerProfile] = useState<any>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(!isVideoCall);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [callDuration, setCallDuration] = useState(0);
    const [callState, setCallState] = useState<'connecting' | 'ringing' | 'connected' | 'ended'>('connecting');

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    const pcRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);

    // Cleanup func
    const cleanupCall = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
    }, []);

    // 1. Fetch Peer
    useEffect(() => {
        if (!username) return;
        insforge.database.from('profiles').select().eq('username', username).single().then(({ data }) => {
            if (data) setPeerProfile(data);
        });
    }, [username]);

    // 2. Initialize Media & WebRTC
    useEffect(() => {
        if (!userId || !peerProfile) return;

        let isSubscribed = true;
        const initCall = async () => {
            try {
                // Get Media
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: isVideoCall ? true : false,
                    audio: true
                });

                if (!isSubscribed) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }

                localStreamRef.current = stream;
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;

                // Create RTCPeerConnection
                const pc = new RTCPeerConnection(STUN_SERVERS);
                pcRef.current = pc;

                // Add local tracks
                stream.getTracks().forEach(track => {
                    pc.addTrack(track, stream);
                });

                // Handle remote track
                pc.ontrack = (event) => {
                    if (remoteVideoRef.current && event.streams[0]) {
                        remoteVideoRef.current.srcObject = event.streams[0];
                    }
                };

                // Handle ICE candidate
                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        insforge.realtime.publish(`user:${peerProfile.id}`, 'CALL_ICE_CANDIDATE', {
                            candidate: event.candidate,
                            caller_id: userId
                        });
                    }
                };

                // Connection State
                pc.onconnectionstatechange = () => {
                    if (pc.connectionState === 'connected') setCallState('connected');
                    if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') handleEndCall(false);
                };

                // Caller vs Receiver Logic
                const isReceiver = incomingCall && incomingCall.caller_id === peerProfile.id;

                if (isReceiver) {
                    // Receiver: set remote description from Offer, create Answer
                    setCallState('connected'); // we answered it
                    if (incomingCall.offer) {
                        await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        insforge.realtime.publish(`user:${peerProfile.id}`, 'CALL_ANSWER', {
                            answer,
                            caller_id: userId
                        });
                    }
                } else {
                    // Caller: create Offer
                    setCallState('ringing');
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    insforge.realtime.publish(`user:${peerProfile.id}`, 'CALL_INIT', {
                        caller_id: userId,
                        caller_name: profileData?.name || 'Someone',
                        caller_avatar: profileData?.avatar_url,
                        type: isVideoCall ? 'video' : 'voice',
                        username: profileData?.username,
                        offer: offer
                    });
                }
            } catch (err: any) {
                const isPermissionError = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
                const message = isPermissionError
                    ? 'Camera/microphone access denied. Please enable it in browser settings.'
                    : 'Failed to initialize call. Please try again.';
                showToast(message, 'error');
                handleEndCall();
            }
        };

        if (!pcRef.current) {
            initCall();
        }

        return () => {
            isSubscribed = false;
        };
    }, [userId, peerProfile]);

    // 3. Listen for WebRTC signals (Answer, ICE, End)
    useEffect(() => {
        if (!userId) return;

        const handleAnswer = async (payload: any) => {
            if (payload.caller_id === peerProfile?.id && pcRef.current) {
                await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
                setCallState('connected');
            }
        };

        const handleIceCandidate = async (payload: any) => {
            if (payload.caller_id === peerProfile?.id && pcRef.current && payload.candidate) {
                try {
                    await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
                } catch (e) { console.error('Error adding ICE candidate', e); }
            }
        };

        const handleCallEnd = (payload: any) => {
            if (payload.caller_id === peerProfile?.id) {
                handleEndCall(false); // peer ended it
            }
        };

        insforge.realtime.on('CALL_ANSWER', handleAnswer);
        insforge.realtime.on('CALL_ICE_CANDIDATE', handleIceCandidate);
        insforge.realtime.on('CALL_END', handleCallEnd);

        return () => {
            insforge.realtime.off('CALL_ANSWER', handleAnswer);
            insforge.realtime.off('CALL_ICE_CANDIDATE', handleIceCandidate);
            insforge.realtime.off('CALL_END', handleCallEnd);
        };
    }, [userId, peerProfile]);

    // 4. Call Duration Timer
    useEffect(() => {
        let timer: any;
        if (callState === 'connected') {
            timer = setInterval(() => setCallDuration(prev => prev + 1), 1000);
        }
        return () => clearInterval(timer);
    }, [callState]);

    // 5. Mute / Video Toggles
    useEffect(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(t => t.enabled = !isMuted);
        }
    }, [isMuted]);

    useEffect(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(t => t.enabled = !isVideoOff);
        }
    }, [isVideoOff]);

    const formatDuration = useCallback((s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, []);

    const handleEndCall = useCallback(async (isLocalEnd = true) => {
        if (callState === 'ended') return;
        setCallState('ended');

        if (isLocalEnd && peerProfile && userId) {
            insforge.realtime.publish(`user:${peerProfile.id}`, 'CALL_END', { caller_id: userId }).catch(() => { });
        }

        cleanupCall();
        setIncomingCall(null);

        // only the caller logs the call history to prevent duplicates
        const isCaller = !(incomingCall && incomingCall.caller_id === peerProfile?.id);

        if (isCaller && userId && peerProfile) {
            try {
                const { data: callData } = await insforge.database
                    .from('calls')
                    .insert([{
                        caller_id: userId,
                        receiver_id: peerProfile.id,
                        type: isVideoCall ? 'video' : 'voice',
                        status: callDuration > 0 ? 'completed' : 'missed',
                        duration: callDuration
                    }])
                    .select('id')
                    .single();

                if (callData) {
                    const statusLabel = callDuration > 0 ? (isVideoCall ? 'Video call' : 'Voice call') : 'Missed call';
                    const { data: msgData } = await insforge.database
                        .from('messages')
                        .insert([{
                            sender_id: userId,
                            receiver_id: peerProfile.id,
                            text: statusLabel,
                            call_id: callData.id,
                            is_seen: false
                        }])
                        .select('id')
                        .single();

                    if (msgData) {
                        const publishPayload = {
                            id: msgData.id,
                            sender_id: userId,
                            receiver_id: peerProfile.id,
                            text: statusLabel,
                            call_id: callData.id,
                            created_at: new Date().toISOString()
                        };
                        insforge.realtime.publish(`chat:${peerProfile.id}`, 'INSERT_message', publishPayload).catch(() => { });
                        insforge.realtime.publish(`chat:${userId}`, 'INSERT_message', publishPayload).catch(() => { });
                    }
                }
            } catch (err) { }
        }
        navigate(-1);
    }, [userId, peerProfile, isVideoCall, callDuration, navigate, callState, incomingCall, setIncomingCall, cleanupCall]);

    return (
        <div className={`call-container ${isVideoCall ? 'video-mode' : 'voice-mode'}`}>
            <div className="call-bg-blur" style={{
                background: peerProfile?.avatar_url
                    ? `url(${peerProfile.avatar_url}) center/cover no-repeat`
                    : 'var(--primary-dark)',
                filter: 'blur(30px) brightness(0.35)',
                transform: 'scale(1.1)'
            }}></div>

            <div className="call-main-area">
                {isVideoCall ? (
                    <div className="video-full-preview">
                        {callState !== 'connected' ? (
                            <div className="remote-video-placeholder">
                                <Avatar src={peerProfile?.avatar_url} name={peerProfile?.name || username} size={140} className="remote-avatar-large" />
                                <div className="remote-status-badge">
                                    {callState === 'ringing' ? 'Ringing...' : 'Connecting...'}
                                </div>
                            </div>
                        ) : (
                            <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
                        )}
                        <div className="local-video-pip fade-in">
                            <video ref={localVideoRef} autoPlay playsInline muted />
                            {!isVideoOff && <div className="pip-label">You</div>}
                        </div>
                    </div>
                ) : (
                    <div className="voice-info-card fade-in">
                        <div className={`avatar-pulse-container ${callState !== 'connected' ? 'pulsing' : ''}`}>
                            <Avatar
                                src={peerProfile?.avatar_url}
                                name={peerProfile?.name || username}
                                size={160}
                                className="call-avatar"
                            />
                        </div>
                        <h2 className="call-username">{peerProfile?.name || username}</h2>
                        <p className="call-status">
                            {callState === 'connected' ? formatDuration(callDuration) : callState === 'ringing' ? 'Ringing...' : 'Connecting...'}
                        </p>
                    </div>
                )}
            </div>

            <div className="call-controls-bar">
                <div className="call-controls-glass">
                    <button className={`call-action-btn ${isSpeakerOn ? 'active' : ''}`} onClick={() => setIsSpeakerOn(!isSpeakerOn)}>
                        {isSpeakerOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
                        <span>Speaker</span>
                    </button>
                    {isVideoCall && (
                        <button className={`call-action-btn ${isVideoOff ? '' : 'active'}`} onClick={() => setIsVideoOff(!isVideoOff)}>
                            {isVideoOff ? <VideoOff size={24} /> : <VideoIcon size={24} />}
                            <span>Video</span>
                        </button>
                    )}
                    <button className={`call-action-btn ${isMuted ? 'active' : ''}`} onClick={() => setIsMuted(!isMuted)}>
                        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                        <span>Mute</span>
                    </button>
                    <button className="call-end-btn" onClick={() => handleEndCall(true)}>
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
                .remote-video { width: 100%; height: 100%; object-fit: cover; }
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
    const callType = searchParams.get('type');

    if (!callType || username === 'history') {
        return <Navigate to="/calls" replace />;
    }

    return <ActiveCallView />;
};

export default CallView;
