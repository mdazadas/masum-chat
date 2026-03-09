import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff, MessageCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { insforge } from '../lib/insforge';

const Login = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email);
  const isPasswordValid = password.length >= 6;
  const isFormValid = isEmailValid && isPasswordValid;

  // Auto-redirect if already logged in (InsForge native)
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await insforge.auth.getCurrentSession();
      if (data?.session) {
        navigate('/home', { replace: true });
      }
    };
    checkSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Official InsForge authentication
      const { data, error } = await insforge.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password
      });

      if (error) throw error;

      if (data?.accessToken) {
        showToast('Welcome back to Masum Chat!', 'success');

        // Notify DataContext of auth change
        window.dispatchEvent(new Event('masum-auth-change'));

        setTimeout(() => {
          navigate('/home', { replace: true });
        }, 300);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      const message = err.message || 'Login failed. Check credentials.';
      showToast(message, 'error');
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
        <h1 className="auth-title">Masum Chat</h1>
        <p className="auth-subtitle">Welcome back! Please login to your account.</p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <input
              type="email"
              id="email"
              className={`input-field ${email && !isEmailValid ? 'error' : ''}`}
              placeholder=" "
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              inputMode="email"
            />
            <label htmlFor="email" className="input-label">Email Address</label>
          </div>

          <div className="form-group">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              className={`input-field ${password && !isPasswordValid ? 'error' : ''}`}
              placeholder=" "
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <label htmlFor="password" className="input-label">Password</label>
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div style={{ textAlign: 'right', marginBottom: '20px' }}>
            <Link to="/forgot-password" className="auth-link">Forgot Password?</Link>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading || !isFormValid}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span className="spinner-small" /> Logging in...
              </span>
            ) : (
              <><LogIn size={20} /> Login</>
            )}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/create-account" className="auth-link">Sign Up</Link>
        </p>
      </div>
      <style>{`
        .input-field.error {
          border-color: #ef4444;
          box-shadow: 0 0 0 1px #ef4444;
        }
        .input-field:focus {
          background: var(--surface-color);
          border-color: var(--primary-color);
          box-shadow: 0 4px 12px var(--primary-light);
        }
        .auth-card {
          animation: slideUpFade 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div >
  );
};

export default Login;
