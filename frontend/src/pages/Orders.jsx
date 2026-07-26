import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart, Package, TrendingUp, Clock,
  CheckCircle2, XCircle, Eye, ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { users, favorites, listings } from '../api/api';
import { Card, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';

const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const statusConfig = {
  active: { label: 'Active', variant: 'success', icon: CheckCircle2 },
  completed: { label: 'Completed', variant: 'info', icon: CheckCircle2 },
  pending: { label: 'Pending', variant: 'warning', icon: Clock },
  cancelled: { label: 'Cancelled', variant: 'error', icon: XCircle },
  sold: { label: 'Sold', variant: 'accent', icon: TrendingUp },
  removed: { label: 'Removed', variant: 'default', icon: XCircle },
};

const tabs = [
  { key: 'all', label: 'All', icon: ShoppingCart },
  { key: 'purchases', label: 'Purchases', icon: Package },
  { key: 'sales', label: 'Sales', icon: TrendingUp },
];

export default function Orders() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const [salesRes, favRes] = await Promise.allSettled([
          users.getListings(user._id),
          favorites.list(),
        ]);
        const salesData = salesRes.status === 'fulfilled' ? salesRes.value : [];
        const salesArr = Array.isArray(salesData) ? salesData : (salesData.listings || []);
        setSales(salesArr);

        const favData = favRes.status === 'fulfilled' ? favRes.value : [];
        const favArr = Array.isArray(favData) ? favData : (favData.favorites || []);
        const purchasesArr = favArr
          .filter(f => f.listing)
          .map((f, i) => ({
            ...f.listing,
            _orderType: 'purchase',
            _orderStatus: f.listing.status === 'sold' ? 'completed' : 'pending',
            _orderDate: f.createdAt || new Date().toISOString(),
            _seller: f.listing.seller,
          }));
        setPurchases(purchasesArr);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchOrders();
  }, [user]);

  const allOrders = [
    ...sales.map(l => ({
      ...l,
      _orderType: 'sale',
      _orderStatus: l.status === 'sold' ? 'completed' : l.status === 'removed' ? 'cancelled' : 'active',
      _orderDate: l.createdAt,
      _otherParty: l.seller,
    })),
    ...purchases,
  ].sort((a, b) => new Date(b._orderDate) - new Date(a._orderDate));

  const filtered = activeTab === 'all' ? allOrders
    : activeTab === 'sales' ? allOrders.filter(o => o._orderType === 'sale')
    : allOrders.filter(o => o._orderType === 'purchase');

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="orders-page">
      <header className="orders-header">
        <div>
          <h1 className="orders-title">Orders & Transactions</h1>
          <p className="orders-subtitle">Track your purchases and sales activity</p>
        </div>
      </header>

      <div className="orders-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`orders-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.key === 'all' && !loading && <span className="tab-count">{allOrders.length}</span>}
            {tab.key === 'sales' && !loading && <span className="tab-count">{sales.length}</span>}
            {tab.key === 'purchases' && !loading && <span className="tab-count">{purchases.length}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="orders-loading">
          <Spinner size={36} />
          <p>Loading orders...</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title={
            activeTab === 'purchases' ? 'No purchases yet' :
            activeTab === 'sales' ? 'No sales yet' :
            'No orders yet'
          }
          description={
            activeTab === 'purchases'
              ? 'Items you add to your wishlist and purchase will appear here.'
              : activeTab === 'sales'
              ? 'Your listed items and their sale status will appear here.'
              : 'Start by browsing items or creating a listing!'
          }
          action={
            <div style={{ display: 'flex', gap: 12 }}>
              <Link to="/create-listing">
                <Button icon={Package}>Create Listing</Button>
              </Link>
              <Link to="/browse">
                <Button variant="secondary" icon={Eye}>Browse Items</Button>
              </Link>
            </div>
          }
        />
      ) : (
        <div className="orders-list">
          {filtered.map(order => {
            const st = statusConfig[order._orderStatus] || statusConfig.pending;
            return (
              <Card key={order._id + order._orderType} hover className="order-card">
                <CardBody>
                  <div className="order-image">
                    {order.images?.[0]?.url ? (
                      <img src={order.images[0].url} alt={order.title} />
                    ) : (
                      <div className="order-image-placeholder">
                        <Package size={20} />
                      </div>
                    )}
                  </div>
                  <div className="order-details">
                    <div className="order-top">
                      <Link to={`/listing/${order._id}`} className="order-title">
                        {order.title}
                      </Link>
                      <Badge variant={st.variant} size="sm" dot>{st.label}</Badge>
                    </div>
                    <p className="order-meta">
                      <span className={`order-type-badge ${order._orderType}`}>
                        {order._orderType === 'sale' ? 'Selling' : 'Buying'}
                      </span>
                      {order._orderType === 'sale' && order.seller?.name && (
                        <span className="order-party">Buyer inquiry</span>
                      )}
                      {order._orderType === 'purchase' && order.seller?.name && (
                        <span className="order-party">Seller: {order.seller.name}</span>
                      )}
                    </p>
                    <div className="order-bottom">
                      <span className="order-price">{fmt.format(order.price)}</span>
                      <span className="order-date">{formatDate(order._orderDate)}</span>
                    </div>
                  </div>
                  <Link to={`/listing/${order._id}`} className="order-arrow">
                    <ArrowUpRight size={18} />
                  </Link>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <div className="orders-notice">
        <p>
          <strong>Note:</strong> Full order tracking is coming soon. Currently, your listings appear as
          sales and wishlisted items as potential purchases.
        </p>
      </div>

      <style>{`
        .orders-page { max-width: 100%; animation: fadeIn 0.4s cubic-bezier(0.22, 1, 0.36, 1); }
        .orders-header { margin-bottom: 32px; }
        .orders-title {
          font-size: 28px; font-weight: 800; color: var(--text);
          margin: 0 0 6px; letter-spacing: -0.5px;
        }
        .orders-subtitle { font-size: 14px; color: var(--text-tertiary); margin: 0; }
        .orders-tabs {
          display: flex; gap: 6px; margin-bottom: 28px;
          background: var(--bg-secondary); border: 1px solid var(--border-light);
          border-radius: var(--radius-xl); padding: 5px; width: fit-content;
          box-shadow: var(--shadow-card);
        }
        .orders-tab {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 22px; border-radius: var(--radius-lg);
          font-size: 13px; font-weight: 600; color: var(--text-secondary);
          background: transparent; border: none; cursor: pointer;
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .orders-tab:hover { color: var(--text); background: var(--bg-tertiary); }
        .orders-tab.active {
          background: var(--accent); color: white;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }
        .tab-count {
          font-size: 11px; font-weight: 700;
          background: rgba(255,255,255,0.2); padding: 2px 8px;
          border-radius: var(--radius-full); line-height: 1.4;
        }
        .orders-tab:not(.active) .tab-count { background: var(--bg-tertiary); color: var(--text-secondary); }
        .orders-loading {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 72px; gap: 14px;
        }
        .orders-loading p { color: var(--text-tertiary); font-size: 14px; }
        .orders-list { display: flex; flex-direction: column; gap: 14px; }
        .order-card .card-body {
          display: flex; align-items: center; gap: 18px;
          padding: 18px 22px;
        }
        .order-image {
          width: 76px; height: 76px; border-radius: var(--radius-lg);
          overflow: hidden; flex-shrink: 0; background: var(--bg-tertiary);
        }
        .order-image img { width: 100%; height: 100%; object-fit: cover; }
        .order-image-placeholder {
          width: 100%; height: 100%; display: flex;
          align-items: center; justify-content: center; color: var(--text-tertiary);
        }
        .order-details { flex: 1; min-width: 0; }
        .order-top { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; flex-wrap: wrap; }
        .order-title {
          font-size: 15px; font-weight: 700; color: var(--text);
          text-decoration: none; white-space: nowrap; overflow: hidden;
          text-overflow: ellipsis; transition: color 0.2s ease;
        }
        .order-title:hover { color: var(--accent); }
        .order-meta { display: flex; align-items: center; gap: 10px; margin: 0 0 8px; }
        .order-type-badge {
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          padding: 3px 10px; border-radius: var(--radius-full); letter-spacing: 0.3px;
        }
        .order-type-badge.sale { background: rgba(99,102,241,0.1); color: #6366f1; }
        .order-type-badge.purchase { background: rgba(233,69,96,0.1); color: #e94560; }
        .order-party { font-size: 12px; color: var(--text-tertiary); }
        .order-bottom { display: flex; align-items: center; gap: 18px; }
        .order-price { font-size: 17px; font-weight: 800; color: var(--accent); }
        .order-date { font-size: 12px; color: var(--text-tertiary); }
        .order-arrow {
          width: 38px; height: 38px; border-radius: var(--radius-lg);
          display: flex; align-items: center; justify-content: center;
          color: var(--text-tertiary); transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
          flex-shrink: 0; text-decoration: none;
        }
        .order-arrow:hover {
          background: var(--bg-tertiary); color: var(--text);
          transform: translate(2px, -2px);
        }
        .orders-notice {
          margin-top: 36px; padding: 18px 22px;
          background: rgba(99,102,241,0.05); border: 1px solid rgba(99,102,241,0.15);
          border-radius: var(--radius-xl);
        }
        .orders-notice p { font-size: 13px; color: var(--text-secondary); margin: 0; line-height: 1.6; }
        .orders-notice strong { color: var(--text); }
        @media (max-width: 600px) {
          .orders-tab { padding: 9px 14px; font-size: 12px; }
          .order-card .card-body { padding: 14px 16px; gap: 14px; }
          .order-image { width: 60px; height: 60px; }
          .order-title { font-size: 14px; }
          .order-price { font-size: 15px; }
        }
      `}</style>
    </div>
  );
}
