import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const styles = `
  @keyframes authFadeIn {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes authSlideIn {
    from { opacity: 0; transform: translateX(-24px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes orbFloat {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(30px, -20px) scale(1.04); }
    66% { transform: translate(-15px, 15px) scale(0.96); }
  }
  @keyframes gridScroll {
    0% { background-position: 0 0; }
    100% { background-position: 60px 60px; }
  }
  @keyframes pulseGlow {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }

  .auth-page {
    min-height: 100vh;
    display: flex;
  }

  .auth-left {
    flex: 1;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 45%, var(--primary-lighter) 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px;
    position: relative;
    overflow: hidden;
  }
  .auth-left-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
    background-size: 60px 60px;
    animation: gridScroll 20s linear infinite;
    pointer-events: none;
  }
  .auth-left-orb-1 {
    position: absolute;
    width: 400px;
    height: 400px;
    border-radius: 50%;
    background: rgba(233, 69, 96, 0.12);
    filter: blur(80px);
    top: -100px;
    right: -100px;
    animation: orbFloat 10s ease-in-out infinite;
    pointer-events: none;
  }
  .auth-left-orb-2 {
    position: absolute;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: rgba(15, 52, 96, 0.25);
    filter: blur(60px);
    bottom: -80px;
    left: -80px;
    animation: orbFloat 12s ease-in-out infinite 2s;
    pointer-events: none;
  }
  .auth-left-content {
    position: relative;
    z-index: 2;
    text-align: center;
    max-width: 400px;
    animation: authSlideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .auth-left-logo {
    width: 68px;
    height: 68px;
    border-radius: var(--radius-xl);
    background: linear-gradient(135deg, var(--accent), #ff6b81);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 28px;
    box-shadow: 0 4px 28px rgba(233, 69, 96, 0.4);
  }
  .auth-left-logo-text {
    color: #fff;
    font-size: 28px;
    font-weight: 800;
    line-height: 1;
  }
  .auth-left-title {
    font-size: 32px;
    font-weight: 800;
    color: #fff;
    letter-spacing: -1px;
    margin-bottom: 16px;
    line-height: 1.2;
  }
  .auth-left-desc {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.5);
    line-height: 1.7;
    margin-bottom: 40px;
  }
  .auth-left-features {
    display: flex;
    flex-direction: column;
    gap: 16px;
    text-align: left;
  }
  .auth-left-feature {
    display: flex;
    align-items: center;
    gap: 14px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
    font-weight: 500;
  }
  .auth-left-feature-icon {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-sm);
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--accent);
  }

  .auth-right {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px;
    background: var(--bg-secondary);
    position: relative;
  }
  .auth-form-wrapper {
    width: 100%;
    max-width: 400px;
    animation: authFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both;
  }
  .auth-form-header {
    margin-bottom: 36px;
  }
  .auth-form-mobile-logo {
    display: none;
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
    background: linear-gradient(135deg, var(--accent), #ff6b81);
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
    box-shadow: 0 4px 16px rgba(233, 69, 96, 0.3);
  }
  .auth-form-mobile-logo span {
    color: #fff;
    font-size: 22px;
    font-weight: 800;
  }
  .auth-form-title {
    font-size: 28px;
    font-weight: 800;
    color: var(--text);
    letter-spacing: -0.8px;
    margin-bottom: 8px;
  }
  .auth-form-subtitle {
    font-size: 15px;
    color: var(--text-secondary);
  }
  .auth-form-subtitle a {
    color: var(--accent);
    font-weight: 600;
    transition: color var(--transition);
  }
  .auth-form-subtitle a:hover {
    color: var(--accent-hover);
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .auth-form .input-group {
    margin-bottom: 0;
  }
  .auth-form .input {
    padding: 12px 16px;
    padding-left: 44px;
    height: 48px;
    font-size: 14px;
    border-radius: var(--radius-md);
    border: 1.5px solid var(--border);
    background: var(--bg-secondary);
    transition: all var(--transition);
  }
  .auth-form .input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-light);
    outline: none;
  }
  .auth-form .input-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-tertiary);
    pointer-events: none;
    transition: color var(--transition);
  }
  .auth-form .input:focus ~ .input-icon,
  .auth-form .input-wrapper:focus-within .input-icon {
    color: var(--accent);
  }
  .auth-form .input-wrapper {
    position: relative;
  }
  .auth-form .input-label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 6px;
  }

  .password-field {
    position: relative;
  }
  .password-toggle {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-tertiary);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    transition: color var(--transition);
    background: none;
    border: none;
  }
  .password-toggle:hover {
    color: var(--text);
  }

  .auth-error-banner {
    background: var(--error-bg);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: var(--radius-md);
    padding: 12px 16px;
    font-size: 13px;
    color: var(--error);
    font-weight: 500;
    animation: authFadeIn 0.3s ease both;
  }

  .auth-divider {
    display: flex;
    align-items: center;
    gap: 16px;
    color: var(--text-tertiary);
    font-size: 13px;
  }
  .auth-divider::before,
  .auth-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  .auth-footer-text {
    text-align: center;
    margin-top: 32px;
    font-size: 14px;
    color: var(--text-secondary);
  }

  @media (max-width: 1024px) {
    .auth-page { flex-direction: column; }
    .auth-left {
      min-height: auto;
      padding: 48px 24px;
    }
    .auth-left-features { display: none; }
    .auth-left-title { font-size: 24px; }
    .auth-left-desc { margin-bottom: 0; font-size: 14px; }
    .auth-right {
      padding: 40px 24px 60px;
    }
    .auth-form-mobile-logo { display: flex; }
  }
  @media (max-width: 640px) {
    .auth-left { padding: 36px 20px; }
    .auth-right { padding: 32px 20px 48px; }
  }
`;

