import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <div className="navbar-logo"><span className="logo-icon">N</span></div>
              <span className="logo-text">NEXUS</span>
            </Link>
            <p className="footer-tagline">The modern marketplace for buying and selling pre-owned goods.</p>
            <div className="footer-contact">
              <a href="mailto:hello@nexus.dev"><Mail size={14} /> hello@nexus.dev</a>
              <a href="tel:+919876543210"><Phone size={14} /> +91 98765 43210</a>
              <span><MapPin size={14} /> Mumbai, India</span>
            </div>
          </div>
          <div className="footer-col">
            <h4>Marketplace</h4>
            <Link to="/browse">Browse Listings</Link>
            <Link to="/register">Sell on Nexus</Link>
            <Link to="/services">Our Services</Link>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <Link to="/about">About Us</Link>
            <Link to="/about">Careers</Link>
            <Link to="/about">Blog</Link>
          </div>
          <div className="footer-col">
            <h4>Support</h4>
            <Link to="/about">Help Center</Link>
            <Link to="/about">Safety Tips</Link>
            <Link to="/about">Terms of Use</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Nexus. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
