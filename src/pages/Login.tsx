import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff, MessageCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useData } from '../context/DataContext';
import { insforge } from '../lib/insforge';
import { clearAppAuthStorage, hasOAuthCallbackParams } from '../lib/authStorage';

const Login = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { setUserId } = useData();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email);
  const isPasswordValid = password.length >= 6;
  const isFormValid = isEmailValid && isPasswordValid;

  const completeLogin = (id: string, fromOAuthCallback = false) => {
    setUserId(id);
    if (fromOAuthCallback) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    navigate('/home', { replace: true });
  };

  // Auto-redirect if already logged in (InsForge native)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const oauthError = params.get('error_description') || params.get('error');
        if (oauthError) {
          showToast(decodeURIComponent(oauthError), 'error');
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }

        // Silently check session only if key exists or this is OAuth callback
        const hasSession = sessionStorage.getItem('insforge_session') || localStorage.getItem('insforge_session');
        const isOAuthCallback = hasOAuthCallbackParams();
        if (!hasSession && !isOAuthCallback) return;

        // Try-catch specifically for the SDK call to suppress 401 console logs where possible
        const { data, error } = await insforge.auth.getCurrentSession().catch(() => ({ data: null, error: true }));

        if (error) {
          // Silent cleanup only if error is definitive
          clearAppAuthStorage();
          return;
        }

        if (data?.session) {
          completeLogin(data.session.user.id, isOAuthCallback);
        }
      } catch (err) { }
    };
    checkSession();
  }, [navigate, showToast]);

  const handleOAuth = async (provider: 'google' | 'github') => {
    try {
      setLoading(true);
      const { error } = await insforge.auth.signInWithOAuth({
        provider,
        redirectTo: window.location.origin + '/login'
      });
      if (error) throw error;
    } catch (err: any) {
      showToast(`OAuth Error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

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

      if (data?.user) {
        showToast('Welcome back to Masum Chat!', 'success');
        completeLogin(data.user.id);
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
    <div className="auth-container premium-mesh-bg">
      <div className="auth-card fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="auth-brand-wrapper">
          <div className="auth-brand-icon" style={{ position: 'relative' }}>
            <div className="auth-brand-ring"></div>
            <MessageCircle size={36} color="white" fill="white" style={{ position: 'relative', zIndex: 2 }} />
          </div>
          <h1 className="auth-title">Masum Chat</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', background: 'var(--primary-light)', padding: '4px 10px', borderRadius: '12px' }}>
            <div style={{ width: '6px', height: '6px', background: 'var(--primary-color)', borderRadius: '50%' }}></div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary-dark)', letterSpacing: '0.5px' }}>SECURE LOGIN</span>
          </div>
          <p className="auth-subtitle">Welcome back! Please login to your account.</p>
        </div>

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

          <button type="submit" className="btn btn-primary" style={{ height: '54px' }} disabled={loading || !isFormValid}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span className="spinner-small" /> Logging in...
              </span>
            ) : (
              <><LogIn size={20} /> Login Now</>
            )}
          </button>
        </form>

        <div style={{ margin: '24px 0 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Or continue with</div>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
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
            <img src="https://github.com/favicon.ico" alt="GitHub" className="github-auth-icon" style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        <p className="auth-footer">
          Don't have an account? <Link to="/create-account" className="auth-link">Sign Up</Link>
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

export default Login;
