import { useNavigate } from 'react-router-dom';
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

            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '40px' }} className="fade-in">
                {/* Brand Hero Section */}
                <div style={{
                    padding: '40px 20px',
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
                    <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', filter: 'blur(20px)', animation: 'float 6s infinite ease-in-out' }}></div>
                    <div style={{ position: 'absolute', bottom: '-15%', left: '-8%', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', filter: 'blur(30px)', animation: 'float 8s infinite ease-in-out reverse' }}></div>

                    {/* Logo Icon */}
                    <div className="hero-logo" style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '20px',
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        backdropFilter: 'blur(10px)',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px auto',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                        position: 'relative',
                        zIndex: 1
                    }}>
                        <MessageCircle size={32} color="white" fill="white" style={{ opacity: 0.95 }} />
                    </div>

                    <h1 style={{
                        fontSize: '26px',
                        fontWeight: 800,
                        margin: '0',
                        letterSpacing: '-0.5px',
                        textShadow: '0 4px 8px rgba(0,0,0,0.15)',
                        zIndex: 1,
                        position: 'relative'
                    }}>
                        Masum Chat
                    </h1>
                    <div style={{
                        marginTop: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        opacity: 0.9,
                        letterSpacing: '1.2px',
                        textTransform: 'uppercase',
                        zIndex: 1,
                        position: 'relative',
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        padding: '4px 14px',
                        borderRadius: '30px',
                        border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                        v2.1.0 Stable
                    </div>
                </div>

                {/* Developer Section */}
                <div style={{ padding: '30px 20px 10px 20px' }}>
                    <div style={{
                        backgroundColor: 'var(--surface-color)',
                        border: '1.5px solid var(--border-color)',
                        borderRadius: '24px',
                        padding: '30px',
                        boxShadow: 'var(--shadow-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px' }}>
                            DEVELOPER & FOUNDER
                        </div>
                        <div style={{ position: 'relative', width: '90px', height: '90px', marginBottom: '16px' }}>
                            <img
                                src="/md_azad_final.png"
                                alt="MD Azad"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '50%',
                                    border: '3px solid var(--primary-light)',
                                    padding: '3px',
                                    objectFit: 'cover',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                            />
                        </div>
                        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>MD Azad</h2>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
                            CEO & Lead Engineer at <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>Masum Chat</span>
                        </p>

                        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                            <button
                                onClick={() => window.open('https://github.com/mdazadas', '_blank', 'noopener,noreferrer')}
                                className="action-btn"
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    padding: '14px',
                                    borderRadius: '16px',
                                    background: 'var(--secondary-color)',
                                    border: 'none',
                                    color: 'var(--text-primary)',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                <Github size={18} /> GitHub
                            </button>
                            <button
                                onClick={() => window.open('https://mdazad.netlify.app/', '_blank', 'noopener,noreferrer')}
                                className="action-btn"
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    padding: '14px',
                                    borderRadius: '16px',
                                    background: 'var(--secondary-color)',
                                    border: 'none',
                                    color: 'var(--text-primary)',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                <Globe size={18} /> Website
                            </button>
                        </div>
                    </div>
                </div>

                {/* Legal & Versioning */}
                <div style={{ padding: '20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px', paddingLeft: '8px' }}>
                        Legal & Compliance
                    </div>
                    <div style={{
                        backgroundColor: 'var(--surface-color)',
                        border: '1.5px solid var(--border-color)',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <div
                            onClick={() => navigate('/privacy')}
                            className="list-item-hover"
                            style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                        >
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(37, 211, 102, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Shield size={20} color="#25D366" />
                            </div>
                            <span style={{ flex: 1, color: 'var(--text-primary)', fontWeight: 600 }}>Privacy Policy</span>
                            <ExternalLink size={16} color="var(--text-secondary)" style={{ opacity: 0.5 }} />
                        </div>
                        <div
                            onClick={() => navigate('/terms')}
                            className="list-item-hover"
                            style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
                        >
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FileText size={20} color="#3b82f6" />
                            </div>
                            <span style={{ flex: 1, color: 'var(--text-primary)', fontWeight: 600 }}>Terms of Service</span>
                            <ExternalLink size={16} color="var(--text-secondary)" style={{ opacity: 0.5 }} />
                        </div>
                    </div>
                </div>

                {/* Footer Credits */}
                <div style={{ textAlign: 'center', padding: '30px 20px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        Crafted with <Heart size={14} color="#ef4444" fill="#ef4444" style={{ animation: 'pulse 1.5s infinite' }} /> by MD Azad
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', opacity: 0.7, marginTop: '8px', letterSpacing: '0.3px' }}>
                        &copy; 2026 Masum Chat. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
