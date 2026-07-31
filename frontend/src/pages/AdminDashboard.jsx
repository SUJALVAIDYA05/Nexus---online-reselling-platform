import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  Users, Package, Receipt, Trash2, ShieldCheck, User as UserIcon,
  MapPin, Eye
} from 'lucide-react';
import { users, listings, orders } from '../api/api';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import PageTransition from '../components/ui/PageTransition';

const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const roleBadge = {
  admin: { label: 'Admin', color: '#f59e0b' },
  seller: { label: 'Seller', color: '#10b981' },
  buyer: { label: 'Buyer', color: '#6366f1' },
};

const styles = `
  .adm-page { padding: 40px 0 80px; }
  .adm-header { margin-bottom: 32px; }
  .adm-title { font-size: 30px; font-weight: 800; color: #ffffff; display: flex; align-items: center; gap: 10px; }
  .adm-sub { color: var(--text-tertiary); margin-top: 4px; }

  .adm-section { margin-bottom: 44px; }
  .adm-sec-title { font-size: 20px; font-weight: 800; color: #ffffff; margin-bottom: 18px; display: flex; align-items: center; gap: 10px; }

  .adm-table { width: 100%; border-collapse: collapse; background: var(--bg-glass); border: 1px solid var(--border); border-radius: var(--radius-xl); overflow: hidden; }
  .adm-table th { text-align: left; padding: 14px 18px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-tertiary); border-bottom: 1px solid var(--border); }
  .adm-table td { padding: 14px 18px; font-size: 14px; color: var(--text-secondary); border-bottom: 1px solid var(--border-light); }
  .adm-table tr:last-child td { border-bottom: none; }

  .adm-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  @media (max-width: 992px) {
    .adm-grid { grid-template-columns: 1fr; }
  }
  .adm-card { background: var(--bg-glass); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 20px; display: flex; gap: 14px; align-items: center; }
  .adm-card-img { width: 56px; height: 56px; border-radius: var(--radius-md); overflow: hidden; background: #070a12; flex-shrink: 0; }
  .adm-card-img img { width: 100%; height: 100%; object-fit: cover; }
  .adm-pill { padding: 3px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 700; border: 1px solid var(--border); }
`;

export default function AdminDashboard() {
  const [userList, setUserList] = useState([]);
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [listingList, setListingList] = useState([]);
  const [orderList, setOrderList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  const loadUsers = useCallback(async (page) => {
    try {
      const res = await users.list({ page, limit: 10 });
      setUserList(res.users || []);
      setUserTotal(res.total || 0);
    } catch {
      setUserList([]);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [_u, l, o] = await Promise.allSettled([
          loadUsers(1),
          listings.list({ limit: 100 }),
          orders.list({ limit: 100 }),
        ]);
        setListingList(l.status === 'fulfilled' ? (l.value?.listings || []) : []);
        setOrderList(o.status === 'fulfilled' ? (o.value?.orders || []) : []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [loadUsers]);

  const handleRemoveListing = async (id, title) => {
    if (!window.confirm(`Remove listing "${title}"? This cannot be undone.`)) return;
    setRemovingId(id);
    try {
      await listings.delete(id);
      setListingList(prev => prev.filter(l => l._id !== id));
      toast.success('Listing removed');
    } catch (err) {
      toast.error(err?.message || 'Could not remove listing');
    } finally {
      setRemovingId(null);
    }
  };

  const handleUserPage = (dir) => {
    const next = Math.max(1, Math.min(Math.ceil(userTotal / 10), userPage + dir));
    setUserPage(next);
    loadUsers(next);
  };

  if (loading) {
    return (
      <PageTransition>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 120 }}>
          <Spinner size={40} />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <style>{styles}</style>
      <div className="adm-page">
        <div className="adm-header">
          <h1 className="adm-title"><ShieldCheck size={26} color="#f59e0b" /> Admin Dashboard</h1>
          <p className="adm-sub">Platform-wide moderation — users, listings and orders</p>
        </div>

        <div className="adm-section">
          <div className="adm-sec-title"><Users size={20} color="#6366f1" /> Users ({userTotal})</div>
          {userList.length === 0 ? (
            <EmptyState icon={UserIcon} title="No users found" />
          ) : (
            <>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {userList.map(u => (
                    <tr key={u._id}>
                      <td style={{ color: '#ffffff', fontWeight: 600 }}>{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className="adm-pill" style={{ color: roleBadge[u.role]?.color || 'var(--text-secondary)' }}>
                          {roleBadge[u.role]?.label || u.role}
                        </span>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {userTotal > 10 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16, alignItems: 'center' }}>
                  <Button variant="secondary" size="sm" disabled={userPage <= 1} onClick={() => handleUserPage(-1)}>Prev</Button>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Page {userPage} of {Math.max(1, Math.ceil(userTotal / 10))}</span>
                  <Button variant="secondary" size="sm" disabled={userPage >= Math.ceil(userTotal / 10)} onClick={() => handleUserPage(1)}>Next</Button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="adm-section">
          <div className="adm-sec-title"><Package size={20} color="#f43f5e" /> Active Listings ({listingList.length})</div>
          {listingList.length === 0 ? (
            <EmptyState icon={Package} title="No active listings" />
          ) : (
            <div className="adm-grid">
              {listingList.map(l => (
                <motion.div key={l._id} className="adm-card" whileHover={{ y: -2 }}>
                  <div className="adm-card-img">
                    {l.images?.[0]?.url && <img src={l.images[0].url} alt={l.title} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#ffffff', fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4 }}>
                      {l.seller?.name || 'Unknown seller'} {l.location && <><MapPin size={11} style={{ verticalAlign: -1 }} /> {l.location}</>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ color: 'var(--accent)', fontWeight: 800 }}>{fmt.format(l.price)}</span>
                      <a href={`/listing/${l._id}`} target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Eye size={13} /> View
                      </a>
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    loading={removingId === l._id}
                    onClick={() => handleRemoveListing(l._id, l.title)}
                  >
                    Remove
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="adm-section">
          <div className="adm-sec-title"><Receipt size={20} color="#10b981" /> Orders ({orderList.length})</div>
          {orderList.length === 0 ? (
            <EmptyState icon={Receipt} title="No orders yet" />
          ) : (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Buyer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orderList.slice(0, 30).map(o => (
                  <tr key={o._id}>
                    <td style={{ color: '#ffffff', fontWeight: 600 }}>#{o._id?.slice(-8)}</td>
                    <td>{o.buyer?.name || '—'}</td>
                    <td>{o.items?.map(i => i.listing?.title).filter(Boolean).join(', ') || '—'}</td>
                    <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{fmt.format(o.totalAmount)}</td>
                    <td>
                      <span className="adm-pill" style={{ color: '#10b981' }}>{o.status}</span>
                    </td>
                    <td>{new Date(o.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
