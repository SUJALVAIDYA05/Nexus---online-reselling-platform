import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
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

export default function Register() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Full name is required'); return; }
    if (!form.email.trim()) { setError('Email is required'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      await signup(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.message || 'Registration failed');
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
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-sub">Join thousands of buyers & sellers on Nexus</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Input
              label="Full Name"
              type="text"
              placeholder="Arjun Mehta"
              icon={User}
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              icon={Mail}
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              icon={Lock}
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />

            {error && <p className="input-error-text">{error}</p>}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              iconRight={ArrowRight}
            >
              Create Account
            </Button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-tertiary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
              Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
