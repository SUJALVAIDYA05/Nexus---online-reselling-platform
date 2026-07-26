import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Zap, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

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
  @keyframes strengthFill {
    from { width: 0; }
  }

  .reg-page {
    min-height: 100vh;
    display: flex;
  }

  .reg-left {
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
  .reg-left-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
    background-size: 60px 60px;
    animation: gridScroll 20s linear infinite;
    pointer-events: none;
  }
  .reg-left-orb-1 {
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
  .reg-left-orb-2 {
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
  .reg-left-content {
    position: relative;
    z-index: 2;
    text-align: center;
    max-width: 400px;
    animation: authSlideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .reg-left-logo {
    width: 64px;
    height: 64px;
    border-radius: var(--radius-lg);
    background: linear-gradient(135deg, var(--accent), #ff6b81);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 28px;
    box-shadow: 0 4px 24px rgba(233, 69, 96, 0.35);
  }
  .reg-left-logo-text {
    color: #fff;
    font-size: 28px;
    font-weight: 800;
    line-height: 1;
  }
  .reg-left-title {
    font-size: 32px;
    font-weight: 800;
    color: #fff;
    letter-spacing: -1px;
    margin-bottom: 16px;
    line-height: 1.2;
  }
  .reg-left-desc {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.5);
    line-height: 1.7;
    margin-bottom: 40px;
  }
  .reg-left-features {
    display: flex;
    flex-direction: column;
    gap: 16px;
    text-align: left;
  }
  .reg-left-feature {
    display: flex;
    align-items: center;
    gap: 14px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
    font-weight: 500;
  }
  .reg-left-feature-icon {
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

  .reg-right {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px;
    background: var(--bg-secondary);
    position: relative;
    overflow-y: auto;
  }
  .reg-form-wrapper {
    width: 100%;
    max-width: 420px;
    animation: authFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both;
  }
  .reg-form-header {
    margin-bottom: 32px;
  }
  .reg-form-mobile-logo {
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
  .reg-form-mobile-logo span {
    color: #fff;
    font-size: 22px;
    font-weight: 800;
  }
  .reg-form-title {
    font-size: 28px;
    font-weight: 800;
    color: var(--text);
    letter-spacing: -0.8px;
    margin-bottom: 8px;
  }
  .reg-form-subtitle {
    font-size: 15px;
    color: var(--text-secondary);
  }
  .reg-form-subtitle a {
    color: var(--accent);
    font-weight: 600;
    transition: color var(--transition);
  }
  .reg-form-subtitle a:hover {
    color: var(--accent-hover);
  }

  .reg-form {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .reg-field {
    position: relative;
  }
  .reg-field-label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 6px;
  }
  .reg-field-wrapper {
    position: relative;
  }
  .reg-field-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-tertiary);
    pointer-events: none;
    z-index: 2;
    transition: color var(--transition);
  }
  .reg-field-input {
    width: 100%;
    height: 48px;
    padding: 12px 16px 12px 44px;
    font-size: 14px;
    border-radius: var(--radius-md);
    border: 1.5px solid var(--border);
    background: var(--bg-secondary);
    color: var(--text);
    transition: all 0.2s;
    outline: none;
    box-sizing: border-box;
    font-family: inherit;
  }
  .reg-field-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-light);
  }
  .reg-field-input.input-error {
    border-color: var(--error);
  }
  .reg-field-input.input-error:focus {
    box-shadow: 0 0 0 3px var(--error-bg);
  }
  .reg-field-error {
    font-size: 12px;
    color: var(--error);
    margin-top: 6px;
    font-weight: 500;
  }
  .reg-field-icon.error {
    color: var(--error);
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

  .password-strength {
    margin-top: 10px;
  }
  .strength-bars {
    display: flex;
    gap: 4px;
    margin-bottom: 6px;
  }
  .strength-bar {
    flex: 1;
    height: 3px;
    border-radius: 2px;
    background: var(--border);
    overflow: hidden;
    transition: background 0.3s;
  }
  .strength-bar.filled {
    background: var(--strength-color, var(--border));
    animation: strengthFill 0.3s ease both;
  }
  .strength-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--strength-color, var(--text-tertiary));
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .password-requirements {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 10px;
  }
  .password-req {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--text-tertiary);
    transition: color 0.2s;
  }
  .password-req.met {
    color: var(--success);
  }
  .password-req-icon {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1.5px solid var(--border);
    transition: all 0.2s;
  }
  .password-req.met .password-req-icon {
    background: var(--success);
    border-color: var(--success);
    color: #fff;
  }

  .reg-error-banner {
    background: var(--error-bg);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: var(--radius-md);
    padding: 12px 16px;
    font-size: 13px;
    color: var(--error);
    font-weight: 500;
    animation: authFadeIn 0.3s ease both;
  }

  .reg-footer-text {
    text-align: center;
    margin-top: 28px;
    font-size: 14px;
    color: var(--text-secondary);
  }

  @media (max-width: 1024px) {
    .reg-page { flex-direction: column; }
    .reg-left {
      min-height: auto;
      padding: 48px 24px;
    }
    .reg-left-features { display: none; }
    .reg-left-title { font-size: 24px; }
    .reg-left-desc { margin-bottom: 0; font-size: 14px; }
    .reg-right {
      padding: 40px 24px 60px;
    }
    .reg-form-mobile-logo { display: flex; }
  }
  @media (max-width: 640px) {
    .reg-left { padding: 36px 20px; }
    .reg-right { padding: 32px 20px 48px; }
  }
