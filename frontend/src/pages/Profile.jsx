import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Calendar, Save, Camera, Shield, Package } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/api';

export default function Profile() {
  const navigate = useNavigate();
  const { user, setUser, loading: authLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
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

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (form.phone && !/^[+]?[\d\s-]{7,15}$/.test(form.phone)) errs.phone = 'Invalid phone number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
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

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    if (errors.submit) setErrors(prev => ({ ...prev, submit: '' }));
  };

  if (authLoading) return <PageLoader />;

  const initials = (form.name || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'N/A';

  return (
    <div className="page-enter" style={styles.page}>
      <div className="container" style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>My Profile</h1>
          <p style={styles.subtitle}>Manage your account information</p>
        </div>

        <div style={styles.grid}>
          <div style={styles.main}>
            <Card style={{ animation: 'slideUp 0.4s ease' }}>
              <CardHeader>
                <div style={styles.cardTitle}>
                  <User size={20} color="var(--accent)" />
                  <span>Personal Information</span>
                </div>
              </CardHeader>
              <CardBody>
                <div style={styles.formStack}>
                  <Input
                    label="Full Name"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    error={errors.name}
                    icon={User}
                    placeholder="Your full name"
                  />
                  <Input
                    label="Email"
                    value={form.email}
                    disabled
                    icon={Mail}
                    helperText="Email cannot be changed"
                  />
                  <Input
                    label="Phone"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    error={errors.phone}
                    icon={Phone}
                    placeholder="+91 98765 43210"
                  />
                  <Input
                    label="Location"
                    value={form.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    icon={MapPin}
                    placeholder="e.g. Mumbai, Maharashtra"
                  />
                </div>
              </CardBody>
            </Card>

            {errors.submit && (
              <div style={styles.errorBanner}>{errors.submit}</div>
            )}

            {saved && (
              <div style={styles.successBanner}>Profile updated successfully!</div>
            )}

            <div style={styles.actions}>
              <Button
                variant="primary"
                onClick={handleSave}
                loading={saving}
                icon={Save}
              >
                Save Changes
              </Button>
            </div>
          </div>

          <div style={styles.sidebar}>
            <Card style={{ animation: 'slideUp 0.5s ease' }}>
              <CardBody>
                <div style={styles.avatarSection}>
                  <div style={styles.avatarLarge}>
                    <span style={styles.avatarText}>{initials}</span>
                  </div>
                  <h3 style={styles.userName}>{form.name || 'User'}</h3>
                  <p style={styles.userEmail}>{form.email}</p>
                </div>
              </CardBody>
            </Card>

            <Card style={{ animation: 'slideUp 0.6s ease' }}>
              <CardHeader>
                <div style={styles.cardTitle}>
                  <Shield size={20} color="var(--accent)" />
                  <span>Account Info</span>
                </div>
              </CardHeader>
              <CardBody>
                <div style={styles.infoList}>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>
                      <Calendar size={14} />
                      Member since
                    </span>
                    <span style={styles.infoValue}>{memberSince}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>
                      <Package size={14} />
                      Active listings
                    </span>
                    <span style={styles.infoValue}>{user?.listingsCount || '—'}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>
                      <Mail size={14} />
                      Email verified
                    </span>
                    <Badge variant={user?.isVerified ? 'success' : 'warning'} size="sm">
                      {user?.isVerified ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: { padding: '40px 0 80px' },
  container: { maxWidth: 960, margin: '0 auto', padding: '0 24px' },
  header: { marginBottom: 40 },
  title: { fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px', letterSpacing: '-0.4px' },
  subtitle: { fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.5 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28, alignItems: 'start' },
  main: { display: 'flex', flexDirection: 'column', gap: 24 },
  sidebar: { display: 'flex', flexDirection: 'column', gap: 24, position: 'sticky', top: 96 },
  cardTitle: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 600, color: 'var(--text)' },
  formStack: { display: 'flex', flexDirection: 'column', gap: 22 },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 8 },
  avatarSection: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0 8px',
  },
  avatarLarge: {
    width: 96, height: 96, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--accent), #ff6b81)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 6px 24px rgba(233, 69, 96, 0.35)',
    marginBottom: 20,
  },
  avatarText: { fontSize: 34, fontWeight: 700, color: '#fff', letterSpacing: 1 },
  userName: { fontSize: 19, fontWeight: 600, color: 'var(--text)', margin: '0 0 4px' },
  userEmail: { fontSize: 14, color: 'var(--text-secondary)', margin: 0 },
  infoList: { display: 'flex', flexDirection: 'column', gap: 2 },
  infoRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 0', borderBottom: '1px solid var(--border-light)',
  },
  infoLabel: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 13, color: 'var(--text-secondary)',
  },
  infoValue: { fontSize: 13, fontWeight: 500, color: 'var(--text)' },
  errorBanner: {
    padding: '14px 18px', borderRadius: 'var(--radius-xl)', background: 'var(--error-bg)',
    color: 'var(--error)', fontSize: 14, border: '1px solid var(--error-border)',
  },
  successBanner: {
    padding: '14px 18px', borderRadius: 'var(--radius-xl)', background: 'var(--success-bg)',
    color: 'var(--success)', fontSize: 14, border: '1px solid var(--success-border)',
  },
};
