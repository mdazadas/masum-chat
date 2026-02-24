import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Headset } from 'lucide-react';
import { insforge } from '../lib/insforge';
import { useCurrentUserId } from '../hooks/useCurrentUser';

const MediaView = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const userId = useCurrentUserId();

    const [activeTab, setActiveTab] = useState<'media' | 'docs' | 'links'>('media');
    const [photos, setPhotos] = useState<string[]>([]);
    const [videos, setVideos] = useState<any[]>([]);
    const [audio, setAudio] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId || !username) return;
        const fetchMedia = async () => {
            setLoading(true);
            try {
                // Find receiver profile first
                const { data: profiles } = await insforge.database
                    .from('profiles')
                    .select('id')
                    .ilike('name', `%${username.replace('.', ' ')}%`);
                const receiver = profiles?.[0];
                if (!receiver) {
                    setLoading(false);
                    return;
                }

                const { data } = await insforge.database
                    .from('messages')
                    .select('image_url, video_url, audio_url, created_at')
                    .or(`and(sender_id.eq.${userId},receiver_id.eq.${receiver.id}),and(sender_id.eq.${receiver.id},receiver_id.eq.${userId})`)
                    .order('created_at', { ascending: false });

                if (data) {
                    const p: string[] = [];
                    const v: any[] = [];
                    const a: any[] = [];

                    data.forEach((m: any) => {
                        if (m.image_url) p.push(m.image_url);
                        if (m.video_url) v.push({ url: m.video_url, name: `Video_${new Date(m.created_at).getTime()}.mp4`, date: new Date(m.created_at).toLocaleDateString() });
                        if (m.audio_url) a.push({ url: m.audio_url, name: `Audio_${new Date(m.created_at).getTime()}.mp3`, duration: '0:00' });
                    });

                    setPhotos(p);
                    setVideos(v);
                    setAudio(a);
                }
            } catch (err) {
                console.error('Fetch media error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchMedia();
    }, [userId, username]);

    return (
        <div className="media-view-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--surface-color)' }}>
            {/* Header */}
            <div className="media-nav" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border-color)' }}>
                <button className="nav-icon-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{username}</h3>
            </div>

            {/* Tabs */}
            <div className="media-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
                <button
                    onClick={() => setActiveTab('media')}
                    style={{
                        flex: 1,
                        padding: '14px',
                        border: 'none',
                        background: 'none',
                        color: activeTab === 'media' ? 'var(--primary-color)' : 'var(--text-secondary)',
                        borderBottom: activeTab === 'media' ? '3px solid var(--primary-color)' : 'none',
                        fontWeight: 600
                    }}
                >
                    Photos
                </button>
                <button
                    onClick={() => setActiveTab('docs')}
                    style={{
                        flex: 1,
                        padding: '14px',
                        border: 'none',
                        background: 'none',
                        color: activeTab === 'docs' ? 'var(--primary-color)' : 'var(--text-secondary)',
                        borderBottom: activeTab === 'docs' ? '3px solid var(--primary-color)' : 'none',
                        fontWeight: 600
                    }}
                >
                    Videos
                </button>
                <button
                    onClick={() => setActiveTab('links')}
                    style={{
                        flex: 1,
                        padding: '14px',
                        border: 'none',
                        background: 'none',
                        color: activeTab === 'links' ? 'var(--primary-color)' : 'var(--text-secondary)',
                        borderBottom: activeTab === 'links' ? '3px solid var(--primary-color)' : 'none',
                        fontWeight: 600
                    }}
                >
                    Audio
                </button>
            </div>

            {/* Content Area */}
            <div className="media-content" style={{ flex: 1, overflowY: 'auto', padding: activeTab === 'media' ? '2px' : '20px' }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '16px' }}>
                        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', animation: 'pulse 2s infinite' }}>Loading media...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'media' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
                                {photos.length > 0 ? photos.map((src, i) => (
                                    <div key={i} style={{ aspectRatio: '1/1', background: 'var(--secondary-color)' }}>
                                        <img src={src} alt="media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                )) : (
                                    <div style={{ gridColumn: 'span 3', padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No photos shared</div>
                                )}
                            </div>
                        )}

                        {activeTab === 'docs' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase' }}>Recent Videos</span>
                                {videos.length > 0 ? videos.map((v, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'var(--secondary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                                            <Play size={24} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600 }}>{v.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{v.date}</div>
                                        </div>
                                    </div>
                                )) : (
                                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No videos shared</div>
                                )}
                            </div>
                        )}

                        {activeTab === 'links' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase' }}>Shared Audio</span>
                                {audio.length > 0 ? audio.map((a, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'var(--secondary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff4b5c' }}>
                                            <Headset size={24} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600 }}>{a.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{a.duration}</div>
                                        </div>
                                    </div>
                                )) : (
                                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No audio shared</div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default MediaView;
