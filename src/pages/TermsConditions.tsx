import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsConditions = () => {
    const navigate = useNavigate();

    return (
        <div className="home-container" style={{ backgroundColor: 'var(--surface-color)' }}>
            <nav className="top-nav">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button className="nav-icon-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={24} />
                    </button>
                    <div className="top-nav-title" style={{ position: 'static', transform: 'none' }}>Terms & Conditions</div>
                </div>
            </nav>

            <div style={{ padding: '24px 20px', flex: 1, overflowY: 'auto' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>Terms and Conditions</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '15px' }}>
                        By using Masum Chat, you agree to these legal terms and our community guidelines.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                        <section>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>1</span>
                                Acceptable Use
                            </h2>
                            <p style={{ color: 'var(--text-primary)', lineHeight: '1.6', fontSize: '14px' }}>
                                You agree not to use Masum Chat for any illegal purposes or to harass other users. Authentic and respectful communication is required.
                            </p>
                        </section>

                        <section>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>2</span>
                                Account Responsibility
                            </h2>
                            <p style={{ color: 'var(--text-primary)', lineHeight: '1.6', fontSize: '14px' }}>
                                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                            </p>
                        </section>

                        <section>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>3</span>
                                Service Availability
                            </h2>
                            <p style={{ color: 'var(--text-primary)', lineHeight: '1.6', fontSize: '14px' }}>
                                We strive for maximum uptime but do not guarantee uninterrupted service. We reserve the right to perform maintenance as needed.
                            </p>
                        </section>

                        <section>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>4</span>
                                Termination
                            </h2>
                            <p style={{ color: 'var(--text-primary)', lineHeight: '1.6', fontSize: '14px' }}>
                                We reserve the right to terminate accounts that violate our community guidelines or engage in suspicious activity.
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

export default TermsConditions;
