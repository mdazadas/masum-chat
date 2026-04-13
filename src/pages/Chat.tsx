import React, { useState, useRef, useEffect, useCallback, memo, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Phone, Video, Check, CheckCheck, MoreVertical,
    Paperclip, Send, Trash2, Mic, Camera, Plus, X, Copy,
    Reply, RefreshCcw, ImagePlay, FileText, User, Clock,
    Play, Pause, Image as ImageIcon, PhoneIncoming, PhoneOutgoing, PhoneMissed,
    Search, Palette, Ban, AlertCircle, Download
} from 'lucide-react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useToast } from '../context/ToastContext';
import { getPendingMedia, clearPendingMedia } from '../pendingMediaStore';
import { insforge } from '../lib/insforge';
import Avatar from '../components/Avatar';
import LoadingOverlay from '../components/LoadingOverlay';
import FloatingActionSheet from '../components/FloatingActionSheet';
import { useData } from '../context/DataContext';
import ClearChatModal from '../components/ClearChatModal';
import BlockUserModal from '../components/BlockUserModal';

interface Message {
    id: number;
    clientId?: string | number;
    text: string;
    time: string;
    sender: 'me' | 'other';
    status: 'sent' | 'delivered' | 'read' | 'failed';
    is_deleted?: boolean;
    image?: string | null;
    audio?: string | null; // Added audio support
    audioDuration?: string;
    mediaType?: 'image' | 'video' | 'audio';
    uploading?: boolean;
    optimistic?: boolean;
    uploadProgress?: number;
    call_id?: number | null;
    replyTo?: {
        id: number;
        text: string;
        username: string;
    } | null;
    created_at?: string;
}

const AudioPlayer = ({ src, duration: initialDuration, sender }: { src: string; duration?: string; sender?: 'me' | 'other' }) => {
    const isSent = sender === 'me';
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(initialDuration || "0:00");
    const audioRef = useRef<HTMLAudioElement>(null);

    const fmt = (s: number) => {
        if (!isFinite(s)) return '0:00';
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

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
            if (isPlaying) setDuration(fmt(current));
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!audioRef.current) return;
        const val = Number(e.target.value);
        audioRef.current.currentTime = (val / 100) * audioRef.current.duration;
        setProgress(val);
        setDuration(fmt(audioRef.current.currentTime));
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            if (audioRef.current.duration && audioRef.current.duration !== Infinity) {
                setDuration(fmt(audioRef.current.duration));
            } else if (initialDuration) {
                setDuration(initialDuration);
            } else {
                setDuration("0:00");
            }
        }
    };

    return (
        <div className={`audio-player-container modern-audio ${isSent ? 'audio-sent' : 'audio-received'}`}>
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onPause={() => {
                    if (audioRef.current && audioRef.current.duration && audioRef.current.duration !== Infinity) {
                        setDuration(fmt(audioRef.current.duration));
                    } else if (initialDuration) {
                        setDuration(initialDuration);
                    }
                }}
                onLoadedMetadata={() => {
                    if (audioRef.current) {
                        // WebM duration hack for Chrome/Recording
                        if (audioRef.current.duration === Infinity || isNaN(audioRef.current.duration)) {
                            audioRef.current.currentTime = 1e101;
                            setTimeout(() => {
                                if (audioRef.current) {
                                    audioRef.current.currentTime = 0;
                                    const d = fmt(audioRef.current.duration);
                                    if (d !== '0:00') setDuration(d);
                                    else if (initialDuration) setDuration(initialDuration);
                                }
                            }, 200);
                        } else {
                            const d = fmt(audioRef.current.duration);
                            setDuration(d);
                        }
                    }
                }}
            />
            <button className={`audio-play-btn ${isSent ? 'audio-btn-sent' : 'audio-btn-received'}`} onClick={togglePlay}>
                {isPlaying ? <Pause size={20} color="white" fill="white" /> : <Play size={20} color="white" fill="white" />}
            </button>
            <div className="audio-content-area">
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={progress}
                    onChange={handleSeek}
                    className={`audio-seek-bar-simple ${isSent ? 'seek-sent' : 'seek-received'}`}
                />
                <div className="audio-meta-row">
                    <span className="audio-duration-text">{duration}</span>
                </div>
            </div>
        </div>
    );
};

const DateSeparator = ({ date }: { date: string }) => (
    <div className="date-separator">
        <span className="date-text">{date}</span>
    </div>
);

