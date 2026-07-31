import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  ShoppingCart, Package, TrendingUp, Eye, Receipt, MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { orders } from '../api/api';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import PageTransition from '../components/ui/PageTransition';

const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const statusMeta = {
  pending: { label: 'Pending', color: '#f59e0b' },
  confirmed: { label: 'Confirmed', color: '#6366f1' },
  shipped: { label: 'Shipped', color: '#3b82f6' },
  completed: { label: 'Completed', color: '#10b981' },
  cancelled: { label: 'Cancelled', color: '#f43f5e' },
};

const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'completed', 'cancelled'];

const styles = `
  .ord-page { padding: 40px 0 80px; }
  .ord-tabs { display: flex; gap: 12px; margin-bottom: 32px; border-bottom: 1px solid var(--border); padding-bottom: 12px; }
  .ord-tab { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: var(--radius-full); background: transparent; color: var(--text-secondary); border: 1px solid transparent; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.2s; font-family: var(--font); }
  .ord-tab:hover { color: #ffffff; background: rgba(255,255,255,0.05); }
  .ord-tab.active { background: rgba(244,63,94,0.15); border-color: rgba(244,63,94,0.3); color: #ffffff; }

  .ord-list { display: flex; flex-direction: column; gap: 16px; }
  .ord-card { background: var(--bg-glass); backdrop-filter: blur(16px); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 24px; }
  .ord-card-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
  .ord-img { width: 56px; height: 56px; border-radius: var(--radius-md); overflow: hidden; background: #070a12; flex-shrink: 0; }
  .ord-img img { width: 100%; height: 100%; object-fit: cover; }
  .ord-item { display: flex; align-items: center; gap: 14px; padding: 10px 0; border-bottom: 1px solid var(--border-light); }
  .ord-item:last-child { border-bottom: none; }
  .ord-status { padding: 4px 12px; border-radius: var(--radius-full); font-size: 12px; font-weight: 700; border: 1px solid var(--border); }
`;

export default function Orders() {
  const { user } = useAuth();
  const role = user?.role;
  const isAdmin = role === 'admin';

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await orders.list({ limit: 100 });
        setData(res.orders || []);
        if (!isAdmin) {
          setActiveTab(role === 'seller' ? 'sales' : 'purchases');
        }
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchOrders();
  }, [user, role, isAdmin]);

  const myId = user?.id || user?._id;

  const tabs = useMemo(() => {
    if (isAdmin) {
      return [
        { key: 'all', label: 'All Orders', icon: ShoppingCart },
        { key: 'purchases', label: 'Purchases', icon: Package },
        { key: 'sales', label: 'My Sales', icon: TrendingUp },
      ];
    }
    if (role === 'seller') {
      return [{ key: 'sales', label: 'My Sales', icon: TrendingUp }];
    }
    return [{ key: 'purchases', label: 'Purchases', icon: Package }];
  }, [role, isAdmin]);

  const filtered = useMemo(() => {
    if (activeTab === 'all') return data;
    if (activeTab === 'sales') {
      return data.filter(o => o.items?.some(i => (i.seller?._id || i.seller)?.toString() === myId));
    }
    return data.filter(o => (o.buyer?._id || o.buyer)?.toString() === myId);
  }, [data, activeTab, myId]);

  const handleStatusChange = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      await orders.updateStatus(orderId, status);
      setData(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
      toast.success('Order status updated');
    } catch (err) {
      toast.error(err?.message || 'Could not update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const canManageStatus = (order) => {
    if (!user) return false;
    if (role === 'admin') return true;
    if (role === 'seller') {
      return order.items?.some(i => (i.seller?._id || i.seller)?.toString() === myId);
    }
    return false;
  };

  return (
    <PageTransition>
      <style>{styles}</style>
      <div className="ord-page">
        <header style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#ffffff' }}>Orders & Activity</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {role === 'seller' ? 'Track the items you have sold' : 'Track your marketplace purchases'}
          </p>
        </header>

        <div className="ord-tabs">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`ord-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <Spinner size={36} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No orders found"
            description={role === 'seller'
              ? 'When buyers purchase your items, your sales will appear here.'
              : 'Complete a checkout to see your purchase history here.'}
            action={
              <Link to="/browse">
                <Button icon={Eye}>Explore Marketplace</Button>
              </Link>
            }
          />
        ) : (
          <div className="ord-list">
            {filtered.map(order => (
              <motion.div key={order._id} className="ord-card" whileHover={{ y: -2 }}>
                <div className="ord-card-head">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#ffffff' }}>Order #{order._id?.slice(-8)}</span>
                      <span className="ord-status" style={{ color: statusMeta[order.status]?.color || 'var(--text-secondary)' }}>
                        {statusMeta[order.status]?.label || order.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                      {' · '}{order.paymentMethod?.toUpperCase()}
                      {!isAdmin && order.shippingAddress?.city && (
                        <> · <MapPin size={12} style={{ verticalAlign: -2 }} /> {order.shippingAddress.city}, {order.shippingAddress.state}</>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--accent)' }}>{fmt.format(order.totalAmount)}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {order.items?.length} item{order.items?.length > 1 ? 's' : ''} · incl. {fmt.format(order.platformFee)} fee
                    </div>
                  </div>
                </div>

                <div>
                  {order.items?.map(item => {
                    const listing = item.listing || {};
                    const sellerName = item.seller?.name || 'Seller';
                    return (
                      <div key={listing._id || item.listing} className="ord-item">
                        <div className="ord-img">
                          {listing.images?.[0]?.url && <img src={listing.images[0].url} alt={listing.title} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: '#ffffff', fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {listing.title || 'Listing'}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                            {role === 'seller' ? `Buyer: ${order.buyer?.name || '—'}` : `Sold by: ${sellerName}`}
                          </div>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-secondary)' }}>
                          {fmt.format(item.priceAtPurchase)}
                        </div>
                        {listing._id && (
                          <Link to={`/listing/${listing._id}`}>
                            <Button variant="ghost" size="sm" icon={Eye}>View</Button>
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>

                {canManageStatus(order) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Update Status:</span>
                    <select
                      value={order.status}
                      disabled={updatingId === order._id}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      style={{
                        background: 'var(--bg-secondary)', color: 'var(--text)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)', padding: '8px 12px', fontSize: 13, fontFamily: 'var(--font)',
                      }}
                    >
                      {ORDER_STATUSES.map(s => (
                        <option key={s} value={s}>{statusMeta[s]?.label || s}</option>
                      ))}
                    </select>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
