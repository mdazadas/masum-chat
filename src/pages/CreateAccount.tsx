import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, CheckCircle2, Eye, EyeOff, MessageCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { insforge } from '../lib/insforge';

const CreateAccount = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [step, setStep] = useState(1); // 1: Details, 2: OTP Verify
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

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 5) otpRefs.current[index + 1]?.focus();
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
                const { data, error } = await insforge.database
                    .from('profiles')
                    .select('id')
                    .eq('username', val.trim().toLowerCase())
                    .single();

                if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
                    console.error("User check error:", error);
                    return;
                }

                if (data) {
                    setUsernameStatus('unavailable');
                    setUsernameError('Username already taken');
                } else {
                    setUsernameStatus('available');
                    setUsernameError('');
                }
            } catch (err) {
                console.error("Check catch:", err);
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
            const { data: existingEmail } = await insforge.database
                .from('profiles')
                .select('id')
                .eq('email', email.toLowerCase().trim())
                .single();

            if (existingEmail) {
                showToast('This email is already associated with an account.', 'error');
                setLoading(false);
                return;
            }

            const { error } = await insforge.auth.signUp({
                email,
                password,
                name,
            });
            if (error) {
                showToast(error.message || 'Sign up failed.', 'error');
            } else {
                showToast('Verification code sent!', 'success');
                setStep(2);
                setResendTimer(60);
            }
        } catch {
            showToast('Something went wrong. Please try again.', 'error');
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
            const { data, error } = await insforge.auth.verifyEmail({ email, otp: code });
            if (error) {
                showToast(error.message || 'Invalid code. Try again.', 'error');
            } else if (data?.user) {
                // Manually create profile in public.profiles table since DB triggers are restricted
                await insforge.database
                    .from('profiles')
                    .upsert({
                        id: data.user.id,
                        name: name,
                        username: username.toLowerCase().trim(),
                        email: email.toLowerCase().trim(),
                        avatar_url: `https://i.pravatar.cc/150?u=${data.user.id}`
                    });

                sessionStorage.setItem('masum_tab_session', 'active');
                sessionStorage.setItem('masum_user_id', data.user.id);
                localStorage.setItem('masum_user_id_backup', data.user.id);

                showToast('Welcome to Masum Chat!', 'success');
                window.dispatchEvent(new Event('masum-auth-change'));
                navigate('/home', { replace: true });
            }
        } catch {
            showToast('Verification failed. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="auth-container">
            <div className="auth-card">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '16px',
                        backgroundColor: 'var(--primary-color)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 16px var(--primary-light)'
                    }}>
                        <MessageCircle size={36} color="white" fill="white" />
                    </div>
                </div>
                <h1 className="auth-title">{step === 1 ? 'Create Account' : 'Verify Email'}</h1>
                <p className="auth-subtitle">
                    {step === 1
                        ? 'Join Masum Chat — fast, secure messaging.'
                        : `Enter the 6-digit code sent to ${email}`}
                </p>

                {step === 1 && (
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

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <span className="spinner" /> Creating account...
                                </span>
                            ) : (
                                <><UserPlus size={20} /> Create Account</>
                            )}
                        </button>
                    </form>
                )}

                {step === 2 && (
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
                            onClick={() => { setOtp(['', '', '', '', '', '']); setStep(1); }}
                        >
                            ← Back to details
                        </button>
                    </form>
                )}

                <p className="auth-footer">
                    Already have an account? <Link to="/" className="auth-link">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default CreateAccount;
