import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Phone, Video, Check, CheckCheck, MoreVertical,
    Paperclip, Send, Trash2, Mic, Camera, Plus, X, Copy,
    Reply, RefreshCcw
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { getPendingMedia, clearPendingMedia } from '../pendingMediaStore';
import { insforge, BUCKETS } from '../lib/insforge';
import { useCurrentUserId } from '../hooks/useCurrentUser';
import Avatar from '../components/Avatar';
import LoadingOverlay from '../components/LoadingOverlay';
import { useData } from '../context/DataContext';

interface Message {
    id: number;
    text: string;
    time: string;
    sender: 'me' | 'other';
    status: 'sent' | 'delivered' | 'read';
    image?: string | null;
    audio?: string | null; // Added audio support
    audioDuration?: string;
    mediaType?: 'image' | 'video' | 'audio';
    uploading?: boolean;
    uploadProgress?: number;
    replyTo?: {
        id: number;
        text: string;
        username: string;
    } | null;
}

const AudioPlayer = ({ src, duration, sender }: { src: string; duration?: string; sender?: 'me' | 'other' }) => {
    const isSent = sender === 'me';
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        const current = audioRef.current.currentTime;
        const total = audioRef.current.duration;
        if (total) {
            setProgress((current / total) * 100);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
    };

    return (
        <div className={`audio-player-container modern-audio ${isSent ? 'audio-sent' : 'audio-received'}`}>
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
            />
            <button className={`audio-play-btn ${isSent ? 'audio-btn-sent' : 'audio-btn-received'}`} onClick={togglePlay}>
                {isPlaying ?
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg> :
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="white"><path d="M8 5v14l11-7z" /></svg>
                }
            </button>
            <div className="audio-content-area">
                <div className="audio-visualizer-bars">
                    {[...Array(15)].map((_, i) => (
                        <div
                            key={i}
                            className="audio-bar"
                            style={{
                                height: `${Math.random() * 60 + 20}% `,
                                opacity: progress > (i / 15 * 100) ? 1 : 0.3
                            }}
                        />
                    ))}
                </div>
                <div className="audio-progress-background">
                    <div className="audio-progress-thumb" style={{ left: `${progress}%` }} />
                </div>
                <div className="audio-meta-row">
                    <span className="audio-duration-text">{duration || "0:00"}</span>
                </div>
            </div>
        </div>
    );
};

