import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Calendar, Save, Shield } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { PageLoader } from '../components/ui/Spinner';
import PageTransition from '../components/ui/PageTransition';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/api';

const styles = `
  .prf-page { padding: 40px 0 80px; }
  .prf-grid { display: grid; grid-template-columns: 1fr 340px; gap: 32px; align-items: start; }
  .prf-card { background: var(--bg-glass); backdrop-filter: blur(20px); border: 1px solid var(--border); border-radius: var(--radius-2xl); padding: 36px; box-shadow: var(--shadow-xl); }
  .prf-avatar { width: 90px; height: 90px; border-radius: 50%; background: var(--gradient-primary); color: white; font-weight: 900; font-size: 32px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; box-shadow: 0 4px 20px rgba(244,63,94,0.4); }

  @media (max-width: 860px) {
    .prf-grid { grid-template-columns: 1fr; }
  }
`;

export default function Profile() {
  const navigate = useNavigate();
  const { user, setUser, loading: authLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: '', email: '', phone: '', location: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
      });
    }
  }, [user, authLoading, navigate]);

  const handleSave = async () => {
    if (!form.name.trim()) { setErrors({ name: 'Name is required' }); return; }
    setSaving(true);
    setSaved(false);
    try {
      const res = await api.put('/users/profile', {
        name: form.name.trim(),
        phone: form.phone.trim(),
        location: form.location.trim(),
      });
      if (res.user) setUser(res.user);
      else setUser({ ...user, ...form });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return <PageLoader />;

  const initials = (form.name || 'U').charAt(0).toUpperCase();

  return (
    <PageTransition>
      <style>{styles}</style>
      <div className="prf-page">
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#ffffff' }}>Account Profile</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your personal details and location settings</p>
        </div>

        <div className="prf-grid">
          <div className="prf-card">
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <User size={20} color="var(--accent)" /> Personal Details
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Input
                label="Full Name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                icon={User}
                error={errors.name}
              />
              <Input
                label="Email Address"
                value={form.email}
                disabled
                icon={Mail}
                helperText="Email is permanently bound to your account"
              />
              <Input
                label="Phone Number"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                icon={Phone}
                placeholder="+91 98765 43210"
              />
              <Input
                label="City / Location"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                icon={MapPin}
                placeholder="Mumbai, Maharashtra"
              />

              {errors.submit && <p className="input-error-text">{errors.submit}</p>}
              {saved && <p style={{ color: 'var(--success)', fontWeight: 600 }}>Profile updated successfully!</p>}

              <div style={{ marginTop: 12 }}>
                <Button variant="primary" size="lg" icon={Save} loading={saving} onClick={handleSave}>
                  Save Profile Changes
                </Button>
              </div>
            </div>
          </div>

          <div className="prf-card" style={{ textAlign: 'center' }}>
            <div className="prf-avatar">{initials}</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', marginBottom: 4 }}>{form.name}</h3>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginBottom: 24 }}>{form.email}</p>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 20, textStyle: 'left', fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: 12 }}>
                <span>Account Status</span>
                <span style={{ color: 'var(--success)', fontWeight: 700 }}>Verified Seller</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Security Rating</span>
                <span style={{ color: '#ffffff', fontWeight: 700 }}>High (Escrow Safe)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
