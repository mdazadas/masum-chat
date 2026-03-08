import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, UserCheck, Activity, Power, Mail, ExternalLink } from 'lucide-react';

const TermsConditions = () => {
    const navigate = useNavigate();

    return (
        <div className="profile-container premium-bg">
            <style>{`
                .terms-section {
                    margin-bottom: 24px;
                }
                .terms-card {
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .terms-header-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 4px;
                }
                .terms-icon-box {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    background: var(--secondary-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--primary-color);
                    flex-shrink: 0;
                }
                .terms-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: var(--text-primary);
                }
                .terms-text {
                    font-size: 14px;
                    color: var(--text-secondary);
                    line-height: 1.6;
                    font-weight: 500;
                }
                .support-footer {
                    margin-top: 40px;
                    padding: 32px 24px;
                    text-align: center;
                }
            `}</style>

            <div className="profile-nav glass-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '0 16px' }}>
                    <button className="nav-icon-btn ripple" onClick={() => navigate(-1)}>
                        <ArrowLeft size={24} />
                    </button>
                    <span className="profile-nav-title" style={{ color: 'var(--primary-color)', fontWeight: 800 }}>Terms & Conditions</span>
                </div>
            </div>

            <div className="profile-content" style={{ paddingBottom: '60px' }}>
                <div style={{ padding: '20px 20px 4px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary-color)', marginBottom: '6px' }}>Legal Disclosure</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: 500, lineHeight: 1.5 }}>
                        By using Masum Chat, you agree to comply with our core principles of privacy, safety, and respect for our global community.
                    </p>
                </div>

                <div style={{ padding: '16px' }}>
                    <div className="profile-glass-card terms-card">
                        <section className="terms-section" style={{ marginBottom: '0' }}>
                            <div className="terms-header-row">
                                <div className="terms-icon-box">
                                    <UserCheck size={20} />
                                </div>
                                <h2 className="terms-title">1. Acceptable Use</h2>
                            </div>
                            <p className="terms-text">
                                You agree not to use Masum Chat for any illegal purposes or to harass other users. Authentic and respectful communication is the foundation of our platform.
                            </p>
                        </section>

                        <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px 0', opacity: 0.5 }} />

                        <section className="terms-section" style={{ marginBottom: '0' }}>
                            <div className="terms-header-row">
                                <div className="terms-icon-box">
                                    <Shield size={20} />
                                </div>
                                <h2 className="terms-title">2. Account Responsibility</h2>
                            </div>
                            <p className="terms-text">
                                You are solely responsible for maintaining the confidentiality of your credentials. All activities occurring under your account are your legal responsibility.
                            </p>
                        </section>

                        <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px 0', opacity: 0.5 }} />

                        <section className="terms-section" style={{ marginBottom: '0' }}>
                            <div className="terms-header-row">
                                <div className="terms-icon-box">
                                    <Activity size={20} />
                                </div>
                                <h2 className="terms-title">3. Service Availability</h2>
                            </div>
                            <p className="terms-text">
                                While we strive for 100% uptime, our services are provided "as is." We reserve the right to perform critical maintenance to ensure platform stability and security.
                            </p>
                        </section>

                        <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px 0', opacity: 0.5 }} />

                        <section className="terms-section" style={{ marginBottom: '0' }}>
                            <div className="terms-header-row">
                                <div className="terms-icon-box">
                                    <Power size={20} />
                                </div>
                                <h2 className="terms-title">4. Termination Rights</h2>
                            </div>
                            <p className="terms-text">
                                We maintain a zero-tolerance policy for abuse. Masum Chat reserves the right to suspend or terminate accounts that violate our community standards.
                            </p>
                        </section>
                    </div>

                    <div className="support-footer profile-glass-card" style={{ marginTop: '24px', padding: '32px 20px' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '20px',
                            background: 'var(--secondary-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                            color: 'var(--primary-color)'
                        }}>
                            <Mail size={32} />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>Legal Questions?</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500, marginBottom: '24px', lineHeight: 1.5 }}>
                            If you have any questions regarding our legal framework or community guidelines, please reach out to our legal team.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button
                                className="premium-btn-primary"
                                style={{ width: '100%', gap: '10px', height: '52px' }}
                                onClick={() => window.location.href = 'mailto:web.mdazad@gmail.com'}
                            >
                                <Mail size={18} /> Contact Legal Team
                            </button>
                            <button
                                className="premium-btn-secondary"
                                style={{ width: '100%', gap: '10px', height: '52px' }}
                                onClick={() => window.open('https://mdazad.netlify.app', '_blank')}
                            >
                                <ExternalLink size={18} /> View Community Guidelines
                            </button>
                        </div>
                    </div>

                    <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                        <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: '12px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            opacity: 0.6
                        }}>
                            Last Updated: February 2026
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsConditions;