const SwipeableMessage = ({
    msg,
    index,
    messages,
    showUnreadIndicator,
    onReply,
    onLongPress,
    onPreviewImage,
    handleUnblock,
    onScrollToReply,
    messageRef
}: any) => {
    const [swipeX, setSwipeX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const touchStartX = useRef(0);
    const swipeThreshold = 60;

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        setIsSwiping(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const currentX = e.touches[0].clientX;
        const diff = currentX - touchStartX.current;
        if (diff > 0) {
            setSwipeX(Math.min(diff, 80));
        }
    };

    const handleTouchEnd = () => {
        if (swipeX >= swipeThreshold) {
            onReply(msg);
            if (navigator.vibrate) navigator.vibrate(10);
        }
        setSwipeX(0);
        setIsSwiping(false);
    };

    return (
        <div className="message-outer-wrapper" ref={messageRef}>
            <div
                className="swipe-reply-indicator"
                style={{
                    opacity: Math.min(swipeX / swipeThreshold, 1),
                    transform: `translateY(-50 %) scale(${Math.min(swipeX / swipeThreshold, 1)})`,
                    left: `${swipeX - 35} px`
                }}
            >
                <Reply size={20} />
            </div>

            <div
                className={`message - bubble - container ${isSwiping ? 'swiping' : ''} `}
                style={{ transform: `translateX(${swipeX}px)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {showUnreadIndicator && index === messages.length - 1 && (
                    <div className="unread-divider">
                        <div className="unread-text">New messages</div>
                    </div>
                )}

                {msg.time === "" ? (
                    <div className="system-message-container">
                        <div className="system-message" onClick={() => msg.text.includes("unblock") && handleUnblock()}>
                            {msg.text}
                        </div>
                    </div>
                ) : (
                    <div className="message-wrapper" style={{ alignItems: msg.sender === 'me' ? 'flex-end' : 'flex-start' }}>
                        <div
                            className={`message - bubble ${msg.sender === 'me' ? 'message-sent' : 'message-received'} `}
                            onContextMenu={(e) => { e.preventDefault(); onLongPress(msg); }}
                        >
                            {msg.replyTo && (
                                <div
                                    className="message-reply-context"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onScrollToReply(msg.replyTo.id);
                                    }}
                                >
                                    <span className="message-reply-name">
                                        {msg.replyTo.username === 'me' ? 'You' : msg.replyTo.username}
                                    </span>
                                    <span className="message-reply-text">
                                        {msg.replyTo.text}
                                    </span>
                                </div>
                            )}
                            {msg.image && (
                                <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                                    {msg.mediaType === 'video' ? (
                                        <div
                                            className="video-thumb-wrapper"
                                            onClick={() => !msg.uploading && onPreviewImage({ url: msg.image!, type: 'video' })}
                                            style={{ cursor: msg.uploading ? 'default' : 'pointer' }}
                                        >
                                            <video
                                                src={msg.image}
                                                className="message-image-content"
                                                playsInline
                                                preload="metadata"
                                                muted
                                                style={{ opacity: msg.uploading ? 0.5 : 1, pointerEvents: 'none' }}
                                            />
                                            {!msg.uploading && (
                                                <div className="video-play-hint-bubble">
                                                    <svg viewBox="0 0 24 24" width="28" height="28" fill="white"><path d="M8 5v14l11-7z" /></svg>
                                                </div>
                                            )}
                                            {msg.uploading && (
                                                <div style={{
                                                    position: 'absolute', inset: 0, display: 'flex',
                                                    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                    background: 'rgba(0,0,0,0.45)', borderRadius: '10px'
                                                }}>
                                                    <div className="upload-progress-bar" style={{ width: '80%' }}>
                                                        <div className="upload-progress-fill" style={{ width: `${msg.uploadProgress ?? 0}% ` }} />
                                                    </div>
                                                    <span className="upload-progress-label">{msg.uploadProgress ?? 0}%</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <img
                                                src={msg.image}
                                                alt="Sent"
                                                className="message-image-content"
                                                style={{ opacity: msg.uploading ? 0.6 : 1, transition: 'opacity 0.3s', cursor: msg.uploading ? 'default' : 'pointer' }}
                                                onClick={() => !msg.uploading && onPreviewImage({ url: msg.image!, type: msg.mediaType || 'image' })}
                                            />
                                            {msg.mediaType === 'video' && !msg.uploading && (
                                                <div className="video-play-hint">
                                                    <svg viewBox="0 0 24 24" width="30" height="30" fill="white"><path d="M8 5v14l11-7z" /></svg>
                                                </div>
                                            )}
                                            {msg.uploading && (
                                                <div className="upload-progress-overlay">
                                                    <div className="upload-progress-bar">
                                                        <div className="upload-progress-fill" style={{ width: `${msg.uploadProgress ?? 0}% ` }} />
                                                    </div>
                                                    <span className="upload-progress-label">{msg.uploadProgress ?? 0}%</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {msg.audio && (
                                <AudioPlayer src={msg.audio} duration={msg.audioDuration} sender={msg.sender} />
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div className="message-text">{msg.text}</div>
                                <div className="message-footer">
                                    <span className="message-time">{msg.time}</span>
                                    {msg.sender === 'me' && (
                                        <span className="status-ticks">
                                            {msg.status === 'read' ? <CheckCheck size={14} className="tick-blue" /> :
                                                msg.status === 'delivered' ? <CheckCheck size={14} /> : <Check size={14} />}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Custom Video Preview Player (full-screen overlay) ---
const VideoPreviewPlayer = ({ src }: { src: string }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [progress, setProgress] = useState(0);

    const fmt = (s: number) => {
        if (!isFinite(s)) return '0:00';
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')} `;
    };

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) videoRef.current.pause();
        else videoRef.current.play();
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!videoRef.current) return;
        const val = Number(e.target.value);
        videoRef.current.currentTime = (val / 100) * duration;
        setProgress(val);
    };

    return (
        <div className="video-preview-player" onClick={(e) => e.stopPropagation()}>
            <video
                ref={videoRef}
                src={src}
                className="video-preview-source"
                autoPlay
                playsInline
                onTimeUpdate={() => {
                    if (!videoRef.current) return;
                    const c = videoRef.current.currentTime;
                    const d = videoRef.current.duration;
                    setCurrentTime(c);
                    if (d) setProgress((c / d) * 100);
                }}
                onLoadedMetadata={() => {
                    if (videoRef.current) setDuration(videoRef.current.duration);
                }}
                onEnded={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
            />
            <div className="video-preview-controls">
                <button className="video-ctrl-btn" onClick={togglePlay}>
                    {isPlaying
                        ? <svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                        : <svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                    }
                </button>
                <span className="video-time-label">{fmt(currentTime)}</span>
                <input
                    type="range"
                    min={0} max={100}
                    value={progress}
                    onChange={handleSeek}
                    className="video-seek-bar"
                />
                <span className="video-time-label">{fmt(duration)}</span>
            </div>
        </div>
    );
};

const Chat = () => {
    const navigate = useNavigate();
    const { username } = useParams();
    const { showToast } = useToast();
    const { chatWallpaper } = useTheme();
    const userId = useCurrentUserId();
    const { contacts, messagesCache, cacheMessages, setContacts } = useData();
    const [receiverId, setReceiverId] = useState<string | null>(null);
    const [receiver, setReceiver] = useState<any>(() => {
        return contacts?.find(c => c.username === username);
    });
    const [messages, setMessages] = useState<Message[]>(() => {
        return (username && messagesCache[username]) || [];
    });
    const [inputText, setInputText] = useState('');
    const [isBlocked, setIsBlocked] = useState(false);
    const [showUnreadIndicator, setShowUnreadIndicator] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [longPressedMsg, setLongPressedMsg] = useState<any>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [showBlockConfirm, setShowBlockConfirm] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [previewMedia, setPreviewMedia] = useState<{ url: string, type: 'image' | 'video' } | null>(null);
    const [replyingTo, setReplyingTo] = useState<any>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [badgeText, setBadgeText] = useState('');
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(!messages.length);
    const [actionLoading, setActionLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const firstUnreadIdRef = useRef<number | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const messageInputRef = useRef<HTMLTextAreaElement>(null);
    const recordingInterval = useRef<any>(null);
    const sendMediaDirectlyRef = useRef<((url: string, type: 'image' | 'video') => void) | null>(null);

    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

    const scrollToBottom = useCallback(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    const handleScrollToReply = (id: number) => {
        const target = messageRefs.current.get(id);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            target.classList.add('highlight-message');
            setTimeout(() => target.classList.remove('highlight-message'), 2000);
            if (navigator.vibrate) navigator.vibrate(20);
        } else {
            showToast('Original message not found', 'info');
        }
    };

    const uploadAndSendMedia = useCallback(async (
        file: Blob | string,
        type: 'image' | 'video' | 'audio',
        duration?: string
    ) => {
        if (!userId || !receiverId) {
            showToast('User session or receiver not found', 'error');
            return;
        }

        const msgId = Date.now();
        const label = type.charAt(0).toUpperCase() + type.slice(1);

        // 1. Create local preview URL if needed
        let previewUrl = typeof file === 'string' ? file : URL.createObjectURL(file);

        // 2. Add optimistic message
        const newMsg: Message = {
            id: msgId,
            text: type === 'audio' ? '' : `Sent a ${type}`,
            image: type === 'audio' ? null : previewUrl,
            audio: type === 'audio' ? previewUrl : null,
            audioDuration: duration,
            mediaType: type,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender: 'me',
            status: 'sent',
            uploading: true,
            uploadProgress: 0,
        };
        setMessages(prev => [...prev, newMsg]);

        try {
            // 3. Convert string (base64/blob URL) to actual Blob if necessary
            let uploadBlob: Blob;
            if (typeof file === 'string') {
                const res = await fetch(file);
                uploadBlob = await res.blob();
            } else {
                uploadBlob = file;
            }

            // 4. Determine bucket and path
            const bucket = type === 'video' ? BUCKETS.chatMedia :
                (type === 'audio' ? BUCKETS.chatMedia : BUCKETS.chatImages);
            const ext = type === 'video' ? 'mp4' : (type === 'audio' ? 'webm' : 'jpg');
            const path = `${userId}/${Date.now()}.${ext}`;

            // 5. Upload to InsForge
            const { data: uploadData, error: uploadError } = await insforge.storage
                .from(bucket)
                .upload(path, uploadBlob);

            if (uploadError) throw uploadError;
            if (!uploadData?.url) throw new Error('Upload failed');

            const mediaUrl = uploadData.url;

            // 6. Save to Database
            const insertPayload: any = {
                sender_id: userId,
                receiver_id: receiverId,
                text: null,
                is_seen: false,
            };

            if (type === 'video') insertPayload.video_url = mediaUrl;
            else if (type === 'audio') insertPayload.audio_url = mediaUrl;
            else insertPayload.image_url = mediaUrl;

            const { error: dbError } = await insforge.database
                .from('messages')
                .insert(insertPayload);

            if (dbError) throw dbError;

            // 7. Update UI with final URL
            setMessages(prev => prev.map(m =>
                m.id === msgId ? {
                    ...m,
                    image: type === 'audio' ? null : mediaUrl,
                    audio: type === 'audio' ? mediaUrl : null,
                    uploading: false,
                    uploadProgress: 100
                } : m
            ));

            showToast(`${label} sent`, 'success');
        } catch (err) {
            console.error(`Error sending ${type}:`, err);
            showToast(`Failed to send ${type}`, 'error');
            setMessages(prev => prev.filter(m => m.id !== msgId));
        }
    }, [userId, receiverId, showToast]);

    // Load messages from InsForge DB
    useEffect(() => {
        if (!userId || !username) return;

        const loadChat = async () => {
            try {
                // 1. Resolve Profile (Cache first)
                let profile = contacts?.find(c => c.username === username);

                if (!profile) {
                    const { data, error } = await insforge.database
                        .from('profiles')
                        .select('id, name, avatar_url, username')
                        .eq('username', username)
                        .single();
                    if (error || !data) {
                        setLoading(false);
                        return;
                    }
                    profile = data;
                }

                if (profile) {
                    const pid = profile.id || (profile as any).contact_id;
                    setReceiver(profile);
                    setReceiverId(pid);

                    // 2. Parallelize everything
                    const [msgRes] = await Promise.all([
                        // Load messages (limited to 50 for speed)
                        insforge.database
                            .from('messages')
                            .select('*')
                            .or(`and(sender_id.eq.${userId},receiver_id.eq.${pid}),and(sender_id.eq.${pid},receiver_id.eq.${userId})`)
                            .order('created_at', { ascending: false })
                            .limit(50),

                        // Mark messages as seen (Background task)
                        insforge.database
                            .from('messages')
                            .update({ is_seen: true })
                            .eq('sender_id', pid)
                            .eq('receiver_id', userId)
                            .eq('is_seen', false)
                            .catch(err => console.warn('Silent failure marking messages as seen:', err)),

                        // Ensure contact entry exists (Background task)
                        insforge.database
                            .from('contacts')
                            .upsert({
                                user_id: userId,
                                contact_id: pid
                            }, { onConflict: 'user_id,contact_id' })
                            .catch(err => console.warn('Silent failure upserting contact:', err))
                    ]);

                    const dbMsgs = msgRes.data;

                    if (dbMsgs) {
                        const mapped: Message[] = dbMsgs.reverse().map((m: any) => ({
                            id: m.id,
                            text: m.text || '',
                            image: m.video_url || m.audio_url || m.image_url || null,
                            mediaType: m.video_url ? 'video' : (m.audio_url ? 'audio' : (m.image_url ? 'image' : undefined)),
                            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            sender: m.sender_id === userId ? 'me' : 'other',
                            status: m.is_seen ? 'read' : 'delivered',
                        }));
                        setMessages(mapped);
                        if (username) cacheMessages(username, mapped);
                        setHasMore(dbMsgs.length === 50);
                        // Clear unread badge for this contact in DataContext immediately
                        setContacts(prev => prev.map((c: any) =>
                            c.contact_id === pid ? { ...c, unread: 0 } : c
                        ));
                        setTimeout(scrollToBottom, 100);
                    }
                }
            } catch (err) {
                console.error('loadChat error:', err);
            }
        };

        const fetchInitialData = async () => {
            if (!messages.length) setLoading(true);
            try {
                await loadChat();
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [userId, username, scrollToBottom]);

    const handleLoadMore = async () => {
        if (!userId || !receiverId || !hasMore || loadingMore) return;
        setLoadingMore(true);
        try {
            const oldestMsgId = messages[0]?.id;
            const { data: olderMsgs } = await insforge.database
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${userId}, receiver_id.eq.${receiverId}), and(sender_id.eq.${receiverId}, receiver_id.eq.${userId})`)
                .lt('id', oldestMsgId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (olderMsgs && olderMsgs.length > 0) {
                const mapped: Message[] = olderMsgs.reverse().map((m: any) => ({
                    id: m.id,
                    text: m.text || '',
                    image: m.video_url || m.audio_url || m.image_url || null,
                    mediaType: m.video_url ? 'video' : (m.audio_url ? 'audio' : (m.image_url ? 'image' : undefined)),
                    time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    sender: m.sender_id === userId ? 'me' : 'other',
                    status: m.is_seen ? 'read' : 'delivered',
                }));
                setMessages(prev => [...mapped, ...prev]);
                setHasMore(olderMsgs.length === 50);
            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.error('Load more error:', err);
        } finally {
            setLoadingMore(false);
        }
    };

    // Realtime: subscribe to new messages in this chat
    useEffect(() => {
        if (!userId || !receiverId) return;
        const channel = `chat:${[userId, receiverId].sort().join('-')}`;

        const handleNewMessage = (payload: any) => {
            if (payload.sender_id === userId) return; // skip self
            const incoming: Message = {
                id: payload.id,
                text: payload.text || '',
                image: payload.video_url || payload.audio_url || payload.image_url || null,
                mediaType: payload.video_url ? 'video' : (payload.audio_url ? 'audio' : (payload.image_url ? 'image' : undefined)),
                time: new Date(payload.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                sender: 'other',
                status: 'delivered',
            };
            setMessages(prev => [...prev, incoming]);
            setIsAtBottom(prev => {
                if (!prev) {
                    setUnreadCount(c => {
                        if (c === 0) firstUnreadIdRef.current = typeof incoming.id === 'string' ? parseInt(incoming.id) : incoming.id as number;
                        return c + 1;
                    });
                    setBadgeText(incoming.text?.length > 35 ? incoming.text.slice(0, 35) + '…' : (incoming.text || 'New message'));
                } else {
                    // Automatically mark as seen if user is at bottom
                    insforge.database
                        .from('messages')
                        .update({ is_seen: true })
                        .eq('id', payload.id)
                        .then(({ error }) => {
                            if (!error) {
                                // Update local status
                                setMessages(msgs => msgs.map(m => m.id === payload.id ? { ...m, status: 'read' } : m));
                            }
                        });
                }
                return prev;
            });
        };

        const handleUpdateMessage = (payload: any) => {
            if (payload.is_seen) {
                setMessages(prev => prev.map(m => m.id === payload.id ? { ...m, status: 'read' } : m));
            }
        };

        const setup = async () => {
            try {
                await insforge.realtime.connect();
                await insforge.realtime.subscribe(channel);
                insforge.realtime.on('INSERT_message', handleNewMessage);
                insforge.realtime.on('UPDATE_message', handleUpdateMessage);
            } catch (err) {
                console.error('Chat realtime setup error:', err);
            }
        };

        setup();

        return () => {
            insforge.realtime.off('INSERT_message', handleNewMessage);
            insforge.realtime.off('UPDATE_message', handleUpdateMessage);
            insforge.realtime.unsubscribe(channel);
        };
    }, [userId, receiverId]);

    useEffect(() => {
        if (showUnreadIndicator) {
            const timer = setTimeout(() => setShowUnreadIndicator(false), 3000);
            return () => clearTimeout(timer);
        } else if (isAtBottom) {
            scrollToBottom();
        }
    }, [showUnreadIndicator, isAtBottom, scrollToBottom]);

    useEffect(() => {
        if (!showUnreadIndicator && isAtBottom) {
            scrollToBottom();
        }
    }, [messages, showUnreadIndicator, isAtBottom, scrollToBottom]);

    // Auto-cache messages
    useEffect(() => {
        if (username && messages.length > 0) {
            cacheMessages(username, messages);
        }
    }, [messages, username, cacheMessages]);

    useEffect(() => {
        const checkPendingMedia = () => {
            const media = getPendingMedia();
            if (!media) return;
            clearPendingMedia();
            uploadAndSendMedia(media.url, media.type === 'video' ? 'video' : 'image');
        };

        let rafId = 0;
        const handleViewportChange = () => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                const viewport = window.visualViewport;
                if (!viewport) return;

                const chatContainer = document.querySelector('.chat-container') as HTMLElement;
                if (!chatContainer) return;

                const currentHeight = viewport.height;
                const keyboardOpen = currentHeight < window.innerHeight * 0.85;

                // Lock container height precisely to the visual viewport
                chatContainer.style.setProperty('--vh', `${currentHeight}px`);

                if (keyboardOpen) {
                    document.body.style.overflow = 'hidden';
                    // Accurate position sync via hardware acceleration
                    chatContainer.style.transform = `translateY(${Math.round(viewport.offsetTop)}px)`;
                    chatContainer.classList.add('keyboard-active');

                    // Only scroll on keyboard open if user is already at bottom
                    if (isAtBottom) setTimeout(scrollToBottom, 50);
                } else {
                    document.body.style.overflow = '';
                    chatContainer.classList.remove('keyboard-active');
                    chatContainer.style.transform = '';
                    chatContainer.style.height = '';
                }
            });
        };

        sendMediaDirectlyRef.current = uploadAndSendMedia;
        checkPendingMedia();

        if (window.visualViewport) {
            handleViewportChange();
            window.visualViewport.addEventListener('resize', handleViewportChange);
            window.visualViewport.addEventListener('scroll', handleViewportChange);
        }
        window.addEventListener('focus', checkPendingMedia);

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener('focus', checkPendingMedia);
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleViewportChange);
                window.visualViewport.removeEventListener('scroll', handleViewportChange);
            }
        };
    }, [username, showToast, userId, receiverId, scrollToBottom]);

    const handleGalleryClick = () => {
        galleryInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        const reader = new FileReader();
        reader.onload = (event) => {
            const url = event.target?.result as string;
            const mediaType = file.type.startsWith('video') ? 'video' : 'image';
            if (sendMediaDirectlyRef.current) {
                sendMediaDirectlyRef.current(url, mediaType);
            }
        };
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        if (isRecording && !isPaused) {
            recordingInterval.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(recordingInterval.current);
        }
        return () => clearInterval(recordingInterval.current);
    }, [isRecording, isPaused]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

                if (shouldSendAudio.current) {
                    const duration = formatTime(recordingTime);
                    // Unified flow handles storage + DB
                    await uploadAndSendMedia(audioBlob, 'audio', duration);
                }

                // CRITICAL: Cleanup stream tracks to turn off the mic indicator
                stream.getTracks().forEach(track => {
                    track.stop();
                    console.log("Track stopped:", track.kind);
                });
            };

            recorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            setIsPaused(false);
        } catch (err: any) {
            console.error("Error accessing microphone:", err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                showToast('Microphone access denied. Please enable it in browser settings.', 'error');
            } else {
                showToast('Could not access microphone', 'error');
            }
        }
    };

    const shouldSendAudio = useRef(false);

    const stopRecording = (send: boolean) => {
        shouldSendAudio.current = send;
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    };

    const handleUnblock = async () => {
        if (!userId || !receiverId) return;
        try {
            await insforge.database
                .from('blocked_users')
                .delete()
                .eq('user_id', userId)
                .eq('blocked_id', receiverId);

            setIsBlocked(false);
            const systemMsg: Message = {
                id: Date.now(),
                text: "You unblocked this contact.",
                time: "",
                sender: "me",
                status: "read"
            };
            setMessages(prev => [...prev, systemMsg]);
            setShowMenu(false);
            showToast('User unblocked', 'success');
        } catch (err) {
            console.error('Unblock error:', err);
            showToast('Failed to unblock user', 'error');
        }
    };

    const handleSendMessage = async (e: any) => {
        if (e) e.preventDefault();

        // If there's a captured image from camera, use the unified media flow
        if (capturedImage) {
            const finalImage = capturedImage;
            setCapturedImage(null);
            setInputText('');
            // Upload to storage and send
            await uploadAndSendMedia(finalImage, 'image');
            return;
        }

        if (!inputText.trim()) return;
        if (!userId || !receiverId) return;

        const tempId = Date.now() + Math.floor(Math.random() * 1000);
        const textToSend = inputText;
        const currentReply = replyingTo;

        const newMsg: Message = {
            id: tempId,
            text: textToSend,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender: 'me',
            status: 'sent',
            replyTo: currentReply ? {
                id: currentReply.id,
                text: currentReply.text,
                username: currentReply.sender === 'me' ? 'me' : username!
            } : null
        };

        setMessages(prev => [...prev, newMsg]);
        setInputText('');
        setReplyingTo(null);
        setIsTyping(false);

        setTimeout(() => {
            if (messageInputRef.current) {
                messageInputRef.current.focus();
                messageInputRef.current.style.height = 'auto';
            }
        }, 0);

        // Save to InsForge DB
        const { error } = await insforge.database
            .from('messages')
            .insert({
                sender_id: userId,
                receiver_id: receiverId,
                text: textToSend,
                image_url: null,
                is_seen: false,
            });

        if (error) {
            console.error('handleSendMessage error:', error);
            showToast('Failed to send message', 'error');
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }
    };

    const deleteMessage = async (forEveryone: boolean) => {
        if (!longPressedMsg) return;
        if (forEveryone && userId) {
            setActionLoading(true);
            setLoadingMessage('Deleting...');
            try {
                // Delete from DB if it's the user's own message
                await insforge.database
                    .from('messages')
                    .delete()
                    .eq('id', longPressedMsg.id)
                    .eq('sender_id', userId);
                setMessages(prev => prev.map(m => m.id === longPressedMsg.id ? { ...m, text: 'This message was deleted', status: 'read' as const, image: null } : m));
                showToast('Message deleted for everyone', 'info');
            } catch (err) {
                console.error("Delete message error:", err);
                showToast('Failed to delete message', 'error');
            } finally {
                setActionLoading(false);
            }
        } else {
            setMessages(prev => prev.filter(m => m.id !== longPressedMsg.id));
            showToast('Message deleted for you', 'info');
        }
        setLongPressedMsg(null);
    };

    const copyMessage = () => {
        navigator.clipboard.writeText(longPressedMsg.text);
        showToast('Message copied to clipboard', 'info');
        setLongPressedMsg(null);
    };

    const handleBlock = () => {
        setShowMenu(false);
        setShowBlockConfirm(true);
    };

    const confirmBlock = () => {
        setIsBlocked(true);
        setShowBlockConfirm(false);
        const systemMsg: Message = {
            id: Date.now(),
            text: "You blocked this contact. Tap to unblock.",
            time: "",
            sender: "me",
            status: "read"
        };
        setMessages([...messages, systemMsg]);
        showToast(`${username} has been blocked`, 'error');
    };


    const handleClearChat = () => {
        setShowMenu(false);
        setShowClearConfirm(true);
    };

    const executeClearChat = async () => {
        if (!userId || !receiverId) return;
        setActionLoading(true);
        setLoadingMessage('Clearing history...');
        try {
            const { error } = await insforge.database
                .from('messages')
                .delete()
                .or(`and(sender_id.eq.${userId}, receiver_id.eq.${receiverId}), and(sender_id.eq.${receiverId}, receiver_id.eq.${userId})`);

            if (error) throw error;

            setMessages([]);
            setShowClearConfirm(false);
            showToast('Chat history deleted permanently', 'info');
        } catch (err) {
            console.error("Clear chat error:", err);
            showToast('Failed to clear chat history', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading && !messages.length) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--surface-color)', gap: '16px' }}>
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', animation: 'pulse 2s infinite' }}>Loading chat...</p>
            </div>
        );
    }

    return (
        <div
            className="chat-container"
            style={{
                backgroundColor: chatWallpaper || 'var(--chat-bg-default)',
                backgroundImage: chatWallpaper ? 'none' : undefined,
            }}
        >
            {actionLoading && <LoadingOverlay message={loadingMessage} transparent />}
            <nav className="chat-messages-navbar">
                <div className="chat-header-left">
                    <button className="nav-icon-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={24} color="var(--text-secondary)" />
                    </button>
                    {/* NO app logo here - removed per user request */}
                    <div className="chat-header-user" onClick={() => navigate(`/profile/${username}`)}>
                        <div className="chat-header-avatar-container">
                            <Avatar
                                src={receiver?.avatar_url}
                                name={receiver?.name || username}
                                size={40}
                                className="chat-header-avatar"
                            />
                            <div className="chat-header-status-dot" />
                        </div>
                        <div className="chat-header-text-container">
                            <span className="chat-header-name">{receiver?.name || `@${username}`}</span>
                            <span className="chat-header-status">
                                {isTyping ? 'typing...' : `@${username}`}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="chat-header-actions">
                    <button className="chat-call-btn" title="Voice call" onClick={() => navigate(`/call/${username}?type=voice`)}>
                        <Phone size={24} color="var(--text-secondary)" />
                    </button>
                    <button className="chat-call-btn" title="Video call" onClick={() => navigate(`/call/${username}?type=video`)}>
                        <Video size={24} color="var(--text-secondary)" />
                    </button>
                    <button className="nav-icon-btn" onClick={() => setShowMenu(!showMenu)}>
                        <MoreVertical size={20} color="var(--text-secondary)" />
                    </button>
                </div>

                {showMenu && (
                    <>
                        <div className="chat-dropdown-backdrop" onClick={() => setShowMenu(false)} />
                        <div className="chat-dropdown">
                            <div className="dropdown-item" onClick={() => navigate(`/profile/${username}`)}>View Profile</div>
                            <div className="dropdown-item" onClick={() => setShowMenu(false)}>Search in chat</div>
                            <div className="dropdown-item" onClick={() => navigate('/theme-appearance')}>Change Theme</div>
                            <div className="dropdown-item" onClick={isBlocked ? handleUnblock : handleBlock}>
                                {isBlocked ? 'Unblock user' : 'Block user'}
                            </div>
                            <div className="dropdown-item" onClick={handleClearChat}>Clear chat</div>
                        </div>
                    </>
                )}
            </nav>

            <div
                className="chat-messages-area"
                onScroll={(e) => {
                    const target = e.currentTarget;
                    const atBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
                    setIsAtBottom(atBottom);
                    if (atBottom) {
                        setUnreadCount(0);
                        setBadgeText('');
                        firstUnreadIdRef.current = null;
                    }
                }}
            >

                <div className="system-message-badge">
                    🔒 Messages are end-to-end encrypted. No one outside of this chat, not even Masum Chats, can read or listen to them.
                </div>
                {hasMore && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '10px' }}>
                        <button
                            className="load-more-btn"
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--border-color)',
                                padding: '6px 16px',
                                borderRadius: '20px',
                                color: 'var(--text-secondary)',
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            {loadingMore ? <span className="spinner-small" style={{ width: 12, height: 12 }}></span> : <RefreshCcw size={14} />}
                            Load Previous Messages
                        </button>
                    </div>
                )}
                {messages.map((msg, index) => (
                    <SwipeableMessage
                        key={msg.id}
                        msg={msg}
                        index={index}
                        messages={messages}
                        showUnreadIndicator={showUnreadIndicator}
                        onReply={setReplyingTo}
                        onLongPress={(m: any) => setLongPressedMsg(m)}
                        onPreviewImage={setPreviewMedia}
                        handleUnblock={handleUnblock}
                        onScrollToReply={handleScrollToReply}
                        messageRef={(el: HTMLDivElement) => {
                            if (el) messageRefs.current.set(msg.id, el);
                            else messageRefs.current.delete(msg.id);
                        }}
                    />
                ))}

                {isTyping && (
                    <div className="typing-bubble">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* WhatsApp-style new message badge - bottom center, above input */}
            {!isAtBottom && unreadCount > 0 && (
                <div className="new-msg-float-badge" onClick={() => {
                    // Scroll to first unseen message, not just the bottom
                    const firstId = firstUnreadIdRef.current;
                    if (firstId) {
                        const el = messageRefs.current.get(firstId);
                        if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            el.classList.add('highlight-message');
                            setTimeout(() => el.classList.remove('highlight-message'), 2000);
                        }
                    } else {
                        scrollToBottom();
                    }
                    setUnreadCount(0);
                    setBadgeText('');
                    firstUnreadIdRef.current = null;
                }}>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" style={{ marginRight: 5, flexShrink: 0 }}><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z" transform="rotate(180 12 12)" /></svg>
                    <span className="new-msg-badge-text">{badgeText || `${unreadCount} new ${unreadCount === 1 ? 'message' : 'messages'}`}</span>
                </div>
            )}

            {isBlocked ? (
                <div className="blocked-bar">
                    <button className="blocked-btn danger" onClick={handleClearChat}>
                        <Trash2 size={18} /> Delete chat
                    </button>
                    <button className="blocked-btn" onClick={handleUnblock}>
                        <RefreshCcw size={18} /> Unblock contact
                    </button>
                </div>
            ) : (
                <div className="chat-input-wrapper">
                    {replyingTo && (
                        <div className="reply-preview-container">
                            <div className="reply-preview-content">
                                <span className="reply-preview-name">
                                    Replying to {replyingTo.sender === 'me' ? 'yourself' : username}
                                </span>
                                <span className="reply-preview-text">{replyingTo.text}</span>
                            </div>
                            <button
                                className="reply-close-btn"
                                onMouseDown={(e) => e.preventDefault()} // Prevent focus loss (keeps keyboard open)
                                onClick={() => setReplyingTo(null)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}
                    <input
                        type="file"
                        ref={galleryInputRef}
                        style={{ display: 'none' }}
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                    />
                    {isRecording ? (
                        <div className="recording-overlay animating">
                            <button className="recording-btn discard-btn" onClick={() => stopRecording(false)} title="Discard">
                                <Trash2 size={24} />
                            </button>
                            <div className="recording-center-area">
                                <div className="recording-live-indicator">
                                    <div className="pulse-circle" />
                                    <span className="recording-timer">{formatTime(recordingTime)}</span>
                                </div>
                                <div className="waveform-animation-container">
                                    {[...Array(18)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="waveform-bar oscillate"
                                            style={{
                                                animationDelay: `${i * 0.08}s`,
                                                height: '12px'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <button className="recording-btn send-btn" onClick={() => stopRecording(true)} title="Send">
                                <Send size={24} color="white" />
                            </button>
                        </div>
                    ) : (
                        <div className="chat-input-main-area">
                            <div className="input-pill-container modern-input">
                                <button className="pill-icon plus-btn" title="More" onClick={() => showToast('More options coming soon!', 'info')}>
                                    <Plus size={22} />
                                </button>
                                <textarea
                                    ref={messageInputRef}
                                    rows={1}
                                    autoComplete="off"
                                    autoCorrect="off"
                                    autoCapitalize="sentences"
                                    spellCheck={true}
                                    placeholder="Message"
                                    value={inputText}
                                    onChange={(e) => {
                                        setInputText(e.target.value);
                                        // Handle auto-grow
                                        const target = e.target;
                                        target.style.height = 'auto'; // Reset height
                                        const newHeight = Math.min(target.scrollHeight, 120); // Cap at approx 5 lines
                                        target.style.height = `${newHeight}px`;
                                        target.style.overflowY = target.scrollHeight > 120 ? 'auto' : 'hidden';
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(null);
                                        }
                                    }}
                                />
                                <div className="input-right-icons">
                                    <button className="pill-icon" title="Attachments" onClick={handleGalleryClick}>
                                        <Paperclip size={22} />
                                    </button>
                                    {!inputText.trim() && (
                                        <button className="pill-icon" title="Camera" onClick={() => navigate('/camera')}>
                                            <Camera size={22} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <button
                                className={`mic-action-btn ${inputText.trim() ? 'send-mode' : ''}`}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => inputText.trim() ? handleSendMessage(null) : startRecording()}
                            >
                                {inputText.trim() ? <Send size={24} color="white" /> : <Mic size={24} color="white" />}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {longPressedMsg && (
                <div className="overlay-backdrop" onClick={() => setLongPressedMsg(null)}>
                    <div className="context-menu-card" onClick={(e) => e.stopPropagation()}>
                        <div className="menu-item" onClick={copyMessage}>
                            <Copy size={20} /> Copy
                        </div>
                        <div className="menu-item" onClick={() => { setReplyingTo(longPressedMsg); setLongPressedMsg(null); }}>
                            <Reply size={20} /> Reply
                        </div>
                        <div className="menu-item" onClick={() => deleteMessage(false)}>
                            <Trash2 size={20} /> Delete for me
                        </div>
                        {longPressedMsg.sender === 'me' && (
                            <div className="menu-item" onClick={() => deleteMessage(true)}>
                                <Trash2 size={20} /> Delete for everyone
                            </div>
                        )}
                        <div className="menu-item cancel" onClick={() => setLongPressedMsg(null)}>
                            <X size={20} /> Cancel
                        </div>
                    </div>
                </div>
            )}

            {showBlockConfirm && (
                <div className="chat-modal-overlay">
                    <div className="chat-modal-card">
                        <h3 className="chat-modal-title">Block {username}?</h3>
                        <p className="chat-modal-text">
                            Blocked contacts will no longer be able to call you or send you messages.
                        </p>
                        <div className="chat-modal-actions">
                            <button className="chat-modal-btn cancel" onClick={() => setShowBlockConfirm(false)}>Cancel</button>
                            <button className="chat-modal-btn danger" onClick={confirmBlock}>Block</button>
                        </div>
                    </div>
                </div>
            )}

            {showClearConfirm && (
                <div className="chat-modal-overlay">
                    <div className="chat-modal-card">
                        <h3 className="chat-modal-title">Delete chat?</h3>
                        <p className="chat-modal-text">
                            Are you sure you want to delete the entire chat history with {username}? This action cannot be undone.
                        </p>
                        <div className="chat-modal-actions">
                            <button className="chat-modal-btn cancel" onClick={() => setShowClearConfirm(false)}>Cancel</button>
                            <button className="chat-modal-btn danger" onClick={executeClearChat}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {previewMedia && (
                <div className="media-preview-overlay" onClick={() => setPreviewMedia(null)}>
                    <div className="media-preview-topbar" onClick={(e) => e.stopPropagation()}>
                        <button className="media-preview-close" onClick={() => setPreviewMedia(null)}>
                            <X size={24} color="white" />
                        </button>
                        <a
                            className="media-preview-download"
                            href={previewMedia.url}
                            download={`masum-media-${Date.now()}.${previewMedia.type === 'video' ? 'mp4' : 'jpg'}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            ⬇ Download
                        </a>
                    </div>
                    <div className="media-preview-container">
                        {previewMedia.type === 'video' ? (
                            <VideoPreviewPlayer src={previewMedia.url} />
                        ) : (
                            <img
                                src={previewMedia.url}
                                alt="Preview"
                                className="media-preview-img"
                                onClick={(e) => e.stopPropagation()}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;
