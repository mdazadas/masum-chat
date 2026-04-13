import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, ChevronLeft, Chrome, MoreVertical, EyeOff, Smartphone, AlertTriangle } from 'lucide-react';

const SafetyGuide = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-container premium-bg" style={{ minHeight: '100vh', paddingBottom: '40px', overflowY: 'auto' }}>
            {/* Fixed Header */}
            <div className="screen-header" style={{ position: 'fixed', top: 0, left: 0, right: 0, width: '100%' }}>
                <div className="max-w-content" style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '16px' }}>
                    <button className="nav-icon-btn ripple" onClick={() => navigate(-1)}>
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="screen-header-title">Safety Guide</h2>
                </div>
            </div>

            <div style={{ padding: '8px 16px', paddingTop: '80px' }} className="fade-in">
                <div style={{ maxWidth: '420px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '8px', borderRadius: '12px', display: 'flex' }}>
                            <Shield size={20} />
                        </div>
                        <h1 className="landing-title" style={{ fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2, fontSize: '20px' }}>
                            Masum Chat ko <span style={{ color: 'var(--primary-color)' }}>Safely</span> kaise use karein
                        </h1>
                    </div>
                    <p className="landing-subtitle" style={{ color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '16px', fontSize: '13px', maxWidth: '100%' }}>
                        Apni privacy bachayein. In 5 asaan steps ko follow karein. Ye app use karna <strong>Instagram aur WhatsApp</strong> jitna hi asaan hai!
                    </p>

                    {/* Step 1 */}
                    <div className="landing-privacy-card" style={{ margin: '0 0 12px 0', padding: '16px 14px' }}>
                        <div className="step-row" style={{ marginBottom: '10px' }}>
                            <div className="step-number" style={{ width: '22px', height: '22px', fontSize: '11px' }}><Chrome size={11} /></div>
                            <div>
                                <div className="step-text" style={{ fontSize: '14px' }}>Step 1: Chrome Browser open karein</div>
                                <div className="step-subtext" style={{ fontSize: '12px' }}>Apne phone mein Google Chrome app dhundhein.</div>
                            </div>
                        </div>
                        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', maxHeight: '300px', background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <img src="/guide_step1.jpg" alt="Open Chrome" style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', display: 'block' }} />
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="landing-privacy-card" style={{ margin: '0 0 12px 0', padding: '16px 14px' }}>
                        <div className="step-row" style={{ marginBottom: '10px' }}>
                            <div className="step-number" style={{ width: '22px', height: '22px', fontSize: '11px' }}><MoreVertical size={11} /></div>
                            <div>
                                <div className="step-text" style={{ fontSize: '14px' }}>Step 2: Menu open karein</div>
                                <div className="step-subtext" style={{ fontSize: '12px' }}>Chrome browser ke top right corner mein 3 dots par tap karein.</div>
                            </div>
                        </div>
                        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', maxHeight: '300px', background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <img src="/guide_step2.jpg" alt="Chrome Menu" style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', display: 'block' }} />
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="landing-privacy-card" style={{ margin: '0 0 12px 0', padding: '16px 14px' }}>
                        <div className="step-row" style={{ marginBottom: '10px' }}>
                            <div className="step-number" style={{ width: '22px', height: '22px', fontSize: '11px', background: '#333', color: 'white' }}><EyeOff size={11} /></div>
                            <div>
                                <div className="step-text" style={{ fontSize: '14px' }}>Step 3: New Incognito Tab</div>
                                <div className="step-subtext" style={{ fontSize: '12px' }}>New Incognito tab par tap karein. Screen dark gray ho jayegi.</div>
                            </div>
                        </div>
                        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', maxHeight: '300px', background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <img src="/guide_step3.jpg" alt="Incognito Tab" style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', display: 'block' }} />
                        </div>
                    </div>

                    {/* Step 4 */}
                    <div className="landing-privacy-card" style={{ margin: '0 0 12px 0', padding: '16px 14px' }}>
                        <div className="step-row" style={{ marginBottom: '10px' }}>
                            <div className="step-number" style={{ width: '22px', height: '22px', fontSize: '11px', background: '#333', color: 'white' }}><Chrome size={11} /></div>
                            <div>
                                <div className="step-text" style={{ fontSize: '14px' }}>Step 4: Dark Screen open hogi</div>
                                <div className="step-subtext" style={{ fontSize: '12px' }}>Ye dark screen aapka apna private space hai.</div>
                            </div>
                        </div>
                        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', maxHeight: '300px', background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <img src="/guide_step4.png" alt="Incognito Search" style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', display: 'block' }} />
                        </div>
                    </div>

                    {/* Step 5 */}
                    <div className="landing-privacy-card" style={{ margin: '0 0 16px 0', padding: '16px 14px' }}>
                        <div className="step-row" style={{ marginBottom: '10px' }}>
                            <div className="step-number" style={{ width: '22px', height: '22px', fontSize: '11px' }}><Smartphone size={11} /></div>
                            <div>
                                <div className="step-text" style={{ fontSize: '14px' }}>Step 5: Search & Open</div>
                                <div className="step-subtext" style={{ fontSize: '12px' }}>Search mein <strong style={{ color: 'var(--text-primary)' }}>masum chat</strong> likhein aur open karein.</div>
                            </div>
                        </div>
                        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', maxHeight: '300px', marginBottom: '10px', background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <img src="/guide_step5.png" alt="Google Search Results" style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', display: 'block' }} />
                        </div>
                        <button className="landing-btn-primary" style={{ width: '100%', padding: '10px 16px', fontSize: '14px' }} onClick={() => window.open('https://masumchat.insforge.site', '_blank')}>
                            Open Masum Chat Now
                        </button>
                    </div>

                    {/* Final Warning */}
                    <div style={{
                        padding: '12px 14px',
                        background: 'rgba(234, 179, 8, 0.06)',
                        borderRadius: '14px',
                        border: '1px solid rgba(234, 179, 8, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ca8a04', fontWeight: 800, fontSize: '13px' }}>
                            <AlertTriangle size={16} /> BAHUT ZAROORI BAAT
                        </div>
                        <div style={{ fontSize: '12px', color: '#a16207', lineHeight: 1.4, fontWeight: 500 }}>
                            Chat khatam hone par Incognito tab close kar dein. Iske baad phone mein koi nishaan nahi bachega.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SafetyGuide;
