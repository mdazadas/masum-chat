import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Trash2, Mail, ExternalLink } from 'lucide-react';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="profile-container premium-bg">
            <style>{`
                .policy-hero {
                    padding: 40px 20px 20px;
                    text-align: center;
                }
                .policy-hero h1 {
                    font-size: 32px;
                    font-weight: 800;
                    color: var(--text-primary);
                    margin-bottom: 8px;
                    letter-spacing: -0.5px;
                }
                .policy-hero p {
                    color: var(--text-secondary);
                    font-weight: 600;
                    font-size: 15px;
                }
                
                .policy-section {
                    padding: 24px;
                }
                .policy-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 16px;
                }
                .policy-icon-box {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    background: var(--secondary-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--primary-color);
                }
                .policy-header h2 {
                    font-size: 18px;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin: 0;
                }
                .policy-content {
                    color: var(--text-secondary);
                    line-height: 1.6;
                    font-size: 14px;
                    font-weight: 500;
                }

                .policy-footer {
                    padding: 40px 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                }
                .policy-date {
                    font-size: 12px;
                    color: var(--text-secondary);
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    opacity: 0.6;
                }

                .contact-card {
                    margin-top: 20px;
                    background: rgba(255, 255, 255, 0.5);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 20px;
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .contact-card:active { transform: scale(0.98); }
            `}</style>

            <div className="screen-header">
                <div className="max-w-content" style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '16px' }}>
                    <button className="nav-icon-btn ripple" onClick={() => navigate(-1)}>
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="screen-header-title">Privacy Center</h2>
                </div>
            </div>

            <div className="profile-content">
                <div className="policy-hero">
                    <h1>Privacy Policy</h1>
                    <p>Your trust is the foundation of Masum Chats.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="profile-glass-card">
                        <div className="policy-section">
                            <div className="policy-header">
                                <div className="policy-icon-box">
                                    <Shield size={20} />
                                </div>
                                <h2>1. Data Ownership</h2>
                            </div>
                            <p className="policy-content">
                                At Masum Chat, your data belongs to you. We strictly collect only the essential information required to facilitate synchronization: your username, public profile identifiers, and encrypted message metadata. We never sell your personal information to third parties.
                            </p>
                        </div>
                    </div>

                    <div className="profile-glass-card">
                        <div className="policy-section">
                            <div className="policy-header">
                                <div className="policy-icon-box">
                                    <Lock size={20} />
                                </div>
                                <h2>2. Advanced Security</h2>
                            </div>
                            <p className="policy-content">
                                We employ industry-standard encryption protocols. While messages are stored on our cloud infrastructure for real-time delivery across your devices, they are protected by robust access controls (RLS) ensuring that only authorized participants can access specific conversation threads.
                            </p>
                        </div>
                    </div>

                    <div className="profile-glass-card">
                        <div className="policy-section">
                            <div className="policy-header">
                                <div className="policy-icon-box">
                                    <Eye size={20} />
                                </div>
                                <h2>3. Transparency & Control</h2>
                            </div>
                            <p className="policy-content">
                                You have full visibility into what others see. Through your settings, you can manage your "Last Seen" status, typing indicators, and profile visibility. We believe in providing clear, granular controls so you can tailor your privacy level to your comfort.
                            </p>
                        </div>
                    </div>

                    <div className="profile-glass-card">
                        <div className="policy-section">
                            <div className="policy-header">
                                <div className="policy-icon-box">
                                    <Trash2 size={20} />
                                </div>
                                <h2>4. Right to Erasure</h2>
                            </div>
                            <p className="policy-content">
                                We respect your right to be forgotten. When you choose to delete your account, our systems initiate a complete purge of your profile data, contacts, and message history within 24 hours. Once deleted, this data cannot be recovered.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="contact-card ripple"
                    onClick={() => window.location.href = 'mailto:privacy@masumchats.com'}
                    style={{
                        background: 'var(--surface-color)',
                        border: '1.5px solid var(--border-color)',
                        marginTop: '24px',
                        padding: '24px'
                    }}
                >
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        background: 'rgba(37, 211, 102, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary-color)'
                    }}>
                        <Mail size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '2px' }}>Privacy Questions?</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Contact our specialized team</div>
                    </div>
                    <ExternalLink size={18} color="var(--primary-color)" />
                </div>

                <div className="policy-footer">
                    <div className="policy-date">Last Updated: February 26, 2026</div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, textAlign: 'center' }}>
                        Masum Chats is committed to protecting the digital rights of users worldwide.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
