import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Bell, Eye, Trash2, Lock, Mail, AlertTriangle, Save } from 'lucide-react';
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { PageLoader } from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/api';

function Toggle({ enabled, onChange, label, description }) {
  return (
    <div style={toggleStyles.row}>
      <div style={toggleStyles.text}>
        <span style={toggleStyles.label}>{label}</span>
        {description && <span style={toggleStyles.desc}>{description}</span>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        style={{
          ...toggleStyles.track,
          background: enabled ? 'var(--accent)' : 'var(--border)',
        }}
      >
        <span
          style={{
            ...toggleStyles.thumb,
            transform: enabled ? 'translateX(24px)' : 'translateX(2px)',
          }}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    pushNotifications: true,
    newListings: true,
    priceDrops: false,
    messages: true,
    marketing: false,
  });

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showEmail: false,
    showPhone: false,
    indexProfile: true,
  });

  const handlePasswordChange = async () => {
    const errs = {};
    if (!passwordForm.current) errs.current = 'Current password is required';
    if (!passwordForm.newPassword) errs.newPassword = 'New password is required';
    else if (passwordForm.newPassword.length < 6) errs.newPassword = 'Must be at least 6 characters';
    if (passwordForm.newPassword !== passwordForm.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setPasswordErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setPasswordSaving(true);
    setPasswordSaved(false);
    try {
      await api.put('/users/password', {
        currentPassword: passwordForm.current,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ current: '', newPassword: '', confirmPassword: '' });
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch (err) {
      setPasswordErrors({ submit: err.message || 'Failed to update password' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteText !== 'DELETE') return;
    setDeleting(true);
    try {
      await api.delete('/users/account');
      await logout();
      navigate('/');
    } catch (err) {
      setDeleting(false);
    }
  };

  const tabs = [
    { key: 'account', label: 'Account', icon: Shield },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'privacy', label: 'Privacy', icon: Eye },
    { key: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ];

  return (
    <div className="page-enter" style={styles.page}>
      <div className="container" style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Settings</h1>
          <p style={styles.subtitle}>Manage your account preferences</p>
        </div>

        <div style={styles.layout}>
          <nav style={styles.sidebar}>
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  ...styles.tabBtn,
                  ...(activeTab === tab.key ? styles.tabBtnActive : {}),
                  ...(tab.key === 'danger' ? styles.tabDanger : {}),
                }}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>

          <div style={styles.content}>
            {activeTab === 'account' && (
              <div style={{ animation: 'slideUp 0.3s ease' }}>
                <Card>
                  <CardHeader>
                    <div style={styles.cardTitle}>
                      <Mail size={20} color="var(--accent)" />
                      <span>Email Address</span>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div style={styles.emailRow}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 2px' }}>{user?.email}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: 0 }}>
                          Your email address is used for login and notifications
                        </p>
                      </div>
                      <Badge variant="success" size="sm">Active</Badge>
                    </div>
                  </CardBody>
                </Card>

                <Card style={{ marginTop: 20 }}>
                  <CardHeader>
                    <div style={styles.cardTitle}>
                      <Lock size={20} color="var(--accent)" />
                      <span>Change Password</span>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div style={styles.formStack}>
                      <Input
                        label="Current Password"
                        type="password"
                        placeholder="Enter current password"
                        value={passwordForm.current}
                        onChange={(e) => setPasswordForm(p => ({ ...p, current: e.target.value }))}
                        error={passwordErrors.current}
                      />
                      <Input
                        label="New Password"
                        type="password"
                        placeholder="Enter new password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                        error={passwordErrors.newPassword}
                      />
                      <Input
                        label="Confirm New Password"
                        type="password"
                        placeholder="Confirm new password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                        error={passwordErrors.confirmPassword}
                      />
                    </div>
                  </CardBody>
                  <CardFooter>
                    {passwordSaved && (
                      <span style={{ fontSize: 13, color: 'var(--success)', marginRight: 'auto' }}>
                        Password updated!
                      </span>
                    )}
                    {passwordErrors.submit && (
                      <span style={{ fontSize: 13, color: 'var(--error)', marginRight: 'auto' }}>
                        {passwordErrors.submit}
                      </span>
                    )}
                    <Button variant="primary" size="sm" onClick={handlePasswordChange} loading={passwordSaving} icon={Save}>
                      Update Password
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div style={{ animation: 'slideUp 0.3s ease' }}>
                <Card>
                  <CardHeader>
                    <div style={styles.cardTitle}>
                      <Bell size={20} color="var(--accent)" />
                      <span>Notification Preferences</span>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div style={styles.toggleSection}>
                      <p style={styles.sectionLabel}>Email Notifications</p>
                      <Toggle
                        enabled={notifications.emailAlerts}
                        onChange={(v) => setNotifications(p => ({ ...p, emailAlerts: v }))}
                        label="Email alerts"
                        description="Receive important updates via email"
                      />
                      <Toggle
                        enabled={notifications.newListings}
                        onChange={(v) => setNotifications(p => ({ ...p, newListings: v }))}
                        label="New listings in your area"
                        description="Get notified when new items are listed near you"
                      />
                      <Toggle
                        enabled={notifications.priceDrops}
                        onChange={(v) => setNotifications(p => ({ ...p, priceDrops: v }))}
                        label="Price drop alerts"
                        description="Know when items in your wishlist drop in price"
                      />
                      <Toggle
                        enabled={notifications.messages}
                        onChange={(v) => setNotifications(p => ({ ...p, messages: v }))}
                        label="New messages"
                        description="Get notified when someone messages you"
                      />
                      <Toggle
                        enabled={notifications.marketing}
                        onChange={(v) => setNotifications(p => ({ ...p, marketing: v }))}
                        label="Marketing & promotions"
                        description="Receive tips, offers, and platform updates"
                      />
                    </div>
                    <div style={styles.toggleSection}>
                      <p style={styles.sectionLabel}>Push Notifications</p>
                      <Toggle
                        enabled={notifications.pushNotifications}
                        onChange={(v) => setNotifications(p => ({ ...p, pushNotifications: v }))}
                        label="Push notifications"
                        description="Receive push notifications in your browser"
                      />
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div style={{ animation: 'slideUp 0.3s ease' }}>
                <Card>
                  <CardHeader>
                    <div style={styles.cardTitle}>
                      <Eye size={20} color="var(--accent)" />
                      <span>Privacy Settings</span>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div style={styles.toggleSection}>
                      <p style={styles.sectionLabel}>Profile Visibility</p>
                      <Toggle
                        enabled={privacy.profileVisible}
                        onChange={(v) => setPrivacy(p => ({ ...p, profileVisible: v }))}
                        label="Public profile"
                        description="Allow other users to view your profile"
                      />
                      <Toggle
                        enabled={privacy.showEmail}
                        onChange={(v) => setPrivacy(p => ({ ...p, showEmail: v }))}
                        label="Show email on profile"
                        description="Display your email address on your public profile"
                      />
                      <Toggle
                        enabled={privacy.showPhone}
                        onChange={(v) => setPrivacy(p => ({ ...p, showPhone: v }))}
                        label="Show phone on profile"
                        description="Display your phone number on your public profile"
                      />
                      <Toggle
                        enabled={privacy.indexProfile}
                        onChange={(v) => setPrivacy(p => ({ ...p, indexProfile: v }))}
                        label="Search engine indexing"
                        description="Allow search engines to index your profile page"
                      />
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}

            {activeTab === 'danger' && (
              <div style={{ animation: 'slideUp 0.3s ease' }}>
                <Card style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
                  <CardHeader>
                    <div style={styles.cardTitle}>
                      <AlertTriangle size={20} color="var(--error)" />
                      <span style={{ color: 'var(--error)' }}>Danger Zone</span>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div style={styles.dangerContent}>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>Delete Account</p>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                          Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                      </div>
                      <Button
                        variant="danger"
                        icon={Trash2}
                        onClick={() => setShowDeleteModal(true)}
                      >
                        Delete Account
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteText(''); }}
        title="Delete Account"
        size="sm"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, width: '100%' }}>
            <Button variant="ghost" onClick={() => { setShowDeleteModal(false); setDeleteText(''); }}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              loading={deleting}
              disabled={deleteText !== 'DELETE'}
            >
              Delete Permanently
            </Button>
          </div>
        }
      >
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={styles.deleteIcon}>
            <AlertTriangle size={32} color="var(--error)" />
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '16px 0 12px' }}>
            This will permanently delete your account, all your listings, messages, and data.
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '0 0 16px' }}>
            Type <strong style={{ color: 'var(--error)' }}>DELETE</strong> to confirm:
          </p>
          <Input
            placeholder="Type DELETE"
            value={deleteText}
            onChange={(e) => setDeleteText(e.target.value)}
            error={deleteText && deleteText !== 'DELETE' ? 'Type DELETE to confirm' : ''}
          />
        </div>
      </Modal>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const toggleStyles = {
  row: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 0', borderBottom: '1px solid var(--border-light)',
  },
  text: { display: 'flex', flexDirection: 'column', gap: 3 },
  label: { fontSize: 14, fontWeight: 500, color: 'var(--text)' },
  desc: { fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.4 },
  track: {
    width: 44, height: 24, borderRadius: 12, padding: 0,
    border: 'none', cursor: 'pointer', position: 'relative',
    transition: 'background var(--transition)', flexShrink: 0,
  },
  thumb: {
    width: 18, height: 18, borderRadius: '50%', background: '#fff',
    position: 'absolute', top: 3, left: 0,
    transition: 'transform var(--transition)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
  },
};

