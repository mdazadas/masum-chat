import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Send, MessageSquare, AlertCircle, Sparkles, Coffee } from 'lucide-react';
import { insforge } from '../lib/insforge';
import { useCurrentUserId } from '../hooks/useCurrentUser';
import { useToast } from '../context/ToastContext';

interface FeedbackMessage {
    id: string;
    name: string;
    email?: string;
    message: string;
    type: string;
    created_at: string;
    user_id?: string;
}

interface UserProfile {
    id: string;
    name?: string;
}

type SupportFeedbackEventPayload = FeedbackMessage;

const Support = () => {
    const navigate = useNavigate();
    const userId = useCurrentUserId();
    const { showToast } = useToast();

    const [messages, setMessages] = useState<FeedbackMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [feedbackType, setFeedbackType] = useState('feedback');
    const [messageText, setMessageText] = useState('');
    const [inputName, setInputName] = useState('');
    const [inputEmail, setInputEmail] = useState('');
    const [profile, setProfile] = useState<UserProfile | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchProfile = useCallback(async () => {
        if (!userId) return;
        const { data } = await insforge.database
            .from('profiles')
            .select('id,name')
            .eq('id', userId)
            .single();
        if (data) setProfile(data as UserProfile);
    }, [userId]);

    const fetchFeedback = useCallback(async () => {
        try {
            // Only fetch messages less than 24 hours old
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

            const { data, error } = await insforge.database
                .from('support_feedback')
                .select('*')
                .gte('created_at', oneDayAgo)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            if (data) setMessages(data as FeedbackMessage[]);
        } catch (err) {
            console.error('Fetch feedback error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0); // Force scroll to top on mount
        fetchProfile();
        fetchFeedback();

        const handleNewFeedback = (payload: SupportFeedbackEventPayload) => {
            const newMsg = payload as FeedbackMessage;
            setMessages(prev => {
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [newMsg, ...prev];
            });
            if (scrollRef.current) {
                scrollRef.current.scrollTop = 0;
            }
        };

        const setupSupportRealtime = async () => {
            try {
                await insforge.realtime.connect();
                await insforge.realtime.subscribe('support_feedback:global');
                insforge.realtime.on('INSERT_support_feedback', handleNewFeedback);
            } catch (err) {
                console.error('Support realtime setup error:', err);
            }
        };

        setupSupportRealtime();

        return () => {
            insforge.realtime.off('INSERT_support_feedback', handleNewFeedback);
            insforge.realtime.unsubscribe('support_feedback:global');
        };
    }, [fetchProfile, fetchFeedback]);

    // Filter out expired messages constantly
    useEffect(() => {
        const interval = setInterval(() => {
            setMessages(prev => prev.filter(msg => {
                const ageHours = (new Date().getTime() - new Date(msg.created_at).getTime()) / (1000 * 60 * 60);
                return ageHours < 24;
            }));
        }, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (profile?.name) {
            setInputName(profile.name);
        }
    }, [profile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim() || sending) return;

        const isEmailRequired = feedbackType === 'bug' || feedbackType === 'suggestion';
        if (isEmailRequired && !inputEmail.trim()) {
            showToast('Email is required for bugs and suggestions', 'error');
            return;
        }

        const exactTime = new Date().toISOString();
        const optimisticId = `optimistic-${Date.now()}`;
        const submittedText = messageText.trim();
        const submittedType = feedbackType;
        const submittedName = inputName.trim() || 'Anonymous';
        const submittedEmail = inputEmail.trim() || undefined;

        // Eagerly clear the text box and show success
        setMessageText('');
        setSending(true);

        // Optimistically insert to UI array immediately
        const optimisticMsg: FeedbackMessage = {
            id: optimisticId,
            user_id: userId || undefined,
            name: submittedName,
            email: submittedEmail,
            message: submittedText,
            type: submittedType,
            created_at: exactTime,
        };

        setMessages(prev => [optimisticMsg, ...prev]);
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
        showToast('Feedback sent! Thank you for supporting Masum Chat.', 'success');

        try {
            const { data, error } = await insforge.database
                .from('support_feedback')
                .insert({
                    user_id: userId || null,
                    name: submittedName,
                    email: submittedEmail || null,
                    message: submittedText,
                    type: submittedType,
                    // Use the exact time we stamped locally
                    created_at: exactTime
                })
                .select()
                .single();

            if (error) throw error;

            // Replace the optimistic temp ID with the real DB ID quietly
            if (data) {
                setMessages(prev => prev.map(m => m.id === optimisticId ? data : m));
            }

            // Keep name and email populated
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to send feedback';
            showToast(errorMessage, 'error');
            // Revert optimistic insert on failure
            setMessages(prev => prev.filter(m => m.id !== optimisticId));
        } finally {
            setSending(false);
        }
    };

    const handleCopyUPI = () => {
        const upiId = 'mdazad.web@ptyes';
        navigator.clipboard.writeText(upiId).then(() => {
            showToast('UPI ID copied to clipboard!', 'success');
        }).catch(() => {
            showToast('Failed to copy UPI ID', 'error');
        });
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'bug': return <AlertCircle size={14} color="#ef4444" />;
            case 'suggestion': return <Sparkles size={14} color="#f59e0b" />;
            default: return <MessageSquare size={14} color="var(--primary-color)" />;
        }
    };

    return (
        <div className="support-page-container">
            {/* Header */}
            <div className="screen-header" style={{ position: 'fixed', top: 0, left: 0, right: 0, width: '100%' }}>
                <div className="max-w-content" style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '16px' }}>
                    <button className="nav-icon-btn ripple" onClick={() => navigate(-1)}>
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="screen-header-title">Help &amp; Support</h2>
                </div>
            </div>

            <main className="support-content scroll-container">
                {/* Donation Card */}
                <section className="support-section donation-card">
                    <div className="donation-icon">
                        <Heart size={32} fill="#ef4444" color="#ef4444" />
                    </div>
                    <h2>Support Our Project</h2>
                    <p>If you love Masum Chat, consider buying us a coffee! Your donations help us keep the servers running and keep the app free forever.</p>

                    <div className="qr-container">
                        <img src="/donation_qr.jpg" alt="Donation QR Code" className="qr-image" />
                        <div
                            className="upi-id"
                            onClick={handleCopyUPI}
                            title="Click to copy"
                        >
                            mdazad.web@ptyes
                        </div>
                    </div>

                    <div className="donation-badges">
                        <div className="badge"><Coffee size={14} /> Low Cost</div>
                        <div className="badge"><Sparkles size={14} /> Ad Free</div>
                        <div className="badge"><Heart size={14} /> Made with Love</div>
                    </div>
                </section>

                {/* Feedback Form Card */}
                <section className="support-section feedback-form-card">
                    <h3>Report Issue or Feedback</h3>
                    <p className="section-desc">Found a bug? Or have a cool idea? Tell us instantly!</p>

                    <form onSubmit={handleSubmit} className="feedback-form">
                        <div className="type-toggle">
                            {['feedback', 'bug', 'suggestion'].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    className={`type-btn ${feedbackType === type ? 'active' : ''}`}
                                    onClick={() => setFeedbackType(type)}
                                >
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                            ))}
                        </div>

                        <div className="contact-inputs">
                            <input
                                type="text"
                                className="contact-input"
                                placeholder="Your Name (Optional)"
                                value={inputName}
                                onChange={(e) => setInputName(e.target.value)}
                                maxLength={50}
                            />
                            {feedbackType !== 'feedback' && (
                                <input
                                    type="email"
                                    className="contact-input"
                                    placeholder="Email Address (Required)"
                                    value={inputEmail}
                                    onChange={(e) => setInputEmail(e.target.value)}
                                    required
                                />
                            )}
                        </div>

                        <div className="input-wrapper">
                            <textarea
                                placeholder="Tell us more about it..."
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                maxLength={500}
                                required
                            />
                            <div className="char-count">{messageText.length}/500</div>
                        </div>

                        <button type="submit" className="submit-feedback-btn" disabled={sending || !messageText.trim()}>
                            {sending ? (
                                <span className="spinner-small" />
                            ) : (
                                <><Send size={18} /> Send Message</>
                            )}
                        </button>
                    </form>
                </section>

                {/* Real-time Wall Section */}
                <section className="support-section wall-section">
                    <div className="section-header">
                        <h3>Live Feedback Wall</h3>
                        <div className="live-indicator">
                            <span className="dot" /> LIVE
                        </div>
                    </div>

                    <div className="feedback-wall" ref={scrollRef}>
                        {loading ? (
                            <div className="wall-loader">
                                <span className="spinner-small" /> Loading wall...
                            </div>
                        ) : messages.length > 0 ? (
                            messages.map((msg) => (
                                <div key={msg.id} className="wall-item">
                                    <div className="item-header">
                                        <div className="user-info">
                                            <span className="user-name">{msg.name}</span>
                                            {msg.email && <span className="user-email">{msg.email}</span>}
                                        </div>
                                        <span className="item-type">
                                            {getTypeIcon(msg.type)}
                                            {msg.type}
                                        </span>
                                    </div>
                                    <p className="item-message">{msg.message}</p>
                                    <div className="item-footer">
                                        <span className="item-time">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <CountdownTimer createdAt={msg.created_at} />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-wall">
                                <MessageSquare size={32} opacity={0.3} />
                                <p>No messages yet. Be the first!</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <style>{`
                .support-page-container {
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                    min-height: 100dvh;
                    background-color: var(--secondary-color);
                    overflow-y: auto;
                    overflow-x: hidden;
                }

                .support-header {
                    background: var(--surface-color);
                    padding: 16px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    border-bottom: 1px solid var(--border-color);
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    z-index: 100;
                }

                .support-header h1 {
                    font-size: 20px;
                    font-weight: 800;
                    margin: 0;
                    color: var(--primary-color);
                }

                .back-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: var(--text-primary);
                    padding: 4px;
                    border-radius: 50%;
                    transition: background 0.2s;
                }

                .back-btn:active {
                    background: var(--secondary-color);
                }

                .support-content {
                    flex: 1;
                    padding: 80px 16px 16px; /* Offset for fixed header */
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    -webkit-overflow-scrolling: touch;
                }

                .support-section {
                    background: var(--surface-color);
                    border-radius: 20px;
                    padding: 20px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                    border: 1px solid var(--border-color);
                }

                .donation-card {
                    text-align: center;
                    background: linear-gradient(135deg, var(--surface-color) 0%, rgba(0, 168, 132, 0.03) 100%);
                }

                .donation-icon {
                    margin-bottom: 12px;
                    animation: heartBeat 1.5s infinite;
                }

                @keyframes heartBeat {
                    0% { transform: scale(1); }
                    14% { transform: scale(1.1); }
                    28% { transform: scale(1); }
                    42% { transform: scale(1.1); }
                    70% { transform: scale(1); }
                }

                .donation-card h2 {
                    font-size: 22px;
                    font-weight: 800;
                    margin: 0 0 8px;
                    color: var(--text-primary);
                }

                .donation-card p {
                    font-size: 14px;
                    color: var(--text-secondary);
                    line-height: 1.5;
                    margin-bottom: 20px;
                }

                .qr-container {
                    background: white;
                    padding: 12px;
                    border-radius: 16px;
                    display: inline-block;
                    border: 2px dashed var(--primary-light);
                    margin-bottom: 16px;
                }

                .qr-image {
                    width: 240px;
                    height: 240px;
                    object-fit: contain;
                    border-radius: 8px;
                }

                .upi-id {
                    margin-top: 12px;
                    font-weight: 700;
                    color: var(--primary-color);
                    font-size: 15px;
                    cursor: pointer;
                    padding: 8px 16px;
                    background: var(--secondary-color);
                    border-radius: 10px;
                    display: inline-block;
                    transition: all 0.2s;
                    border: 1px solid transparent;
                }

                .upi-id:hover {
                    background: var(--surface-color);
                    border-color: var(--primary-light);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
                }

                .upi-id:active {
                    transform: translateY(0);
                    opacity: 0.8;
                }

                .donation-badges {
                    display: flex;
                    justify-content: center;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .badge {
                    background: var(--secondary-color);
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--text-secondary);
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .feedback-form-card h3 {
                    font-size: 18px;
                    font-weight: 800;
                    margin: 0 0 4px;
                }

                .section-desc {
                    font-size: 13px;
                    color: var(--text-secondary);
                    margin-bottom: 16px;
                }

                .type-toggle {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 12px;
                }

                .type-btn {
                    flex: 1;
                    padding: 8px;
                    border-radius: 10px;
                    border: 1px solid var(--border-color);
                    background: var(--secondary-color);
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .type-btn.active {
                    background: var(--primary-color);
                    color: white;
                    border-color: var(--primary-color);
                }

                .input-wrapper {
                    position: relative;
                    margin-bottom: 12px;
                }

                textarea {
                    width: 100%;
                    min-height: 100px;
                    background: var(--secondary-color);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 12px;
                    font-family: inherit;
                    font-size: 14px;
                    resize: none;
                    outline: none;
                    transition: border 0.2s;
                }

                textarea:focus {
                    border-color: var(--primary-color);
                }

                .char-count {
                    position: absolute;
                    bottom: 8px;
                    right: 8px;
                    font-size: 10px;
                    color: var(--text-secondary);
                    opacity: 0.7;
                }

                .submit-feedback-btn {
                    width: 100%;
                    padding: 14px;
                    background: var(--primary-color);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: transform 0.2s;
                }

                .submit-feedback-btn:active {
                    transform: scale(0.98);
                }

                .submit-feedback-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .wall-section {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    padding-bottom: 8px;
                    margin-bottom: 24px;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .section-header h3 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 800;
                }

                .live-indicator {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                    font-weight: 800;
                    color: #ef4444;
                    background: #fef2f2;
                    padding: 4px 8px;
                    border-radius: 10px;
                }

                .dot {
                    width: 6px;
                    height: 6px;
                    background: #ef4444;
                    border-radius: 50%;
                    animation: blink 1s infinite;
                }

                @keyframes blink {
                    0% { opacity: 1; }
                    50% { opacity: 0.4; }
                    100% { opacity: 1; }
                }

                .feedback-wall {
                    max-height: 350px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    padding-right: 4px;
                }

                .wall-item {
                    background: var(--secondary-color);
                    padding: 12px;
                    border-radius: 15px;
                    border-left: 4px solid var(--primary-color);
                    animation: slideIn 0.3s_ease-out;
                }

                @keyframes slideIn {
                    from { transform: translateY(-10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .item-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 6px;
                }

                .user-info {
                    display: flex;
                    flex-direction: column;
                }

                .user-name {
                    font-size: 13px;
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .user-email {
                    font-size: 11px;
                    color: var(--text-secondary);
                    margin-top: 2px;
                }

                .item-type {
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    color: var(--text-secondary);
                }

                .item-message {
                    font-size: 13.5px;
                    color: var(--text-primary);
                    line-height: 1.4;
                    margin: 0;
                    word-break: break-word;
                }

                .item-time {
                    display: block;
                    text-align: right;
                    font-size: 10px;
                    color: var(--text-secondary);
                    margin-top: 4px;
                    opacity: 0.6;
                }

                .empty-wall {
                    padding: 40px 0;
                    text-align: center;
                    color: var(--text-secondary);
                }

                .empty-wall p {
                    margin-top: 8px;
                    font-size: 14px;
                }

                .wall-loader {
                    padding: 20px;
                    text-align: center;
                    font-size: 13px;
                    color: var(--text-secondary);
                }

                .contact-inputs {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 12px;
                }

                .contact-input {
                    width: 100%;
                    background: var(--secondary-color);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 12px 16px;
                    font-family: inherit;
                    font-size: 14px;
                    color: var(--text-primary);
                    outline: none;
                    transition: border 0.2s;
                }

                .contact-input:focus {
                    border-color: var(--primary-color);
                }

                .item-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 8px;
                }

                .item-footer .item-time {
                    margin-top: 0;
                }

                .countdown-badge {
                    font-size: 10px;
                    font-weight: 700;
                    color: #ef4444;
                    background: rgba(239, 68, 68, 0.1);
                    padding: 4px 8px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
            `}</style>
        </div>
    );
};

// Helper component for live 24h countdown
const CountdownTimer = ({ createdAt }: { createdAt: string }) => {
    const calculateTimeLeft = useCallback(() => {
        const createdTime = new Date(createdAt).getTime();
        const expiryTime = createdTime + 24 * 60 * 60 * 1000;
        const now = new Date().getTime();
        const difference = expiryTime - now;

        if (difference <= 0) {
            return 'Expired';
        }

        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

        return `${hours}h ${minutes}m left`;
    }, [createdAt]);

    const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 60000); // Update every minute

        return () => clearInterval(timer);
    }, [calculateTimeLeft]);

    if (timeLeft === 'Expired') return null;

    return (
        <span className="countdown-badge">
            <AlertCircle size={10} /> {timeLeft}
        </span>
    );
};

export default Support;
