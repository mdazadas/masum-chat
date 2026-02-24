import { useState, useEffect } from 'react';
import { Search as SearchIcon, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { insforge } from '../lib/insforge';
import { useCurrentUserId } from '../hooks/useCurrentUser';
import Avatar from '../components/Avatar';

const Search = () => {
    const navigate = useNavigate();
    const currentUserId = useCurrentUserId();
    const { showToast } = useToast();
    const [query, setQuery] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            if (!currentUserId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                let queryBuilder = insforge.database
                    .from('profiles')
                    .select('*')
                    .neq('id', currentUserId);

                if (query.trim()) {
                    queryBuilder = queryBuilder.or(`name.ilike.%${query}%,username.ilike.%${query}%`);
                }

                const { data, error } = await queryBuilder.limit(20);

                if (error) throw error;
                setUsers(data || []);
            } catch (err) {
                console.error("Search error:", err);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchUsers, 300);
        return () => clearTimeout(timeoutId);
    }, [query, currentUserId]);

    const startChat = (user: any) => {
        showToast(`Opening chat with ${user.name}`, 'info');
        navigate(`/chat/${user.username}`);
    };

    return (
        <div className="home-container" style={{ backgroundColor: 'var(--surface-color)' }}>
            {/* Search Header */}
            <nav className="top-nav" style={{ height: '72px', backgroundColor: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                    <button className="nav-icon-btn" onClick={() => navigate('/home')}>
                        <ArrowLeft size={24} />
                    </button>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <input
                            type="search"
                            className="input-field"
                            placeholder="Search name or @username..."
                            style={{ padding: '10px 16px 10px 40px', borderRadius: '50px', marginBottom: 0, backgroundColor: 'var(--secondary-color)', border: 'none' }}
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            inputMode="search"
                        />
                        <SearchIcon
                            size={18}
                            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
                        />
                    </div>
                </div>
            </nav>

            {/* User List */}
            <div className="chat-list" style={{ paddingTop: '72px', background: 'var(--surface-color)' }}>
                <p style={{
                    padding: '16px 20px',
                    fontSize: '12px',
                    fontWeight: 800,
                    color: 'var(--primary-color)',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    opacity: 0.8
                }}>
                    {query.trim() ? `Search Results (${users.length})` : "Find People"}
                </p>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
                        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3, marginBottom: 12 }} />
                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', animation: 'pulse 2s infinite' }}>Searching...</p>
                    </div>
                ) : users.length > 0 ? (
                    users.map(profile => (
                        <div
                            key={profile.id}
                            className="search-result-item"
                            onClick={() => startChat(profile)}
                            style={{
                                borderBottom: 'none',
                                padding: '12px 20px',
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <Avatar
                                src={profile.avatar_url}
                                name={profile.name}
                                size={50}
                                className="search-result-avatar"
                            />
                            <div className="chat-info" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginLeft: '12px', flex: 1 }}>
                                <div className="chat-row">
                                    <span className="chat-name" style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)' }}>{profile.name}</span>
                                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, marginLeft: '6px' }}>
                                        @{profile.username}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : query.trim() ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <p style={{ fontSize: '16px', fontWeight: 500 }}>No users found for "{query}"</p>
                        <p style={{ fontSize: '14px', marginTop: '8px' }}>Try searching with a different name or @username</p>
                    </div>
                ) : (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <p style={{ fontSize: '16px', fontWeight: 500 }}>Start typing to find people</p>
                        <p style={{ fontSize: '14px', marginTop: '8px' }}>Search by name or @username</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Search;
