import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Package, Heart, ShoppingCart, MessageCircle, Settings, User, PlusCircle, ShieldCheck } from 'lucide-react';
import './Sidebar.css';

export default function Sidebar() {
  const { user } = useAuth();
  const role = user?.role;
  const canSell = role === 'seller' || role === 'admin';
  const canBuy = role === 'buyer' || role === 'admin';
  const isAdmin = role === 'admin';

  const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', show: true },
    { to: '/dashboard/my-listings', icon: Package, label: 'My Listings', show: canSell },
    { to: '/create-listing', icon: PlusCircle, label: 'Create Listing', show: canSell },
    { to: '/favorites', icon: Heart, label: 'Wishlist', show: canBuy },
    { to: '/orders', icon: ShoppingCart, label: 'Orders', show: true },
    { to: '/messages', icon: MessageCircle, label: 'Messages', show: true },
    { to: '/dashboard/profile', icon: User, label: 'Profile', show: true },
    { to: '/dashboard/settings', icon: Settings, label: 'Settings', show: true },
    { to: '/admin', icon: ShieldCheck, label: 'Admin Dashboard', show: isAdmin },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-user">
        <div className="sidebar-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
        <div>
          <div className="sidebar-name">{user?.name}</div>
          <div className="sidebar-email">{user?.email}</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {links.filter(l => l.show).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
