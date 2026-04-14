import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Video, X, PhoneCall } from 'lucide-react';
import { insforge } from '../lib/insforge';
import { showMessageNotification } from '../hooks/useNotifications';
import { clearAppAuthStorage } from '../lib/authStorage';

interface DataContextType {
    contacts: any[];
    setContacts: React.Dispatch<React.SetStateAction<any[]>>;
    profileData: any;
    setProfileData: React.Dispatch<React.SetStateAction<any>>;
    settings: any;
    setSettings: React.Dispatch<React.SetStateAction<any>>;
    messagesCache: Record<string, any[]>;
    cacheMessages: (username: string, messages: any[]) => void;
    refreshContacts: () => Promise<any>;
    refreshProfile: () => Promise<any>;
    refreshSettings: () => Promise<any>;
    loading: boolean;
    initialized: boolean;
    authRestored: boolean;
    userId: string | null;
    userPresence: Record<string, string>;
    setUserPresence: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    globalTyping: Record<string, boolean>;
    executeSecurely: <T>(operation: () => Promise<T>, errorMsg?: string) => Promise<T | undefined>;
    isOnline: boolean;
    activeChatId: string | null;
    setActiveChatId: (id: string | null) => void;
    incomingCall: any;
    setIncomingCall: React.Dispatch<React.SetStateAction<any>>;
    playSound: (type: 'send' | 'receive' | 'tick') => void;
    clearLocalChat: (username: string) => void;
    setUserId: React.Dispatch<React.SetStateAction<string | null>>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper: format last message time
const formatTime = (dateStr: string): string => {
    const msgDate = new Date(dateStr);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffInDays === 0) return msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return msgDate.toLocaleDateString([], { weekday: 'short' });
    return msgDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [authRestored, setAuthRestored] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    const [contacts, setContacts] = useState<any[]>(() => {
        const saved = localStorage.getItem('masum_contacts');
        return saved ? JSON.parse(saved) : [];
    });
    const [profileData, setProfileData] = useState<any>(() => {
        const saved = localStorage.getItem('masum_profile');
        return saved ? JSON.parse(saved) : null;
    });
    const [settings, setSettings] = useState<any>(() => {
        const saved = localStorage.getItem('masum_settings');
        return saved ? JSON.parse(saved) : null;
    });
    const [messagesCache, setMessagesCache] = useState<Record<string, any[]>>(() => {
        const saved = localStorage.getItem('masum_messages_cache');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                Object.keys(parsed).forEach(k => {
                    parsed[k] = parsed[k].map((m: any) => {
                        if (!m.call_id && m.text && (m.text === 'Missed call' || m.text === 'Video call' || m.text === 'Voice call')) {
                            m.call_id = m.id || 'legacy_call';
                        }
                        return m;
                    });
                });
                return parsed;
            } catch (e) { return {}; }
        }
        return {};
    });
    const [userPresence, setUserPresence] = useState<Record<string, string>>({});
    const [globalTyping, setGlobalTyping] = useState<Record<string, boolean>>({});
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [loading, setLoading] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [incomingCall, setIncomingCall] = useState<any>(null);

    const activeChatIdRef = useRef<string | null>(null);
    useEffect(() => { activeChatIdRef.current = activeChatId; }, [activeChatId]);

    const contactsRef = useRef(contacts);
    const messagesCacheRef = useRef(messagesCache);
    const initializedRef = useRef(initialized);
    const settingsRef = useRef(settings);
    useEffect(() => { contactsRef.current = contacts; }, [contacts]);
    useEffect(() => { messagesCacheRef.current = messagesCache; }, [messagesCache]);
    useEffect(() => { initializedRef.current = initialized; }, [initialized]);
    useEffect(() => { settingsRef.current = settings; }, [settings]);

    // Restore Session
    const restoreSession = useCallback(async () => {
        // Pre-flight: only attempt session restore if meaningful data exists in storage.
        // NOTE: localStorage.setItem saves JSON.stringify(null) as the literal string "null",
        // so we must check both that the key exists AND that it's not the string "null".
        const profileInStorage = localStorage.getItem('masum_profile');
        const settingsInStorage = localStorage.getItem('masum_settings');
        const hasSessionFlag =
            (profileInStorage && profileInStorage !== 'null') ||
            (settingsInStorage && settingsInStorage !== 'null') ||
            !!localStorage.getItem('insforge_session') ||
            !!sessionStorage.getItem('insforge_session') ||
            Object.keys(localStorage).some(k => k.toLowerCase().includes('insforge'));

        if (!hasSessionFlag) {
            setUserId(null);
            setAuthRestored(true);
            return;
        }

        // Only set authRestored=false if we don't already have a userId
        // This prevents flickering the ProtectedRoute back to loading after login
        setAuthRestored(prev => {
            if (prev) return false; // was true, now restoring again
            return false; // was already false
        });
        try {
            const { data, error } = await insforge.auth.getCurrentSession().catch((err: any) => ({ data: null, error: err }));

            if (data?.session) {
                setUserId(data.session.user.id);
            } else if (error) {
                // Suppress "No refresh token/CSRF token" warnings as it's expected for guests/expired sessions
                const isNoTokenErr = error?.message?.includes('refresh token') ||
                    error?.status === 401 ||
                    error?.status === 403 ||
                    error?.message?.includes('CSRF token');

                if (!isNoTokenErr) {
                    console.warn("Session restore error:", error);
                }

                // If the token is corrupt or refresh forbidden/unauthorized, forcefully clear it from storage to prevent infinite loops
                if (error?.status === 403 || error?.status === 401 || error?.message?.includes('CSRF token') || error?.message?.includes('refresh token')) {
                    clearAppAuthStorage();
                    insforge.auth.signOut().catch(() => { });
                    window.dispatchEvent(new CustomEvent('masum-jwt-expired'));
                }

                setUserId(null);
            } else {
                setUserId(null);
            }
        } catch (err) {
            setUserId(null);
        } finally {
            setAuthRestored(true);
        }
    }, []);

    useEffect(() => { restoreSession(); }, [restoreSession]);

    // Auth Listeners
    useEffect(() => {
        const handleAuthChange = () => {
            restoreSession();
        };
        window.addEventListener('masum-auth-change', handleAuthChange);
        return () => window.removeEventListener('masum-auth-change', handleAuthChange);
    }, [restoreSession]);

    useEffect(() => {
        const handleJwtExpired = async () => {
            try { await insforge.auth.signOut(); } catch { }
            clearAppAuthStorage();
            setUserId(null);
            setContacts([]);
            setProfileData(null);
            setSettings(null);
            setMessagesCache({});
            setInitialized(false);
            window.location.replace('/');
        };
        window.addEventListener('masum-jwt-expired', handleJwtExpired);
        return () => window.removeEventListener('masum-jwt-expired', handleJwtExpired);
    }, []);

    // Persistence
    useEffect(() => { localStorage.setItem('masum_contacts', JSON.stringify(contacts)); }, [contacts]);
    useEffect(() => { localStorage.setItem('masum_profile', JSON.stringify(profileData)); }, [profileData]);
    useEffect(() => { localStorage.setItem('masum_settings', JSON.stringify(settings)); }, [settings]);
    useEffect(() => {
        const trimmed: Record<string, any[]> = {};
        Object.keys(messagesCache).forEach(k => {
            if (messagesCache[k]) {
                // Filter out messages with temporary blob URLs to prevent ERR_FILE_NOT_FOUND on refresh
                trimmed[k] = messagesCache[k]
                    .filter((m: any) => {
                        const hasBlob = (m.image && m.image.startsWith('blob:')) || (m.audio && m.audio.startsWith('blob:'));
                        return !hasBlob;
                    })
                    .slice(-50);
            }
        });
        localStorage.setItem('masum_messages_cache', JSON.stringify(trimmed));
    }, [messagesCache]);

    const playSound = useCallback((type: 'send' | 'receive' | 'tick') => {
        // Respect user's in-app sound setting (Strict default to silent)
        if (!settingsRef.current || settingsRef.current.in_app_sound !== true) return;

        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();

            if (type === 'tick') {
                // Subtle 'tick' sound: very short double high-pitched click
                [0, 0.08].forEach((delay, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(2500 + (i * 500), ctx.currentTime + delay);
                    gain.gain.setValueAtTime(0.08, ctx.currentTime + delay);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.04);
                    osc.start(ctx.currentTime + delay);
                    osc.stop(ctx.currentTime + delay + 0.04);
                    if (i === 1) osc.onended = () => ctx.close();
                });
            } else if (type === 'send') {
                // 'send' sound: upward high-pitched blip
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.15);
                osc.onended = () => ctx.close();
            } else if (type === 'receive') {
                // 'receive' sound: downward double blip
                [0, 0.12].forEach((delay, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(i === 0 ? 1200 : 900, ctx.currentTime + delay);
                    gain.gain.setValueAtTime(0.1, ctx.currentTime + delay);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.1);
                    osc.start(ctx.currentTime + delay);
                    osc.stop(ctx.currentTime + delay + 0.1);
                    if (i === 1) osc.onended = () => ctx.close();
                });
            }
        } catch (e) {
            // Silently ignore — audio is non-critical
        }
    }, []);

    // Cleanup local cache and contact preview for a user
    const clearLocalChat = useCallback((userToClear: string) => {
        setMessagesCache(prev => {
            const newCache = { ...prev };
            delete newCache[userToClear];

            // Aggressive Synchronous Persistence: Update localStorage immediately
            // to prevent any race condition during rapid navigation/refresh
            try {
                const saved = localStorage.getItem('masum_messages_cache');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    delete parsed[userToClear];
                    localStorage.setItem('masum_messages_cache', JSON.stringify(parsed));
                }
            } catch (err) {
                console.warn('Silent sync persistence failure:', err);
            }

            return newCache;
        });

        // Also clear the preview on the Home page
        setContacts(prev => prev.map(c =>
            c.username === userToClear
                ? { ...c, preview: '', lastMsgStatus: undefined, unread: 0 }
                : c
        ));
    }, []);

    const executeSecurely = async <T,>(operation: () => Promise<T>, errorMsg = 'An error occurred'): Promise<T | undefined> => {
        try {
            return await operation();
        } catch (err: any) {
            const isJwtError = err.status === 401 || err.code === 'PGRST301' || err.message?.includes('JWT') || err.message?.includes('expired');
            if (isJwtError) {
                // Try to silently refresh the session first
                try {
                    const { data: refreshData } = await insforge.auth.getCurrentSession();
                    if (refreshData?.session) {
                        // Session refreshed — retry the operation once
                        try {
                            return await operation();
                        } catch (retryErr: any) {
                            // Retry also failed — now sign out
                            window.dispatchEvent(new CustomEvent('masum-jwt-expired'));
                            return undefined;
                        }
                    } else {
                        window.dispatchEvent(new CustomEvent('masum-jwt-expired'));
                    }
                } catch {
                    window.dispatchEvent(new CustomEvent('masum-jwt-expired'));
                }
            } else {
                window.dispatchEvent(new CustomEvent('masum-toast', { detail: { message: errorMsg, type: 'error' } }));
            }
            return undefined;
        }
    };

    const refreshProfile = async () => {
        if (!userId) return;
        return executeSecurely(async () => {
            const { data } = await insforge.database.from('profiles').select().eq('id', userId).maybeSingle();

            if (data) {
                setProfileData(data);
                return data;
            }

            // Fallback: If profile missing, attempt to create it
            const { data: sessionData } = await insforge.auth.getCurrentSession();
            if (sessionData?.session?.user) {
                const u = sessionData.session.user;
                // Generate random username: email_prefix + 4 random digits
                const emailPrefix = u.email?.split('@')[0] || 'user';
                const randomId = Math.floor(1000 + Math.random() * 9000);
                const generatedUsername = `${emailPrefix}_${randomId}`.toLowerCase().replace(/[^a-z0-9_.]/g, '');

                const defaultProfile = {
                    id: u.id,
                    username: generatedUsername,
                    name: u.profile?.name || u.email?.split('@')[0] || 'Anonymous User',
                    avatar_url: u.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`,
                    bio: 'Hey there! I am using Masum Chat.',
                    last_seen: new Date().toISOString()
                };

                const { data: created } = await insforge.database.from('profiles').insert([defaultProfile]).select().maybeSingle();
                if (created) {
                    setProfileData(created);
                    return created;
                }
            }
            return null;
        }, 'Failed to refresh profile');
    };

    const refreshSettings = async () => {
        if (!userId) return;
        return executeSecurely(async () => {
            const { data } = await insforge.database.from('user_settings').select().eq('user_id', userId).maybeSingle();

            if (data) {
                setSettings(data);
                return data;
            }

            // Fallback: Create default settings if missing
            const defaultSettings = {
                user_id: userId,
                theme: 'default',
                theme_mode: 'dark',
                accent_color: '#7F3DFF',
                read_receipts: true,
                disappearing_messages_duration: 0,
                in_app_sound: false,
                updated_at: new Date().toISOString()
            };

            const { data: created } = await insforge.database.from('user_settings').insert([defaultSettings]).select().maybeSingle();
            if (created) {
                setSettings(created);
                return created;
            }
            return null;
        }, 'Failed to refresh settings');
    };

    const refreshContacts = async () => {
        if (!userId) return;
        return executeSecurely(async () => {
            const { data: dbContacts } = await insforge.database.from('contacts').select().eq('user_id', userId).order('created_at', { ascending: false });
            if (dbContacts) {
                // Fetch recent messages to see if there are missing contacts
                const { data: messagesRes } = await insforge.database.from('messages').select().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).order('created_at', { ascending: false }).limit(200);

                // Find all unique contact IDs from messages
                const msgContactIds = new Set<string>();
                (messagesRes || []).forEach((msg: any) => {
                    msgContactIds.add(msg.sender_id === userId ? msg.receiver_id : msg.sender_id);
                });

                const existingContactIds = new Set(dbContacts.map((c: any) => c.contact_id));
                const missingIds = Array.from(msgContactIds).filter(id => !existingContactIds.has(id));

                if (missingIds.length > 0) {
                    const inserts = missingIds.map(cid => ({ user_id: userId, contact_id: cid }));
                    try {
                        // Use upsert to avoid 409 Conflict if contact was already added concurrently
                        await insforge.database.from('contacts').upsert(inserts, { onConflict: 'user_id,contact_id' });
                        inserts.forEach(i => dbContacts.push({ ...i, created_at: new Date().toISOString() }));
                    } catch { }
                }

                const finalContactIds = dbContacts.map((c: any) => c.contact_id);
                const { data: profilesRes } = await insforge.database.from('profiles').select().in('id', finalContactIds);

                const profileMap: Record<string, any> = {};
                (profilesRes || []).forEach((p: any) => { profileMap[p.id] = p; });

                const lastMsgMap: Record<string, any> = {};
                const unreadMap: Record<string, number> = {};
                (messagesRes || []).forEach((msg: any) => {
                    const contactId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
                    if (!lastMsgMap[contactId]) lastMsgMap[contactId] = msg;
                    if (msg.receiver_id === userId && !msg.is_seen) {
                        unreadMap[msg.sender_id] = (unreadMap[msg.sender_id] || 0) + 1;
                    }
                });

                const mapped = dbContacts.map((c: any) => {
                    const profile = profileMap[c.contact_id];
                    const lastMsg = lastMsgMap[c.contact_id];
                    let preview = '';
                    if (lastMsg) {
                        if (lastMsg.is_deleted) preview = 'This message was deleted';
                        else if (lastMsg.image_url) preview = '📷 Photo';
                        else if (lastMsg.video_url) preview = '📹 Video';
                        else if (lastMsg.audio_url) preview = '🎤 Voice message';
                        else {
                            preview = lastMsg.text || '';
                            if (preview.length > 45) preview = preview.substring(0, 45) + '...';
                        }
                    }
                    return {
                        ...c,
                        name: profile?.name || 'Unknown',
                        username: profile?.username || 'unknown',
                        avatar: profile?.avatar_url,
                        bio: profile?.bio || null,
                        preview,
                        time: lastMsg ? formatTime(lastMsg.created_at) : '',
                        unread: unreadMap[c.contact_id] || 0,
                        lastMessageAt: lastMsg?.created_at || c.created_at,
                        lastSeen: profile?.last_seen,
                        lastMsgStatus: lastMsg ? (lastMsg.is_seen ? 'read' : lastMsg.is_delivered ? 'delivered' : 'sent') : null,
                        isLastMsgMe: lastMsg?.sender_id?.toString() === userId?.toString(),
                    };
                });
                const sorted = mapped.sort((a: any, b: any) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
                setContacts(sorted);
                return sorted;
            }
        }, 'Failed to refresh contacts');
    };

    const cacheMessages = useCallback((username: string, messages: any[]) => {
        setMessagesCache(prev => {
            // Only update if actually different to prevent unnecessary renders
            if (JSON.stringify(prev[username]) === JSON.stringify(messages.slice(-100))) return prev;
            return { ...prev, [username]: messages.slice(-100) };
        });
    }, []);

    const navigate = useNavigate();

    // ──────────────────────────────────────────────────
    // Real-time Sync 2.1 & Presence 2.1
    // ──────────────────────────────────────────────────
    useEffect(() => {
        if (!userId || !initialized) return;


        const handleNewMessage = (payload: any) => {
            if (payload.sender_id !== userId && payload.receiver_id !== userId) return;
            const contactId = payload.sender_id === userId ? payload.receiver_id : payload.sender_id;
            const isIncoming = payload.receiver_id === userId;

            // If chat is active, auto-mark seen in DB
            const isChatActive = isIncoming && activeChatIdRef.current === contactId;
            if (isChatActive && !payload.is_seen) {
                (async () => {
                    try {
                        const { data: sessionData } = await insforge.auth.getCurrentSession();
                        const expiresAt = (sessionData?.session as any)?.expires_at || (sessionData?.session as any)?.expiresAt;
                        if (!sessionData?.session || (expiresAt && (expiresAt * 1000) < Date.now() + 5000)) return;

                        await insforge.database.from('messages').update({ is_seen: true }).eq('id', payload.id);
                    } catch (e) { console.error('Auto-mark seen error:', e); }
                })();
            }

            // ──────────────────────────────────────────────────
            // Contact discovery for both incoming & outgoing
            // ──────────────────────────────────────────────────
            const currentContacts = contactsRef.current;
            const contact = currentContacts.find(c => c.contact_id === contactId);

            if (!contact) {
                // Discover entirely new contact (works for both incoming/outgoing)
                (async () => {
                    try {
                        const { data: sessionData } = await insforge.auth.getCurrentSession();
                        const expiresAt = (sessionData?.session as any)?.expires_at || (sessionData?.session as any)?.expiresAt;
                        if (!sessionData?.session || (expiresAt && (expiresAt * 1000) < Date.now() + 5000)) return;

                        console.log('Real-time Discovery: New contact found via message', contactId);
                        if (isIncoming && !payload.is_delivered) {
                            await insforge.database.from('messages').update({ is_delivered: true }).eq('id', payload.id);
                        }
                        await insforge.database.from('contacts').upsert([{ user_id: userId, contact_id: contactId }], { onConflict: 'user_id,contact_id' });
                    } catch (e) {
                        console.error('Failed processing dynamic new contact:', e);
                    }
                    // Refresh contacts list so it shows up on the UI immediately
                    await refreshContacts();
                })();
                return;
            }

            console.log(`Real-time: ${isIncoming ? 'Incoming' : 'Outgoing'} message update for ${contact.username}`, payload.id);

            // Deduplication & Optimistic Matching
            const existingCache = messagesCacheRef.current[contact.username] || [];

            // 1. Exact ID duplicate check
            if (existingCache.some(m => m.id === payload.id)) return;

            // 2. ClientId-based matching for optimistic responses (THE PRIMARY SYNC KEY)
            const matchedIndex = existingCache.findIndex(m =>
                m.clientId !== undefined &&
                payload.clientId !== undefined &&
                m.clientId === payload.clientId
            );

            if (matchedIndex !== -1 && payload.id) {
                // We found a match! Update the optimistic bubble with real server data
                setMessagesCache(prev => {
                    const cache = [...(prev[contact.username] || [])];
                    if (cache[matchedIndex]) {
                        cache[matchedIndex] = {
                            ...cache[matchedIndex],
                            id: payload.id,
                            clientId: payload.clientId, // Keep the mapping
                            optimistic: false,
                            uploading: false,
                            uploadProgress: 100,
                            image: payload.image_url || cache[matchedIndex].image,
                            video: payload.video_url || cache[matchedIndex].video,
                            audio: payload.audio_url || cache[matchedIndex].audio,
                        };
                    }
                    return { ...prev, [contact.username]: cache };
                });
                return;
            }

            // 3. Fallback content-based matching (for missed clientIds or external triggers)
            const isMedia = payload.image_url || payload.video_url || payload.audio_url;
            const recentDuplicateIndex = existingCache.findIndex(m => {
                if (!(typeof m.id === 'number' && m.id > 1000000000000)) return false;
                if (m.sender !== (payload.sender_id === userId ? 'me' : 'other')) return false;

                if (isMedia) {
                    return (payload.image_url && m.mediaType === 'image') ||
                        (payload.video_url && m.mediaType === 'video') ||
                        (payload.audio_url && m.mediaType === 'audio');
                }
                return m.text === payload.text && Math.abs(new Date(m.created_at || Date.now()).getTime() - new Date().getTime()) < 5000;
            });

            if (recentDuplicateIndex !== -1 && payload.id) {
                setMessagesCache(prev => {
                    const cache = [...(prev[contact.username] || [])];
                    if (cache[recentDuplicateIndex]) {
                        cache[recentDuplicateIndex] = {
                            ...cache[recentDuplicateIndex],
                            id: payload.id,
                            clientId: payload.clientId || cache[recentDuplicateIndex].clientId,
                            optimistic: false,
                            uploading: false,
                            uploadProgress: 100,
                            image: payload.image_url || cache[recentDuplicateIndex].image,
                            video: payload.video_url || undefined,
                            audio: payload.audio_url || cache[recentDuplicateIndex].audio,
                        };
                    }
                    return { ...prev, [contact.username]: cache };
                });
                return;
            }

            setGlobalTyping(prev => ({ ...prev, [contactId]: false }));

            // Mark delivered if incoming
            if (isIncoming && !payload.is_delivered && payload.id) {
                (async () => {
                    try {
                        await insforge.database.from('messages').update({ is_delivered: true }).eq('id', payload.id);
                    } catch (e) {
                        console.error('Failed to mark message delivered:', e);
                    }
                })();
            }

            // Handle reply_to if present
            let replyToData = null;
            if (payload.reply_to) {
                const parentMsg = existingCache.find(m => m.id === payload.reply_to);
                if (parentMsg) {
                    replyToData = {
                        id: parentMsg.id,
                        text: parentMsg.text,
                        username: parentMsg.sender === 'me' ? 'me' : contact.username,
                        mediaType: parentMsg.mediaType
                    };
                } else {
                    // Placeholder if parent message isn't in local cache
                    // Try to discover it from payload if possible (rare but good for consistency)
                    replyToData = {
                        id: payload.reply_to,
                        text: "Message",
                        username: "User",
                        mediaType: undefined
                    };
                }
            }

            if (isIncoming && payload.sender_id !== userId) {
                playSound('receive');

                // Browser push notification — only when not in that chat
                const isChatOpen = activeChatIdRef.current === contactId?.toString();
                if (!isChatOpen) {
                    showMessageNotification(
                        payload,
                        contact,
                        settingsRef.current
                    );
                }
            }

            const incoming: any = {
                id: payload.id,
                clientId: payload.clientId || payload.id,
                text: payload.text || '',
                time: new Date(payload.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
                sender: payload.sender_id === userId ? 'me' : 'other',
                status: payload.is_seen ? 'read' : payload.is_delivered ? 'delivered' : 'sent',
                image: payload.video_url || payload.image_url || null,
                audio: payload.audio_url || null,
                audioDuration: payload.audio_duration || undefined,
                mediaType: payload.video_url ? 'video' : (payload.image_url ? 'image' : (payload.audio_url ? 'audio' : undefined)),
                is_deleted: payload.is_deleted || false,
                call_id: payload.call_id || null,
                replyTo: replyToData
            };

            setMessagesCache(prev => ({
                ...prev,
                [contact.username]: [...(prev[contact.username] || []), incoming].slice(-200)
            }));

            // Update Contact List
            setContacts(prev => {
                const idx = prev.findIndex(c => c.contact_id === contactId);
                if (idx === -1) return prev;
                let preview = '';
                if (payload.is_deleted) preview = 'This message was deleted';
                else if (payload.image_url) preview = '📷 Photo';
                else if (payload.video_url) preview = '📹 Video';
                else if (payload.audio_url) preview = '🎤 Voice message';
                else preview = (payload.text || '').substring(0, 45);

                const updated = {
                    ...prev[idx],
                    preview,
                    time: formatTime(payload.created_at || new Date().toISOString()),
                    lastMessageAt: payload.created_at || new Date().toISOString(),
                    unread: (isIncoming && !isChatActive) ? (prev[idx].unread || 0) + 1 : prev[idx].unread,
                    lastMsgStatus: payload.is_seen ? 'read' : payload.is_delivered ? 'delivered' : 'sent',
                    isLastMsgMe: payload.sender_id?.toString() === userId?.toString()
                };
                const rest = prev.filter((_, i) => i !== idx);
                return [updated, ...rest].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
            });
        };

        const handleUpdateMessage = (payload: any) => {
            const contactId = payload.sender_id === userId ? payload.receiver_id : payload.sender_id;
            const currentContacts = contactsRef.current;
            const contact = currentContacts.find(c => c.contact_id === contactId);
            if (!contact) return;

            setMessagesCache(prev => {
                const existing = prev[contact.username];
                if (!existing || !payload.id) return prev;
                return {
                    ...prev,
                    [contact.username]: existing.map(m => m.id === payload.id ? {
                        ...m,
                        text: payload.is_deleted ? 'This message was deleted' : (payload.text || m.text),
                        status: payload.is_seen ? 'read' : payload.is_delivered ? 'delivered' : m.status,
                        is_deleted: payload.is_deleted || m.is_deleted,
                        image: payload.is_deleted ? null : m.image,
                        audio: payload.is_deleted ? null : m.audio,
                        mediaType: payload.is_deleted ? undefined : m.mediaType
                    } : m)
                };
            });

            if (payload.is_seen && payload.receiver_id === userId) {
                setContacts(prev => prev.map(c => c.contact_id === contactId ? { ...c, unread: 0 } : c));
            }

            // Play tick sound if OUR message was just delivered/read
            if (payload.sender_id === userId && (payload.is_seen || payload.is_delivered)) {
                // Ensure we only play it if the status actually changed (don't spam on repeated events)
                const existingExistingMsgs = messagesCacheRef.current?.[contact.username] || [];
                const existingMsg = existingExistingMsgs.find(m => m.id === payload.id);
                if (existingMsg) {
                    const oldStatus = existingMsg.status;
                    const newStatus = payload.is_seen ? 'read' : (payload.is_delivered ? 'delivered' : oldStatus);
                    if (oldStatus !== newStatus && (newStatus === 'delivered' || newStatus === 'read')) {
                        playSound('tick');
                    }
                }
            }

            // Sync message status updates to contact list for ticks
            setContacts(prev => prev.map(c => {
                if (c.contact_id === contactId) {
                    // Update status if provided in payload, otherwise preserve existing
                    const newStatus = payload.is_seen ? 'read' : (payload.is_delivered ? 'delivered' : c.lastMsgStatus);

                    return {
                        ...c,
                        lastMsgStatus: newStatus,
                        preview: payload.is_deleted ? 'This message was deleted' : (payload.text || c.preview),
                        // Ensure we keep track of who sent the last message for tick visibility
                        isLastMsgMe: payload.sender_id ? (payload.sender_id.toString() === userId?.toString()) : c.isLastMsgMe
                    };
                }
                return c;
            }));
        };

        const handleDeleteMessage = (payload: any) => {
            // Physically deleted from DB (cleanup or single delete)
            const contactId = payload.sender_id === userId ? payload.receiver_id : payload.sender_id;
            const contact = contactsRef.current.find(c => c.contact_id === contactId);
            if (!contact) return;

            setMessagesCache(prev => {
                const existing = prev[contact.username];
                if (!existing) return prev;
                return {
                    ...prev,
                    [contact.username]: existing.filter(m => m.id !== payload.id)
                };
            });
        };

        const handleUpdateProfile = (payload: any) => {
            if (payload.id === userId) setProfileData((prev: any) => ({ ...prev, ...payload }));
            setContacts(prev => prev.map(c => c.contact_id === payload.id ? {
                ...c,
                name: payload.name !== undefined ? payload.name : c.name,
                avatar: payload.avatar_url !== undefined ? payload.avatar_url : c.avatar,
                bio: payload.bio !== undefined ? payload.bio : c.bio,
                lastSeen: payload.last_seen || c.lastSeen
            } : c));
        };

        const handleTypingEvent = (payload: any) => {
            if (payload.sender_id === userId) return;
            if (payload.receiver_id && payload.receiver_id !== userId) return;

            setGlobalTyping(prev => ({ ...prev, [payload.sender_id]: true }));
            setTimeout(() => setGlobalTyping(prev => ({ ...prev, [payload.sender_id]: false })), 6000);
        };

        const handleStatusEvent = (payload: any) => {
            if (payload.sender_id === userId) return;
            const timestamp = payload.status === 'online' ? new Date().toISOString() : new Date(Date.now() - 70000).toISOString();
            setUserPresence(prev => ({ ...prev, [payload.sender_id]: timestamp }));
            setContacts(prev => prev.map(c => c.contact_id === payload.sender_id ? { ...c, lastSeen: timestamp } : c));
        };

        const handleCallInit = (payload: any) => {
            if (payload.caller_id === userId) return;
            setIncomingCall(payload);
        };

        const handleCallEnd = (payload: any) => {
            setIncomingCall((prev: any) => {
                if (prev && prev.caller_id === payload.caller_id) return null;
                return prev;
            });
        };

        const handleBlockStatusChange = (payload: any) => {
            // Broadcast it to the rest of the app (Chat, UserProfile)
            window.dispatchEvent(new CustomEvent('masum-block-status-change', { detail: payload.payload }));
        };

        const setupRealtime = async () => {
            try {
                await insforge.realtime.connect();
                insforge.realtime.on('INSERT_message', handleNewMessage);
                insforge.realtime.on('UPDATE_message', handleUpdateMessage);
                insforge.realtime.on('DELETE_message', handleDeleteMessage);
                insforge.realtime.on('UPDATE_profile', handleUpdateProfile);
                insforge.realtime.on('UPDATE_block_status', handleBlockStatusChange);
                insforge.realtime.on('typing', handleTypingEvent);
                insforge.realtime.on('status', handleStatusEvent);
                insforge.realtime.on('CALL_INIT', handleCallInit);
                insforge.realtime.on('CALL_END', handleCallEnd);

                await Promise.all([
                    insforge.realtime.subscribe(`chat:${userId}`),
                    insforge.realtime.subscribe(`profiles:${userId}`),
                    insforge.realtime.subscribe('presence:global'),
                    insforge.realtime.subscribe(`user:${userId}`)
                ]);

                insforge.realtime.publish('presence:global', 'status', { sender_id: userId, status: 'online' }).catch(() => { });
            } catch (err) { console.error('Realtime setup error:', err); }
        };

        setupRealtime();

        const cleanup = () => {
            insforge.realtime.publish('presence:global', 'status', { sender_id: userId, status: 'offline' }).catch(() => { });
            insforge.realtime.off('INSERT_message', handleNewMessage);
            insforge.realtime.off('UPDATE_message', handleUpdateMessage);
            insforge.realtime.off('DELETE_message', handleDeleteMessage);
            insforge.realtime.off('UPDATE_profile', handleUpdateProfile);
            insforge.realtime.off('UPDATE_block_status', handleBlockStatusChange);
            insforge.realtime.off('typing', handleTypingEvent);
            insforge.realtime.off('status', handleStatusEvent);
            insforge.realtime.off('CALL_INIT', handleCallInit);
            insforge.realtime.off('CALL_END', handleCallEnd);
            insforge.realtime.unsubscribe(`chat:${userId}`);
            insforge.realtime.unsubscribe(`profiles:${userId}`);
            insforge.realtime.unsubscribe('presence:global');
            insforge.realtime.unsubscribe(`user:${userId}`);
        };

        window.addEventListener('beforeunload', cleanup);
        return () => {
            window.removeEventListener('beforeunload', cleanup);
            cleanup();
        };
    }, [userId, initialized]);

    // Connection Recovery
    useEffect(() => {
        const handleOnline = async () => {
            setIsOnline(true);
            window.dispatchEvent(new CustomEvent('masum-toast', { detail: { message: 'Connected', type: 'success' } }));
            if (userId && initializedRef.current) {
                await refreshContacts();
                await insforge.realtime.connect();
                insforge.realtime.publish('presence:global', 'status', { sender_id: userId, status: 'online' }).catch(() => { });
            }
        };
        const handleOffline = () => {
            setIsOnline(false);
            window.dispatchEvent(new CustomEvent('masum-toast', { detail: { message: 'Waiting for network...', type: 'info' } }));
            insforge.realtime.publish('presence:global', 'status', { sender_id: userId, status: 'offline' }).catch(() => { });
        };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [userId]);

    // Heartbeat
    useEffect(() => {
        if (!userId) return;
        const heartbeat = async () => {
            if (!userId || !authRestored) return;

            try {
                // Pre-flight check: only run heartbeat if session is still valid
                // This avoids 401 errors in console by not making the request if unauthenticated
                const { data: sessionData } = await insforge.auth.getCurrentSession();

                if (!sessionData?.session || !sessionData.session.accessToken) {
                    return; // No active session, stop heartbeat silently
                }

                // Check if token is likely still valid (buffer of 15s)
                // Supabase/InsForge uses `expires_at` (unix timestamp in seconds)
                const expiresAt = (sessionData.session as any).expires_at || (sessionData.session as any).expiresAt;
                if (expiresAt && (expiresAt * 1000) < Date.now() + 15000) {
                    // Token is expired or about to expire. The SDK's autoRefreshToken should handle it,
                    // but we skip this background update to prevent a 401 trace in the console.
                    return;
                }

                // Fire database update only if authenticated
                await insforge.database.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', userId);

                // Also broadcast locally for faster UI sync
                insforge.realtime.publish('presence:global', 'status', { sender_id: userId, status: 'online' }).catch(() => { });
            } catch (err) {
                // Completely silent catch for background heartbeat
            }
        };
        const interval = setInterval(heartbeat, 30000); // Optimized 30s heartbeat
        heartbeat();
        return () => {
            clearInterval(interval);
        };
    }, [userId]);

    // Initialization
    useEffect(() => {
        if (!authRestored || !userId || initialized) return;
        const init = async () => {
            setLoading(true);
            try {
                // Preemptive Auth Check before firing DB queries
                const { data: sessionData, error: sessionErr } = await insforge.auth.getCurrentSession();
                if (sessionErr || !sessionData?.session) {
                    window.dispatchEvent(new CustomEvent('masum-jwt-expired'));
                    return;
                }

                await Promise.all([refreshProfile(), refreshContacts(), refreshSettings()]);
            } catch (err) { } finally {
                setInitialized(true);
                setLoading(false);
            }
        };
        init();
    }, [userId, initialized, authRestored]);

    return (
        <DataContext.Provider value={{
            contacts, setContacts, profileData, setProfileData, settings, setSettings,
            messagesCache, cacheMessages, refreshContacts, refreshProfile, refreshSettings,
            loading, initialized, authRestored, userId, userPresence, setUserPresence,
            globalTyping, executeSecurely, isOnline, activeChatId, setActiveChatId,
            incomingCall, setIncomingCall, playSound, clearLocalChat, setUserId
        }}>
            {children}
            {incomingCall && (
                <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '400px', backgroundColor: 'var(--surface-color)', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 99999, overflow: 'hidden', border: '1px solid var(--border-color)', animation: 'fadeIn 0.3s ease-out' }}>
                    <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border-color)' }}>
                        <img src={incomingCall.caller_avatar || 'https://via.placeholder.com/150'} alt="Avatar" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }} />
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>{incomingCall.caller_name || incomingCall.username}</h3>
                            <p style={{ margin: 0, fontSize: '14px', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500, marginTop: '4px' }}>
                                {incomingCall.type === 'video' ? <Video size={14} /> : <PhoneCall size={14} />}
                                Incoming {incomingCall.type} call...
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', background: 'var(--secondary-color)' }}>
                        <button
                            className="ripple"
                            style={{ flex: 1, padding: '16px', border: 'none', background: 'transparent', color: '#ef4444', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            onClick={() => {
                                insforge.realtime.publish(`user:${incomingCall.caller_id}`, 'CALL_END', { caller_id: userId }).catch(() => { });
                                setIncomingCall(null);
                            }}
                        >
                            <X size={20} /> Decline
                        </button>
                        <div style={{ width: 1, background: 'var(--border-color)' }} />
                        <button
                            className="ripple"
                            style={{ flex: 1, padding: '16px', border: 'none', background: 'transparent', color: '#22c55e', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            onClick={() => {
                                navigate(`/call/${incomingCall.username}?type=${incomingCall.type}`);
                                // We DO NOT clear setIncomingCall(null) here! 
                                // CallView needs to read `incomingCall.offer` to initialize the WebRTC Answer.
                                // CallView will clear incomingCall when the call connects or ends.
                            }}
                        >
                            {incomingCall.type === 'video' ? <Video size={20} /> : <Phone size={20} />} Answer
                        </button>
                    </div>
                </div>
            )}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData must be used within DataProvider');
    return context;
};
