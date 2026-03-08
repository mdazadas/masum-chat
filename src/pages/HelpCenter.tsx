import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Mail, ExternalLink, Shield, ChevronDown, Search, MessageSquare } from 'lucide-react';
import BlurImage from '../components/BlurImage';

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div style={{
            borderBottom: '1px solid var(--border-color)',
            overflow: 'hidden',
            transition: 'background-color 0.2s'
        }} className="faq-item">
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: '18px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                }}
            >
                <div style={{ fontWeight: 600, fontSize: '15.5px', color: 'var(--text-primary)', flex: 1, paddingRight: '12px' }}>
                    {question}
                </div>
                <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: isOpen ? 'var(--primary-light)' : 'var(--secondary-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isOpen ? 'var(--primary-color)' : 'var(--text-secondary)',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}>
                    <ChevronDown size={18} />
                </div>
            </div>
            <div style={{
                maxHeight: isOpen ? '500px' : '0',
                opacity: isOpen ? 1 : 0,
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                paddingBottom: isOpen ? '18px' : '0',
                fontSize: '14.5px',
                color: 'var(--text-secondary)',
                lineHeight: '1.6',
                transform: isOpen ? 'translateY(0)' : 'translateY(-10px)'
            }}>
                {answer}
            </div>
        </div>
    );
};

const HelpCenter = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const faqs = [
        {
            question: "How do I change my theme?",
            answer: "Go to Settings > Theme & Appearance. You can choose between Light, Dark, or System mode, and also customize your accent color and chat wallpaper."
        },
        {
            question: "How can I block a user?",
            answer: "Open the chat with the user, tap their name to view their profile, and scroll down to select 'Block User'. You can also manage blocked users in Settings > Privacy & Status > Blocked Contacts."
        },
        {
            question: "Is Masum Chat secure?",
            answer: "Yes, Masum Chat uses end-to-end encryption for all messages. Your data is stored locally on your device and never shared with 3rd parties."
        },
        {
            question: "Why am I not receiving notifications?",
            answer: "Ensure that notifications are enabled in Settings > Notifications. Also, check if Masum Chat has permission to send notifications in your device's system settings."
        },
        {
            question: "How do I delete my account?",
            answer: "You can permanently delete your account in Settings > Account > Delete Account. This action is irreversible and will remove all your data."
        },
        {
            question: "What to do if the app crashes?",
            answer: "Try clearing the app cache or restarting your device. If the problem persists, ensure you are using the latest version of Masum Chat or contact us."
        },
        {
            question: "Can I use Masum Chat on multiple devices?",
            answer: "Currently, Masum Chat is designed for a single device per account to maintain maximum security and local storage integrity."
        }
    ];

    const filteredFaqs = faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="home-container" style={{ backgroundColor: 'var(--surface-color)' }}>
            {/* Header */}
            <nav className="top-nav">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="nav-icon-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={24} />
                    </button>
                    <div className="top-nav-title">Help Center</div>
                </div>
            </nav>

            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '40px' }}>
                {/* Hero Section */}
                <div style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    background: 'var(--secondary-color)',
                    borderBottom: '1px solid var(--border-color)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-20px',
                        right: '-20px',
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        background: 'var(--primary-light)',
                        opacity: 0.1
                    }} />

                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '20px',
                        backgroundColor: 'var(--primary-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        margin: '0 auto 16px auto',
                        boxShadow: '0 8px 16px var(--primary-light)',
                        position: 'relative',
                        zIndex: 1
                    }}>
                        <HelpCircle size={32} />
                    </div>
                    <h2 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 800 }}>How can we help?</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>Find answers to common questions or reach out to us directly.</p>

                    <div style={{
                        maxWidth: '400px',
                        margin: '0 auto',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Search questions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '14px 16px 14px 44px',
                                borderRadius: '14px',
                                border: '1.5px solid var(--border-color)',
                                backgroundColor: 'var(--surface-color)',
                                fontSize: '15px',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
                            }}
                            className="search-input"
                        />
                    </div>
                </div>

                {/* FAQ Section */}
                <div style={{ padding: '24px 20px 8px 20px', fontSize: '13px', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Frequently Asked Questions
                </div>

                <div style={{ padding: '0 20px' }}>
                    {filteredFaqs.length > 0 ? (
                        filteredFaqs.map((faq, index) => (
                            <FAQItem key={index} question={faq.question} answer={faq.answer} />
                        ))
                    ) : (
                        <div style={{
                            padding: '40px 0',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <Search size={40} color="var(--text-secondary)" opacity={0.3} />
                            <div style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                                No results found for "{searchQuery}"
                            </div>
                            <button
                                onClick={() => setSearchQuery('')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--primary-color)',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}
                            >
                                Clear search
                            </button>
                        </div>
                    )}
                </div>

                <div style={{ height: '8px', backgroundColor: 'var(--secondary-color)', margin: '20px 0' }}></div>

                {/* Contact Section */}
                <div style={{ padding: '0 20px 24px 20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
                        Contact Support
                    </div>

                    <div className="contact-card" onClick={() => window.location.href = 'mailto:web.mdazad@gmail.com'}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            backgroundColor: 'var(--primary-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--primary-color)'
                        }}>
                            <Mail size={22} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Email Us</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>web.mdazad@gmail.com</div>
                        </div>
                        <ExternalLink size={18} color="var(--text-secondary)" />
                    </div>

                    <div className="contact-card">
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(0,0,0,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-primary)'
                        }}>
                            <Shield size={22} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Privacy Assurance</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Your data is always encrypted & safe.</div>
                        </div>
                    </div>
                </div>

                {/* Developer Info */}
                <div style={{
                    margin: '20px',
                    padding: '24px',
                    borderRadius: '24px',
                    background: 'linear-gradient(145deg, var(--primary-color) 0%, var(--primary-dark) 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    boxShadow: '0 12px 24px rgba(0, 168, 132, 0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <MessageSquare size={100} style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.1, transform: 'rotate(-15deg)' }} />

                    <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                        <div style={{ fontSize: '11px', opacity: 0.8, textTransform: 'uppercase', fontWeight: 800, letterSpacing: '1px', marginBottom: '4px' }}>Developer</div>
                        <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>MD Azad</div>
                        <div style={{ fontSize: '14px', opacity: 0.9, marginTop: '4px', lineHeight: '1.3' }}>CEO & Lead Engineer at Masum Chats</div>
                    </div>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.4)', overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,0,0,0.3)', flexShrink: 0 }}>
                        <BlurImage
                            src="/md_azad_final.png"
                            alt="MD Azad"
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                </div>
            </div>

            <style>{`
                .faq-item:hover {
                    background-color: var(--secondary-color);
                    padding-left: 8px;
                    padding-right: 8px;
                    margin-left: -8px;
                    margin-right: -8px;
                    border-radius: 12px;
                }
                .search-input:focus {
                    border-color: var(--primary-color) !important;
                    box-shadow: 0 4px 12px var(--primary-light) !important;
                }
                .contact-card {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 18px;
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(10px);
                    border: 1.5px solid var(--border-color);
                    border-radius: 20px;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-top: 12px;
                }
                .contact-card:hover {
                    transform: translateY(-2px);
                    border-color: var(--primary-color);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.05);
                }
            `}</style>
        </div>
    );
};

export default HelpCenter;