const styles = {
  page: { padding: '40px 0 80px' },
  container: { maxWidth: 960, margin: '0 auto', padding: '0 24px' },
  header: { marginBottom: 40 },
  title: { fontSize: 30, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px', letterSpacing: '-0.4px' },
  subtitle: { fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.5 },
  layout: { display: 'grid', gridTemplateColumns: '230px 1fr', gap: 28, alignItems: 'start' },
  sidebar: {
    display: 'flex', flexDirection: 'column', gap: 4,
    background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)',
    padding: 8, border: '1px solid var(--border-light)',
    position: 'sticky', top: 96,
    boxShadow: 'var(--shadow-card)',
  },
  tabBtn: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '11px 16px', borderRadius: 'var(--radius-md)',
    fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)',
    border: 'none', background: 'none', cursor: 'pointer',
    transition: 'all var(--transition)', textAlign: 'left', width: '100%',
  },
  tabBtnActive: {
    background: 'var(--accent-light)', color: 'var(--accent)',
    boxShadow: 'inset 3px 0 0 var(--accent)',
  },
  tabDanger: {
    color: 'var(--error)',
  },
  content: { minWidth: 0 },
  cardTitle: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 16, fontWeight: 600, color: 'var(--text)' },
  formStack: { display: 'flex', flexDirection: 'column', gap: 22 },
  emailRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 18px', borderRadius: 'var(--radius-lg)', background: 'var(--bg)',
    border: '1px solid var(--border-light)',
  },
  toggleSection: { marginBottom: 28 },
  sectionLabel: {
    fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px',
    color: 'var(--text-tertiary)', margin: '0 0 10px',
  },
  dangerContent: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px', borderRadius: 'var(--radius-xl)', background: 'var(--error-bg)',
    border: '1px solid var(--error-border)',
  },
  deleteIcon: {
    width: 72, height: 72, borderRadius: '50%', background: 'var(--error-bg)',
    border: '2px solid var(--error-border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
  },
};
