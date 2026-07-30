import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Bell, Eye, Lock, Save, Trash2 } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import PageTransition from '../components/ui/PageTransition';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/api';

const styles = `
  .st-page { padding: 40px 0 80px; }
  .st-grid { display: grid; grid-template-columns: 240px 1fr; gap: 32px; align-items: start; }
  .st-tabs { display: flex; flex-direction: column; gap: 6px; background: var(--bg-glass); backdrop-filter: blur(16px); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 12px; }
  .st-tab { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: var(--radius-md); background: transparent; color: var(--text-secondary); border: none; cursor: pointer; font-weight: 600; font-size: 14px; text-align: left; transition: all 0.2s; }
  .st-tab:hover { color: #ffffff; background: rgba(255,255,255,0.06); }
  .st-tab.active { background: rgba(244,63,94,0.15); color: #ffffff; border: 1px solid rgba(244,63,94,0.3); }

  .st-card { background: var(--bg-glass); backdrop-filter: blur(20px); border: 1px solid var(--border); border-radius: var(--radius-2xl); padding: 36px; box-shadow: var(--shadow-xl); }

  @media (max-width: 768px) {
    .st-grid { grid-template-columns: 1fr; }
  }
`;

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('security');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteText, setDeleteText] = useState('');

  const [passwordForm, setPasswordForm] = useState({
    current: '', newPassword: '', confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const handlePasswordChange = async () => {
    const errs = {};
    if (!passwordForm.current) errs.current = 'Current password is required';
    if (!passwordForm.newPassword) errs.newPassword = 'New password is required';
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
    try {
      await api.delete('/users/me');
      await logout();
      navigate('/');
    } catch {
      // silent
    }
  };

  return (
    <PageTransition>
      <style>{styles}</style>
      <div className="st-page">
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#ffffff' }}>Account Settings</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage password, notifications, and security preferences</p>
        </div>

        <div className="st-grid">
          <div className="st-tabs">
            <button className={`st-tab ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
              <Lock size={18} /> Password & Security
            </button>
            <button className={`st-tab ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
              <Bell size={18} /> Notifications
            </button>
            <button className={`st-tab ${activeTab === 'danger' ? 'active' : ''}`} onClick={() => setActiveTab('danger')}>
              <Trash2 size={18} /> Danger Zone
            </button>
          </div>

          <div className="st-card">
            {activeTab === 'security' && (
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', marginBottom: 20 }}>Change Password</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 440 }}>
                  <Input
                    label="Current Password"
                    type="password"
                    value={passwordForm.current}
                    onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                    error={passwordErrors.current}
                  />
                  <Input
                    label="New Password"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    error={passwordErrors.newPassword}
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    error={passwordErrors.confirmPassword}
                  />

                  {passwordErrors.submit && <p className="input-error-text">{passwordErrors.submit}</p>}
                  {passwordSaved && <p style={{ color: 'var(--success)', fontWeight: 600 }}>Password updated successfully!</p>}

                  <Button variant="primary" icon={Save} loading={passwordSaving} onClick={handlePasswordChange}>
                    Update Password
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', marginBottom: 20 }}>Email & Alert Preferences</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <label style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ width: 18, height: 18, accentColor: 'var(--accent)' }} />
                    Email notifications for new buyer chat messages
                  </label>
                  <label style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ width: 18, height: 18, accentColor: 'var(--accent)' }} />
                    Order status & shipment updates
                  </label>
                  <label style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ width: 18, height: 18, accentColor: 'var(--accent)' }} />
                    Wishlist price drop alerts
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'danger' && (
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--error)', marginBottom: 12 }}>Delete Account</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
                  Permanently erase your Nexus profile, active listings, and message history.
                </p>
                <Button variant="danger" icon={Trash2} onClick={() => setShowDeleteModal(true)}>
                  Delete My Account
                </Button>
              </div>
            )}
          </div>
        </div>

        <Modal
          open={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Confirm Account Deletion"
        >
          <div style={{ padding: '10px 0 20px' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              Type <strong>DELETE</strong> below to confirm permanent account removal.
            </p>
            <Input
              value={deleteText}
              onChange={e => setDeleteText(e.target.value)}
              placeholder="Type DELETE"
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
              <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button variant="danger" disabled={deleteText !== 'DELETE'} onClick={handleDeleteAccount}>
                Confirm Delete
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}
