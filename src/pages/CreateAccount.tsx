import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, CheckCircle2, Eye, EyeOff, MessageCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useData } from '../context/DataContext';
import { insforge } from '../lib/insforge';

const CreateAccount = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { setUserId } = useData();
    const [authStep, setAuthStep] = useState(1); // 1: Details, 2: OTP Verify
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    useEffect(() => {
        let interval: any;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable' | 'invalid'>('idle');
    const [usernameError, setUsernameError] = useState('');
    const checkTimeout = useRef<any>(null);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    const isEmailValid = emailRegex.test(email);
    const isPasswordValid = password.length >= 6;
    const doPasswordsMatch = password === confirmPassword;
    const isNameValid = name.trim().length >= 2;
    const isFormValid = isEmailValid && isPasswordValid && doPasswordsMatch && isNameValid && usernameStatus === 'available';

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        const char = value.replace(/[^0-9]/g, '').slice(-1);
        const newOtp = [...otp];
        newOtp[index] = char;
        setOtp(newOtp);
        if (char && index < 5) otpRefs.current[index + 1]?.focus();
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const pasted = e.clipboardData.getData('text').slice(0, 6).replace(/[^0-9]/g, '');
        if (pasted.length === 6) {
            setOtp(pasted.split(''));
            otpRefs.current[5]?.focus();
        }
    };

    const checkUsername = async (val: string) => {
        if (!val) {
            setUsernameStatus('idle');
            setUsernameError('');
            return;
        }

        const regex = /^[a-z0-9_.]+$/;
        if (!regex.test(val)) {
            setUsernameStatus('invalid');
            setUsernameError('Only a-z, 0-9, _ and . allowed');
            return;
        }

        if (val.length < 3) {
            setUsernameStatus('invalid');
            setUsernameError('Username too short');
            return;
        }

        setUsernameStatus('checking');
        setUsernameError('');

        if (checkTimeout.current) clearTimeout(checkTimeout.current);

        checkTimeout.current = setTimeout(async () => {
            try {
                const { data: checkData } = await insforge.database
                    .from('profiles')
                    .select()
                    .eq('username', val.trim().toLowerCase())
                    .maybeSingle();

                if (checkData) {
                    setUsernameStatus('unavailable');
                    setUsernameError('Username already taken');
                } else {
                    setUsernameStatus('available');
                    setUsernameError('');
                }
            } catch (err: any) {
                console.error("User check error:", err);
            }
        }, 500);
    };

    const handleUsernameChange = (val: string) => {
        const lowerVal = val.toLowerCase().trim();
        setUsername(lowerVal);
        checkUsername(lowerVal);
    };

    const handleSignUp = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (usernameStatus === 'unavailable') {
            showToast('Please choose a different username.', 'error');
            return;
        }
        if (usernameStatus === 'invalid') {
            showToast(usernameError || 'Invalid username format.', 'error');
            return;
        }
        if (password !== confirmPassword) {
            showToast('Passwords do not match!', 'error');
            return;
        }
        if (password.length < 6) {
            showToast('Password must be at least 6 characters.', 'error');
            return;
        }
        setLoading(true);
        try {
            // Check if email already exists in profiles
            const { data: existingEmail, error: emailCheckError } = await insforge.database
                .from('profiles')
                .select('id')
                .eq('email', email.toLowerCase().trim())
                .maybeSingle();

            if (emailCheckError && emailCheckError.code !== 'PGRST116') throw emailCheckError;

            if (existingEmail) {
                showToast('This email is already associated with an account.', 'error');
                setLoading(false);
                return;
            }

            const { data, error } = await insforge.auth.signUp({
                email,
                password,
                name
            });

            if (error) throw error;

            if (data?.requireEmailVerification) {
                showToast('Verification code sent!', 'success');
                setAuthStep(2);
                setResendTimer(60);
                setTimeout(() => otpRefs.current[0]?.focus(), 100);
            } else if (data?.accessToken) {
                if (data?.user) {
                    setUserId(data.user.id);
                    // Ensure profile is created/linked correctly using upsert for idempotency
                    await insforge.database.from('profiles').upsert([{
                        id: data.user.id,
                        name: name,
                        username: username.toLowerCase().trim(),
                        email: email.toLowerCase().trim(),
                        avatar_url: null
                    }], { onConflict: 'id' });
                }
                showToast('Welcome to Masum Chat!', 'success');
                navigate('/home', { replace: true });
            }
        } catch (error: any) {
            console.error("Sign up error:", error);
            showToast(error?.message || 'Sign up failed.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOAuth = async (provider: 'google' | 'github') => {
        try {
            setLoading(true);
            const { error } = await insforge.auth.signInWithOAuth({
                provider,
                redirectTo: window.location.origin + '/home'
            });
            if (error) throw error;
        } catch (err: any) {
            showToast(`OAuth Error: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length < 6) {
            showToast('Please enter the full 6-digit code.', 'error');
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await insforge.auth.verifyEmail({
                email,
                otp: code
            });

            if (error) throw error;

            if (data?.user) {
                setUserId(data.user.id);
                // Ensure profile is created/linked correctly using upsert for idempotency
                await insforge.database.from('profiles').upsert([{
                    id: data.user.id,
                    name: name,
                    username: username.toLowerCase().trim(),
                    email: email.toLowerCase().trim(),
                    avatar_url: null
                }], { onConflict: 'id' });

                showToast('Welcome to Masum Chat!', 'success');
                window.dispatchEvent(new Event('masum-auth-change'));
                navigate('/home', { replace: true });
            }
        } catch (error: any) {
            console.error("Verification error:", error);
            showToast(error?.message || 'Verification failed. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="auth-container premium-mesh-bg">
            <div className="auth-card fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="auth-brand-wrapper">
                    <div className="auth-brand-icon" style={{ position: 'relative' }}>
                        <div className="auth-brand-ring"></div>
                        <MessageCircle size={36} color="white" fill="white" style={{ position: 'relative', zIndex: 2 }} />
                    </div>
                    <h1 className="auth-title">{authStep === 1 ? 'Create Account' : 'Verify Email'}</h1>
                    {authStep === 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', background: 'var(--primary-light)', padding: '4px 10px', borderRadius: '12px' }}>
                            <div style={{ width: '6px', height: '6px', background: 'var(--primary-color)', borderRadius: '50%' }}></div>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary-dark)', letterSpacing: '0.5px' }}>SECURE REGISTRATION</span>
                        </div>
                    )}
                    <p className="auth-subtitle">
                        {authStep === 1
                            ? 'Join Masum Chat — fast, secure messaging.'
                            : `Enter the 6-digit code sent to ${email}`}
                    </p>
                </div>

                {authStep === 1 && (
                    <form onSubmit={handleSignUp}>
                        <div className="form-group">
                            <input
                                type="text"
                                id="name"
                                className="input-field"
                                placeholder=" "
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoComplete="name"
                            />
                            <label htmlFor="name" className="input-label">Full Name</label>
                        </div>

                        <div className="form-group" style={{ marginBottom: usernameStatus !== 'idle' ? '8px' : '24px' }}>
                            <input
                                type="text"
                                id="username"
                                className={`input-field ${usernameStatus === 'invalid' || usernameStatus === 'unavailable' ? 'error' : ''}`}
                                placeholder=" "
                                required
                                value={username}
                                onChange={(e) => handleUsernameChange(e.target.value)}
                                autoComplete="username"
                            />
                            <label htmlFor="username" className="input-label">Username</label>
                            {usernameStatus !== 'idle' && (
                                <div style={{
                                    fontSize: '12px',
                                    marginTop: '4px',
                                    fontWeight: 600,
                                    color: usernameStatus === 'available' ? '#10b981' :
                                        usernameStatus === 'checking' ? 'var(--text-secondary)' : '#ef4444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    paddingLeft: '4px'
                                }}>
                                    {usernameStatus === 'checking' && <span className="spinner-small" style={{ width: '10px', height: '10px' }} />}
                                    {usernameStatus === 'available' && '✓ Available'}
                                    {usernameStatus === 'unavailable' && '✕ Taken'}
                                    {usernameStatus === 'invalid' && `⚠ ${usernameError}`}
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <input
                                type="email"
                                id="email"
                                className="input-field"
                                placeholder=" "
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                inputMode="email"
                            />
                            <label htmlFor="email" className="input-label">Email Address</label>
                        </div>

                        <div className="form-group">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                className="input-field"
                                placeholder=" "
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                            />
                            <label htmlFor="password" className="input-label">Password</label>
                            <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        <div className="form-group">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                className="input-field"
                                placeholder=" "
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                autoComplete="new-password"
                            />
                            <label htmlFor="confirmPassword" className="input-label">Confirm Password</label>
                            <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
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

                        <button type="submit" className="btn btn-primary" style={{ height: '54px' }} disabled={loading || !isFormValid}>
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <span className="spinner-small" /> Creating account...
                                </span>
                            ) : (
                                <><UserPlus size={20} /> Create Account Now</>
                            )}
                        </button>

                        <div style={{ margin: '20px 0 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Or join with</div>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                            <button 
                                type="button"
                                className="landing-btn-secondary" 
                                onClick={() => handleOAuth('google')}
                                disabled={loading}
                                style={{ flex: 1, padding: '12px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', cursor: 'pointer' }}
                            >
                                <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: '18px', height: '18px' }} />
                            </button>
                            <button 
                                type="button"
                                className="landing-btn-secondary" 
                                onClick={() => handleOAuth('github')}
                                disabled={loading}
                                style={{ flex: 1, padding: '12px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--surface-color)', cursor: 'pointer' }}
                            >
                                <img src="https://github.com/favicon.ico" alt="GitHub" style={{ width: '18px', height: '18px', filter: 'brightness(0)' }} />
                            </button>
                        </div>
                    </form>
                )}

                {authStep === 2 && (
                    <form onSubmit={handleVerifyOtp}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={(el) => { otpRefs.current[i] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    className="otp-input"
                                    value={digit}
                                    onPaste={i === 0 ? handlePaste : undefined}
                                    onChange={(e) => handleOtpChange(i, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(i, e)}
                                />
                            ))}
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <span className="spinner-small" /> Verifying...
                                </span>
                            ) : (
                                <><CheckCircle2 size={20} /> Verify & Continue</>
                            )}
                        </button>

                        <div style={{ textAlign: 'center', marginTop: 16 }}>
                            {resendTimer > 0 ? (
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Resend code in {resendTimer}s</p>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSignUp}
                                    style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
                                    disabled={loading}
                                >
                                    Resend Code
                                </button>
                            )}
                        </div>

                        <button
                            type="button"
                            style={{ marginTop: 12, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', width: '100%', fontSize: 13 }}
                            onClick={() => { setOtp(['', '', '', '', '', '']); setAuthStep(1); }}
                        >
                            ← Back to details
                        </button>
                    </form>
                )}

                <p className="auth-footer" style={{ marginTop: '16px' }}>
                    Already have an account? <Link to="/login" className="auth-link">Login</Link>
                </p>

                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '11px' }}>
                    <Link to="/terms" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Terms</Link>
                    <Link to="/privacy-policy" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Privacy</Link>
                    <Link to="/support" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Support</Link>
                </div>
            </div>
        </div>
    );
};

export default CreateAccount;