`;

const features = [
  { icon: Zap, text: 'Create your first listing in under a minute' },
  { icon: Zap, text: 'Reach thousands of potential buyers' },
  { icon: Zap, text: 'Free to join, no hidden fees' },
];

function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: 'var(--border)' };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: 'var(--error)' };
  if (score <= 2) return { score: 2, label: 'Fair', color: 'var(--warning)' };
  if (score <= 3) return { score: 3, label: 'Good', color: '#3b82f6' };
  return { score: 4, label: 'Strong', color: 'var(--success)' };
}

export default function Register() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const strength = getPasswordStrength(password);

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const pwReqs = [
    { label: 'At least 6 characters', met: password.length >= 6 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(password) },
  ];

  function validate() {
    const errs = {};
    if (!name.trim()) errs.name = 'Name is required';
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
    if (!confirmPassword) {
      errs.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
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
      await signup(name, email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setApiError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function clearError(field) {
    setErrors(prev => ({ ...prev, [field]: '' }));
    setApiError('');
  }

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--bg-secondary)'
      }}>
        <div style={{ width: 40, height: 40 }}>
          <svg viewBox="0 0 50 50" style={{ width: 40, height: 40, animation: 'spin 0.8s linear infinite' }}>
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
      <div className="reg-page">
        <div className="reg-left">
          <div className="reg-left-grid" />
          <div className="reg-left-orb-1" />
          <div className="reg-left-orb-2" />
          <div className="reg-left-content">
            <div className="reg-left-logo">
              <span className="reg-left-logo-text">N</span>
            </div>
            <h1 className="reg-left-title">
              Join the Nexus<br />Community
            </h1>
            <p className="reg-left-desc">
              Create your account and start buying or selling on India's fastest growing marketplace.
            </p>
            <div className="reg-left-features">
              {features.map((f, i) => (
                <div key={i} className="reg-left-feature">
                  <div className="reg-left-feature-icon">
                    <f.icon size={16} />
                  </div>
                  {f.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="reg-right">
          <div className="reg-form-wrapper">
            <div className="reg-form-header">
              <div className="reg-form-mobile-logo">
                <span>N</span>
              </div>
              <h2 className="reg-form-title">Create Account</h2>
              <p className="reg-form-subtitle">
                Already have an account?{' '}
                <Link to="/login">Sign in</Link>
              </p>
            </div>

            {apiError && (
              <div className="reg-error-banner">{apiError}</div>
            )}

            <form className="reg-form" onSubmit={handleSubmit} noValidate>
              <div className="reg-field">
                <label className="reg-field-label">Full Name</label>
                <div className="reg-field-wrapper">
                  <User size={18} className={`reg-field-icon ${errors.name ? 'error' : ''}`} />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => { setName(e.target.value); clearError('name'); }}
                    className={`reg-field-input ${errors.name ? 'input-error' : ''}`}
                  />
                </div>
                {errors.name && <p className="reg-field-error">{errors.name}</p>}
              </div>

              <div className="reg-field">
                <label className="reg-field-label">Email</label>
                <div className="reg-field-wrapper">
                  <Mail size={18} className={`reg-field-icon ${errors.email ? 'error' : ''}`} />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
                    className={`reg-field-input ${errors.email ? 'input-error' : ''}`}
                  />
                </div>
                {errors.email && <p className="reg-field-error">{errors.email}</p>}
              </div>

              <div className="reg-field">
                <label className="reg-field-label">Password</label>
                <div className="reg-field-wrapper">
                  <Lock size={18} className={`reg-field-icon ${errors.password ? 'error' : ''}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
                    className={`reg-field-input ${errors.password ? 'input-error' : ''}`}
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="reg-field-error">{errors.password}</p>}

                {password.length > 0 && (
                  <div className="password-strength">
                    <div className="strength-bars">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`strength-bar ${i <= strength.score ? 'filled' : ''}`}
                          style={{ '--strength-color': strength.color }}
                        />
                      ))}
                    </div>
                    <span className="strength-label" style={{ '--strength-color': strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                )}

                <div className="password-requirements">
                  {pwReqs.map((req, i) => (
                    <div key={i} className={`password-req ${req.met ? 'met' : ''}`}>
                      <span className="password-req-icon">
                        {req.met ? <Check size={10} /> : null}
                      </span>
                      {req.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="reg-field">
                <label className="reg-field-label">Confirm Password</label>
                <div className="reg-field-wrapper">
                  <Lock size={18} className={`reg-field-icon ${errors.confirmPassword ? 'error' : ''}`} />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); clearError('confirmPassword'); }}
                    className={`reg-field-input ${errors.confirmPassword ? 'input-error' : ''}`}
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirm(!showConfirm)}
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="reg-field-error">{errors.confirmPassword}</p>}
              </div>

              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={submitting}
                iconRight={!submitting ? ArrowRight : undefined}
              >
                Create Account
              </Button>
            </form>

            <p className="reg-footer-text">
              By creating an account, you agree to our{' '}
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