const SwipeableMessage = memo(({
    msg,
    onReply,
    onLongPress,
    onPreviewImage,
    handleUnblock,
    onScrollToReply,
    messageRef,
    firstUnreadMessageId,
    initialUnreadCount,
    navigate,
    username,
    showDateSeparator,
    dateLabel,
    onRetry,
    onDeleteFailed,
    settings
}: any) => {
    const [swipeX, setSwipeX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const [isPressing, setIsPressing] = useState(false);
    const [mediaLoaded, setMediaLoaded] = useState(!msg.image || !msg.uploading);
    // mediaLoaded starts true for already-delivered messages (no upload in progress)
    const touchStartX = useRef(0);
    const swipeThreshold = 60;

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        setIsSwiping(true);
        setIsPressing(true);
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
            if (settings?.vibration !== false && navigator.vibrate) navigator.vibrate(10);
        }
        setSwipeX(0);
        setIsSwiping(false);
        setIsPressing(false);
    };

    return (
        <div className="message-outer-wrapper" ref={messageRef}>
            {showDateSeparator && <DateSeparator date={dateLabel} />}
            <div
                className="swipe-reply-indicator"
                style={{
                    opacity: Math.min(swipeX / swipeThreshold, 1),
                    transform: `translateY(-50%) scale(${Math.min(swipeX / swipeThreshold, 1)})`,
                    left: `${swipeX - 35}px`
                }}
            >
                <Reply size={20} />
            </div>

            <div
                className={`message-bubble-container ${isSwiping ? 'swiping' : ''} ${isPressing ? 'pressing' : ''}`}
                style={{ transform: `translateX(${swipeX}px)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {firstUnreadMessageId.current !== null && initialUnreadCount.current && msg.id === firstUnreadMessageId.current && (
                    <div className="unread-divider" key="unread-divider">
                        <div className="unread-text">{initialUnreadCount.current} New messages</div>
                    </div>
                )}

                {msg.time === "" ? (
                    <div className="system-message-container">
                        <div className="system-message" onClick={() => msg.text.includes("unblock") && handleUnblock()}>
                            {msg.text}
                        </div>
                    </div>
                ) : (
                    <div
                        className="message-wrapper"
                        style={{
                            alignItems: msg.sender === 'me' ? 'flex-end' : 'flex-start',
                            // Only animate messages created very recently (within the last 15 seconds)
                            animation: (msg.optimistic || (msg.id > Date.now() - 15000)) ? 'messageSlideIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' : 'none'
                        }}
                    >
                        <div
                            className={`message-bubble ${msg.sender === 'me' ? 'message-sent' : 'message-received'} ${msg.is_deleted ? 'message-deleted' : ''} ${msg.optimistic ? 'message-pending' : ''}`}
                            onContextMenu={(e) => { e.preventDefault(); onLongPress(msg); }}
                        >
                            <div className="message-content-wrapper" style={{ display: 'flex', flexDirection: 'column' }}>
                                {msg.is_deleted ? (
                                    <div className="deleted-message-content">
                                        <Trash2 size={12} />
                                        <span>This message was deleted</span>
                                    </div>
                                ) : (
                                    <>
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
                                    {msg.image && msg.mediaType !== 'audio' && (
                                        <div style={{ margin: '-10px -14px 6px -14px', borderRadius: '8px 8px 0 0', overflow: 'hidden', position: 'relative', minWidth: '240px' }}>
                                            {msg.mediaType === 'video' ? (
                                                <div
                                                    className={`video-thumb-wrapper ${msg.uploading ? 'skeleton-shimmer media-uploading-structure' : ''}`}
                                                    onClick={() => !msg.uploading && onPreviewImage({ url: msg.image!, type: 'video' })}
                                                    style={{ cursor: msg.uploading ? 'default' : 'pointer', position: 'relative' }}
                                                >
                                                    <video
                                                        src={msg.image}
                                                        className="message-image-content"
                                                        playsInline
                                                        preload="auto"
                                                        muted
                                                        onLoadedData={() => setMediaLoaded(true)}
                                                        style={{
                                                            opacity: msg.uploading ? 0 : 1,
                                                            transition: 'opacity 0.3s ease',
                                                            pointerEvents: 'none',
                                                            objectFit: 'cover'
                                                        }}
                                                    />
                                                    {msg.uploading && (
                                                        <div className="upload-progress-overlay">
                                                            <div className="upload-spinner-wrapper">
                                                                <div className="upload-spinner-ring" />
                                                                <div className="upload-spinner-icon">
                                                                    <Video size={20} color="white" />
                                                                </div>
                                                            </div>
                                                            <span className="upload-progress-label">Sending...</span>
                                                        </div>
                                                    )}
                                                    {!msg.uploading && (
                                                        <div className="video-play-hint-bubble">
                                                            <svg viewBox="0 0 24 24" width="26" height="26" fill="white"><path d="M8 5v14l11-7z" /></svg>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                /* Image wrapper — fixed 210px height matching video */
                                                <div
                                                    className={msg.uploading ? 'media-uploading-structure skeleton-shimmer' : ''}
                                                    style={{ position: 'relative', width: '100%', height: '210px', cursor: msg.uploading ? 'default' : 'pointer' }}
                                                    onClick={() => !msg.uploading && onPreviewImage({ url: msg.image!, type: msg.mediaType || 'image' })}
                                                >
                                                    <img
                                                        src={msg.image}
                                                        alt="Sent"
                                                        className="message-image-content"
                                                        loading="eager"
                                                        onLoad={() => setMediaLoaded(true)}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                            display: 'block',
                                                            opacity: msg.uploading ? 0 : 1,
                                                            transition: 'opacity 0.3s ease',
                                                        }}
                                                    />
                                                    {msg.uploading && (
                                                        <div className="upload-progress-overlay">
                                                            <div className="upload-spinner-wrapper">
                                                                <div className="upload-spinner-ring" />
                                                                <div className="upload-spinner-icon">
                                                                    <ImageIcon size={20} color="white" />
                                                                </div>
                                                            </div>
                                                            <span className="upload-progress-label">Sending...</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {msg.audio && (
                                        <AudioPlayer src={msg.audio} duration={msg.audioDuration} sender={msg.sender} />
                                    )}

                                    {msg.call_id ? (
                                            <div className="call-message-bubble">
                                                <div className="call-info-row">
                                                    <div className="call-icon-container" style={{
                                                        background: msg.text.includes('Missed') ? 'var(--call-missed-bg)' : 'var(--call-active-bg)',
                                                        color: msg.text.includes('Missed') ? 'var(--error-color)' : 'var(--success-color)'
                                                    }}>
                                                        {msg.text.includes('Video') ? <Video size={18} /> : <Phone size={18} />}
                                                    </div>
                                                    <div className="call-text-content">
                                                        <span className="call-type-label">{msg.text}</span>
                                                        <div className="call-status-sub">
                                                            {msg.sender === 'me' ? (
                                                                <PhoneOutgoing size={12} style={{ marginRight: 4 }} />
                                                            ) : (
                                                                msg.text.includes('Missed') ?
                                                                    <PhoneMissed size={12} style={{ marginRight: 4 }} /> :
                                                                    <PhoneIncoming size={12} style={{ marginRight: 4 }} />
                                                            )}
                                                            {msg.sender === 'me' ? 'Outgoing' : (msg.text.includes('Missed') ? 'Missed' : 'Incoming')}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    className="call-again-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const type = msg.text.includes('Video') ? 'video' : 'voice';
                                                        navigate(`/call/${username}?type=${type}`);
                                                    }}
                                                >
                                                    {msg.text.includes('Missed') ? 'Call Back' : 'Call Again'}
                                                </button>
                                            </div>
                                        ) : (
                                            msg.text && (
                                                <div className={`message-text ${msg.image ? 'media-text-container' : ''}`}>
                                                    {msg.text}
                                                </div>
                                            )
                                        )}
                                    </>
                                )}

                                <div className="message-footer" style={{ marginTop: msg.is_deleted ? '4px' : '2px' }}>
                                    <span className="message-time">{msg.time}</span>
                                    {!msg.is_deleted && msg.sender === 'me' && (
                                                <span className="status-ticks">
                                                    {msg.status === 'failed' ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                                            <div title="Failed to send" style={{ display: 'flex', alignItems: 'center' }}>
                                                                <AlertCircle size={14} color="var(--error-color)" />
                                                                <span style={{ fontSize: '10px', color: 'var(--error-color)', fontWeight: 700, marginLeft: '4px' }}>Failed</span>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                                <button
                                                                    className="failed-action-btn"
                                                                    onClick={(e) => { e.stopPropagation(); onRetry(msg); }}
                                                                    style={{ background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '12px', padding: '2px 8px', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}
                                                                >
                                                                    Retry
                                                                </button>
                                                                <button
                                                                    className="failed-action-btn"
                                                                    onClick={(e) => { e.stopPropagation(); onDeleteFailed(msg); }}
                                                                    style={{ background: 'var(--call-missed-bg)', color: 'var(--error-color)', border: '1px solid var(--call-missed-bg)', borderRadius: '12px', padding: '2px 8px', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (msg.optimistic || msg.uploading) ? (
                                                        <Clock size={12} className="tick-pending" />
                                                    ) : msg.status === 'read' ? (
                                                        <CheckCheck size={14} className="tick-blue" />
                                                    ) : msg.status === 'delivered' ? (
                                                        <CheckCheck size={14} className="tick-delivered" />
                                                    ) : (
                                                        <Check size={14} className="tick-sent" />
                                                    )}
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
});

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
        <div className="video-preview-player" onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
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
                onDurationChange={() => {
                    if (videoRef.current) setDuration(videoRef.current.duration);
                }}
                onEnded={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
            />
            {/* Play/Pause Overlay Icon (visible when paused) */}
            {!isPlaying && (
                <div className="video-preview-center-play">
                    <Play size={48} color="white" fill="white" />
                </div>
            )}
            <div className="video-preview-controls enhanced" onClick={(e) => e.stopPropagation()}>
                <button className="video-ctrl-btn" onClick={togglePlay}>
                    {isPlaying ? <Pause size={24} color="white" fill="white" /> : <Play size={24} color="white" fill="white" />}
                </button>
                <span className="video-time-label">{fmt(currentTime)}</span>
                <input
                    type="range"
                    min={0} max={100}
                    value={progress}
                    onChange={handleSeek}
                    className="video-seek-bar-enhanced"
                />
                <span className="video-time-label">{fmt(duration)}</span>
            </div>
        </div>
    );
};

const compressImage = (file: Blob | File | string, maxWidth = 1200, quality = 0.7): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = (maxWidth / width) * height;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);
            }
            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Canvas compression failed'));
            }, 'image/jpeg', quality);
            if (typeof file !== 'string') URL.revokeObjectURL(img.src);
        };
        img.onerror = (e) => reject(e);
        img.src = typeof file === 'string' ? file : URL.createObjectURL(file);
    });
};

const Chat = () => {
    const { username } = useParams<{ username: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    const {
        contacts, setContacts,
        settings,
        cacheMessages,
        messagesCache,
        userPresence,
        globalTyping,
        setActiveChatId,
        userId,
        playSound,
        clearLocalChat
    } = useData();
    const chatWallpaper = settings?.chat_wallpaper;

    // Helper: Scroll to bottom - defined earliest to avoid initialization race
    const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior });
        }
    }, []);

    // Prefill from cache/state for instant load
    const [messages, setMessages] = useState<Message[]>(() => {
        if (username && messagesCache[username]) return messagesCache[username];
        return [];
    });
    const [showMediaSheet, setShowMediaSheet] = useState(false);
    const [receiver, setReceiver] = useState<any>(location.state?.profile || null);
    const [receiverId, setReceiverId] = useState<string | null>(location.state?.profile?.contact_id || location.state?.profile?.id || null);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(() => {
        if (username && messagesCache[username]?.length > 0) return false;
        return true;
    });
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [isBlocked, setIsBlocked] = useState(location.state?.isBlockedInitially || false);
    const [isBlockedByReceiver, setIsBlockedByReceiver] = useState(location.state?.isBlockedByReceiverInitially || false);
    const [showUnreadIndicator] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [badgeText, setBadgeText] = useState('');
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [, forceUpdate] = useState({}); // Dummy state for presence refresh
    const isAtBottomRef = useRef(true); // Sync ref for message handler logic
    const firstUnreadIdRef = useRef<number | null>(null);
    // Session-persistent unread banner - not reset by DB is_seen updates
    const firstUnreadMessageId = useRef<number | null>(null);
    const initialUnreadCount = useRef<number>(0);
    const lastIncomingMessageIdRef = useRef<number | null>(null);

    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [longPressedMsg, setLongPressedMsg] = useState<Message | null>(null);
    const [previewMedia, setPreviewMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
    const [showMenu, setShowMenu] = useState(false);
    const [showBlockConfirm, setShowBlockConfirm] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const recordingInterval = useRef<any>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const lastDBSyncRef = useRef<string>('');
    const messageInputRef = useRef<HTMLTextAreaElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const sendMediaDirectlyRef = useRef<any>(null);
    const [isPaused, setIsPaused] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingTimeRef = useRef(0); // Ref for stale-closure-safe duration
    const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const messagesRef = useRef<Message[]>(messages);
    const userIdRef = useRef(userId);
    const receiverIdRef = useRef(receiverId);
    const contactsRef = useRef(contacts);

    // Track active chat for unread count suppression
    useEffect(() => {
        if (receiverId) {
            setActiveChatId(receiverId);
            return () => setActiveChatId(null);
        }
    }, [receiverId, setActiveChatId]);

    // 1. Initial Positioning: Scroll to bottom immediately on mount if cached messages exist.
    // useLayoutEffect is critical as it runs before paint, preventing the "jump" after rendering.
    useLayoutEffect(() => {
        if (messages.length > 0) {
            scrollToBottom('instant' as any);
        }
    }, []);


    // Sync refs with state
    useEffect(() => { messagesRef.current = messages; }, [messages]);
    useEffect(() => { userIdRef.current = userId; }, [userId]);
    useEffect(() => { receiverIdRef.current = receiverId; }, [receiverId]);
    useEffect(() => { contactsRef.current = contacts; }, [contacts]);

    // CACHE SYNC: Mirror local outgoing messages back to the global provider
    // Only runs when user sends a new optimistic/uploading message (not from cache sync)
    useEffect(() => {
        if (username && messages.length > 0) {
            const hasLocalMessages = messages.some(m => m.optimistic || m.uploading);
            if (hasLocalMessages) {
                cacheMessages(username, messages);
            }
        }
    }, [messages, username, cacheMessages]);

    const getPresenceStatus = () => {
        const isReceiverTyping = globalTyping[receiverId || ''];
        if (isReceiverTyping) return 'typing...';

        const lastSeen = userPresence[receiverId || ''] || receiver?.lastSeen;
        if (!lastSeen) return '';

        const lastSeenDate = new Date(lastSeen);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - lastSeenDate.getTime()) / 1000);

        // A bit of buffer (40s) to show online since heartbeat is 15s
        if (diffInSeconds < 40) return 'Online';

        // Format last seen time - use 12h format
        const timeStr = lastSeenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        const isToday = lastSeenDate.toDateString() === now.toDateString();

        if (isToday) return `Last seen at ${timeStr}`;
        const isYesterday = new Date(now.getTime() - 86400000).toDateString() === lastSeenDate.toDateString();
        if (isYesterday) return `Last seen Yesterday at ${timeStr}`;

        return `Last seen on ${lastSeenDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
    };

    // Keep receiver profile in sync with global contacts (name/avatar changes)
    useEffect(() => {
        if (!username || !contacts.length) return;
        const profile = contacts.find(c => c.username === username);
        if (profile) setReceiver(profile);
    }, [contacts, username]);

    // Presence reactive update: force re-render every 30s to update "Last seen" relative time
    useEffect(() => {
        const interval = setInterval(() => forceUpdate({}), 30000);
        return () => clearInterval(interval);
    }, []);


    const handleDownload = useCallback(async (url: string, filename: string) => {
        try {
            showToast('Starting download...', 'info');
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.style.display = 'none';
            link.href = blobUrl;
            link.download = filename;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
            }, 100);
            showToast('Download complete', 'success');
        } catch (err) {
            console.error('Download error, falling back to new tab:', err);
            // Fallback for CORS issues
            window.open(url, '_blank');
            showToast('Opened media securely', 'info');
        }
    }, [showToast]);

    const handleScrollToReply = useCallback((id: number) => {
        const target = messageRefs.current.get(id);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            target.classList.add('highlight-message');
            setTimeout(() => target.classList.remove('highlight-message'), 2000);
            if (settings?.vibration !== false && navigator.vibrate) navigator.vibrate(20);
        } else {
            showToast('Original message not found', 'info');
        }
    }, [showToast, settings?.vibration]);

    const uploadAndSendMedia = useCallback(async (
        file: Blob | string | File,
        type: 'image' | 'video' | 'audio',
        caption?: string,
        duration?: string,
        providedPreviewUrl?: string
    ) => {
        const currentUserId = userIdRef.current;
        let currentReceiverId = receiverIdRef.current;

        if (!currentUserId) {
            showToast('User session not found. Please log in again.', 'error');
            return;
        }

        if (!currentReceiverId) {
            console.warn('Media upload attempt before receiver profile loaded');
            showToast('Preparing chat... Please try again in a moment.', 'info');
            return;
        }

        // UUID Safety Hook
        if (currentReceiverId.length < 10) {
            console.warn(`Invalid UUID detected for receiver (${currentReceiverId}), attempting recovery...`);
            const fallbackProfile = contactsRef.current?.find(c => c.id === currentReceiverId || c.contact_id === currentReceiverId);
            if (fallbackProfile && fallbackProfile.contact_id) {
                currentReceiverId = fallbackProfile.contact_id;
            } else {
                showToast('Chat synchronization error. Please refresh.', 'error');
                return;
            }
        }

        const tempId = Date.now() + Math.random();
        let previewUrl = providedPreviewUrl;
        const label = type.charAt(0).toUpperCase() + type.slice(1);

        // 1. Create local preview URL if needed
        if (!previewUrl) {
            previewUrl = typeof file === 'string' ? file : URL.createObjectURL(file as Blob);
        }

        // 2. Add optimistic message
        const newMsg: Message = {
            id: tempId,
            clientId: tempId,
            text: caption || '',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
            sender: 'me',
            status: 'sent' as 'sent',
            uploading: true,
            uploadProgress: 0,
            mediaType: type,
            image: type !== 'audio' ? previewUrl : null,
            audio: type === 'audio' ? previewUrl : null,
            audioDuration: duration,
            optimistic: true
        };

        setMessages(prev => [...prev, newMsg]);
        playSound('send');

        // Optimistic contact preview update
        setContacts(prev => {
            const idx = prev.findIndex(c => c.contact_id === currentReceiverId);
            if (idx === -1) return prev;

            let preview = type === 'video' ? '📹 Video' : (type === 'audio' ? '🎤 Voice message' : '📷 Photo');

            const updated = {
                ...prev[idx],
                preview,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
                lastMessageAt: new Date().toISOString()
            };
            const rest = prev.filter((_, i) => i !== idx);
            return [updated, ...rest].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
        });

        try {
            // 3. Convert string (base64/blob URL) to actual Blob if necessary
            let uploadBlob: Blob;
            if (typeof file === 'string') {
                const res = await fetch(file);
                uploadBlob = await res.blob();
            } else {
                uploadBlob = file;
            }

            // 3.1 COMPRESSION: Fast Upload & Fast Load Optimization
            if (type === 'image') {
                try {
                    const compressed = await compressImage(uploadBlob);
                    console.log(`Compression success: ${(uploadBlob.size / 1024).toFixed(1)}KB -> ${(compressed.size / 1024).toFixed(1)}KB`);
                    uploadBlob = compressed;
                } catch (cErr) {
                    console.warn('Compression failed, using raw file:', cErr);
                }
            }

            // 4. Determine bucket
            const bucketName = type === 'video' ? 'chat-media' :
                (type === 'audio' ? 'chat-media' : 'chat-images');

            // 5. Upload to InsForge Storage
            const filePath = `${currentUserId}/${tempId}-${type}`;
            const { data: uploadData, error: uploadErr } = await insforge.storage
                .from(bucketName)
                .upload(filePath, uploadBlob);

            if (uploadErr || !uploadData?.url) {
                console.error('Storage upload error:', uploadErr);
                throw uploadErr || new Error('Upload failed - No URL returned');
            }
            const mediaUrl = uploadData.url;

            // 6. Save Message reference to Database
            const insertPayload: any = {
                sender_id: currentUserId,
                receiver_id: currentReceiverId,
                text: caption || null,
                is_seen: false,
            };

            if (type === 'video') insertPayload.video_url = mediaUrl;
            else if (type === 'audio') insertPayload.audio_url = mediaUrl;
            else insertPayload.image_url = mediaUrl;

            const { data: dbData, error: dbErr } = await insforge.database
                .from('messages')
                .insert([insertPayload])
                .select('id')
                .single();

            if (dbErr) throw dbErr;

            // 7. Update UI with final URL and real database ID
            const realId = dbData?.id;

            // WE DO NOT SET LOCAL STATE HERE Anymore.
            // If we did, the WebSocket would ALSO push it, causing duplicates.
            // By letting the WebSocket handle it smoothly, the optimistic `uploading` bubble
            // gracefully transitions into the final `sent` bubble with the real ID.

            // 8. Force real-time broadcast to both users (fixes media popping in and out)
            const publishPayload = {
                ...insertPayload,
                id: realId || tempId,
                clientId: tempId, // CRITICAL: Tells the receiver's local cache which optimistic message to swap
                created_at: new Date().toISOString()
            };

            // Publish to receiver
            Promise.resolve(insforge.realtime.publish(`chat:${currentReceiverId}`, 'INSERT_message', publishPayload)).catch(() => { });
            // Publish to self (other tabs)
            Promise.resolve(insforge.realtime.publish(`chat:${currentUserId}`, 'INSERT_message', publishPayload)).catch(() => { });

            showToast(`${label} sent`, 'success');
        } catch (err) {
            console.error(`Error sending ${type}:`, err);
            showToast(`Failed to send ${type}`, 'error');
            setMessages(prev => prev.map(m => (m.id === tempId || m.clientId === tempId) ? { ...m, status: 'failed', uploading: false, optimistic: false, uploadProgress: 0 } : m));
        } finally {
            // We NO LONGER revoke the object URL immediately here.
            // React might still be rendering it. The browser will garbage collect it
            // when the tab is closed, which is fine for small files.
            // Revoking it here causes the image to disappear before the remote URL loads down the wire.
        }
    }, [showToast]);

    // Load messages from InsForge DB
    useEffect(() => {
        if (!userId || !username) return;

        const loadChat = async () => {
            try {
                // 1. Resolve Profile (Cache first)
                let profile = contacts?.find(c => c.username === username);

                if (!profile) {
                    try {
                        const { data, error } = await insforge.database
                            .from('profiles')
                            .select()
                            .eq('username', username)
                            .single();

                        if (error) throw error;
                        profile = data;
                    } catch (err) {
                        setLoading(false);
                        return;
                    }
                }

                if (profile) {
                    const pid = (profile as any).contact_id || profile.id;
                    setReceiver(profile);
                    setReceiverId(pid);

                    // Check block status from DB (both directions) — persists across refresh
                    if (userId) {
                        try {
                            const { data: blockRows } = await insforge.database
                                .from('blocked_users')
                                .select('blocker_id,blocked_id')
                                .or(`and(blocker_id.eq.${userId},blocked_id.eq.${pid}),and(blocker_id.eq.${pid},blocked_id.eq.${userId})`);

                            if (blockRows) {
                                const iHaveBlocked = (blockRows as any).some((r: any) => r.blocker_id === userId && r.blocked_id === pid);
                                const theyHaveBlocked = (blockRows as any).some((r: any) => r.blocker_id === pid && r.blocked_id === userId);
                                setIsBlocked(iHaveBlocked);
                                setIsBlockedByReceiver(theyHaveBlocked);
                            }
                        } catch (err) {
                            // Silent failure
                        }
                    }

                    // Fetch messages - 50 most recent, newest-first
                    const msgRes = await insforge.database
                        .from('messages')
                        .select(`
                                                    *,
                                                    reply_to (
                                                    id,
                                                    text,
                                                    sender_id
                                                    )
                                                    `)
                        .or(`and(sender_id.eq.${userId},receiver_id.eq.${pid}),and(sender_id.eq.${pid},receiver_id.eq.${userId})`)
                        .order('created_at', { ascending: false })
                        .limit(50);

                    if (msgRes.error) throw msgRes.error;
                    const dbMsgs = msgRes.data;

                    if (dbMsgs) {
                        const mapped: Message[] = [...dbMsgs].reverse().map((m: any) => ({
                            id: m.id,
                            clientId: m.id,
                            text: m.text || '',
                            image: m.video_url || m.image_url || null,
                            mediaType: m.video_url ? 'video' : (m.audio_url ? 'audio' : (m.image_url ? 'image' : undefined)),
                            audio: m.audio_url || null,
                            audioDuration: m.audio_duration || undefined,
                            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
                            sender: m.sender_id === userId ? 'me' : 'other',
                            status: m.is_seen ? 'read' : (m.is_delivered ? 'delivered' : 'sent'),
                            replyTo: m.reply_to ? {
                                id: m.reply_to.id,
                                text: m.reply_to.text,
                                username: m.reply_to.sender_id === userId ? 'me' : profile.username
                            } : null
                        }));

                        // Find the first unread message from the other person in the
                        // CHRONOLOGICAL list - capture it now, BEFORE the background
                        // markAsSeen task changes is_seen in the DB.
                        const firstUnread = mapped.find(
                            m => m.sender === 'other' && m.status !== 'read'
                        );
                        const unreadMessages = mapped.filter(
                            m => m.sender === 'other' && m.status !== 'read'
                        );
                        if (firstUnread) {
                            firstUnreadMessageId.current = firstUnread.id as number;
                            initialUnreadCount.current = unreadMessages.length;
                        }
                        setMessages(prev => {
                            // Keep local outgoing messages (uploading OR optimistic OR failed)
                            const localOnly = prev.filter(m => m.sender === 'me' && (m.uploading || m.optimistic || m.status === 'failed'));

                            // Merge with DB messages, avoiding duplicates by clientId
                            const filteredLocal = localOnly.filter(local =>
                                !mapped.some(m => m.id === local.id || m.clientId === local.clientId)
                            );

                            const finalMsgs = [...mapped, ...filteredLocal];
                            return finalMsgs;
                        });
                        setHasMore(dbMsgs.length === 50);
                        setContacts(prev => prev.map((c: any) =>
                            c.contact_id === pid ? { ...c, unread: 0 } : c
                        ));

                        // --- Background tasks (truly fire-and-forget, never block render) ---

                        // 1. Bulk mark unseen messages as seen in a single query (not a loop)
                        const unseenIds = dbMsgs
                            .filter((m: any) => m.sender_id === pid && !m.is_seen)
                            .map((m: any) => m.id);
                        if (unseenIds.length > 0) {
                            setTimeout(async () => {
                                try {
                                    await insforge.database
                                        .from('messages')
                                        .update({ is_seen: true })
                                        .in('id', unseenIds);
                                } catch (err) {
                                    console.warn('Silent markAsSeen failure:', err);
                                }
                            }, 0);
                        }

                        // 2. Ensure contact entry exists
                        setTimeout(async () => {
                            try {
                                const { data: existing } = await insforge.database
                                    .from('contacts')
                                    .select('user_id')
                                    .eq('user_id', userId)
                                    .eq('contact_id', pid)
                                    .maybeSingle();
                                if (!existing) {
                                    await insforge.database
                                        .from('contacts')
                                        .insert([{ user_id: userId, contact_id: pid }]);
                                }
                            } catch (err) {
                                console.warn('Silent contact upsert failure:', err);
                            }
                        }, 0);
                        // otherwise scroll to the bottom as usual.
                        // Reduced delay from 120ms to 50ms for a more "direct" feel
                        setTimeout(() => {
                            if (firstUnread) {
                                const el = messageRefs.current.get(firstUnread.id as number);
                                if (el) {
                                    el.scrollIntoView({ behavior: 'instant', block: 'center' });
                                } else {
                                    scrollToBottom('instant' as any);
                                }
                            } else {
                                scrollToBottom('instant' as any);
                            }
                        }, 50);
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
            const { data: olderMsgs, error: loadErr } = await insforge.database
                .from('messages')
                .select(`
                                                    *,
                                                    reply_to (
                                                    id,
                                                    text,
                                                    sender_id
                                                    )
                                                    `)
                .or(`and(sender_id.eq.${userId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${userId})`)
                .lt('id', oldestMsgId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (loadErr) throw loadErr;

            if (olderMsgs && olderMsgs.length > 0) {
                const mapped: Message[] = [...olderMsgs].reverse().map((m: any) => ({
                    id: m.id,
                    clientId: m.id,
                    text: m.text || '',
                    image: m.video_url || m.image_url || null,
                    mediaType: m.video_url ? 'video' : (m.audio_url ? 'audio' : (m.image_url ? 'image' : undefined)),
                    audio: m.audio_url || null,
                    audioDuration: m.audio_duration || undefined,
                    time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
                    sender: m.sender_id === userId ? 'me' : 'other',
                    status: m.is_seen ? 'read' : (m.is_delivered ? 'delivered' : 'sent'),
                    replyTo: m.reply_to ? {
                        id: m.reply_to.id,
                        text: m.reply_to.text,
                        username: m.reply_to.sender_id === userId ? 'me' : username!
                    } : null
                }));
                setMessages(prev => {
                    // Simplify: pagination adds to the TOP, so we combine mapped (new old messages) + existing messages
                    const combined = [...mapped, ...prev.filter(p => !mapped.some(m => m.id === p.id))];
                    return combined;
                });
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

    // Realtime: Listen for Block Status Updates
    useEffect(() => {
        const handleBlockStatus = (e: any) => {
            const detail = e.detail;
            if (!detail || !userId || !receiverId) return;

            // Type: 'block' or 'unblock'
            // If the OTHER user blocked/unblocked ME
            if (detail.blocker_id === receiverId && detail.blocked_id === userId) {
                setIsBlockedByReceiver(detail.type === 'block');
            }
            // If I blocked/unblocked the OTHER user
            if (detail.blocker_id === userId && detail.blocked_id === receiverId) {
                setIsBlocked(detail.type === 'block');
            }
        };

        window.addEventListener('masum-block-status-change', handleBlockStatus);
        return () => window.removeEventListener('masum-block-status-change', handleBlockStatus);
    }, [userId, receiverId]);

    // Realtime: Sync local state when global cache updates
    useEffect(() => {
        if (!username || !messagesCache[username]) return;
        const cached = messagesCache[username];

        // Optimization: Create a robust key that detects count, last message ID, and ALL statuses to catch ticks
        const cacheKey = `${cached.length}-${cached[cached.length - 1]?.id}-${cached.map(m => m.status).join('')}`;

        if (lastDBSyncRef.current === cacheKey) return;
        lastDBSyncRef.current = cacheKey;

        setMessages(prev => {
            // Keep local outgoing messages (uploading OR optimistic OR failed) that aren't yet in the server cache
            const localOnly = prev.filter(m => m.sender === 'me' && (m.uploading || m.optimistic || m.status === 'failed'));

            // Only keep local messages that don't match anything in the cached list (by real ID, clientId or text)
            const filteredLocal = localOnly.filter(local =>
                !cached.some(c =>
                    c.id === local.id ||
                    (local.clientId !== undefined && c.clientId === local.clientId) ||
                    (local.text && c.text === local.text && c.sender === 'me')
                )
            );

            return [...cached, ...filteredLocal];
        });
    }, [messagesCache, username]);

    // IntersectionObserver for Unread Banner
    useEffect(() => {
        if (!firstUnreadMessageId.current) return;

        let observer: IntersectionObserver | null = null;
        // Wait for rendering
        const timer = setTimeout(() => {
            observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            setTimeout(() => {
                                firstUnreadMessageId.current = null;
                                initialUnreadCount.current = 0;
                            }, 1000);
                            if (observer) observer.disconnect();
                        }
                    });
                },
                { threshold: 0.5 }
            );

            const bannerEl = document.querySelector('.unread-divider');
            if (bannerEl) observer.observe(bannerEl);
        }, 500);

        return () => {
            clearTimeout(timer);
            if (observer) observer.disconnect();
        };
    }, [messages]);


    // Consolidated scroll effect
    useEffect(() => {
        if (!showUnreadIndicator && isAtBottom) {
            scrollToBottom();
        }
    }, [messages, showUnreadIndicator, isAtBottom, scrollToBottom]);


    const processingMediaRef = useRef(false);

    useEffect(() => {
        const checkPendingMedia = async (retryCount = 0) => {
            if (processingMediaRef.current) return;
            const media = getPendingMedia();
            if (!media) return;

            // If receiverId isn't loaded yet, retry a few times (WhatsApp-like resilience)
            if (!receiverIdRef.current && retryCount < 15) {
                console.log(`Waiting for receiver profile... retry ${retryCount + 1}`);
                setTimeout(() => checkPendingMedia(retryCount + 1), 100);
                return;
            }

            processingMediaRef.current = true;
            clearPendingMedia();
            // Pass the raw file/blob if available to avoid failing browser fetch on blob URLs
            await uploadAndSendMedia(media.file || media.url, media.type === 'video' ? 'video' : 'image', media.caption);
            processingMediaRef.current = false;
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
                    if (isAtBottomRef.current) setTimeout(scrollToBottom, 50);
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

        const onFocus = () => {
            checkPendingMedia();


            // Also mark as seen on focus
            if (receiverIdRef.current) {
                const unseenIds = messagesRef.current.filter(m => m.sender === 'other' && m.status !== 'read').map(m => m.id);
                if (unseenIds.length > 0) {
                    (async () => {
                        try {
                            const { data: sessionData } = await insforge.auth.getCurrentSession();
                            const expiresAt = (sessionData?.session as any)?.expires_at || (sessionData?.session as any)?.expiresAt;
                            if (!sessionData?.session || (expiresAt && (expiresAt * 1000) < Date.now() + 5000)) return;

                            await insforge.database
                                .from('messages')
                                .update({ is_seen: true })
                                .in('id', unseenIds);
                        } catch (err) { /* silent */ }
                    })();
                }
            }
        };

        if (window.visualViewport) {
            handleViewportChange();
            window.visualViewport.addEventListener('resize', handleViewportChange);
            window.visualViewport.addEventListener('scroll', handleViewportChange);
        }
        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onFocus);

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onFocus);
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleViewportChange);
                window.visualViewport.removeEventListener('scroll', handleViewportChange);
            }
        };
    }, [uploadAndSendMedia, scrollToBottom]);

    const handleGalleryClick = () => {
        galleryInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        const mediaType = file.type.startsWith('video') ? 'video' : 'image';

        // Use createObjectURL for instant optimistic UI preview without blocking UI stringifying large blobs
        const instantUrl = URL.createObjectURL(file);

        if (sendMediaDirectlyRef.current) {
            // Pass the raw file object instead of the data URL so upload works properly
            sendMediaDirectlyRef.current(file, mediaType, undefined, undefined, instantUrl);
        }
    };

    useEffect(() => {
        if (isRecording && !isPaused) {
            recordingInterval.current = setInterval(() => {
                setRecordingTime(prev => {
                    recordingTimeRef.current = prev + 1; // Keep ref in sync
                    return prev + 1;
                });
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
                    // Use ref (not state) to avoid stale closure - state may be 0 inside here
                    const duration = formatTime(recordingTimeRef.current);
                    // Unified flow handles storage + DB
                    await uploadAndSendMedia(audioBlob, 'audio', duration);
                }

                // CRITICAL: Cleanup stream tracks to turn off the mic indicator
                stream.getTracks().forEach(track => track.stop());
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

    const handleUnblock = useCallback(async () => {
        if (!userId || !receiverId) return;
        setActionLoading(true);
        setLoadingMessage('Unblocking...');
        try {
            const { error } = await insforge.database
                .from('blocked_users')
                .delete()
                .eq('blocker_id', userId)   // Fixed: was 'user_id'
                .eq('blocked_id', receiverId);
            if (error) throw error;

            // Real-time broadcast to both users' channels to trigger instant UI updates
            const payload = { type: 'unblock', blocker_id: userId, blocked_id: receiverId };
            Promise.resolve(insforge.realtime.publish(`user:${receiverId}`, 'UPDATE_block_status', payload)).catch(console.error);
            Promise.resolve(insforge.realtime.publish(`user:${userId}`, 'UPDATE_block_status', payload)).catch(console.error);

            setIsBlocked(false);
            showToast('User unblocked', 'success');
        } catch (err) {
            console.error('Unblock error:', err);
            showToast('Failed to unblock user', 'error');
        } finally {
            setActionLoading(false);
        }
    }, [userId, receiverId, showToast]);

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

        const currentUserId = userIdRef.current;
        let currentReceiverId = receiverIdRef.current;

        if (!currentUserId || !currentReceiverId) return;

        // UUID Safety Hook
        if (currentReceiverId.length < 10) {
            console.warn(`Invalid UUID detected for receiver (${currentReceiverId}), attempting recovery...`);
            const fallbackProfile = contactsRef.current?.find(c => c.id === currentReceiverId || c.contact_id === currentReceiverId);
            if (fallbackProfile && fallbackProfile.contact_id) {
                currentReceiverId = fallbackProfile.contact_id;
            } else {
                showToast('Chat synchronization error. Please refresh.', 'error');
                return;
            }
        }

        const tempId = Date.now() + Math.floor(Math.random() * 1000);
        const textToSend = inputText;
        const currentReply = replyingTo;

        const newMsg: Message = {
            id: tempId,
            clientId: tempId,
            text: textToSend,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
            sender: 'me',
            status: 'sent' as 'sent',
            replyTo: currentReply ? {
                id: currentReply.id,
                text: currentReply.text,
                username: currentReply.sender === 'me' ? 'me' : username!
            } : null,
            optimistic: true
        };

        setMessages(prev => {
            const next = [...prev, newMsg];
            return next;
        });
        playSound('send');

        // Optimistic contact preview update
        setContacts((prev: any[]) => {
            const idx = prev.findIndex(c => c.contact_id === currentReceiverId);
            if (idx === -1) return prev;
            const updated = {
                ...prev[idx],
                preview: textToSend.substring(0, 45),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
                lastMessageAt: new Date().toISOString()
            };
            const rest = prev.filter((_, i) => i !== idx);
            return [updated, ...rest].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
        });

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
        try {
            const { data: dbData, error } = await insforge.database
                .from('messages')
                .insert([{
                    sender_id: currentUserId,
                    receiver_id: currentReceiverId,
                    text: textToSend,
                    image_url: null,
                    is_seen: false,
                    reply_to: currentReply?.id
                }])
                .select('id')
                .single();

            if (error) throw error;

            // 4. Force real-time broadcast to both users
            const publishPayload = {
                id: dbData?.id || tempId,
                clientId: tempId, // CRITICAL: Links the DB response to the local optimistic bubble
                sender_id: currentUserId,
                receiver_id: currentReceiverId,
                text: textToSend,
                image_url: null,
                is_seen: false,
                reply_to: currentReply?.id,
                created_at: new Date().toISOString()
            };

            // Publish to receiver
            Promise.resolve(insforge.realtime.publish(`chat:${currentReceiverId}`, 'INSERT_message', publishPayload)).catch(() => { });
            // Publish to self (other tabs)
            Promise.resolve(insforge.realtime.publish(`chat:${currentUserId}`, 'INSERT_message', publishPayload)).catch(() => { });

            // WE DO NOT SET LOCAL STATE HERE Anymore.
            // If we did, the WebSocket would ALSO push it, causing duplicates.
            // By letting the WebSocket handle it smoothly, the optimistic bubble
            // gracefully transitions into the final `sent` bubble with the real ID.
        } catch (error: any) {
            console.error('handleSendMessage error:', error);
            showToast('Failed to send message', 'error');
            setMessages(prev => prev.map(m =>
                (m.id === tempId || m.clientId === tempId)
                    ? { ...m, status: 'failed', optimistic: false }
                    : m
            ));
        }
    };

    const handleRetryMessage = async (msg: Message) => {
        // Toggle status back to sending (optimistic)
        setMessages(prev => prev.map(m => (m.clientId === msg.clientId || m.id === msg.id) ? { ...m, status: 'sent', optimistic: true } : m));

        try {
            const currentUserId = userIdRef.current;
            const currentReceiverId = receiverIdRef.current;
            if (!currentUserId || !currentReceiverId) return;

            const { data: sessionData } = await insforge.auth.getCurrentSession();
            const expiresAt = (sessionData?.session as any)?.expires_at || (sessionData?.session as any)?.expiresAt;
            if (!sessionData?.session || (expiresAt && (expiresAt * 1000) < Date.now() + 5000)) {
                throw new Error('Session expired');
            }

            const payload = {
                sender_id: currentUserId,
                receiver_id: currentReceiverId,
                text: msg.text,
                is_seen: false,
                reply_to: msg.replyTo?.id || null
            };

            const { data, error } = await insforge.database
                .from('messages')
                .insert([payload])
                .select('id')
                .single();

            if (error) throw error;

            const publishPayload = {
                id: data?.id || (msg.clientId || msg.id),
                clientId: msg.clientId || msg.id,
                sender_id: currentUserId,
                receiver_id: currentReceiverId,
                text: msg.text,
                image_url: null,
                is_seen: false,
                reply_to: msg.replyTo?.id || null,
                created_at: new Date().toISOString()
            };

            Promise.resolve(insforge.realtime.publish(`chat:${currentReceiverId}`, 'INSERT_message', publishPayload)).catch(() => { });
            Promise.resolve(insforge.realtime.publish(`chat:${currentUserId}`, 'INSERT_message', publishPayload)).catch(() => { });
        } catch (error) {
            console.error('Retry failed:', error);
            setMessages(prev => prev.map(m => (m.clientId === msg.clientId || m.id === msg.id) ? { ...m, status: 'failed', optimistic: false } : m));
        }
    };

    useEffect(() => {
        if (!messages.length) return;

        const lastMsg = messages[messages.length - 1];
        if (!lastMsg || lastMsg.sender !== 'other') return;

        if (lastIncomingMessageIdRef.current === (lastMsg.id as number)) return;
        lastIncomingMessageIdRef.current = lastMsg.id as number;

        if (!isAtBottomRef.current) {
            setUnreadCount(prev => prev + 1);
            setBadgeText('New messages');
            if (!firstUnreadIdRef.current) {
                firstUnreadIdRef.current = lastMsg.id as number;
            }
        }
    }, [messages]);

    const handleDeleteFailedMessage = (msg: Message) => {
        setMessages(prev => prev.filter(m => (m.clientId !== msg.clientId && m.id !== msg.id)));
    };

    // Auto-retry logic: stable interval using ref (prevents interval recreation on every message change)
    useEffect(() => {
        const timer = setInterval(() => {
            const failedMessages = messagesRef.current.filter(m => m.status === 'failed' && m.sender === 'me');
            if (failedMessages.length > 0) {
                console.log(`Auto-retrying ${failedMessages.length} failed messages...`);
                failedMessages.forEach(handleRetryMessage);
            }
        }, 20000);

        return () => clearInterval(timer);
    }, []);

    const deleteMessage = async (forEveryone: boolean) => {
        if (!longPressedMsg) return;
        if (forEveryone && userId) {
            setActionLoading(true);
            setLoadingMessage('Deleting...');
            try {
                // Soft delete by updating text to placeholder
                const { error } = await insforge.database
                    .from('messages')
                    .update({
                        text: 'This message was deleted',
                        image_url: null,
                        video_url: null,
                        audio_url: null,
                        is_deleted: true
                    })
                    .eq('id', longPressedMsg.id);

                if (error) throw error;

                // Optimistic update for sender is already done, but real-time UPDATE_message will sync others
                setMessages(prev => prev.map(m => m.id === longPressedMsg.id ? {
                    ...m,
                    text: 'This message was deleted',
                    status: 'read' as const,
                    image: null,
                    audio: null,
                    mediaType: undefined
                } : m));

                // Optimistic contact preview update
                setContacts((prev: any[]) => {
                    const idx = prev.findIndex(c => c.contact_id === receiverId);
                    if (idx === -1) return prev;
                    const updated = {
                        ...prev[idx],
                        preview: 'This message was deleted'
                    };
                    const rest = prev.filter((_, i) => i !== idx);
                    return [updated, ...rest]; // Maintain current sort order
                });

                showToast('Message deleted for everyone', 'info');
            } catch (err) {
                console.error("Delete message error:", err);
                showToast('Failed to delete message', 'error');
            } finally {
                setActionLoading(false);
            }
        } else if (longPressedMsg) {
            setMessages(prev => prev.filter(m => m.id !== longPressedMsg.id));
            showToast('Message deleted for you', 'info');
        }
        setLongPressedMsg(null);
    };

    const copyMessage = () => {
        if (longPressedMsg) {
            navigator.clipboard.writeText(longPressedMsg.text);
            showToast('Message copied to clipboard', 'info');
        }
        setLongPressedMsg(null);
    };

    const handleBlock = () => {
        setShowMenu(false);
        setShowBlockConfirm(true);
    };

    const confirmBlock = async () => {
        if (!userId || !receiverId) return;
        setShowBlockConfirm(false);
        setActionLoading(true);
        setLoadingMessage('Blocking user...');
        try {
            const { error } = await insforge.database
                .from('blocked_users')
                .upsert([{ blocker_id: userId, blocked_id: receiverId }], { onConflict: 'blocker_id,blocked_id' });
            if (error) throw error;

            // Real-time broadcast to both users' channels to trigger instant UI updates
            const payload = { type: 'block', blocker_id: userId, blocked_id: receiverId };
            Promise.resolve(insforge.realtime.publish(`user:${receiverId}`, 'UPDATE_block_status', payload)).catch(console.error);
            Promise.resolve(insforge.realtime.publish(`user:${userId}`, 'UPDATE_block_status', payload)).catch(console.error);

            setIsBlocked(true);
            showToast(`${username} has been blocked`, 'info');
        } catch (err: any) {
            console.error('Block error:', err);
            showToast('Failed to block user', 'error');
        } finally {
            setActionLoading(false);
        }
    };


    const handleClearChat = () => {
        setShowMenu(false);
        setShowClearConfirm(true);
    };

    const executeClearChat = async () => {
        if (!userId || !receiverId || !username) return;
        setActionLoading(true);
        setLoadingMessage('Clearing history...');

        // ✅ Instantly clear local state and cache BEFORE the async DB call.
        // This eliminates the flash of old messages when the chat is reopened.
        setMessages([]);
        clearLocalChat(username);
        setContacts((prev: any[]) => {
            const idx = prev.findIndex(c => c.contact_id === receiverId);
            if (idx === -1) return prev;
            const updated = { ...prev[idx], preview: '', time: '' };
            const rest = prev.filter((_, i) => i !== idx);
            return [updated, ...rest];
        });
        setShowClearConfirm(false);

        try {
            // Step 0: Sever 'reply_to' foreign keys to prevent FK constraint errors on bulk delete
            await insforge.database
                .from('messages')
                .update({ reply_to: null })
                .or(`and(sender_id.eq.${userId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${userId})`);

            // Step 1: Delete messages sent by user to receiver
            const { error: err1 } = await insforge.database
                .from('messages')
                .delete()
                .eq('sender_id', userId)
                .eq('receiver_id', receiverId);

            if (err1) throw err1;

            // Step 2: Delete messages sent by receiver to user
            const { error: err2 } = await insforge.database
                .from('messages')
                .delete()
                .eq('sender_id', receiverId)
                .eq('receiver_id', userId);

            if (err2) throw err2;

            showToast('Chat history cleared permanently', 'info');
            navigate('/home');
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
                backgroundImage: (chatWallpaper && chatWallpaper !== 'none') ? 'none' : undefined,
            }}
        >
            {actionLoading && <LoadingOverlay message={loadingMessage} transparent />}
            <nav className="chat-messages-navbar">
                <div className="chat-header-left">
                    <button className="nav-icon-btn" onClick={() => navigate('/home')}>
                        <ArrowLeft size={24} color="var(--text-secondary)" />
                    </button>
                    {/* NO app logo here - removed per user request */}
                    <div className="chat-header-user" onClick={() => navigate(`/profile/${username}`, { state: { profile: receiver } })}>
                        <div className="chat-header-avatar-container">
                            <Avatar
                                src={receiver?.avatar || receiver?.avatar_url}
                                name={receiver?.name || username}
                                size={40}
                                className="chat-header-avatar"
                            />
                            {getPresenceStatus() === 'Online' && <div className="chat-header-status-dot" />}
                        </div>
                        <div className="chat-header-text-container">
                            <span className="chat-header-name">{receiver?.name || `@${username}`}</span>
                            <span className="chat-header-status">
                                {getPresenceStatus()}
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

                {showMenu && createPortal(
                    <div className="overlay-backdrop" onClick={() => setShowMenu(false)} style={{ zIndex: 3000, position: 'fixed', inset: 0, transform: 'none', backgroundColor: 'transparent', backdropFilter: 'none' }}>
                        <div className="profile-glass-card" onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '60px', right: '16px', padding: '8px', borderRadius: '16px', minWidth: '220px', backgroundColor: 'var(--surface-color)', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div className="menu-item" onClick={() => { setShowMenu(false); navigate(`/profile/${username}`, { state: { profile: receiver } }); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', fontSize: '15px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600 }}>
                                <User size={18} color="var(--text-secondary)" /> View Profile
                            </div>
                            <div className="menu-item" onClick={() => setShowMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', fontSize: '15px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600 }}>
                                <Search size={18} color="var(--text-secondary)" /> Search in chat
                            </div>
                            <div className="menu-item" onClick={() => { setShowMenu(false); navigate('/theme-appearance'); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', fontSize: '15px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600 }}>
                                <Palette size={18} color="var(--text-secondary)" /> Change Theme
                            </div>
                            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />
                            <div className="menu-item" onClick={() => { setShowMenu(false); isBlocked ? handleUnblock() : handleBlock(); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', fontSize: '15px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, color: '#ef4444' }}>
                                <Ban size={18} color="#ef4444" /> {isBlocked ? 'Unblock user' : 'Block user'}
                            </div>
                            <div className="menu-item" onClick={() => { setShowMenu(false); handleClearChat(); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', fontSize: '15px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, color: '#ef4444' }}>
                                <Trash2 size={18} color="#ef4444" /> Clear chat
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </nav>

            <div
                className="chat-messages-area"
                onScroll={(e) => {
                    const target = e.currentTarget;
                    // Throttle state update to once per frame
                    requestAnimationFrame(() => {
                        const atBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
                        if (atBottom !== isAtBottomRef.current) {
                            isAtBottomRef.current = atBottom;
                            setIsAtBottom(atBottom);
                            if (atBottom) {
                                setUnreadCount(0);
                                setBadgeText('');
                                firstUnreadIdRef.current = null;
                            }
                        }
                    });
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
                {messages.map((msg, index) => {
                    const prevMsg = index > 0 ? messages[index - 1] : null;

                    // Use created_at for accurate date grouping, fallback to Date.now() for optimistic/temp messages
                    const getMsgDate = (m: Message) => {
                        if (m.created_at) return new Date(m.created_at);
                        // If it's a numeric ID that looks like a valid timestamp
                        if (m.id > 1000000000000) return new Date(m.id);
                        return new Date(); // Fallback to now for temp messages
                    };

                    const msgDate = getMsgDate(msg);
                    const prevDate = prevMsg ? getMsgDate(prevMsg) : null;

                    let showDateSeparator = false;
                    let dateLabel = '';

                    if (!prevDate || msgDate.toDateString() !== prevDate.toDateString()) {
                        showDateSeparator = true;
                        const now = new Date();
                        if (msgDate.toDateString() === now.toDateString()) {
                            dateLabel = 'Today';
                        } else {
                            const yesterday = new Date(now);
                            yesterday.setDate(now.getDate() - 1);
                            if (msgDate.toDateString() === yesterday.toDateString()) {
                                dateLabel = 'Yesterday';
                            } else {
                                dateLabel = msgDate.toLocaleDateString([], { day: 'numeric', month: 'long', year: msgDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
                            }
                        }
                    }

                    return (
                        <SwipeableMessage
                            key={msg.clientId || msg.id}
                            msg={msg}
                            onReply={setReplyingTo}
                            onLongPress={setLongPressedMsg}
                            onPreviewImage={setPreviewMedia}
                            handleUnblock={handleUnblock}
                            onScrollToReply={handleScrollToReply}
                            messageRef={(el: HTMLDivElement) => {
                                if (el) messageRefs.current.set(msg.id, el);
                                else messageRefs.current.delete(msg.id);
                            }}
                            firstUnreadMessageId={firstUnreadMessageId}
                            initialUnreadCount={initialUnreadCount}
                            navigate={navigate}
                            username={username}
                            showDateSeparator={showDateSeparator}
                            dateLabel={dateLabel}
                            onRetry={handleRetryMessage}
                            onDeleteFailed={handleDeleteFailedMessage}
                            settings={settings}
                        />
                    );
                })}

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
            {
                !isAtBottom && (
                    <div className="new-msg-float-badge premium-float" onClick={() => {
                        if (unreadCount > 0) {
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
                        } else {
                            scrollToBottom();
                        }
                        setUnreadCount(0);
                        setBadgeText('');
                        firstUnreadIdRef.current = null;
                    }}>
                        <div className="float-icon-wrapper">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z" transform="rotate(180 12 12)" /></svg>
                            {unreadCount > 0 && <span className="float-unread-dot">{unreadCount}</span>}
                        </div>
                        {badgeText && <span className="new-msg-badge-text">{badgeText}</span>}
                    </div>
                )
            }

            {
                isBlocked ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px',
                        padding: 'clamp(12px, 3vw, 16px)',
                        backgroundColor: 'var(--surface-color)',
                        borderTop: '1px solid var(--border-color)',
                    }}>
                        {/* Banner */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '12px',
                            padding: '10px 14px',
                            width: '100%',
                        }}>
                            <Ban size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: 'clamp(12px, 3.2vw, 14px)', fontWeight: 600, color: '#ef4444', lineHeight: 1.4 }}>
                                You have blocked this contact. They cannot send you messages or calls.
                            </span>
                        </div>
                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                            <button
                                onClick={handleClearChat}
                                style={{
                                    flex: 1,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    padding: 'clamp(10px, 2.5vw, 13px)',
                                    borderRadius: '14px',
                                    backgroundColor: 'transparent',
                                    border: '1.5px solid rgba(239, 68, 68, 0.35)',
                                    color: '#ef4444',
                                    fontSize: 'clamp(12px, 3vw, 14px)',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                <Trash2 size={15} /> Delete chat
                            </button>
                            <button
                                onClick={handleUnblock}
                                style={{
                                    flex: 1,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    padding: 'clamp(10px, 2.5vw, 13px)',
                                    borderRadius: '14px',
                                    backgroundColor: 'var(--primary-color)',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: 'clamp(12px, 3vw, 14px)',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                <RefreshCcw size={15} /> Unblock
                            </button>
                        </div>
                    </div>
                ) : isBlockedByReceiver ? (
                    <div style={{
                        padding: '16px 20px',
                        marginBottom: '4px',
                        display: 'flex',
                        justifyContent: 'center',
                        width: '100%'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            backgroundColor: 'rgba(107, 114, 128, 0.08)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            border: '1px solid rgba(107, 114, 128, 0.2)',
                            borderRadius: '24px',
                            padding: '14px 24px',
                            maxWidth: '100%',
                            textAlign: 'left',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
                        }}>
                            <AlertCircle size={20} color="var(--text-secondary)" style={{ flexShrink: 0, opacity: 0.8 }} />
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                You have been blocked by this user. You can no longer send messages or audio calls.
                            </span>
                        </div>
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
                            <div className="recording-overlay animating" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: 'var(--surface-color)', borderRadius: '30px', margin: '4px 8px', height: '48px', flex: 1, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                                <button className="recording-btn discard-btn" onClick={() => stopRecording(false)} title="Discard" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                                    <Trash2 size={20} />
                                    <span style={{ fontSize: '14px', fontWeight: 600 }}>Cancel</span>
                                </button>
                                <div className="recording-center-area" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div className="recording-live-indicator" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontWeight: 600 }}>
                                        <div className="pulse-circle" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', animation: 'pulse 1.5s infinite' }} />
                                        <span className="recording-timer" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatTime(recordingTime)}</span>
                                    </div>
                                    <div className="waveform-animation-container" style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '24px' }}>
                                        {[...Array(8)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="waveform-bar oscillate"
                                                style={{
                                                    animationDelay: `${i * 0.15}s`,
                                                    height: `${Math.max(4, Math.random() * 16)}px`,
                                                    width: '3px',
                                                    backgroundColor: 'var(--primary-color)',
                                                    borderRadius: '2px'
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <button className="recording-btn send-btn" onClick={() => stopRecording(true)} title="Send" style={{ background: 'var(--primary-color)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                                    <Send size={18} color="white" />
                                </button>
                            </div>
                        ) : (
                            <div className="chat-input-main-area w-full flex items-end flex-wrap gap-2 px-2 py-1">
                                <div className="input-pill-container modern-input flex-1 w-full min-w-0 flex items-center bg-surface-color rounded-3xl px-3 min-h-[48px] border border-border-color shadow-sm">
                                    <button
                                        className="pill-icon plus-btn"
                                        title="More Options"
                                        onClick={() => setShowMediaSheet(true)}
                                        disabled={loading || !receiverId}
                                        style={{ opacity: (loading || !receiverId) ? 0.5 : 1 }}
                                    >
                                        <Plus size={22} />
                                    </button>
                                    <textarea
                                        ref={messageInputRef}
                                        className="flex-1 min-w-[50px] bg-transparent resize-none border-none outline-none overflow-hidden m-0 p-2"
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
                                            // Broadcast typing event with throttle to avoid flickering
                                            const lastTyping = (target as any).lastTypingBroadcast || 0;
                                            if (Date.now() - lastTyping > 2000) {
                                                (target as any).lastTypingBroadcast = Date.now();
                                                Promise.resolve(insforge.realtime.publish(
                                                    'presence:global',
                                                    'typing',
                                                    { sender_id: userId, receiver_id: receiverId }
                                                )).catch(() => { /* silent */ });
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage(null);
                                            }
                                        }}
                                    />
                                    <div className="input-right-icons flex shrink-0 items-center justify-end">
                                        <button
                                            className="pill-icon"
                                            title="Attachments"
                                            onClick={handleGalleryClick}
                                            disabled={loading || !receiverId}
                                            style={{ opacity: (loading || !receiverId) ? 0.5 : 1 }}
                                        >
                                            <Paperclip size={22} />
                                        </button>
                                        {!inputText.trim() && (
                                            <button
                                                className="pill-icon"
                                                title="Camera"
                                                onClick={() => navigate('/camera')}
                                                disabled={loading || !receiverId}
                                                style={{ opacity: (loading || !receiverId) ? 0.5 : 1 }}
                                            >
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
                                    <Send size={24} color="white" className="send-icon" />
                                    <Mic size={24} color="white" className="mic-icon" />
                                </button>
                            </div>
                        )}
                    </div>
                )
            }

            {
                longPressedMsg && createPortal(
                    <div className="overlay-backdrop" onClick={() => setLongPressedMsg(null)} style={{ zIndex: 3000, backdropFilter: 'blur(5px)', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, transform: 'none' }}>
                        <div className="profile-glass-card" onClick={(e) => e.stopPropagation()} style={{ padding: '8px', borderRadius: '24px', minWidth: '240px', maxWidth: '80%', backgroundColor: 'var(--surface-color)', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div className="menu-item" onClick={copyMessage} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 16px', fontSize: '15px', borderRadius: '16px', cursor: 'pointer', fontWeight: 600 }}>
                                <Copy size={20} color="var(--primary-color)" /> Copy Text
                            </div>
                            <div className="menu-item" onClick={() => { setReplyingTo(longPressedMsg); setLongPressedMsg(null); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 16px', fontSize: '15px', borderRadius: '16px', cursor: 'pointer', fontWeight: 600 }}>
                                <Reply size={20} color="var(--primary-color)" /> Reply
                            </div>
                            <div className="menu-item" onClick={() => deleteMessage(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 16px', fontSize: '15px', borderRadius: '16px', cursor: 'pointer', fontWeight: 600 }}>
                                <Trash2 size={20} color="var(--text-secondary)" /> Delete for me
                            </div>
                            {longPressedMsg.sender === 'me' && (
                                <div className="menu-item" onClick={() => deleteMessage(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', padding: '14px 16px', fontSize: '15px', fontWeight: 700, borderRadius: '16px', cursor: 'pointer', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
                                    <Trash2 size={20} color="#ef4444" /> Delete for everyone
                                </div>
                            )}
                            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />
                            <div className="menu-item cancel" onClick={() => setLongPressedMsg(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px 16px', fontSize: '15px', borderRadius: '16px', cursor: 'pointer', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                Cancel
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {
                showBlockConfirm && (
                    <BlockUserModal
                        contactName={receiver?.name || username || 'this contact'}
                        isLoading={actionLoading}
                        onConfirm={confirmBlock}
                        onCancel={() => setShowBlockConfirm(false)}
                    />
                )
            }

            {
                showClearConfirm && (
                    <ClearChatModal
                        contactName={receiver?.name || username || 'this contact'}
                        isLoading={actionLoading}
                        onConfirm={executeClearChat}
                        onCancel={() => setShowClearConfirm(false)}
                    />
                )
            }

            {
                previewMedia && (
                    <div className="media-preview-overlay" onClick={() => setPreviewMedia(null)}>
                        <div className="media-preview-topbar" onClick={(e) => e.stopPropagation()}>
                            <button className="media-preview-close" onClick={() => setPreviewMedia(null)}>
                                <X size={24} color="white" />
                            </button>
                            <button
                                className="media-preview-download"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(previewMedia.url, `masum-media-${Date.now()}.${previewMedia.type === 'video' ? 'mp4' : 'jpg'}`);
                                }}
                            >
                                <Download size={15} /> Download
                            </button>
                        </div>
                        <div className="media-preview-container">
                            {previewMedia.type === 'video' ? (
                                <VideoPreviewPlayer src={previewMedia.url} />
                            ) : (
                                <TransformWrapper
                                    initialScale={1}
                                    minScale={0.5}
                                    maxScale={6}
                                    centerOnInit
                                >
                                    <TransformComponent
                                        wrapperStyle={{ width: '100dvw', height: '100dvh' }}
                                        contentStyle={{ width: '100dvw', height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <img
                                            src={previewMedia.url}
                                            alt="Preview"
                                            className="media-preview-img-zoomable"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </TransformComponent>
                                </TransformWrapper>
                            )}
                        </div>
                    </div>
                )
            }

            <FloatingActionSheet
                isOpen={showMediaSheet}
                onClose={() => setShowMediaSheet(false)}
            >
                <div className="action-sheet-grid">
                    <div className="action-sheet-item" onClick={() => {
                        setShowMediaSheet(false);
                        handleGalleryClick();
                    }}>
                        <div className="icon-circle bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                            <ImagePlay size={24} />
                        </div>
                        <span>Gallery</span>
                    </div>
                    <div className="action-sheet-item" onClick={() => {
                        setShowMediaSheet(false);
                        navigate('/camera');
                    }}>
                        <div className="icon-circle bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400">
                            <Camera size={24} />
                        </div>
                        <span>Camera</span>
                    </div>
                    <div className="action-sheet-item" onClick={() => {
                        setShowMediaSheet(false);
                        showToast('Document sharing coming soon', 'info');
                    }}>
                        <div className="icon-circle bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <FileText size={24} />
                        </div>
                        <span>Document</span>
                    </div>
                    <div className="action-sheet-item" onClick={() => {
                        setShowMediaSheet(false);
                        showToast('Contact sharing coming soon', 'info');
                    }}>
                        <div className="icon-circle bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                            <User size={24} />
                        </div>
                        <span>Contact</span>
                    </div>
                </div>

                <style>{`
                    .action-sheet-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 16px 8px;
                        padding: 10px 0;
                    }
                    .action-sheet-item {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 8px;
                        cursor: pointer;
                        transition: transform 0.2s;
                    }
                    .action-sheet-item:active {
                        transform: scale(0.95);
                    }
                    .action-sheet-item span {
                        font-size: 13px;
                        color: var(--text-secondary);
                        font-weight: 500;
                    }
                    .icon-circle {
                        width: 54px;
                        height: 54px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                    }
                `}</style>
            </FloatingActionSheet>
        </div >
    );
};

export default Chat;



