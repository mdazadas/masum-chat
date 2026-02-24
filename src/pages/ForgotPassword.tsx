import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Send, Eye, EyeOff, MessageCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { insforge } from '../lib/insforge';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [step, setStep] = useState(1);
    const [otp, setOtp] = useState(['', '', '', '', '', '']); // 6-digit OTP
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        let interval: any;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const [resetToken, setResetToken] = useState('');
    const [userEmail, setUserEmail] = useState('');

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        const email = (e.target as any).email.value || userEmail;
        setLoading(true);
        try {
            // Check if user exists first
            const { data: profileData } = await insforge.database
                .from('profiles')
                .select('id')
                .eq('email', email);

            const profile = profileData?.[0];

            if (!profile) {
                showToast('Account not found with this email.', 'error');
                setLoading(false);
                return;
            }

            const { error } = await insforge.auth.sendResetPasswordEmail({ email });
            if (error) throw error;

            setUserEmail(email);
            showToast('Verification code sent!', 'success');
            setStep(2);
            setResendTimer(60);
        } catch (err: any) {
            showToast(err.message || 'Failed to send OTP', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        const code = otp.join('');
        setLoading(true);
        try {
            const { data, error } = await insforge.auth.exchangeResetPasswordToken({
                email: userEmail,
                code: code
            });
            if (error) throw error;
            if (data?.token) {
                setResetToken(data.token);
                setStep(3);
                showToast('OTP verified', 'success');
            }
        } catch (err: any) {
            showToast(err.message || 'Verification failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) return;
        setLoading(true);
        try {
            const { error } = await insforge.auth.resetPassword({
                otp: resetToken,
                newPassword: password
            });
            if (error) throw error;

            showToast('Password reset! Please login.', 'success');
            navigate('/', { replace: true });
        } catch (err: any) {
            showToast(err.message || 'Failed to reset password', 'error');
        } finally {
            setLoading(false);
        }
    };

    const passwordsMatch = password === confirmPassword || !confirmPassword;

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '16px',
                        backgroundColor: 'var(--primary-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 16px var(--primary-light)'
                    }}>
                        <MessageCircle size={36} color="white" fill="white" />
                    </div>
                </div>
                <h1 className="auth-title">Forgot Password</h1>

                <p className="auth-subtitle">Reset your account password easily.</p>

                {step === 1 && (
                    <form onSubmit={handleSendOTP}>
                        <div className="form-group">
                            <input
                                type="email"
                                id="email"
                                className="input-field"
                                placeholder=" "
                                required
                                autoComplete="email"
                                autoCorrect="off"
                                autoCapitalize="none"
                                spellCheck={false}
                                inputMode="email"
                            />
                            <label htmlFor="email" className="input-label">Email ID</label>
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <span className="spinner-small" /> Sending...
                                </span>
                            ) : (
                                <><Send size={20} /> Send OTP</>
                            )}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <div>
                        <p className="auth-subtitle">Verify the 6-digit OTP sent to your email.</p>
                        <div className="otp-group">
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={el => { otpRefs.current[i] = el; }}
                                    type="text"
                                    maxLength={1}
                                    className="otp-input"
                                    value={digit}
                                    onChange={(e) => handleOtpChange(i, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(i, e)}
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    autoCorrect="off"
                                    spellCheck={false}
                                    data-form-type="other"
                                />
                            ))}
                        </div>
                        <button className="btn btn-primary" onClick={handleVerifyOTP} disabled={otp.some(d => !d) || loading}>
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <span className="spinner-small" /> Verifying...
                                </span>
                            ) : (
                                'Verify OTP'
                            )}
                        </button>

                        <div style={{ textAlign: 'center', marginTop: 16 }}>
                            {resendTimer > 0 ? (
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Resend code in {resendTimer}s</p>
                            ) : (
                                <button
                                    type="button"
                                    onClick={(e) => handleSendOTP(e as any)}
                                    style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
                                    disabled={loading}
                                >
                                    Resend Code
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <form onSubmit={handleResetPassword}>
                        <div className="form-group">
                            <input
                                type="password"
                                id="npass"
                                className="input-field"
                                placeholder=" "
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                                autoCorrect="off"
                                spellCheck={false}
                            />
                            <label htmlFor="npass" className="input-label">New Password</label>
                        </div>
                        <div className="form-group">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="cnpass"
                                className={`input-field ${!passwordsMatch ? 'error' : ''}`}
                                placeholder=" "
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                                autoCorrect="off"
                                spellCheck={false}
                            />
                            <label htmlFor="cnpass" className="input-label">Confirm Password</label>
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                            {confirmPassword && (
                                <div style={{
                                    fontSize: '12px',
                                    marginTop: '4px',
                                    fontWeight: 600,
                                    color: password === confirmPassword ? '#10b981' : '#ef4444',
                                    paddingLeft: '4px'
                                }}>
                                    {password === confirmPassword ? '✓ Passwords Match' : '✕ Passwords Do Not Match'}
                                </div>
                            )}
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={!passwordsMatch || !password || loading}>
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <span className="spinner-small" /> Resetting...
                                </span>
                            ) : (
                                <><KeyRound size={20} /> Reset Password</>
                            )}
                        </button>
                    </form>
                )}

                <div style={{ marginTop: '24px' }}>
                    <Link to="/" className="btn-link">Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
