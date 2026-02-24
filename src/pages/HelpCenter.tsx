import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Mail, ExternalLink, Shield, ChevronDown } from 'lucide-react';
import BlurImage from '../components/BlurImage';

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div style={{
            borderBottom: '1px solid var(--border-color)',
            overflow: 'hidden'
        }}>
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
                    backgroundColor: 'var(--secondary-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease'
                }}>
                    <ChevronDown size={18} />
                </div>
            </div>
            <div style={{
                maxHeight: isOpen ? '200px' : '0',
                opacity: isOpen ? 1 : 0,
                transition: 'all 0.3s ease',
                paddingBottom: isOpen ? '18px' : '0',
                fontSize: '14.5px',
                color: 'var(--text-secondary)',
                lineHeight: '1.5'
            }}>
                {answer}
            </div>
        </div>
    );
};

const HelpCenter = () => {
    const navigate = useNavigate();

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
                    borderBottom: '1px solid var(--border-color)'
                }}>
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
                        boxShadow: '0 8px 16px var(--primary-light)'
                    }}>
                        <HelpCircle size={32} />
                    </div>
                    <h2 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>How can we help?</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Find answers to common questions or reach out to us directly.</p>
                </div>

                {/* FAQ Section */}
                <div style={{ padding: '24px 20px 8px 20px', fontSize: '13px', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Frequently Asked Questions
                </div>

                <div style={{ padding: '0 20px' }}>
                    {faqs.map((faq, index) => (
                        <FAQItem key={index} question={faq.question} answer={faq.answer} />
                    ))}
                </div>

                <div style={{ height: '8px', backgroundColor: 'var(--secondary-color)', margin: '20px 0' }}></div>

                {/* Contact Section */}
                <div style={{ padding: '0 20px 24px 20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
                        Contact Support
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '16px',
                        backgroundColor: 'var(--surface-color)',
                        border: '1.5px solid var(--border-color)',
                        borderRadius: '16px',
                        cursor: 'pointer'
                    }} onClick={() => window.location.href = 'mailto:web.mdazad@gmail.com'}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            backgroundColor: 'var(--secondary-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--primary-color)'
                        }}>
                            <Mail size={22} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Email Us</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>web.mdazad@gmail.com</div>
                        </div>
                        <ExternalLink size={18} color="var(--text-secondary)" />
                    </div>

                    <div style={{
                        marginTop: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '16px',
                        backgroundColor: 'var(--surface-color)',
                        border: '1.5px solid var(--border-color)',
                        borderRadius: '16px'
                    }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            backgroundColor: 'var(--secondary-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--primary-color)'
                        }}>
                            <Shield size={22} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Privacy Assurance</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Your data is always encrypted & safe.</div>
                        </div>
                    </div>
                </div>

                {/* Developer Info */}
                <div style={{
                    margin: '20px',
                    padding: '20px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', opacity: 0.8, textTransform: 'uppercase', fontWeight: 700 }}>Developer</div>
                        <div style={{ fontSize: '18px', fontWeight: 700 }}>MD Azad</div>
                        <div style={{ fontSize: '14px', opacity: 0.9, marginTop: '2px' }}>CEO & Lead Engineer at Masum Chats</div>
                    </div>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                        <BlurImage
                            src="/md_azad_final.png"
                            alt="MD Azad"
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpCenter;
