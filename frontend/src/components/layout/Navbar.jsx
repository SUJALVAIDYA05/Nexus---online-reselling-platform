import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Menu, X, ShoppingCart, Heart, MessageCircle, Bell, User, LogOut, LayoutDashboard, Package, Search } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setProfileOpen(false);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="navbar-logo">
            <span className="logo-icon">N</span>
          </div>
          <span className="logo-text">NEXUS</span>
        </Link>

        <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
          <NavLink to="/browse" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
            Browse
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
            About
          </NavLink>
          <NavLink to="/services" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
            Services
          </NavLink>
          {user && (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                Dashboard
              </NavLink>
              <NavLink to="/dashboard/my-listings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                My Listings
              </NavLink>
            </>
          )}
        </div>

        <div className="navbar-actions">
          {user ? (
            <>
              <Link to="/search" className="nav-icon-btn" title="Search">
                <Search size={20} />
              </Link>
              <Link to="/messages" className="nav-icon-btn" title="Messages">
                <MessageCircle size={20} />
              </Link>
              <Link to="/favorites" className="nav-icon-btn" title="Wishlist">
                <Heart size={20} />
              </Link>
              <Link to="/cart" className="nav-icon-btn cart-btn" title="Cart">
                <ShoppingCart size={20} />
                {count > 0 && <span className="cart-badge">{count}</span>}
              </Link>
              <div className="profile-menu-wrapper">
                <button className="nav-avatar" onClick={() => setProfileOpen(!profileOpen)}>
                  {user.name?.charAt(0).toUpperCase()}
                </button>
                {profileOpen && (
                  <>
                    <div className="profile-overlay" onClick={() => setProfileOpen(false)} />
                    <div className="profile-dropdown">
                      <div className="profile-dropdown-header">
                        <span className="profile-name">{user.name}</span>
                        <span className="profile-email">{user.email}</span>
                      </div>
                      <div className="profile-dropdown-divider" />
                      <Link to="/dashboard" className="profile-item" onClick={() => setProfileOpen(false)}>
                        <LayoutDashboard size={16} /> Dashboard
                      </Link>
                      <Link to="/dashboard/my-listings" className="profile-item" onClick={() => setProfileOpen(false)}>
                        <Package size={16} /> My Listings
                      </Link>
                      <Link to="/dashboard/profile" className="profile-item" onClick={() => setProfileOpen(false)}>
                        <User size={16} /> Profile
                      </Link>
                      <Link to="/orders" className="profile-item" onClick={() => setProfileOpen(false)}>
                        <Bell size={16} /> Orders
                      </Link>
                      <div className="profile-dropdown-divider" />
                      <button className="profile-item profile-item-danger" onClick={handleLogout}>
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </div>
          )}

          <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
