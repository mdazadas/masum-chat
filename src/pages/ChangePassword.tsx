import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

import { insforge } from '../lib/insforge';
import LoadingOverlay from '../components/LoadingOverlay';

const ChangePassword = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();

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
    const [step, setStep] = useState(1); // 1: Initial, 2: OTP, 3: New Password
    const [resetToken, setResetToken] = useState('');



    const handleSendOTP = async () => {
        setLoading(true);
        try {
            const { error } = await insforge.auth.sendResetPasswordEmail({
                email: userEmail
            });
            if (error) throw error;
            setStep(2);
            showToast('OTP sent to your email', 'success');
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
        if (passwordData.new !== passwordData.confirm) {
            showToast('Passwords do not match', 'error');
            return;
        }

        setLoading(true);
        try {
            const { error } = await insforge.auth.resetPassword({
                otp: resetToken,
                newPassword: passwordData.new
            });
            if (error) throw error;

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
        switch (step) {
            case 1:
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                            Update your password regularly to keep your account secure. Enter your account email to receive a verification code.
                        </p>
                        <div className="form-group" style={{ margin: 0 }}>
                            <input
                                type="email"
                                className="input-field"
                                placeholder=" "
                                value={userEmail}
                                onChange={(e) => setUserEmail(e.target.value)}
                            />
                            <label className="input-label">Email Address</label>
                        </div>
                        <button
                            onClick={handleSendOTP}
                            className="btn btn-primary"
                            disabled={loading || !userEmail}
                            style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
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
                                    style={{ textAlign: 'center' }}
                                    value={digit}
                                    onChange={(e) => {
                                        const newOtp = [...otp];
                                        newOtp[i] = e.target.value.replace(/[^0-9]/g, '').slice(-1);
                                        setOtp(newOtp);
                                        // Auto focus next
                                        if (e.target.value && i < 5) {
                                            const nextInput = (e.target.nextSibling as HTMLInputElement);
                                            if (nextInput) nextInput.focus();
                                        }
                                    }}
                                />
                            ))}
                        </div>
                        <button
                            onClick={handleVerifyOTP}
                            className="btn btn-primary"
                            disabled={loading}
                            style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify OTP'}
                        </button>
                        <button
                            onClick={() => setStep(1)}
                            className="btn btn-outline"
                            style={{ border: 'none', color: 'var(--primary-color)' }}
                        >
                            Change Email / Back
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

                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '20px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Update Password'}
                        </button>
                    </form>
                );
        }
    };

    return (
        <div className="home-container" style={{ backgroundColor: 'var(--surface-color)' }}>
            {/* Header */}
            <nav className="top-nav">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="nav-icon-btn" onClick={handleBack}>
                        <ArrowLeft size={24} />
                    </button>
                    <div className="top-nav-title">Change Password</div>
                </div>
            </nav>

            <div style={{ flex: 1, padding: '24px 20px', position: 'relative' }}>
                {loading && <LoadingOverlay message={step === 2 ? "Verifying..." : "Sending..."} />}
                {renderStep()}
            </div>
        </div>
    );
};

export default ChangePassword;
