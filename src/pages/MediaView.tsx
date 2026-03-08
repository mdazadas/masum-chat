import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Headset, Image as ImageIcon, Video, Music, Maximize2, X } from 'lucide-react';
import { insforge } from '../lib/insforge';
import { useCurrentUserId } from '../hooks/useCurrentUser';

const MediaView = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const userId = useCurrentUserId();

    const [activeTab, setActiveTab] = useState<'media' | 'audio' | 'links'>('media');
    const [mediaItems, setMediaItems] = useState<any[]>([]);
    const [audioItems, setAudioItems] = useState<any[]>([]);
    const [links, setLinks] = useState<any[]>([]);
    const [receiverName, setReceiverName] = useState(username);
    const [loading, setLoading] = useState(true);
    const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
    const [playingId, setPlayingId] = useState<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (!userId || !username) return;
        const fetchMedia = async () => {
            setLoading(true);
            try {
                // Find receiver profile by username (more robust)
                const { data: receiver, error: profileErr } = await insforge.database
                    .from('profiles')
                    .select()
                    .eq('username', username)
                    .maybeSingle();

                // Fallback to name search if username fails (for backward compatibility)
                let targetReceiver = receiver;
                if (!targetReceiver) {
                    const nameFilter = username.split('.').join(' ');
                    const { data: fallback } = await insforge.database
                        .from('profiles')
                        .select()
                        .ilike('name', `%${nameFilter}%`)
                        .maybeSingle();
                    targetReceiver = fallback;
                }

                if (profileErr || !targetReceiver) {
                    setLoading(false);
                    return;
                }

                setReceiverName(targetReceiver.name);

                const { data, error: msgErr } = await insforge.database
                    .from('messages')
                    .select()
                    .or(`and(sender_id.eq.${userId},receiver_id.eq.${targetReceiver.id}),and(sender_id.eq.${targetReceiver.id},receiver_id.eq.${userId})`)
                    .order('created_at', { ascending: false });

                if (msgErr) throw msgErr;

                if (data) {
                    const mItems: any[] = [];
                    const aItems: any[] = [];
                    const lItems: any[] = [];
                    const urlRegex = /(https?:\/\/[^\s]+)/g;

                    data.forEach((m: any) => {
                        // Media (Images/Videos)
                        if (m.image_url) {
                            mItems.push({ id: m.id, url: m.image_url, type: 'image', caption: m.text, date: new Date(m.created_at).toLocaleDateString() });
                        }
                        if (m.video_url) {
                            mItems.push({ id: m.id, url: m.video_url, type: 'video', caption: m.text, date: new Date(m.created_at).toLocaleDateString() });
                        }

                        // Audio
                        if (m.audio_url) {
                            aItems.push({ id: m.id, url: m.audio_url, name: 'Voice Message', date: new Date(m.created_at).toLocaleDateString(), duration: '0:12' });
                        }

                        // Links
                        if (m.text) {
                            const foundLinks = m.text.match(urlRegex);
                            if (foundLinks) {
                                foundLinks.forEach((link: string) => {
                                    try {
                                        const domain = new URL(link).hostname;
                                        lItems.push({ id: m.id, url: link, domain, date: new Date(m.created_at).toLocaleDateString() });
                                    } catch (e) {
                                        lItems.push({ id: m.id, url: link, domain: 'link', date: new Date(m.created_at).toLocaleDateString() });
                                    }
                                });
                            }
                        }
                    });

                    setMediaItems(mItems);
                    setAudioItems(aItems);
                    setLinks(lItems);
                }
            } catch (err) {
                console.error('Fetch media error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchMedia();
    }, [userId, username]);

    const handlePlayAudio = (item: any) => {
        if (playingId === item.id) {
            audioRef.current?.pause();
            setPlayingId(null);
        } else {
            if (audioRef.current) {
                audioRef.current.src = item.url;
                audioRef.current.play();
                setPlayingId(item.id);
            }
        }
    };

    return (
        <div className="media-view-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--surface-color)' }}>
            {/* Header */}
            <div className="media-nav" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border-color)' }}>
                <button className="nav-icon-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{receiverName}</h3>
            </div>

            {/* Tabs */}
            <div className="media-tabs-wrapper">
                <div className="media-tabs-glass">
                    {[
                        { id: 'media', label: 'Photos & Videos', icon: <ImageIcon size={16} /> },
                        { id: 'audio', label: 'Audio', icon: <Music size={16} /> },
                        { id: 'links', label: 'Links', icon: <Video size={16} /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`media-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="media-content" style={{ flex: 1, overflowY: 'auto' }}>
                <audio ref={audioRef} onEnded={() => setPlayingId(null)} style={{ display: 'none' }} />

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '16px' }}>
                        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', animation: 'pulse 2s infinite' }}>Loading records...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'media' && (
                            <div className="media-photo-grid">
                                {mediaItems.length > 0 ? mediaItems.map((item, i) => (
                                    <div
                                        key={i}
                                        className="photo-grid-item"
                                        onClick={() => setSelectedPreview(item.url)}
                                    >
                                        {item.type === 'video' ? (
                                            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                                <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <div className="video-tag"><Play size={14} fill="white" /></div>
                                            </div>
                                        ) : (
                                            <img src={item.url} alt="media" />
                                        )}
                                        <div className="photo-overlay">
                                            <Maximize2 size={16} color="white" />
                                        </div>
                                    </div>
                                )) : (
                                    <div className="empty-media-state">
                                        <div className="empty-icon-wrapper"><ImageIcon size={48} /></div>
                                        <p>No photos or videos shared yet</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'audio' && (
                            <div className="media-list-container">
                                <span className="list-section-title">Voice Messages & Audio</span>
                                {audioItems.length > 0 ? audioItems.map((a, i) => (
                                    <div key={i} className={`media-list-item audio ${playingId === a.id ? 'playing' : ''}`} onClick={() => handlePlayAudio(a)}>
                                        <div className="list-icon-wrapper">
                                            {playingId === a.id ? <div className="audio-bars"><span></span><span></span><span></span></div> : <Headset size={20} />}
                                        </div>
                                        <div className="list-info">
                                            <div className="list-name">{a.name}</div>
                                            <div className="list-meta">{a.duration} • {a.date}</div>
                                        </div>
                                        <div className="audio-play-btn">
                                            {playingId === a.id ? <X size={18} /> : <Play size={18} fill="currentColor" />}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="empty-media-state">
                                        <div className="empty-icon-wrapper"><Music size={48} /></div>
                                        <p>No audio shared yet</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'links' && (
                            <div className="media-list-container">
                                <span className="list-section-title">Shared Links</span>
                                {links.length > 0 ? links.map((l, i) => (
                                    <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="media-list-item link" style={{ textDecoration: 'none' }}>
                                        <div className="list-icon-wrapper">
                                            <ImageIcon size={20} />
                                        </div>
                                        <div className="list-info">
                                            <div className="list-name" style={{ color: 'var(--primary-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{l.url}</div>
                                            <div className="list-meta">{l.domain} • {l.date}</div>
                                        </div>
                                    </a>
                                )) : (
                                    <div className="empty-media-state">
                                        <div className="empty-icon-wrapper"><Maximize2 size={48} /></div>
                                        <p>No links found in messages</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
            {/* Preview Modal */}
            {selectedPreview && (
                <div className="media-preview-modal" onClick={() => setSelectedPreview(null)}>
                    <button className="modal-close" onClick={() => setSelectedPreview(null)}><X size={28} /></button>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        {selectedPreview.includes('.mp4') || selectedPreview.includes('video') ? (
                            <video src={selectedPreview} controls autoPlay className="full-preview" />
                        ) : (
                            <img src={selectedPreview} alt="Fullscreen" className="full-preview" />
                        )}
                    </div>
                </div>
            )}

            <style>{`
                .media-photo-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1px;
                }
                .video-tag {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: rgba(0,0,0,0.5);
                    width: 24px;
                    height: 24px;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .media-list-item.audio.playing {
                    border-color: var(--primary-color);
                    background: var(--primary-light);
                }
                .audio-bars {
                    display: flex;
                    align-items: flex-end;
                    gap: 2px;
                    height: 12px;
                }
                .audio-bars span {
                    width: 3px;
                    background: var(--primary-color);
                    animation: barGrow 0.8s infinite ease-in-out;
                }
                .audio-bars span:nth-child(2) { animation-delay: 0.2s; }
                .audio-bars span:nth-child(3) { animation-delay: 0.4s; }
                @keyframes barGrow {
                    0%, 100% { height: 4px; }
                    50% { height: 12px; }
                }
                .media-tabs-wrapper {
                    padding: 8px 16px;
                    background: var(--surface-color);
                    border-bottom: 1px solid var(--border-color);
                }
                .media-tabs-glass {
                    display: flex;
                    background: var(--secondary-color);
                    padding: 4px;
                    border-radius: 12px;
                    gap: 4px;
                }
                .media-tab-btn {
                    flex: 1;
                    padding: 8px 4px;
                    border: none;
                    background: transparent;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-secondary);
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                }
                .media-tab-btn.active {
                    background: var(--surface-color);
                    color: var(--primary-color);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                }
                .media-photo-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 2px;
                }
                .photo-grid-item {
                    aspect-ratio: 1;
                    position: relative;
                    overflow: hidden;
                    cursor: pointer;
                }
                .photo-grid-item img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.3s ease;
                }
                .photo-grid-item:hover img {
                    transform: scale(1.05);
                }
                .photo-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,0,0,0.1);
                    display: flex;
                    align-items: flex-end;
                    justify-content: flex-end;
                    padding: 6px;
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                .photo-grid-item:hover .photo-overlay {
                    opacity: 1;
                }
                .media-list-container {
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .list-section-title {
                    font-size: 12px;
                    font-weight: 800;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 4px;
                }
                .media-list-item {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 12px;
                    background: var(--surface-color);
                    border: 1px solid var(--border-color);
                    border-radius: 16px;
                    transition: all 0.2s;
                }
                .media-list-item:active {
                    transform: scale(0.98);
                    background: var(--secondary-color);
                }
                .list-icon-wrapper {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    background: var(--secondary-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--primary-color);
                }
                .video .list-icon-wrapper { color: #3b82f6; background: #eff6ff; }
                .audio .list-icon-wrapper { color: #f43f5e; background: #fff1f2; }
                .list-info { flex: 1; }
                .list-name { font-weight: 700; font-size: 14px; color: var(--text-primary); margin-bottom: 2px; }
                .list-meta { font-size: 12px; color: var(--text-secondary); }
                .list-action-btn {
                    padding: 8px;
                    border: none;
                    background: transparent;
                    color: var(--text-secondary);
                    cursor: pointer;
                }
                .empty-media-state {
                    padding: 80px 40px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    color: var(--text-secondary);
                    text-align: center;
                    gap: 16px;
                }
                .empty-icon-wrapper {
                    width: 80px;
                    height: 80px;
                    border-radius: 40px;
                    background: var(--secondary-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0.5;
                }
                .media-preview-modal {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.9);
                    backdrop-filter: blur(10px);
                    z-index: 5000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: fadeIn 0.3s ease;
                }
                .modal-close {
                    position: absolute;
                    top: 40px;
                    right: 20px;
                    color: white;
                    background: none;
                    border: none;
                    cursor: pointer;
                    z-index: 5001;
                }
                .full-preview {
                    max-width: 100vw;
                    max-height: 80vh;
                    object-fit: contain;
                    border-radius: 12px;
                    animation: zoomIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes zoomIn { from { transform: scale(0.9) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
};

export default MediaView;
