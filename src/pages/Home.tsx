import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, MessageSquare, Image as ImageIcon, Video, Pin, BellOff, Trash2, X } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { insforge } from '../lib/insforge';
import { useCurrentUserId } from '../hooks/useCurrentUser';
import Avatar from '../components/Avatar';
import LoadingOverlay from '../components/LoadingOverlay';
import { useData } from '../context/DataContext';
// Note: global realtime for contact list is handled centrally in DataContext

const Home = () => {
    const navigate = useNavigate();
    console.log("[Home] Rendering component...");
    const userId = useCurrentUserId();
    const {
        contacts, setContacts,
        profileData, refreshContacts, initialized
    } = useData();


    const [searchQuery, setSearchQuery] = useState('');
    const [selectedChat, setSelectedChat] = useState<any>(null);
    const [loading, setLoading] = useState(!initialized);
    const [actionLoading, setActionLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const longPressTimer = useRef<any>(null);
    const isLongPress = useRef(false);

    // Sync loading state with initialization
    useEffect(() => {
        if (initialized) {
            setLoading(false);
        }
    }, [initialized]);

    const handleStartLongPress = (chat: any) => {
        isLongPress.current = false;
        longPressTimer.current = setTimeout(() => {
            isLongPress.current = true;
            setSelectedChat(chat);
        }, 800);
    };

    const handleEndLongPress = () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };

    const togglePin = async () => {
        if (!selectedChat || !userId) return;
        const newPinned = !selectedChat.pinned;
        setActionLoading(true);
        setLoadingMessage(newPinned ? 'Pinning...' : 'Unpinning...');
        try {
            await insforge.database
                .from('contacts')
                .update({ pinned: newPinned })
                .eq('id', selectedChat.contactEntryId)
                .eq('user_id', userId);

            setContacts(prev => prev.map(c =>
                c.id === selectedChat.id ? { ...c, pinned: newPinned } : c
            ));
        } catch (err) {
            console.error('Pin error:', err);
        } finally {
            setActionLoading(false);
        }
        setSelectedChat(null);
    };

    const toggleMute = async () => {
        if (!selectedChat || !userId) return;
        const newMuted = !selectedChat.muted;
        setActionLoading(true);
        setLoadingMessage(newMuted ? 'Muting...' : 'Unmuting...');
        try {
            await insforge.database
                .from('contacts')
                .update({ muted: newMuted })
                .eq('id', selectedChat.contactEntryId)
                .eq('user_id', userId);

            setContacts(prev => prev.map(c =>
                c.id === selectedChat.id ? { ...c, muted: newMuted } : c
            ));
        } catch (err) {
            console.error('Mute error:', err);
        } finally {
            setActionLoading(false);
        }
        setSelectedChat(null);
    };

    const deleteChat = async () => {
        if (!selectedChat || !userId) return;
        if (window.confirm(`Remove @${selectedChat.username} from list?`)) {
            setActionLoading(true);
            setLoadingMessage('Removing...');
            try {
                await insforge.database
                    .from('contacts')
                    .delete()
                    .eq('id', selectedChat.contactEntryId)
                    .eq('user_id', userId);

                setContacts(prev => prev.filter(c => c.id !== selectedChat.id));
            } catch (err) {
                console.error('Delete error:', err);
            } finally {
                setActionLoading(false);
            }
            setSelectedChat(null);
        }
    };

    const getIcon = (preview: string) => {
        if (!preview) return null;
        if (preview.includes('📷')) return <ImageIcon size={14} className="message-status-icon" />;
        if (preview.includes('📹')) return <Video size={14} className="message-status-icon" />;
        return null;
    };

    const filteredContacts = contacts.filter(c =>
        c.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sorted = [
        ...filteredContacts.filter(c => c.pinned),
        ...filteredContacts.filter(c => !c.pinned),
    ];


    return (
        <div className="home-container">
            {actionLoading && <LoadingOverlay message={loadingMessage} transparent />}
            {/* Top Navigation */}
            <nav className="top-nav">
                <div className="top-nav-title">Masum Chat</div>
                <div className="top-nav-right">
                    <button className="nav-icon-btn" onClick={() => navigate('/search')}>
                        <SearchIcon size={24} />
                    </button>
                    <div className="user-avatar-container" onClick={() => navigate('/profile/me')} style={{ cursor: 'pointer' }}>
                        <Avatar
                            src={profileData?.avatar_url}
                            name={profileData?.name}
                            size={40}
                            className="user-avatar"
                            priority="high"
                        />
                    </div>
                </div>
            </nav>

            {/* Search Bar */}
            <div style={{ padding: '12px 16px', backgroundColor: 'var(--surface-color)', position: 'sticky', top: '72px', zIndex: 100 }}>
                <div style={{ position: 'relative' }}>
                    <input
                        type="search"
                        className="input-field"
                        placeholder="Search chats..."
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
                        spellCheck={false}
                    />
                    <SearchIcon size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.7 }} />
                </div>
            </div>

            {/* Chat List */}
            <div className="chat-list">
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '16px' }}>
                        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', animation: 'pulse 2s infinite' }}>Loading chats...</p>
                    </div>
                ) : sorted.length > 0 ? sorted.map(chat => (
                    <div
                        key={chat.id}
                        className="chat-item"
                        onClick={() => {
                            if (!isLongPress.current && !selectedChat) {
                                navigate(`/chat/${chat.username}`);
                            }
                        }}
                        onMouseDown={() => handleStartLongPress(chat)}
                        onMouseUp={handleEndLongPress}
                        onMouseLeave={handleEndLongPress}
                        onTouchStart={() => handleStartLongPress(chat)}
                        onTouchEnd={handleEndLongPress}
                        style={{ cursor: 'pointer', backgroundColor: selectedChat?.id === chat.id ? 'var(--secondary-color)' : 'transparent' }}
                    >
                        <Avatar src={chat.avatar} name={chat.name} size={48} className="chat-avatar" />
                        <div className="chat-info">
                            <div className="chat-row">
                                <span className="chat-name" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {chat.pinned && <Pin size={12} className="pin-icon" />}
                                    {chat.name}
                                </span>
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, marginLeft: '4px' }}>
                                    @{chat.username}
                                </span>
                                <span className="chat-time" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {chat.muted && <BellOff size={12} className="mute-icon" />}
                                    {chat.time}
                                </span>
                            </div>
                            <div className="chat-row">
                                <div className="chat-preview">
                                    {getIcon(chat.preview || '')}
                                    <span style={{ color: chat.unread > 0 ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: chat.unread > 0 ? 600 : 400 }}>
                                        {chat.preview}
                                    </span>
                                </div>
                                {chat.unread > 0 && (
                                    <div className="unread-badge">{chat.unread}</div>
                                )}
                            </div>
                        </div>
                    </div>
                )) : searchQuery ? (
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
            {selectedChat && (
                <div className="home-action-overlay" onClick={() => setSelectedChat(null)}>
                    <div className="home-action-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="action-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4>@{selectedChat.username}</h4>
                            <button className="nav-icon-btn" onClick={() => setSelectedChat(null)}><X size={24} /></button>
                        </div>
                        <div className="action-item" onClick={togglePin}>
                            <Pin size={20} /> {selectedChat.pinned ? "Unpin chat" : "Pin chat"}
                        </div>
                        <div className="action-item" onClick={toggleMute}>
                            <BellOff size={20} /> {selectedChat.muted ? "Unmute chat" : "Mute chat"}
                        </div>
                        <div className="action-item delete" onClick={deleteChat}>
                            <Trash2 size={20} /> Delete chat
                        </div>
                    </div>
                </div>
            )}

            <BottomNav activeTab="chats" />
        </div>
    );
};

export default Home;
