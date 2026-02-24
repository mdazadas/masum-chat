import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { insforge } from '../lib/insforge';

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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper: format last message time
const formatTime = (dateStr: string): string => {
    const msgDate = new Date(dateStr);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffInDays === 0) return msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return msgDate.toLocaleDateString([], { weekday: 'short' });
    return msgDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Make userId reactive — also checks localStorage backup in case SDK cleared sessionStorage on 401
    const [userId, setUserId] = useState<string | null>(() => {
        // First check SDK in-memory (unlikely on mount but good practice)
        if (insforge.auth.user?.id) return insforge.auth.user.id;
        // Fallback to localStorage (SDK storage)
        const saved = localStorage.getItem('masum_user_id');
        return saved || null;
    });
    const [tabSession, setTabSession] = useState<string | null>(() => localStorage.getItem('masum_tab_session') || sessionStorage.getItem('masum_tab_session'));

    // Listen for custom login/logout events dispatched by Login.tsx / Logout code
    useEffect(() => {
        const handleAuthChange = () => {
            const currentId = insforge.auth.user?.id || localStorage.getItem('masum_user_id');
            setUserId(currentId || null);
            setTabSession(localStorage.getItem('masum_tab_session') || sessionStorage.getItem('masum_tab_session'));
        };
        window.addEventListener('masum-auth-change', handleAuthChange);
        return () => window.removeEventListener('masum-auth-change', handleAuthChange);
    }, []);

    // Session Restoration — Crucial for PocketBase/JWT hydration
    useEffect(() => {
        const restoreSession = async () => {
            try {
                // This hydrates the SDK's internal authStore from storage (localStorage)
                const { data } = await insforge.auth.getCurrentSession();
                if (data?.session?.user?.id) {
                    console.log('DataContext: Session restored for:', data.session.user.id);
                    setUserId(data.session.user.id);
                    localStorage.setItem('masum_tab_session', 'active');
                    setTabSession('active');
                }
            } catch (err) {
                console.error('DataContext: Session restoration failed:', err);
            }
        };

        if (!userId) {
            restoreSession();
        }
    }, [userId]);

    const [contacts, setContacts] = useState<any[]>(() => {
        const saved = sessionStorage.getItem('masum_contacts');
        return saved ? JSON.parse(saved) : [];
    });
    const [profileData, setProfileData] = useState<any>(() => {
        const saved = sessionStorage.getItem('masum_profile');
        return saved ? JSON.parse(saved) : null;
    });
    const [settings, setSettings] = useState<any>(() => {
        const saved = sessionStorage.getItem('masum_settings');
        return saved ? JSON.parse(saved) : null;
    });
    const [messagesCache, setMessagesCache] = useState<Record<string, any[]>>(() => {
        const saved = sessionStorage.getItem('masum_messages_cache');
        return saved ? JSON.parse(saved) : {};
    });

    const [loading, setLoading] = useState(false);
    const [initialized, setInitialized] = useState(false);

    // Keep ref to contacts for realtime handler (avoids stale closures)
    const contactsRef = useRef(contacts);
    useEffect(() => { contactsRef.current = contacts; }, [contacts]);

    // Persistence
    useEffect(() => { sessionStorage.setItem('masum_contacts', JSON.stringify(contacts)); }, [contacts]);
    useEffect(() => { sessionStorage.setItem('masum_profile', JSON.stringify(profileData)); }, [profileData]);
    useEffect(() => { sessionStorage.setItem('masum_settings', JSON.stringify(settings)); }, [settings]);
    useEffect(() => { sessionStorage.setItem('masum_messages_cache', JSON.stringify(messagesCache)); }, [messagesCache]);

    const refreshProfile = async () => {
        if (!userId || !tabSession) return;
        try {
            const { data } = await insforge.database.from('profiles').select('*').eq('id', userId).single();
            if (data) { setProfileData(data); return data; }
        } catch (err) { console.error('refreshProfile error:', err); }
        return undefined;
    };

    const refreshSettings = async () => {
        if (!userId || !tabSession) return;
        try {
            const { data } = await insforge.database.from('user_settings').select('*').eq('user_id', userId).single();
            if (data) { setSettings(data); return data; }
        } catch (err) { console.error('refreshSettings error:', err); }
        return undefined;
    };

    const refreshContacts = async () => {
        if (!userId || !tabSession) return;
        try {
            const { data: dbContacts } = await insforge.database
                .from('contacts')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (dbContacts) {
                if (dbContacts.length === 0) { setContacts([]); return []; }

                const contactIds = dbContacts.map((c: any) => c.contact_id);

                const [profilesRes, messagesRes] = await Promise.all([
                    insforge.database
                        .from('profiles')
                        .select('id, name, username, avatar_url')
                        .in('id', contactIds),
                    insforge.database
                        .from('messages')
                        .select('id, sender_id, receiver_id, text, image_url, video_url, audio_url, created_at, status, is_seen')
                        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
                        .order('created_at', { ascending: false })
                        .limit(200)
                ]);

                // Build maps
                const profileMap: Record<string, any> = {};
                (profilesRes.data || []).forEach((p: any) => { profileMap[p.id] = p; });

                const lastMsgMap: Record<string, any> = {};
                const unreadMap: Record<string, number> = {};

                (messagesRes.data || []).forEach((msg: any) => {
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
                    let time = '';
                    if (lastMsg) {
                        if (lastMsg.image_url) preview = '📷 Photo';
                        else if (lastMsg.video_url) preview = '📹 Video';
                        else if (lastMsg.audio_url) preview = '🎤 Voice message';
                        else { preview = lastMsg.text || ''; if (preview.length > 45) preview = preview.substring(0, 45) + '...'; }
                        time = formatTime(lastMsg.created_at);
                    }

                    return {
                        ...c,
                        name: profile?.name || 'Unknown',
                        username: profile?.username || 'unknown',
                        avatar: profile?.avatar_url,
                        contactEntryId: c.id,
                        preview,
                        time,
                        unread: unreadMap[c.contact_id] || 0,
                        lastMessageAt: lastMsg?.created_at || c.created_at,
                    };
                });

                const sorted = [...mapped].sort((a: any, b: any) =>
                    new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
                );
                setContacts(sorted);
                return sorted;
            }
        } catch (err) { console.error('refreshContacts error:', err); }
        return undefined;
    };

    const cacheMessages = useCallback((username: string, messages: any[]) => {
        setMessagesCache(prev => ({ ...prev, [username]: messages.slice(-50) }));
    }, []);

    // ──────────────────────────────────────────────────
    // Global Realtime: Smart incremental contact updates
    // instead of full refreshContacts() on every message
    // ──────────────────────────────────────────────────
    useEffect(() => {
        if (!userId || !tabSession || !initialized) return;

        const handleNewMessage = async (payload: any) => {
            // Only handle messages involving this user
            if (payload.sender_id !== userId && payload.receiver_id !== userId) return;

            const contactId = payload.sender_id === userId ? payload.receiver_id : payload.sender_id;

            let preview = '';
            if (payload.image_url) preview = '📷 Photo';
            else if (payload.video_url) preview = '📹 Video';
            else if (payload.audio_url) preview = '🎤 Voice message';
            else { preview = payload.text || ''; if (preview.length > 45) preview = preview.substring(0, 45) + '...'; }

            const time = formatTime(payload.created_at || new Date().toISOString());
            const isIncoming = payload.receiver_id === userId;

            setContacts(prev => {
                const existingIdx = prev.findIndex((c: any) => c.contact_id === contactId || c.id === contactId);

                if (existingIdx >= 0) {
                    // Update existing contact in-place (no DB call needed)
                    const updated = [...prev];
                    updated[existingIdx] = {
                        ...updated[existingIdx],
                        preview,
                        time,
                        lastMessageAt: payload.created_at || new Date().toISOString(),
                        unread: isIncoming
                            ? (updated[existingIdx].unread || 0) + 1
                            : updated[existingIdx].unread || 0,
                    };
                    // Re-sort: pinned first, then by recency
                    return [
                        ...updated.filter((c: any) => c.pinned).sort((a: any, b: any) =>
                            new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
                        ),
                        ...updated.filter((c: any) => !c.pinned).sort((a: any, b: any) =>
                            new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
                        ),
                    ];
                } else {
                    // New contact not in list — do a targeted fetch just for this contact
                    insforge.database
                        .from('profiles')
                        .select('id, name, username, avatar_url')
                        .eq('id', contactId)
                        .single()
                        .then(({ data: profile }) => {
                            if (profile) {
                                const newContact = {
                                    user_id: userId,
                                    contact_id: contactId,
                                    name: profile.name,
                                    username: profile.username,
                                    avatar: profile.avatar_url,
                                    contactEntryId: null,
                                    preview,
                                    time,
                                    lastMessageAt: payload.created_at || new Date().toISOString(),
                                    unread: isIncoming ? 1 : 0,
                                    pinned: false,
                                    muted: false,
                                };
                                setContacts(c => [newContact, ...c]);
                            }
                        });
                    return prev; // return unchanged for now
                }
            });
        };

        const handleUpdateMessage = (payload: any) => {
            // When messages are read, clear unread count for that sender
            if (payload.is_seen && payload.sender_id && payload.receiver_id === userId) {
                setContacts(prev => prev.map((c: any) =>
                    c.contact_id === payload.sender_id ? { ...c, unread: 0 } : c
                ));
            }
        };

        const setupGlobalRealtime = async () => {
            try {
                await insforge.realtime.connect();
                await insforge.realtime.subscribe('messages');
                insforge.realtime.on('INSERT_message', handleNewMessage);
                insforge.realtime.on('UPDATE_message', handleUpdateMessage);
                console.log('DataContext: Global realtime connected ✓');
            } catch (err) {
                console.error('DataContext: Realtime setup error:', err);
            }
        };

        setupGlobalRealtime();

        return () => {
            insforge.realtime.off('INSERT_message', handleNewMessage);
            insforge.realtime.off('UPDATE_message', handleUpdateMessage);
            insforge.realtime.unsubscribe('messages');
        };
    }, [userId, tabSession, initialized]);

    // Initial background fetch — run once on mount
    useEffect(() => {
        if (!userId || !tabSession || initialized) return;

        const initializeData = async () => {
            console.log('DataContext: Starting initialization for user:', userId);
            const hasCache = contacts.length > 0 || profileData || settings;
            if (!hasCache) setLoading(true);

            // Timeout safety net: if SDK hangs waiting for auth (e.g. after 401),
            // we still unblock the UI after 6 seconds
            const timeout = new Promise<void>((_, reject) =>
                setTimeout(() => reject(new Error('Initialization timeout')), 6000)
            );

            try {
                console.time('initialization');
                await Promise.race([
                    Promise.all([
                        refreshProfile().then(d => { console.log('✓ Profile loaded'); return d; }),
                        refreshContacts().then(d => { console.log('✓ Contacts loaded'); return d; }),
                        refreshSettings().then(d => { console.log('✓ Settings loaded'); return d; })
                    ]),
                    timeout
                ]);
                console.timeEnd('initialization');
                console.log('DataContext: Initialization complete.');
            } catch (err) {
                console.timeEnd('initialization');
                console.warn('DataContext: Initialization ended prematurely:', (err as Error).message);
            } finally {
                setInitialized(true);
                setLoading(false);
            }
        };

        initializeData();
    }, [userId, tabSession, initialized]);

    return (
        <DataContext.Provider value={{
            contacts, setContacts,
            profileData, setProfileData,
            settings, setSettings,
            messagesCache, cacheMessages,
            refreshContacts, refreshProfile, refreshSettings,
            loading, initialized
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData must be used within DataProvider');
    return context;
};
