import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="home-container" style={{ backgroundColor: 'var(--surface-color)' }}>
            <nav className="top-nav">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button className="nav-icon-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={24} />
                    </button>
                    <div className="top-nav-title" style={{ position: 'static', transform: 'none' }}>Privacy Policy</div>
                </div>
            </nav>

            <div style={{ padding: '24px 20px', flex: 1, overflowY: 'auto' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>Privacy Policy</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '15px' }}>
                        Welcome to Masum Chat. Your privacy is critically important to us.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                        <section>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>1</span>
                                Data Collection
                            </h2>
                            <p style={{ color: 'var(--text-primary)', lineHeight: '1.6', fontSize: '14px' }}>
                                We collect minimal data necessary for the chat experience, including your username, profile information, and messages.
                            </p>
                        </section>

                        <section>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>2</span>
                                Message Security
                            </h2>
                            <p style={{ color: 'var(--text-primary)', lineHeight: '1.6', fontSize: '14px' }}>
                                All chats are stored locally and encrypted on our servers to ensure that only you and your recipient can read them.
                            </p>
                        </section>

                        <section>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>3</span>
                                User Control
                            </h2>
                            <p style={{ color: 'var(--text-primary)', lineHeight: '1.6', fontSize: '14px' }}>
                                You have full control over your active status, profile visibility, and the ability to block users at any time.
                            </p>
                        </section>

                        <section>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>4</span>
                                Account Deletion
                            </h2>
                            <p style={{ color: 'var(--text-primary)', lineHeight: '1.6', fontSize: '14px' }}>
                                When you delete your account, all your data, including messages and profile details, are permanently removed from our systems.
                            </p>
                        </section>
                    </div>

                    <div style={{ marginTop: '48px', padding: '16px', borderRadius: '12px', backgroundColor: 'var(--secondary-color)', border: '1px solid var(--border-color)' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
                            <strong>Last updated:</strong> February 2026
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
