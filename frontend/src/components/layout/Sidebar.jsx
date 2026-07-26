import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Package, Heart, ShoppingCart, MessageCircle, Settings, User, PlusCircle } from 'lucide-react';
import './Sidebar.css';

export default function Sidebar() {
  const { user } = useAuth();

  const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/my-listings', icon: Package, label: 'My Listings' },
    { to: '/create-listing', icon: PlusCircle, label: 'Create Listing' },
    { to: '/favorites', icon: Heart, label: 'Wishlist' },
    { to: '/orders', icon: ShoppingCart, label: 'Orders' },
    { to: '/messages', icon: MessageCircle, label: 'Messages' },
    { to: '/profile', icon: User, label: 'Profile' },
    { to: '/settings', icon: Settings, label: 'Settings' },
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
        {links.map(({ to, icon: Icon, label }) => (
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
