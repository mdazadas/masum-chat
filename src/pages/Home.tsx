import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, MessageSquare, Image as ImageIcon, Video, Pin, PinOff, Bell, BellOff, Trash2, Check, CheckCheck, Heart, Mic } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { insforge } from '../lib/insforge';
import { useCurrentUserId } from '../hooks/useCurrentUser';
import Avatar from '../components/Avatar';
import FloatingActionSheet from '../components/FloatingActionSheet';
import { useData } from '../context/DataContext';
// Note: global realtime for contact list is handled centrally in DataContext

const Home = () => {
    const navigate = useNavigate();
    const userId = useCurrentUserId();
    const {
        contacts, setContacts,
        profileData, initialized,
        globalTyping, userPresence,
        settings
    } = useData();


    const [searchQuery, setSearchQuery] = useState('');
    const [selectedChat, setSelectedChat] = useState<any>(null);
    const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [loading, setLoading] = useState(!initialized);
    const longPressTimer = useRef<any>(null);
    const isLongPress = useRef(false);
    const touchStartPos = useRef({ x: 0, y: 0 });

    // Sync loading state with initialization
    useEffect(() => {
        if (initialized) {
            setLoading(false);
        }
    }, [initialized]);

    const handleStartLongPress = (chat: any, e: React.MouseEvent | React.TouchEvent) => {
        isLongPress.current = false;
        if ('touches' in e) {
            touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        longPressTimer.current = setTimeout(() => {
            isLongPress.current = true;
            setSelectedChat(chat);
            setIsActionSheetOpen(true);
            if (settings?.vibration !== false && navigator.vibrate) navigator.vibrate(50);
        }, 600); // Optimized 600ms for more responsive feel
    };

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!longPressTimer.current) return;

        let currentX, currentY;
        if ('touches' in e) {
            currentX = e.touches[0].clientX;
            currentY = e.touches[0].clientY;

            const dist = Math.sqrt(
                Math.pow(currentX - touchStartPos.current.x, 2) +
                Math.pow(currentY - touchStartPos.current.y, 2)
            );

            if (dist > 10) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }
        }
    };

    const handleEndLongPress = (e?: React.MouseEvent | React.TouchEvent) => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        
        if (isLongPress.current) {
            // It was a long press, prevent the synthetic click!
            if (e && e.cancelable) {
                e.preventDefault();
            }
            // Reset slightly later so inline click handlers don't immediately trigger
            setTimeout(() => {
                isLongPress.current = false;
            }, 100);
        } else {
            isLongPress.current = false;
        }
    };

    const closeActionSheet = () => {
        setIsActionSheetOpen(false);
        setTimeout(() => {
            setSelectedChat(null);
            setShowDeleteConfirm(false);
        }, 200); // Wait for fade out animation
    };

    const togglePin = async () => {
        if (!selectedChat || !userId) return;
        const newPinned = !selectedChat.pinned;

        // Optimistic UI Update
        setContacts((prev: any[]) => prev.map((c: any) =>
            c.id === selectedChat.id ? { ...c, pinned: newPinned } : c
        ));
        closeActionSheet();

        try {
            const { error } = await insforge.database
                .from('contacts')
                .update({ pinned: newPinned })
                .eq('id', selectedChat.id);

            if (error) throw error;
        } catch (err) {
            console.error('Pin error:', err);
            // Revert on failure
            setContacts((prev: any[]) => prev.map((c: any) =>
                c.id === selectedChat.id ? { ...c, pinned: !newPinned } : c
            ));
        }
    };

    const toggleMute = async () => {
        if (!selectedChat || !userId) return;
        const newMuted = !selectedChat.muted;

        // Optimistic UI Update
        setContacts((prev: any[]) => prev.map((c: any) =>
            c.id === selectedChat.id ? { ...c, muted: newMuted } : c
        ));
        closeActionSheet();

        try {
            const { error } = await insforge.database
                .from('contacts')
                .update({ muted: newMuted })
                .eq('id', selectedChat.id);

            if (error) throw error;
        } catch (err) {
            console.error('Mute error:', err);
            // Revert on failure
            setContacts((prev: any[]) => prev.map((c: any) =>
                c.id === selectedChat.id ? { ...c, muted: !newMuted } : c
            ));
        }
    };

    const triggerDelete = () => {
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedChat || !userId) return;

        const contactToDelete = selectedChat.id;

        // Optimistic UI Update
        setContacts(prev => prev.filter(c => c.id !== contactToDelete));
        closeActionSheet();

        try {
            // Delete the chat history first
            const { error: msgErr } = await insforge.database
                .from('messages')
                .delete()
                .or(`and(sender_id.eq.${userId},receiver_id.eq.${selectedChat.contact_id}),and(sender_id.eq.${selectedChat.contact_id},receiver_id.eq.${userId})`);

            if (msgErr) console.warn('Could not delete messages history:', msgErr);

            const { error } = await insforge.database
                .from('contacts')
                .delete()
                .eq('id', selectedChat.id);

            if (error) throw error;
        } catch (err) {
            console.error('Delete error:', err);
            // We'll let a full refresh fix the list if it fails, since rebuilding it from scratch is harder
        }
    };

    const getIcon = (preview: string) => {
        if (!preview) return null;
        if (preview.includes('📷')) return <ImageIcon size={14} className="message-status-icon" />;
        if (preview.includes('📹')) return <Video size={14} className="message-status-icon" />;
        if (preview.includes('🎤')) return <Mic size={14} className="message-status-icon" />;
        return null;
    };

    const filteredContacts = useMemo(() => contacts.filter(c =>
        c.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.name?.toLowerCase().includes(searchQuery.toLowerCase())
    ), [contacts, searchQuery]);

    const sorted = useMemo(() => {
        return [
            ...filteredContacts.filter(c => c.pinned),
            ...filteredContacts.filter(c => !c.pinned),
        ];
    }, [filteredContacts]);


    return (
        <div className="home-container">
            {/* Top Navigation */}
            <div className="max-w-content">
                <nav className="top-nav" style={{ padding: '12px 16px' }}>
                    <h1 className="app-title" style={{ margin: 0, fontSize: '22px', color: 'var(--primary-dark)' }}>Masum Chat</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button className="nav-icon-btn ripple" onClick={() => navigate('/support')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Heart size={22} color="#ef4444" />
                        </button>
                        <button className="nav-icon-btn ripple" onClick={() => navigate('/search')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <SearchIcon size={24} />
                        </button>
                        <div className="user-avatar-container" onClick={() => navigate('/profile/me', { state: { profile: profileData } })} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <Avatar
                                src={profileData?.avatar_url}
                                name={profileData?.name}
                                size={38}
                                className="user-avatar"
                                priority="high"
                            />
                        </div>
                    </div>
                </nav>
            </div>

            {/* Search Bar */}
            <div className="home-search-container" style={{ padding: '0 16px 12px' }}>
                <div className="max-w-content" style={{ position: 'relative' }}>
                    <input
                        type="search"
                        className="home-search-input premium-search-input"
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoComplete="off"
                        spellCheck={false}
                        style={{
                            width: '100%',
                            padding: '12px 16px 12px 44px',
                            borderRadius: '24px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--input-bg)',
                            fontSize: '15px',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                        }}
                    />
                    <SearchIcon size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                </div>
            </div>

            {/* Chat List */}
            <div className="chat-list">
                <div className="max-w-content">
                    {loading ? (
                        <div style={{ padding: '0 0' }}>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="skeleton-chat-item">
                                    <div className="skeleton-avatar skeleton-shimmer" />
                                    <div className="skeleton-text-row">
                                        <div className="skeleton-line short skeleton-shimmer" />
                                        <div className="skeleton-line medium skeleton-shimmer" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : sorted.length > 0 ? sorted.map((chat, idx) => {
                        const isTyping = globalTyping[chat.contact_id];
                        return (
                            <div
                                key={chat.id || `${chat.contact_id}-${idx}`}
                                className="chat-item"
                                onClick={() => {
                                    if (!isLongPress.current && !isActionSheetOpen) {
                                        navigate(`/chat/${chat.username}`, { state: { profile: chat } });
                                    }
                                    // Reset after click so next tap works
                                    isLongPress.current = false;
                                }}
                                onMouseDown={(e) => handleStartLongPress(chat, e)}
                                onMouseUp={(e) => handleEndLongPress(e)}
                                onMouseLeave={(e) => handleEndLongPress(e)}
                                onMouseMove={handleMove}
                                onTouchStart={(e) => handleStartLongPress(chat, e)}
                                onTouchEnd={(e) => handleEndLongPress(e)}
                                onTouchMove={handleMove}
                                style={{
                                    backgroundColor: selectedChat?.contact_id === chat.contact_id ? 'var(--primary-light)' : 'transparent',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                <div style={{ position: 'relative' }}>
                                    <Avatar src={chat.avatar} name={chat.name} size={48} className="chat-avatar" />
                                    {userPresence[chat.contact_id] && (new Date().getTime() - new Date(userPresence[chat.contact_id]).getTime() < 60000) && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: 2,
                                            right: 2,
                                            width: 12,
                                            height: 12,
                                            backgroundColor: '#4ade80',
                                            borderRadius: '50%',
                                            border: '2px solid var(--surface-color)',
                                            zIndex: 10
                                        }} />
                                    )}
                                </div>
                                <div className="chat-info">
                                    <div className="chat-row">
                                        <span className="chat-name" style={{ fontWeight: 800 }}>
                                            {chat.name}
                                        </span>
                                        <span style={{ flex: 1 }} />
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {chat.muted && <BellOff size={14} className="mute-icon" color="var(--text-secondary)" opacity={0.6} />}
                                            <span className="chat-time">{chat.time}</span>
                                        </div>
                                    </div>
                                    <div className="chat-row">
                                        <div className="chat-preview" style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden' }}>
                                            {isTyping ? (
                                                <span style={{ color: 'var(--primary-color)', fontWeight: 600, animation: 'pulse 1.5s infinite' }}>Typing...</span>
                                            ) : (
                                                <>
                                                    {chat.isLastMsgMe && (
                                                        <span className="home-status-ticks" style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                                                            {chat.lastMsgStatus === 'read' ? (
                                                                <CheckCheck size={14} className="tick-blue" />
                                                            ) : chat.lastMsgStatus === 'delivered' ? (
                                                                <CheckCheck size={14} className="tick-delivered" />
                                                            ) : (
                                                                <Check size={14} className="tick-sent" />
                                                            )}
                                                        </span>
                                                    )}
                                                    {getIcon(chat.preview || '')}
                                                    <span style={{
                                                        color: chat.unread > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                        fontWeight: chat.unread > 0 ? 600 : 400,
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}>
                                                        {(chat.preview || '').replace(/📷 |📹 |🎤 /g, '').trim()}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {chat.pinned && <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pin size={12} fill="var(--primary-color)" color="var(--primary-color)" /></div>}
                                            {chat.unread > 0 && <div className="unread-badge">{chat.unread}</div>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    }) : searchQuery ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                            <p style={{ fontSize: '16px', fontWeight: 500 }}>No chats found for "{searchQuery}"</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-secondary)', padding: '20px', textAlign: 'center' }}>
                            <div style={{ backgroundColor: 'var(--secondary-color)', padding: '30px', borderRadius: '50%', marginBottom: '24px' }}>
                                <MessageSquare size={52} />
                            </div>
                            <h3 style={{ marginBottom: '12px', color: 'var(--text-primary)', fontSize: '20px' }}>No conversations yet</h3>
                            <p style={{ maxWidth: '250px', lineHeight: 1.5 }}>Search for contacts and start chatting to see them here.</p>
                        </div>
                    )}
                </div>

                {/* Action Menu Overlay */}
                {
                    selectedChat && (
                        <FloatingActionSheet isOpen={isActionSheetOpen} onClose={closeActionSheet}>
                            {!showDeleteConfirm ? (
                                <>
                                    <div className="action-header">
                                        <Avatar src={selectedChat.avatar} name={selectedChat.name} size={44} />
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ margin: 0, fontWeight: 800 }}>{selectedChat.name}</h4>
                                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>@{selectedChat.username}</p>
                                        </div>
                                    </div>
                                    <div className="action-body">
                                        <div className="action-item" onClick={togglePin}>
                                            <div className="action-icon-wrapper">
                                                {selectedChat.pinned ? <PinOff size={20} color="var(--text-secondary)" /> : <Pin size={20} />}
                                            </div>
                                            <span>{selectedChat.pinned ? "Unpin chat" : "Pin chat"}</span>
                                        </div>
                                        <div className="action-item" onClick={toggleMute}>
                                            <div className="action-icon-wrapper">
                                                {selectedChat.muted ? <Bell size={20} color="var(--text-secondary)" /> : <BellOff size={20} />}
                                            </div>
                                            <span>{selectedChat.muted ? "Unmute notifications" : "Mute notifications"}</span>
                                        </div>
                                        <div className="action-item delete" onClick={triggerDelete}>
                                            <div className="action-icon-wrapper"><Trash2 size={20} /></div>
                                            <span>Delete conversation</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="action-body">
                                    <div style={{ textAlign: 'center', padding: '10px 0 24px' }}>
                                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                            <Trash2 size={28} />
                                        </div>
                                        <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800 }}>Delete Chat?</h3>
                                        <p style={{ margin: 0, fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                            This will permanently delete your chat history with <b>@{selectedChat.username}</b>.
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--secondary-color)', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', cursor: 'pointer' }} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                                        <button style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: '#ef4444', fontWeight: 700, fontSize: '15px', color: 'white', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }} onClick={handleConfirmDelete}>Delete</button>
                                    </div>
                                </div>
                            )}
                        </FloatingActionSheet>
                    )
                }
            </div> {/* End max-w-content */}

            <style>{`
                .home-search-container {
                    padding: 12px 16px;
                    background: var(--surface-color);
                    position: sticky;
                    top: 64px;
                    z-index: 100;
                    border-bottom: 1px solid var(--border-color);
                }
                .home-search-input {
                    width: 100%;
                    padding: 12px 16px 12px 42px;
                    border-radius: 16px;
                    background: var(--secondary-color);
                    border: 1.5px solid transparent;
                    font-size: 15px;
                    transition: all 0.2s;
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
                }
                .home-search-input:focus {
                    background: var(--surface-color);
                    border-color: var(--primary-color);
                    box-shadow: 0 4px 12px var(--primary-light);
                    outline: none;
                }
                .search-icon-absolute {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-secondary);
                    opacity: 0.6;
                    pointer-events: none;
                }
                .chat-item:active {
                    background-color: var(--secondary-color) !important;
                    transform: scale(0.99);
                }
                .unread-badge {
                    animation: badgePulse 2s infinite;
                    box-shadow: 0 0 0 0 var(--primary-light);
                }
                @keyframes badgePulse {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 var(--primary-light); }
                    70% { transform: scale(1.1); box-shadow: 0 0 0 8px transparent; }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 transparent; }
                }
                .action-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid var(--border-color);
                    margin-bottom: 8px;
                }
                .action-icon-wrapper {
                    width: 36px;
                    height: 36px;
                    border-radius: 12px;
                    background: var(--secondary-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-primary);
                }
                .home-status-ticks .tick-sent,
                .home-status-ticks .tick-delivered {
                    color: var(--text-secondary);
                    opacity: 1;
                }
                .home-status-ticks .tick-blue {
                    color: var(--tick-read);
                    opacity: 1;
                }
                .action-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 0;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-weight: 500;
                    font-size: 14.5px;
                }
                .action-item:active {
                    transform: translateX(8px);
                    color: var(--primary-color);
                }
                .action-item.delete {
                    color: #ef4444;
                }
                .action-item.delete .action-icon-wrapper {
                    background: #fef2f2;
                    color: #ef4444;
                }
            `}</style>

            <BottomNav activeTab="chats" />
        </div>
    );
};

export default Home;
