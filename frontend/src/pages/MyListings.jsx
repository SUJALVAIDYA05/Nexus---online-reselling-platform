import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusCircle, Package, Eye, Edit3, Trash2, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { users, listings } from '../api/api';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import PageTransition from '../components/ui/PageTransition';

const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const tabs = [
  { key: 'all', label: 'All Listings' },
  { key: 'active', label: 'Active' },
  { key: 'sold', label: 'Sold' },
];

const styles = `
  .ml-page { padding: 32px 0 60px; }
  .ml-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
  .ml-title { font-size: 28px; font-weight: 800; color: #ffffff; }

  .ml-tabs { display: flex; gap: 12px; margin-bottom: 24px; border-bottom: 1px solid var(--border); padding-bottom: 12px; }
  .ml-tab { padding: 8px 18px; border-radius: var(--radius-full); background: transparent; color: var(--text-secondary); border: none; cursor: pointer; font-weight: 600; font-size: 14px; }
  .ml-tab.active { background: rgba(244,63,94,0.15); color: #ffffff; border: 1px solid rgba(244,63,94,0.3); }

  .ml-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .ml-card { background: var(--bg-glass); backdrop-filter: blur(16px); border: 1px solid var(--border); border-radius: var(--radius-xl); overflow: hidden; display: flex; flex-direction: column; }
  .ml-card-img { aspect-ratio: 16/10; background: #070a12; position: relative; }
  .ml-card-img img { width: 100%; height: 100%; object-fit: cover; }
  .ml-card-body { padding: 20px; display: flex; flex-direction: column; flex-grow: 1; justify-content: space-between; }

  @media (max-width: 992px) {
    .ml-grid { grid-template-columns: 1fr; }
  }
`;

export default function MyListings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const data = await users.getListings(user.id || user._id);
        setItems(Array.isArray(data) ? data : (data.listings || []));
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchListings();
  }, [user]);

  const filtered = useMemo(() => {
    if (activeTab === 'all') return items;
    return items.filter(i => i.status === activeTab);
  }, [items, activeTab]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await listings.delete(deleteTarget._id);
      setItems(prev => prev.filter(i => i._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch {
      // silent
    }
  }, [deleteTarget]);

  return (
    <PageTransition>
      <style>{styles}</style>
      <div className="ml-page">
        <div className="ml-header">
          <div>
            <h1 className="ml-title">My Seller Listings</h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>Manage, edit, or delete your posted items</p>
          </div>
          <Link to="/create-listing">
            <Button icon={PlusCircle}>New Listing</Button>
          </Link>
        </div>

        <div className="ml-tabs">
          {tabs.map(t => (
            <button
              key={t.key}
              className={`ml-tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label} ({items.filter(i => t.key === 'all' || i.status === t.key).length})
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <Spinner size={36} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No listings found"
            description="You haven't posted any items in this category yet."
            action={
              <Link to="/create-listing">
                <Button icon={PlusCircle}>Post an Item</Button>
              </Link>
            }
          />
        ) : (
          <div className="ml-grid">
            <AnimatePresence>
              {filtered.map(item => (
                <motion.div
                  key={item._id}
                  className="ml-card"
                  whileHover={{ y: -4 }}
                  layout
                >
                  <div className="ml-card-img">
                    {item.images?.[0]?.url && <img src={item.images[0].url} alt={item.title} />}
                  </div>
                  <div className="ml-card-body">
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>{item.title}</h3>
                      <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--accent)', marginBottom: 16 }}>{fmt.format(item.price)}</div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <Button variant="secondary" size="sm" icon={Eye} onClick={() => navigate(`/listing/${item._id}`)}>
                        View
                      </Button>
                      <Button variant="secondary" size="sm" icon={Edit3} onClick={() => navigate(`/edit-listing/${item._id}`)}>
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" icon={Trash2} onClick={() => setDeleteTarget(item)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <Modal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Confirm Delete Listing"
        >
          <div style={{ padding: '10px 0 20px' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              Are you sure you want to permanently delete <strong>"{deleteTarget?.title}"</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete}>Delete Permanently</Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}
