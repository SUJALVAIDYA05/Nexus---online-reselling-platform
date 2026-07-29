import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusCircle, Package, Eye, Edit3, Trash2, Tag,
  CheckCircle2, XCircle, MoreVertical, Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { users, listings } from '../api/api';
import { Card, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';

const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumDigits: 0 });

const statusMap = {
  all: { label: 'All' },
  active: { label: 'Active', variant: 'success' },
  sold: { label: 'Sold', variant: 'accent' },
  removed: { label: 'Removed', variant: 'default' },
};

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'sold', label: 'Sold' },
  { key: 'removed', label: 'Removed' },
];

export default function MyListings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [markingSold, setMarkingSold] = useState(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const data = await users.getListings(user.id);
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

  const counts = useMemo(() => ({
    all: items.length,
    active: items.filter(i => i.status === 'active').length,
    sold: items.filter(i => i.status === 'sold').length,
    removed: items.filter(i => i.status === 'removed').length,
  }), [items]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await listings.delete(deleteTarget._id);
      setItems(prev => prev.filter(i => i._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch {
      // silent
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget]);

  const handleMarkSold = useCallback(async (item) => {
    setMarkingSold(item._id);
    try {
      const updated = await listings.update(item._id, { status: 'sold' });
      setItems(prev => prev.map(i => i._id === item._id ? { ...i, status: 'sold', ...(updated || {}) } : i));
    } catch {
      // silent
    } finally {
      setMarkingSold(null);
    }
  }, []);

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatPrice = (p) => fmt.format(p);

  return (
    <div className="my-listings-page">
      <header className="ml-header">
        <div>
          <h1 className="ml-title">My Listings</h1>
          <p className="ml-subtitle">
            {!loading && `${items.length} total listing${items.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link to="/create-listing">
          <Button icon={PlusCircle}>Create Listing</Button>
        </Link>
      </header>

      <div className="ml-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`ml-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span className="ml-tab-count">{counts[tab.key]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="ml-loading">
          <Spinner size={36} />
          <p>Loading your listings...</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={
            activeTab === 'all' ? 'No listings yet' :
            activeTab === 'active' ? 'No active listings' :
            activeTab === 'sold' ? 'No sold listings' :
            'No removed listings'
          }
          description={
            activeTab === 'all'
              ? 'Create your first listing and start selling on NEXUS.'
              : activeTab === 'active'
              ? 'All your listings have been sold or removed.'
              : activeTab === 'sold'
              ? 'Items you mark as sold will appear here.'
              : 'Items you remove will appear here.'
          }
          action={
            activeTab === 'all' || activeTab === 'active' ? (
              <Link to="/create-listing">
                <Button icon={PlusCircle}>Create Listing</Button>
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="ml-list">
          {filtered.map(item => {
            const st = statusMap[item.status] || statusMap.active;
            return (
              <Card key={item._id} hover className="ml-item">
                <CardBody>
                  <div className="ml-item-image">
                    {item.images?.[0]?.url ? (
                      <img src={item.images[0].url} alt={item.title} />
                    ) : (
                      <div className="ml-item-placeholder">
                        <ImageIcon size={22} />
                      </div>
                    )}
                  </div>

                  <div className="ml-item-details">
                    <div className="ml-item-top">
                      <Link to={`/listing/${item._id}`} className="ml-item-title">
                        {item.title}
                      </Link>
                      <Badge variant={st.variant} size="sm" dot>{st.label}</Badge>
                    </div>
                    <div className="ml-item-meta">
                      {item.category?.name && (
                        <span className="ml-item-category">{item.category.name}</span>
                      )}
                      {item.condition && (
                        <span className="ml-item-condition">{item.condition}</span>
                      )}
                    </div>
                    <div className="ml-item-bottom">
                      <span className="ml-item-price">{formatPrice(item.price)}</span>
                      <span className="ml-item-date">{formatDate(item.createdAt)}</span>
                    </div>
                  </div>

                  <div className="ml-item-actions">
                    <Link to={`/listing/${item._id}`} className="ml-action-btn" title="View">
                      <Eye size={16} />
                    </Link>
                    {item.status === 'active' && (
                      <>
                        <Link to={`/edit-listing/${item._id}`} className="ml-action-btn" title="Edit">
                          <Edit3 size={16} />
                        </Link>
                        <button
                          className="ml-action-btn ml-action-sold"
                          title="Mark as Sold"
                          onClick={() => handleMarkSold(item)}
                          disabled={markingSold === item._id}
                        >
                          {markingSold === item._id ? (
                            <Spinner size={14} />
                          ) : (
                            <Tag size={16} />
                          )}
                        </button>
                      </>
                    )}
                    <button
                      className="ml-action-btn ml-action-delete"
                      title="Delete"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Listing"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              Delete
            </Button>
          </>
        }
      >
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
          Are you sure you want to delete <strong style={{ color: 'var(--text)' }}>{deleteTarget?.title}</strong>?
          This action cannot be undone.
        </p>
      </Modal>

      <style>{`
        .my-listings-page { max-width: 100%; }
        .ml-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 32px; gap: 16px; flex-wrap: wrap;
        }
        .ml-title { font-size: 28px; font-weight: 800; color: var(--text); margin: 0 0 6px; letter-spacing: -0.6px; line-height: 1.25; }
        .ml-subtitle { font-size: 14px; color: var(--text-tertiary); margin: 0; }
        .ml-tabs {
          display: flex; gap: 4px; margin-bottom: 28px;
          background: var(--bg-secondary); border: 1px solid var(--border-light);
          border-radius: var(--radius-xl); padding: 5px; width: fit-content;
          box-shadow: var(--shadow-card);
        }
        .ml-tab {
          display: flex; align-items: center; gap: 7px;
          padding: 10px 20px; border-radius: var(--radius-lg);
          font-size: 13px; font-weight: 600; color: var(--text-secondary);
          background: transparent; border: none; cursor: pointer;
          transition: all var(--transition-fast);
        }
        .ml-tab:hover { color: var(--text); background: var(--bg-tertiary); }
        .ml-tab.active {
          background: var(--accent); color: white;
          box-shadow: 0 2px 8px rgba(233, 69, 96, 0.3);
        }
        .ml-tab-count {
          font-size: 11px; font-weight: 700;
          background: rgba(255,255,255,0.2); padding: 1px 8px;
          border-radius: var(--radius-full); line-height: 1.4;
        }
        .ml-tab:not(.active) .ml-tab-count { background: var(--bg-tertiary); color: var(--text-secondary); }
        .ml-loading {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 72px; gap: 14px;
        }
        .ml-loading p { color: var(--text-tertiary); font-size: 14px; }
        .ml-list { display: flex; flex-direction: column; gap: 12px; }
        .ml-item .card-body { display: flex; align-items: center; gap: 18px; padding: 16px 22px; }
        .ml-item-image {
          width: 84px; height: 84px; border-radius: var(--radius-lg);
          overflow: hidden; flex-shrink: 0; background: var(--bg-tertiary);
        }
        .ml-item-image img { width: 100%; height: 100%; object-fit: cover; }
        .ml-item-placeholder {
          width: 100%; height: 100%; display: flex;
          align-items: center; justify-content: center; color: var(--text-tertiary);
        }
        .ml-item-details { flex: 1; min-width: 0; }
        .ml-item-top { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; flex-wrap: wrap; }
        .ml-item-title {
          font-size: 15px; font-weight: 700; color: var(--text);
          text-decoration: none; white-space: nowrap; overflow: hidden;
          text-overflow: ellipsis; transition: color var(--transition-fast);
        }
        .ml-item-title:hover { color: var(--accent); }
        .ml-item-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .ml-item-category {
          font-size: 11px; font-weight: 600; color: var(--text-secondary);
          background: var(--bg-tertiary); padding: 3px 10px;
          border-radius: var(--radius-full);
        }
        .ml-item-condition {
          font-size: 11px; font-weight: 600; color: var(--text-tertiary);
          text-transform: capitalize;
        }
        .ml-item-bottom { display: flex; align-items: center; gap: 16px; }
        .ml-item-price { font-size: 17px; font-weight: 800; color: var(--accent); letter-spacing: -0.3px; }
        .ml-item-date { font-size: 12px; color: var(--text-tertiary); }
        .ml-item-actions {
          display: flex; align-items: center; gap: 6px; flex-shrink: 0;
        }
        .ml-action-btn {
          width: 36px; height: 36px; border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
          color: var(--text-tertiary); transition: all var(--transition-fast);
          border: none; background: transparent; cursor: pointer;
          text-decoration: none;
        }
        .ml-action-btn:hover { background: var(--bg-tertiary); color: var(--text); transform: scale(1.08); }
        .ml-action-sold:hover { background: var(--success-bg); color: var(--success); }
        .ml-action-delete:hover { background: var(--error-bg); color: var(--error); }
        @media (max-width: 600px) {
          .ml-item .card-body { padding: 12px 14px; gap: 12px; }
          .ml-item-image { width: 60px; height: 60px; border-radius: var(--radius-md); }
          .ml-item-title { font-size: 14px; }
          .ml-item-price { font-size: 14px; }
          .ml-item-actions { flex-direction: column; gap: 0; }
        }
      `}</style>
    </div>
  );
}
