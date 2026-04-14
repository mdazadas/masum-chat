import { useState, useEffect } from 'react';
import { Search as SearchIcon, ArrowLeft, SearchX, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { insforge } from '../lib/insforge';
import { useCurrentUserId } from '../hooks/useCurrentUser';
import Avatar from '../components/Avatar';
import { useData } from '../context/DataContext';

const Search = () => {
    const navigate = useNavigate();
    const currentUserId = useCurrentUserId();
    const { showToast } = useToast();
    const { contacts } = useData();
    const [query, setQuery] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!query.trim()) {
            // When search is empty, show recent chats only — no DB call needed
            setUsers([]);
            return;
        }

        const fetchUsers = async () => {
            if (!currentUserId) return;
            setLoading(true);
            try {
                const { data, error } = await insforge.database
                    .from('profiles')
                    .select('id, name, username, avatar_url')
                    .neq('id', currentUserId)
                    .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
                    .limit(20);

                if (error) throw error;
                setUsers(data || []);
            } catch (err) {
                console.error('Search error:', err);
                showToast('Failed to fetch search results', 'error');
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchUsers, 400); // Debounce
        return () => clearTimeout(timeoutId);
    }, [query, currentUserId]);

    const viewProfile = (user: any) => {
        navigate(`/profile/${user.username}`, { state: { profile: user } });
    };

    return (
        <div className="profile-container">
            <style>{`
                .search-header {
                    padding: 12px 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .search-input-wrapper {
                    position: relative;
                    flex: 1;
                }
                .premium-search-input {
                    width: 100%;
                    padding: 12px 16px 12px 42px;
                    border-radius: 16px;
                    border: 1px solid var(--border-color);
                    background: var(--input-bg);
                    color: var(--text-primary);
                    font-size: 15px;
                    font-weight: 500;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    outline: none;
                }
                .premium-search-input:focus {
                    background: var(--surface-color);
                    border-color: var(--primary-color);
                    box-shadow: 0 4px 12px var(--primary-glow, rgba(0, 168, 132, 0.1));
                }
                .search-icon-fixed {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-secondary);
                    transition: color 0.3s;
                }
                .premium-search-input:focus + .search-icon-fixed {
                    color: var(--primary-color);
                }

                .search-results-label {
                    padding: 24px 20px 12px;
                    font-size: 13px;
                    font-weight: 800;
                    color: var(--primary-color);
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                    opacity: 0.8;
                }

                .search-card {
                    background: var(--surface-color);
                    border-radius: 20px;
                    border: 1px solid var(--border-color);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.02);
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    padding: 16px;
                    gap: 16px;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                    animation: slideUp 0.4s ease-out forwards;
                }
                .search-card:active { transform: scale(0.98); }

                .search-user-info {
                    flex: 1;
                    min-width: 0;
                }
                .search-user-name {
                    font-weight: 700;
                    color: var(--text-primary);
                    font-size: 16px;
                    display: block;
                }
                .search-user-handle {
                    font-size: 13px;
                    color: var(--primary-color);
                    font-weight: 600;
                }

                .profile-action-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: var(--primary-light);
                    color: var(--primary-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    transition: transform 0.2s, background 0.2s;
                }
                .search-card:hover .profile-action-icon {
                    background: var(--primary-color);
                    color: white;
                    transform: translateX(2px);
                }

                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 80px 40px;
                    text-align: center;
                }
                .empty-icon-box {
                    width: 72px;
                    height: 72px;
                    border-radius: 24px;
                    background: var(--secondary-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--primary-color);
                    margin-bottom: 20px;
                }
                .empty-state h2 {
                    font-size: 19px;
                    font-weight: 800;
                    color: var(--text-primary);
                    margin-bottom: 8px;
                }
                .empty-state p {
                    font-size: 14px;
                    color: var(--text-secondary);
                    font-weight: 500;
                    line-height: 1.5;
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .loader-container {
                    padding: 60px 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                }
                .profile-content {
                    flex: 1;
                    overflow-y: auto;
                    padding-bottom: 80px;
                }
                .recent-container {
                    padding: 4px 0 24px;
                }
                .recent-scroll {
                    display: flex;
                    gap: 16px;
                    overflow-x: auto;
                    padding: 0 20px 8px;
                    scrollbar-width: none;
                }
                .recent-scroll::-webkit-scrollbar { display: none; }
                
                .recent-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    min-width: 70px;
                    transition: transform 0.2s;
                    animation: fadeInScale 0.4s ease-out forwards;
                }
                .recent-item:active { transform: scale(0.9); }
                .recent-name {
                    font-size: 11px;
                    font-weight: 700;
                    color: var(--text-primary);
                    max-width: 64px;
                    text-align: center;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    opacity: 0.9;
                }
                
                @keyframes fadeInScale {
                    from { opacity: 0; transform: scale(0.8); }
                    to { opacity: 1; transform: scale(1); }
                }

                .recent-badge {
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: var(--surface-color);
                    padding: 2px;
                }
                .recent-online-inner {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: var(--primary-color);
                }
            `}</style>

            <div className="screen-header">
                <div className="max-w-content" style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '12px', padding: '0 8px' }}>
                    <button className="nav-icon-btn ripple" onClick={() => navigate('/home')}>
                        <ArrowLeft size={24} />
                    </button>
                    <div className="search-input-wrapper" style={{ flex: 1 }}>
                        <input
                            type="search"
                            className="premium-search-input"
                            placeholder="Search name or @username..."
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            inputMode="search"
                        />
                        <SearchIcon size={18} className="search-icon-fixed" />
                    </div>
                </div>
            </div>

            <div className="profile-content">
                {/* Recent Section (Only shown when not searching) */}
                {!query.trim() && contacts.length > 0 && (
                    <div className="recent-container">
                        <div className="search-results-label" style={{ paddingBottom: '16px' }}>
                            Recent Chats
                        </div>
                        <div className="recent-scroll">
                            {contacts.slice(0, 10).map((contact, index) => (
                                <div
                                    key={contact.contact_id}
                                    className="recent-item"
                                    onClick={() => navigate(`/chat/${contact.username}`, { state: { profile: contact } })}
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    <div style={{ position: 'relative' }}>
                                        <Avatar
                                            src={contact.avatar_url}
                                            name={contact.name || contact.username}
                                            size={56}
                                        />
                                        {/* You can add online status here if available */}
                                    </div>
                                    <span className="recent-name">{contact.name || contact.username}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="search-results-label">
                    {query.trim() ? `Found ${users.length} People` : "Discover People"}
                </div>

                {loading ? (
                    <div style={{ padding: '0 20px' }}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="skeleton-chat-item" style={{ border: '1px solid var(--border-color)', borderRadius: '20px', marginBottom: '12px', padding: '16px' }}>
                                <div className="skeleton-avatar skeleton-shimmer" />
                                <div className="skeleton-text-row">
                                    <div className="skeleton-line short skeleton-shimmer" />
                                    <div className="skeleton-line medium skeleton-shimmer" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : users.length > 0 ? (
                    <div style={{ padding: '0 20px' }}>
                        {users.map((profile, index) => (
                            <div
                                key={profile.id}
                                className="search-card"
                                onClick={() => viewProfile(profile)}
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <Avatar
                                    src={profile.avatar_url}
                                    name={profile.name}
                                    size={48}
                                />
                                <div className="search-user-info">
                                    <span className="search-user-name">{profile.name}</span>
                                    <span className="search-user-handle">@{profile.username}</span>
                                </div>
                                <div className="profile-action-icon">
                                    <ChevronRight size={20} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : query.trim() ? (
                    <div className="empty-state">
                        <div className="empty-icon-box">
                            <SearchX size={32} />
                        </div>
                        <h2>No Users Found</h2>
                        <p>We couldn't find anyone matching "{query}". Try checking the spelling or use a different handle.</p>
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon-box">
                            <Users size={32} />
                        </div>
                        <h2>Find Your Friends</h2>
                        <p>Search for people by their name or unique @username to start chatting instantly.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const ChevronRight = ({ size }: { size: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="m9 18 6-6-6-6" />
    </svg>
);

export default Search;
