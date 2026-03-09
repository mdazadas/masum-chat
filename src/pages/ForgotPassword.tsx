import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Send, Eye, EyeOff, MessageCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { insforge } from '../lib/insforge';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [recoveryStep, setRecoveryStep] = useState(1);
    const [otp, setOtp] = useState(['', '', '', '', '', '']); // 6-digit OTP
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    const [userEmail, setUserEmail] = useState('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = emailRegex.test(userEmail);
    const isPasswordValid = password.length >= 6;
    const doPasswordsMatch = password === confirmPassword;
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
        const char = value.replace(/[^0-9]/g, '').slice(-1);
        const newOtp = [...otp];
        newOtp[index] = char;
        setOtp(newOtp);

        if (char && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const pasted = e.clipboardData.getData('text').slice(0, 6).replace(/[^0-9]/g, '');
        if (pasted.length === 6) {
            setOtp(pasted.split(''));
            otpRefs.current[5]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };


    const handleSendOTP = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!isEmailValid) {
            showToast('Please enter a valid email address', 'error');
            return;
        }

        setLoading(true);
        try {
            // Check if user exists first
            const { data: profile, error: profileErr } = await insforge.database
                .from('profiles')
                .select('id')
                .eq('email', userEmail.toLowerCase().trim())
                .maybeSingle();

            if (profileErr && profileErr.code !== 'PGRST116') throw profileErr;

            if (!profile) {
                showToast('Account not found with this email.', 'error');
                setLoading(false);
                return;
            }

            const { error: resetErr } = await insforge.auth.sendResetPasswordEmail({ email: userEmail });
            if (resetErr) throw resetErr;

            showToast('Verification code sent!', 'success');
            setRecoveryStep(2);
            setResendTimer(60);
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        } catch (err: any) {
            showToast(err.message || 'Failed to send OTP', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (otp.some(digit => !digit)) {
            showToast('Please enter the full 6-digit code.', 'error');
            return;
        }
        setRecoveryStep(3);
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isPasswordValid) {
            showToast('Password must be at least 6 characters long', 'error');
            return;
        }
        if (!doPasswordsMatch) {
            showToast('Passwords do not match', 'error');
            return;
        }

        setLoading(true);
        try {
            const { error: resetErr } = await insforge.auth.resetPassword({
                otp: otp.join(''),
                newPassword: password
            });
            if (resetErr) throw resetErr;

            showToast('Password reset! Please login.', 'success');
            setTimeout(() => {
                navigate('/', { replace: true });
            }, 2000);
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

                {recoveryStep === 1 && (
                    <form onSubmit={handleSendOTP}>
                        <div className="form-group">
                            <input
                                type="email"
                                id="email"
                                className={`input-field ${userEmail && !isEmailValid ? 'error' : ''}`}
                                placeholder=" "
                                required
                                value={userEmail}
                                onChange={(e) => setUserEmail(e.target.value)}
                                autoComplete="email"
                                autoCorrect="off"
                                autoCapitalize="none"
                                spellCheck={false}
                                inputMode="email"
                            />
                            <label htmlFor="email" className="input-label">Email ID</label>
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading || !isEmailValid}>
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

                {recoveryStep === 2 && (
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
                                    onPaste={i === 0 ? handlePaste : undefined}
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

                {recoveryStep === 3 && (
                    <form onSubmit={handleResetPassword}>
                        <div className="form-group">
                            <input
                                type={showPassword ? 'text' : 'password'}
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
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
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
                        <button type="submit" className="btn btn-primary" disabled={!isPasswordValid || !doPasswordsMatch || loading}>
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
            <style>{`
                .otp-input {
                    background: var(--secondary-color);
                    backdrop-filter: blur(10px);
                    border: 1px solid var(--border-color);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    color: var(--text-primary);
                }
                .otp-input:focus {
                    background: var(--surface-color);
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 4px var(--primary-light);
                    transform: translateY(-2px);
                }
                .input-field.error {
                    border-color: #ef4444;
                    box-shadow: 0 0 0 1px #ef4444;
                }
                .auth-card {
                    animation: fadeInScale 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2);
                }
                @keyframes fadeInScale {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-12px); }
                }
            `}</style>
        </div>
    );
};

export default ForgotPassword;