const features = [
  { icon: Zap, text: 'List items in under 60 seconds' },
  { icon: Zap, text: 'Connect with verified buyers & sellers' },
  { icon: Zap, text: 'Secure messaging and transactions' },
];

export default function Login() {
  const navigate = useNavigate();
  const { user, loading: authLoading, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  function validate() {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Please enter a valid email';
    }
    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setApiError(err?.message || 'Invalid email or password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg-secondary)'
      }}>
        <div className="spinner-svg" style={{ width: 40, height: 40 }}>
          <svg viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4"
              stroke="var(--accent)" strokeDasharray="80 40" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="auth-page">
        <div className="auth-left">
          <div className="auth-left-grid" />
          <div className="auth-left-orb-1" />
          <div className="auth-left-orb-2" />
          <div className="auth-left-content">
            <div className="auth-left-logo">
              <span className="auth-left-logo-text">N</span>
            </div>
            <h1 className="auth-left-title">
              Welcome back to<br />Nexus
            </h1>
            <p className="auth-left-desc">
              Sign in to access your listings, messages, and marketplace activity.
            </p>
            <div className="auth-left-features">
              {features.map((f, i) => (
                <div key={i} className="auth-left-feature">
                  <div className="auth-left-feature-icon">
                    <f.icon size={16} />
                  </div>
                  {f.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-form-wrapper">
            <div className="auth-form-header">
              <div className="auth-form-mobile-logo">
                <span>N</span>
              </div>
              <h2 className="auth-form-title">Sign In</h2>
              <p className="auth-form-subtitle">
                Don't have an account?{' '}
                <Link to="/register">Create one</Link>
              </p>
            </div>

            {apiError && (
              <div className="auth-error-banner">{apiError}</div>
            )}

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div>
                <label className="auth-form .input-label" style={{
                  display: 'block', fontSize: 13, fontWeight: 600,
                  color: 'var(--text)', marginBottom: 6
                }}>Email</label>
                <div className="input-wrapper" style={{ position: 'relative' }}>
                  <Mail size={18} style={{
                    position: 'absolute', left: 14, top: '50%',
                    transform: 'translateY(-50%)', color: errors.email ? 'var(--error)' : 'var(--text-tertiary)',
                    pointerEvents: 'none', zIndex: 2, transition: 'color 0.2s'
                  }} />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: '' })); setApiError(''); }}
                    style={{
                      width: '100%', height: 48, padding: '12px 16px 12px 44px',
                      fontSize: 14, borderRadius: 'var(--radius-md)',
                      border: `1.5px solid ${errors.email ? 'var(--error)' : 'var(--border)'}`,
                      background: 'var(--bg-secondary)', color: 'var(--text)',
                      transition: 'all 0.2s', outline: 'none',
                      boxSizing: 'border-box', fontFamily: 'inherit',
                    }}
                    onFocus={(e) => { if (!errors.email) e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-light)'; }}
                    onBlur={(e) => { if (!errors.email) e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                {errors.email && (
                  <p style={{ fontSize: 12, color: 'var(--error)', marginTop: 6, fontWeight: 500 }}>{errors.email}</p>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block', fontSize: 13, fontWeight: 600,
                  color: 'var(--text)', marginBottom: 6
                }}>Password</label>
                <div className="password-field" style={{ position: 'relative' }}>
                  <Lock size={18} style={{
                    position: 'absolute', left: 14, top: '50%',
                    transform: 'translateY(-50%)', color: errors.password ? 'var(--error)' : 'var(--text-tertiary)',
                    pointerEvents: 'none', zIndex: 2, transition: 'color 0.2s'
                  }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: '' })); setApiError(''); }}
                    style={{
                      width: '100%', height: 48, padding: '12px 44px 12px 44px',
                      fontSize: 14, borderRadius: 'var(--radius-md)',
                      border: `1.5px solid ${errors.password ? 'var(--error)' : 'var(--border)'}`,
                      background: 'var(--bg-secondary)', color: 'var(--text)',
                      transition: 'all 0.2s', outline: 'none',
                      boxSizing: 'border-box', fontFamily: 'inherit',
                    }}
                    onFocus={(e) => { if (!errors.password) e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-light)'; }}
                    onBlur={(e) => { if (!errors.password) e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: 12, top: '50%',
                      transform: 'translateY(-50%)', color: 'var(--text-tertiary)',
                      cursor: 'pointer', padding: 4, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', zIndex: 2,
                      background: 'none', border: 'none', transition: 'color 0.2s'
                    }}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p style={{ fontSize: 12, color: 'var(--error)', marginTop: 6, fontWeight: 500 }}>{errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={submitting}
                iconRight={!submitting ? ArrowRight : undefined}
              >
                Sign In
              </Button>
            </form>

            <p className="auth-footer-text">
              By signing in, you agree to our{' '}
              <a href="#" style={{ color: 'var(--accent)', fontWeight: 500 }}>Terms</a>
              {' '}and{' '}
              <a href="#" style={{ color: 'var(--accent)', fontWeight: 500 }}>Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
