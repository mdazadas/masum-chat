import { useNavigate } from 'react-router-dom';
// Force Vite HMR Refresh
import { ArrowLeft, Github, Globe, Shield, FileText, ExternalLink, Heart, MessageCircle } from 'lucide-react';

const About = () => {
    const navigate = useNavigate();

    return (
        <div className="home-container" style={{ backgroundColor: 'var(--surface-color)' }}>
            {/* Header */}
            <nav className="top-nav">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="nav-icon-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={24} />
                    </button>
                    <div className="top-nav-title">About Masum Chat</div>
                </div>
            </nav>

            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '40px' }}>
                {/* Brand Hero Section */}
                <div style={{
                    padding: '50px 20px',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}>
                    {/* Decorative Elements */}
                    <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', filter: 'blur(20px)' }}></div>
                    <div style={{ position: 'absolute', bottom: '-15%', left: '-8%', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', filter: 'blur(30px)' }}></div>

                    {/* Logo Icon */}
                    <div style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '20px',
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        backdropFilter: 'blur(10px)',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px auto',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                        position: 'relative',
                        zIndex: 1
                    }}>
                        <MessageCircle size={40} color="white" fill="white" style={{ opacity: 0.95 }} />
                    </div>

                    <h1 style={{
                        fontSize: '28px',
                        fontWeight: 800,
                        margin: '0',
                        letterSpacing: '-0.5px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        zIndex: 1,
                        position: 'relative'
                    }}>
                        Masum Chat
                    </h1>
                    <div style={{
                        marginTop: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        opacity: 0.85,
                        letterSpacing: '0.8px',
                        textTransform: 'uppercase',
                        zIndex: 1,
                        position: 'relative',
                        backgroundColor: 'rgba(0,0,0,0.15)',
                        padding: '4px 12px',
                        borderRadius: '20px'
                    }}>
                        v2.0.0 Stable
                    </div>
                </div>

                {/* Developer Section */}
                <div style={{ padding: '30px 20px 10px 20px' }}>
                    <div style={{
                        backgroundColor: 'var(--surface-color)',
                        border: '1.5px solid var(--border-color)',
                        borderRadius: '20px',
                        padding: '24px',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                            DEVELOPER
                        </div>
                        <div style={{ position: 'relative', width: '80px', height: '80px', marginBottom: '16px' }}>
                            <img
                                src="/md_azad_final.png"
                                alt="MD Azad"
                                style={{ width: '100%', height: '100%', borderRadius: '50%', border: '3px solid var(--primary-light)', padding: '2px', objectFit: 'cover' }}
                            />
                        </div>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>MD Azad</h2>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>CEO & Lead Engineer at Masum Chats</p>

                        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                            <button
                                onClick={() => window.open('https://github.com/mdazadas', '_blank')}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    background: 'var(--secondary-color)',
                                    border: 'none',
                                    color: 'var(--text-primary)',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Github size={18} /> GitHub
                            </button>
                            <button
                                onClick={() => window.open('https://mdazad.netlify.app/', '_blank')}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    background: 'var(--secondary-color)',
                                    border: 'none',
                                    color: 'var(--text-primary)',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Globe size={18} /> Website
                            </button>
                        </div>
                    </div>
                </div>

                {/* Legal & Versioning */}
                <div style={{ padding: '20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', paddingLeft: '4px' }}>
                        Legal
                    </div>
                    <div style={{
                        backgroundColor: 'var(--surface-color)',
                        border: '1.5px solid var(--border-color)',
                        borderRadius: '16px',
                        overflow: 'hidden'
                    }}>
                        <div
                            onClick={() => navigate('/privacy')}
                            style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                        >
                            <Shield size={20} color="var(--primary-color)" />
                            <span style={{ flex: 1, color: 'var(--text-primary)', fontWeight: 500 }}>Privacy Policy</span>
                            <ExternalLink size={16} color="var(--text-secondary)" />
                        </div>
                        <div
                            onClick={() => navigate('/terms')}
                            style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
                        >
                            <FileText size={20} color="var(--primary-color)" />
                            <span style={{ flex: 1, color: 'var(--text-primary)', fontWeight: 500 }}>Terms of Service</span>
                            <ExternalLink size={16} color="var(--text-secondary)" />
                        </div>
                    </div>
                </div>

                {/* Footer Credits */}
                <div style={{ textAlign: 'center', padding: '20px 0', marginTop: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        Made with <Heart size={14} color="#ef4444" fill="#ef4444" /> by MD Azad
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', opacity: 0.6, marginTop: '4px' }}>
                        &copy; 2026 Masum Chat. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
