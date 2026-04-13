import { useNavigate } from 'react-router-dom';
import { Shield, EyeOff, Lock, Video, MessageCircle, Heart, UserPlus, LogIn, Globe, Instagram, Github, Mail, Phone, Smartphone, Search, CheckCircle, UserX, Palette, Trash2, Cpu } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useEffect } from 'react';

const Landing = () => {
    const navigate = useNavigate();
    const { userId } = useData();

    // Auto-redirect if already logged in
    useEffect(() => {
        if (userId) {
            navigate('/home', { replace: true });
        }
    }, [userId, navigate]);

    return (
        <div className="landing-container premium-bg">
            {/* Fixed Header */}
            <div className="landing-header" style={{
                position: 'fixed', top: 0, left: 0, right: 0, width: '100%', zIndex: 100,
                background: 'var(--glass-bg)', backdropFilter: 'blur(12px)',
                borderBottom: '1px solid var(--border-color)',
                padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ background: 'var(--primary-color)', padding: '6px', borderRadius: '10px', display: 'flex' }}>
                        <MessageCircle size={18} color="white" fill="white" />
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Masum Chat</span>
                </div>
                <button
                    onClick={() => navigate('/safeguide')}
                    style={{
                        background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.2)', padding: '6px 14px',
                        borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
                    }}
                >
                    <Shield size={14} /> Safety Guide
                </button>
            </div>

            {/* Hero Section */}
            <div className="landing-hero fade-in">
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div className="landing-badge">
                        <Heart size={14} fill="#d21f3c" /> Built specifically for Girlfriends & Boyfriends
                    </div>
                    <h1 className="landing-title">
                        The Chat Your Family <br /><span style={{ color: 'var(--primary-color)' }}>Will Never See</span>
                    </h1>
                    <p className="landing-subtitle">
                        Masum Chat is a ghost application designed for complete secrecy between couples. Zero history. Zero call logs. 100% hidden from family monitoring.
                    </p>

                    {/* Quick Actions */}
                    <div className="landing-actions fade-in" style={{ animationDelay: '0.1s', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button className="landing-btn-primary" onClick={() => navigate('/login')}>
                                <LogIn size={20} /> Login to Account
                            </button>
                            <button className="landing-btn-secondary" onClick={() => navigate('/create-account')}>
                                <UserPlus size={20} /> Create Secret Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Exclusive Detailed Warning */}
            <div className="fade-in" style={{ padding: '0 20px 32px' }}>
                <div style={{
                    background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(202, 138, 4, 0.05) 100%)',
                    border: '1px solid rgba(234, 179, 8, 0.3)',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: '0 4px 12px rgba(234, 179, 8, 0.05)',
                    maxWidth: '800px',
                    margin: '0 auto'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: 800, fontSize: '15px', marginBottom: '8px' }}>
                        <Smartphone size={18} /> Mobile Specific Design
                    </div>
                    <div style={{ fontSize: '13px', color: '#92400e', lineHeight: 1.5, fontWeight: 500 }}>
                        This app is <strong>not meant for Desktop or Laptop</strong>. On larger screens, anyone nearby can easily read your private chats.<br /><br />
                        Masum Chat ko specifically mobile privacy ke liye design kiya gaya hai. Khatra mehsoos hone par aap turant apne phone ki screen lock ya app switch kar sakte hain.
                    </div>
                </div>
            </div>

            {/* Donation Banner */}
            <div className="fade-in" style={{ padding: '0 20px 40px' }}>
                <div className="home-donation-banner" onClick={() => navigate('/support')} style={{ margin: '0 auto', maxWidth: '800px' }}>
                    <div className="banner-content">
                        <div className="banner-heart">
                            <Heart size={24} fill="#ef4444" color="#ef4444" />
                        </div>
                        <div className="banner-text">
                            <h3>Support Masum Chat 💖</h3>
                            <p>Help us stay live & ad-free!</p>
                        </div>
                    </div>
                    <button className="banner-btn">Support Now</button>
                </div>
            </div>

            {/* Why Choose Us Section */}
            <div style={{ padding: '0 20px 40px' }} className="fade-in">
                <div className="landing-section-title" style={{ justifyContent: 'center', marginBottom: '24px' }}>
                    <Lock size={18} /> Why Masum Chat?
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', maxWidth: '1100px', margin: '0 auto' }}>

                    <div className="landing-feature-card" style={{ background: 'var(--surface-color)', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
                            <EyeOff size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '2px', fontSize: '15px' }}>Zero Browser History</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.4, fontSize: '13px' }}>Parents aapki browsing track nahi kar sakenge.</p>
                        </div>
                    </div>

                    <div className="landing-feature-card" style={{ background: 'var(--surface-color)', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', flexShrink: 0 }}>
                            <Shield size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '2px', fontSize: '15px' }}>Anti-Tracking Mode</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.4, fontSize: '13px' }}>Ghost technology jo aapko invisible rakhti hai.</p>
                        </div>
                    </div>

                    <div className="landing-feature-card" style={{ background: 'var(--surface-color)', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ background: 'rgba(245, 158, 11, 0.1)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', flexShrink: 0 }}>
                            <Lock size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '2px', fontSize: '15px' }}>100% Privacy</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.4, fontSize: '13px' }}>Couple chats ke liye sabse secure platform.</p>
                        </div>
                    </div>

                </div>
            </div>

            {/* New Features Section */}
            <div style={{ padding: '0 20px 40px' }} className="fade-in">
                <div className="landing-section-title" style={{ justifyContent: 'center', marginBottom: '24px' }}>
                    <Cpu size={18} /> Powerful Features
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', maxWidth: '1100px', margin: '0 auto' }}>
                    {/* Messaging Features */}
                    <div className="landing-feature-card" style={{ background: 'var(--surface-color)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px', color: '#10b981' }}>
                                <MessageCircle size={22} />
                            </div>
                            <h3 style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Real-Time Messaging</h3>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <li style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={14} color="#10b981" /> Instant Send & Receive Messages
                            </li>
                            <li style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={14} color="#10b981" /> Live Typing Indicators
                            </li>
                            <li style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={14} color="#10b981" /> Seen & Delivered Status Ticks
                            </li>
                            <li style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={14} color="#10b981" /> Rich Media (Photos/Video/Audio)
                            </li>
                        </ul>
                    </div>

                    {/* Privacy & Safety */}
                    <div className="landing-feature-card" style={{ background: 'var(--surface-color)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '12px', color: '#ef4444' }}>
                                <UserX size={22} />
                            </div>
                            <h3 style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Privacy Controls</h3>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <li style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={14} color="#ef4444" /> Block & Unblock Users Instantly
                            </li>
                            <li style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={14} color="#ef4444" /> Mute Individual Notifications
                            </li>
                            <li style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={14} color="#ef4444" /> Silence App Sounds for Secrecy
                            </li>
                            <li style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={14} color="#ef4444" /> Secure Auth Layer Protection
                            </li>
                        </ul>
                    </div>

                    {/* Customization */}
                    <div className="landing-feature-card" style={{ background: 'var(--surface-color)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '10px', borderRadius: '12px', color: '#8b5cf6' }}>
                                <Palette size={22} />
                            </div>
                            <h3 style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Personalization</h3>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <li style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={14} color="#8b5cf6" /> Themes: Switch Dark & Light Mode
                            </li>
                            <li style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={14} color="#8b5cf6" /> Custom Profile Photo Upload
                            </li>
                            <li style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={14} color="#8b5cf6" /> Instant Name & Username Updates
                            </li>
                            <li style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={14} color="#8b5cf6" /> Interactive UI Animations
                            </li>
                        </ul>
                    </div>

                    {/* Familiar Experience Card */}
                    <div className="landing-feature-card" style={{ background: 'var(--surface-color)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', borderLeft: '4px solid var(--primary-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ background: 'var(--primary-light)', padding: '10px', borderRadius: '12px', color: 'var(--primary-dark)' }}>
                                <Smartphone size={22} />
                            </div>
                            <h3 style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Familiar & Fast</h3>
                        </div>
                        <p style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px', lineHeight: 1.4 }}>
                            Aapko kuch naya seekhne ki zaroorat nahi hai:
                        </p>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <li style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', width: '18px', height: '18px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Instagram size={11} color="white" />
                                </div>
                                <span>Login process <strong>Instagram</strong> jaisa simple hai.</span>
                            </li>
                            <li style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ background: '#25D366', width: '18px', height: '18px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <MessageCircle size={11} color="white" fill="white" />
                                </div>
                                <span>Chating experience <strong>WhatsApp</strong> jaisa smooth hai.</span>
                            </li>
                            <li style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={14} color="var(--primary-color)" /> Zero Learning Curve - Kaam shuru kijiye!
                            </li>
                        </ul>
                    </div>

                    {/* Account Support */}
                    <div className="landing-feature-card" style={{ background: 'var(--surface-color)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ background: 'rgba(100, 116, 139, 0.1)', padding: '10px', borderRadius: '12px', color: '#64748b' }}>
                                <Trash2 size={22} />
                            </div>
                            <h3 style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Support & Security</h3>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <li style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={14} color="#64748b" /> Dedicated Help Center Support
                            </li>
                            <li style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={14} color="#64748b" /> Permanent Account Depletion
                            </li>
                            <li style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={14} color="#64748b" /> Instant History Wipe on Exit
                            </li>
                            <li style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={14} color="#64748b" /> End-to-End Privacy First Logic
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* How Authentication Works */}
            <div style={{ padding: '0 20px 40px', marginTop: '16px' }} className="fade-in">
                <div className="landing-section-title" style={{ justifyContent: 'center', marginBottom: '24px' }}>
                    <Lock size={18} /> How to Get Started
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', maxWidth: '1100px', margin: '0 auto' }}>
                    {/* Login */}
                    <div className="landing-tutorial-card" style={{ background: 'var(--surface-color)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <div style={{ background: 'var(--primary-color)', color: 'white', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>1</div>
                            Login
                        </h4>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Agar account pehle se hai, toh sirf apna <strong>Email ID aur Password</strong> enter karein aur turant access payein.
                        </p>
                    </div>

                    {/* Create Account */}
                    <div className="landing-tutorial-card" style={{ background: 'var(--surface-color)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <div style={{ background: 'var(--primary-color)', color: 'white', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>2</div>
                            Create Account
                        </h4>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Naya account banane ke liye details fill karein: <strong>Name, Username, Email ID, aur ek strong choose Password karein</strong>. Uske baad OTP verification complete karein aur aapka naya secret ID create ho jayega!
                        </p>
                    </div>

                    {/* Forgot Password */}
                    <div className="landing-tutorial-card" style={{ background: 'var(--surface-color)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <div style={{ background: 'var(--primary-color)', color: 'white', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>3</div>
                            Forgot Password?
                        </h4>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Password bhool gaye? Tension not. Apna <strong>Email ID enter karein</strong>, uspar aaya OTP verify karein, aur apna naya password turant set karein.
                        </p>
                    </div>
                </div>
            </div>

            {/* How to Connect & Chat */}
            <div style={{ padding: '0 20px 40px' }} className="fade-in">
                <div className="landing-section-title" style={{ justifyContent: 'center', marginBottom: '24px' }}>
                    <Search size={18} /> Finding & Chatting
                </div>

                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ background: 'var(--surface-color)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                            Naye users se connect hona bahut aasan hai. Apna private network banayein step-by-step:
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <CheckCircle size={18} color="var(--primary-color)" style={{ marginTop: '2px', flexShrink: 0 }} />
                                <span style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>Sabse pehle <strong>Search Button</strong> par click kijiye.</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <CheckCircle size={18} color="var(--primary-color)" style={{ marginTop: '2px', flexShrink: 0 }} />
                                <span style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>Apne partner ya friend ka <strong>Username ya Name</strong> search kijiye.</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <CheckCircle size={18} color="var(--primary-color)" style={{ marginTop: '2px', flexShrink: 0 }} />
                                <span style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>Unka <strong>Profile check kijiye</strong> aur confirm karein ki wahi hain.</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <CheckCircle size={18} color="var(--primary-color)" style={{ marginTop: '2px', flexShrink: 0 }} />
                                <span style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>Bus! Ab easily ekdm secure and private <strong>Chat shuru kijiye</strong>.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upcoming Features Grid */}
            <div style={{ padding: '0 20px 40px', background: 'rgba(0,0,0,0.02)' }} className="fade-in">
                <div className="landing-section-title" style={{ justifyContent: 'center', margin: '32px 0 24px' }}>
                    <Globe size={18} /> Coming Soon Features
                </div>
                <div className="landing-features" style={{ margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', maxWidth: '1100px', gap: '20px' }}>
                    <div className="landing-feature-chip" style={{ position: 'relative', overflow: 'hidden', padding: '16px 20px', alignItems: 'flex-start' }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)', transform: 'translateX(-100%)', animation: 'shimmer 2s infinite' }} />
                        <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '10px', borderRadius: '12px' }}>
                            <Video size={20} color="#8b5cf6" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                <span style={{ fontWeight: 800 }}>Video Calls</span>
                                <span style={{ fontSize: '10px', background: '#8b5cf6', color: 'white', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>SOON</span>
                            </div>
                            <span style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>High-definition P2P secret video calls.</span>
                        </div>
                    </div>

                    <div className="landing-feature-chip" style={{ position: 'relative', overflow: 'hidden', padding: '16px 20px', alignItems: 'flex-start', marginTop: '16px' }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)', transform: 'translateX(-100%)', animation: 'shimmer 2s infinite 1s' }} />
                        <div style={{ background: 'var(--primary-light)', padding: '10px', borderRadius: '12px' }}>
                            <Phone size={20} color="var(--primary-dark)" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                <span style={{ fontWeight: 800 }}>Voice Calls</span>
                                <span style={{ fontSize: '10px', background: 'var(--primary-dark)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>SOON</span>
                            </div>
                            <span style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>Clear audio isolated from call logs.</span>
                        </div>
                    </div>

                    {/* Soon Feature 3 */}
                    <div className="landing-feature-chip" style={{ position: 'relative', overflow: 'hidden', padding: '16px 20px', alignItems: 'flex-start', marginTop: '16px' }}>
                        <div style={{ background: 'rgba(244, 63, 94, 0.1)', padding: '10px', borderRadius: '12px' }}>
                            <Lock size={20} color="#f43f5e" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                <span style={{ fontSize: '15px', fontWeight: 800 }}>Self-Destructing Media</span>
                                <span style={{ fontSize: '10px', background: '#f43f5e', color: 'white', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>SOON</span>
                            </div>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>Photos that vanish forever after 1 view.</span>
                        </div>
                    </div>

                    {/* Soon Feature 4 */}
                    <div className="landing-feature-chip" style={{ position: 'relative', overflow: 'hidden', padding: '16px 20px', alignItems: 'flex-start', marginTop: '16px' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px' }}>
                            <Smartphone size={20} color="#10b981" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                <span style={{ fontSize: '15px', fontWeight: 800 }}>Fake PIN Mode</span>
                                <span style={{ fontSize: '10px', background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>SOON</span>
                            </div>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>Enter a decoy PIN for an empty chat list.</span>
                        </div>
                    </div>

                    {/* Soon Feature 5 */}
                    <div className="landing-feature-chip" style={{ position: 'relative', overflow: 'hidden', padding: '16px 20px', alignItems: 'flex-start', marginTop: '16px' }}>
                        <div style={{ background: 'rgba(255, 105, 180, 0.15)', padding: '10px', borderRadius: '12px' }}>
                            <Heart size={20} fill="#d21f3c" color="#d21f3c" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                <span style={{ fontSize: '15px', fontWeight: 800 }}>Shared Secret Diary</span>
                                <span style={{ fontSize: '10px', background: '#d21f3c', color: 'white', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>SOON</span>
                            </div>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>A private space for couples to share.</span>
                        </div>
                    </div>

                </div>

            </div>
            {/* Footer */}
            <div className="landing-footer fade-in" style={{ paddingBottom: '32px', paddingTop: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <img src="/md_azad_final.png" alt="Md Azad" className="landing-footer-avatar" style={{ width: 60, height: 60, borderWidth: 3, marginBottom: '12px' }} />

                <div style={{ marginBottom: '20px' }}>
                    <div className="landing-footer-name">Md Azad</div>
                    <div className="landing-footer-sub" style={{ color: 'var(--primary-color)', fontWeight: 600, marginTop: '2px' }}>Creator & Lead Developer</div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '6px', maxWidth: '280px', margin: '6px auto 0', lineHeight: 1.4 }}>
                        Passionate about building secure & private digital spaces.
                    </div>
                </div>

                {/* Social Links - Simple uniform style */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', justifyContent: 'center' }}>
                    {/* GitHub */}
                    <a href="https://github.com/mdazadas" target="_blank" rel="noopener noreferrer" className="social-icon" style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', transition: 'transform 0.2s' }}>
                        <Github size={18} />
                    </a>
                    {/* WhatsApp */}
                    <a href="https://wa.me/918986054993" target="_blank" rel="noopener noreferrer" className="social-icon" style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', transition: 'transform 0.2s' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                            <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
                        </svg>
                    </a>
                    {/* Website */}
                    <a href="https://mdazad.netlify.app/" target="_blank" rel="noopener noreferrer" className="social-icon" style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', transition: 'transform 0.2s' }}>
                        <Globe size={18} />
                    </a>
                    {/* Instagram */}
                    <a href="https://www.instagram.com/web.mdazad?igsh=ZnJiOWJic2h4MzIw" target="_blank" rel="noopener noreferrer" className="social-icon" style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', transition: 'transform 0.2s' }}>
                        <Instagram size={18} />
                    </a>
                    {/* Email */}
                    <a href="mailto:web.mdazad@gmail.com" target="_blank" rel="noopener noreferrer" className="social-icon" style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', transition: 'transform 0.2s' }}>
                        <Mail size={18} />
                    </a>
                </div>

                {/* Legal & Copyright */}
                <div style={{ display: 'flex', gap: '16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px', justifyContent: 'center' }}>
                    <span onClick={() => navigate('/privacy')} style={{ cursor: 'pointer' }}>Privacy Policy</span>
                    <span>•</span>
                    <span onClick={() => navigate('/terms')} style={{ cursor: 'pointer' }}>Terms of Service</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', opacity: 0.6, textAlign: 'center' }}>
                    © {new Date().getFullYear()} Masum Chat. All rights reserved.
                </div>

                {/* Safe area spacer for mobile nav */}
                <div style={{ height: 'env(safe-area-inset-bottom, 40px)', width: '100%', minHeight: '40px' }} />
            </div>
        </div >
    );
};

export default Landing;
