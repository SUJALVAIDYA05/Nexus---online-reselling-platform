import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import PageTransition from '../components/ui/PageTransition';

const styles = `
  .auth-page { min-height: 85vh; display: flex; align-items: center; justify-content: center; padding: 40px 24px; }
  .auth-card { width: 100%; max-width: 440px; background: var(--bg-glass); backdrop-filter: blur(20px); border: 1px solid var(--border); border-radius: var(--radius-2xl); padding: 40px; box-shadow: var(--shadow-2xl); }
  .auth-logo { width: 48px; height: 48px; border-radius: var(--radius-lg); background: var(--gradient-primary); color: white; font-weight: 900; font-size: 24px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; box-shadow: 0 4px 20px rgba(244,63,94,0.4); }
  .auth-title { font-size: 26px; font-weight: 800; color: #ffffff; text-align: center; margin-bottom: 8px; }
  .auth-sub { font-size: 14px; color: var(--text-tertiary); text-align: center; margin-bottom: 28px; }
`;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <style>{styles}</style>
      <div className="auth-page">
        <motion.div 
          className="auth-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="auth-logo">N</div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-sub">Sign in to manage your listings and messages</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              icon={Mail}
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />

            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={Lock}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 12, marginTop: 4, cursor: 'pointer', float: 'right' }}
              >
                {showPassword ? 'Hide Password' : 'Show Password'}
              </button>
            </div>

            {error && <p className="input-error-text" style={{ marginTop: 4 }}>{error}</p>}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              iconRight={ArrowRight}
            >
              Sign In to Account
            </Button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-tertiary)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
              Create Account
            </Link>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
