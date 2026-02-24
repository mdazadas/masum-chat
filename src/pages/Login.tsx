import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff, MessageCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { insforge } from '../lib/insforge';
import { useUser } from '@insforge/react';

const Login = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, isLoaded } = useUser();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-redirect if already logged in (check both SDK and manual ID)
  useEffect(() => {
    const manualUserId = localStorage.getItem('masum_user_id');
    const hasTabSession = localStorage.getItem('masum_tab_session') === 'active';

    if ((isLoaded && user) || (manualUserId && hasTabSession)) {
      navigate('/home', { replace: true });
    }
  }, [isLoaded, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await insforge.auth.signInWithPassword({ email, password });

      if (error) {
        showToast(error.message || 'Login failed. Check credentials.', 'error');
        setLoading(false);
      } else if (data) {
        showToast('Welcome back to Masum Chat!', 'success');

        // Persist session
        localStorage.setItem('masum_tab_session', 'active');
        localStorage.setItem('masum_user_id', data.user.id);

        // Ensure email is always synced to profiles
        if (data.user?.email) {
          insforge.database
            .from('profiles')
            .update({ email: data.user.email })
            .eq('id', data.user.id)
            .is('email', null)
            .then(() => { });
        }

        // Notify DataContext to re-read userId BEFORE navigating (SDK session still hot in memory)
        window.dispatchEvent(new Event('masum-auth-change'));
        // SPA navigate — keeps SDK in-memory session alive (DO NOT use location.replace here)
        navigate('/home', { replace: true });
      } else {
        showToast('Unexpected error. Please try again.', 'error');
        setLoading(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      showToast('Something went wrong. Please try again.', 'error');
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
              className="input-field"
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
              className="input-field"
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

          <button type="submit" className="btn btn-primary" disabled={loading}>
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
    </div>
  );
};

export default Login;
