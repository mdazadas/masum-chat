import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useData } from '../context/DataContext';

import { insforge } from '../lib/insforge';
import LoadingOverlay from '../components/LoadingOverlay';

const ChangePassword = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { profileData } = useData();

    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [loading, setLoading] = useState(false);

    const [passwordData, setPasswordData] = useState({
        new: '',
        confirm: ''
    });

    const handleBack = () => {
        navigate(-1);
    };

    const [userEmail, setUserEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [currentStep, setCurrentStep] = useState(1); // 1: Initial, 2: OTP, 3: New Password
    const [resendTimer, setResendTimer] = useState(0);

    const isPasswordValid = passwordData.new.length >= 6;
    const doPasswordsMatch = passwordData.new === passwordData.confirm;

    useEffect(() => {
        if (profileData?.email) {
            setUserEmail(profileData.email);
        }
    }, [profileData]);

    const handleSendOTP = async () => {
        if (!userEmail) {
            showToast('Could not securely identify your email address', 'error');
            return;
        }
        setLoading(true);
        try {
            const { error: resetErr } = await insforge.auth.sendResetPasswordEmail({ email: userEmail });
            if (resetErr) throw resetErr;

            setCurrentStep(2);
            setResendTimer(60);
            showToast('OTP sent to your email', 'success');
        } catch (err: any) {
            showToast(err.message || 'Failed to send OTP', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Resend timer effect
    useEffect(() => {
        let interval: any;
        if (resendTimer > 0) {
            interval = setInterval(() => setResendTimer(t => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleVerifyOTP = async () => {
        if (otp.some(digit => !digit)) {
            showToast('Please enter the full 6-digit code', 'error');
            return;
        }
        setCurrentStep(3);
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
                newPassword: passwordData.new
            });
            if (resetErr) throw resetErr;

            showToast('Password changed successfully!', 'success');
            setTimeout(() => {
                navigate('/settings');
            }, 2000);
        } catch (err: any) {
            showToast(err.message || 'Failed to change password', 'error');
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.5, textAlign: 'center' }}>
                            Update your password regularly to keep your account secure. Click the button below to receive a verification code at your registered email address.
                        </p>

                        <div style={{
                            padding: '16px',
                            background: 'var(--secondary-color)',
                            borderRadius: '16px',
                            textAlign: 'center',
                            border: '1px dashed var(--border-color)',
                            color: 'var(--text-primary)',
                            fontWeight: 600,
                            letterSpacing: '0.5px'
                        }}>
                            {userEmail ? (
                                <span style={{ opacity: 0.8 }}>Sending code to:<br /></span>
                            ) : null}
                            <span style={{ color: 'var(--primary-color)' }}>
                                {userEmail || 'Fetching your email...'}
                            </span>
                        </div>

                        <button
                            onClick={handleSendOTP}
                            className="btn btn-primary"
                            disabled={loading || !userEmail}
                            style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '12px' }}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send Verification Code'}
                        </button>
                    </div>
                );
            case 2:
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                            Enter the 6-digit code sent to {userEmail}
                        </p>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={1}
                                    className="otp-input"
                                    autoFocus={i === 0}
                                    style={{ textAlign: 'center' }}
                                    value={digit}
                                    onPaste={(e) => {
                                        if (i !== 0) return;
                                        const pasted = e.clipboardData.getData('text').slice(0, 6).replace(/[^0-9]/g, '');
                                        if (pasted.length === 6) {
                                            setOtp(pasted.split(''));
                                            (e.target as HTMLInputElement).blur();
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Backspace' && !digit && i > 0) {
                                            const prev = (e.target as HTMLInputElement).previousSibling as HTMLInputElement;
                                            if (prev) prev.focus();
                                        }
                                    }}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9]/g, '').slice(-1);
                                        const newOtp = [...otp];
                                        newOtp[i] = val;
                                        setOtp(newOtp);

                                        if (val && i < 5) {
                                            const nextInput = (e.target.nextSibling as HTMLInputElement);
                                            if (nextInput) nextInput.focus();
                                        }
                                    }}
                                />
                            ))}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button
                                onClick={handleVerifyOTP}
                                className="btn btn-primary"
                                disabled={loading || otp.some(d => !d)}
                                style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                Verify OTP
                            </button>
                            <button
                                onClick={handleSendOTP}
                                disabled={loading || resendTimer > 0}
                                className="btn btn-outline"
                                style={{ border: 'none', color: resendTimer > 0 ? 'var(--text-secondary)' : 'var(--primary-color)', fontSize: '14px' }}
                            >
                                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend Verification Code'}
                            </button>
                        </div>
                        <button
                            onClick={() => setCurrentStep(1)}
                            className="btn btn-outline"
                            style={{ border: 'none', color: 'var(--primary-color)' }}
                        >
                            Back
                        </button>
                    </div>
                );
            case 3:
                return (
                    <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showNewPass ? "text" : "password"}
                                    className="input-field"
                                    placeholder=" "
                                    value={passwordData.new}
                                    onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                                />
                                <label className="input-label">New Password</label>
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowNewPass(!showNewPass)}
                                >
                                    {showNewPass ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showConfirmPass ? "text" : "password"}
                                    className="input-field"
                                    placeholder=" "
                                    value={passwordData.confirm}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                />
                                <label className="input-label">Confirm New Password</label>
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                                >
                                    {showConfirmPass ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                                {passwordData.confirm && (
                                    <div style={{
                                        fontSize: '12px',
                                        marginTop: '4px',
                                        fontWeight: 600,
                                        color: passwordData.new === passwordData.confirm ? '#10b981' : '#ef4444',
                                        paddingLeft: '4px'
                                    }}>
                                        {passwordData.new === passwordData.confirm ? '✓ Passwords Match' : '✕ Passwords Do Not Match'}
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || !isPasswordValid || !doPasswordsMatch}
                            style={{ marginTop: '20px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Update Password'}
                        </button>
                    </form>
                );
        }
    };

    return (
        <div className="profile-container premium-bg">
            <div className="screen-header">
                <div className="max-w-content" style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '16px' }}>
                    <button className="nav-icon-btn ripple" onClick={handleBack}>
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="screen-header-title">Change Password</h2>
                </div>
            </div>

            <div style={{ flex: 1, padding: '24px 20px', position: 'relative' }}>
                {loading && (
                    <LoadingOverlay
                        message={currentStep === 1 ? "Sending OTP..." : (currentStep === 2 ? "Verifying..." : "Updating Password...")}
                    />
                )}
                {renderStep()}
            </div>
        </div>
    );
};

export default ChangePassword;
