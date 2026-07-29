import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';

export default function ListingSuccess() {
  const location = useLocation();
  const listingTitle = location.state?.title || 'Your listing';

  return (
    <div className="page-enter" style={styles.page}>
      <div style={styles.card}>
        <div style={styles.iconWrap}>
          <CheckCircle size={56} style={styles.icon} />
        </div>
        <h1 style={styles.title}>Listing Created Successfully!</h1>
        <p style={styles.subtitle}>
          <strong>"{listingTitle}"</strong> has been registered and is now live on the platform.
        </p>
        <div style={styles.actions}>
          <Link to="/dashboard/my-listings" style={{ textDecoration: 'none' }}>
            <Button variant="primary" icon={Package}>
              View My Listings
            </Button>
          </Link>
          <Link to="/create-listing" style={{ textDecoration: 'none' }}>
            <Button variant="ghost" iconRight={ArrowRight}>
              Create Another Listing
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: 'calc(100vh - 160px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
  },
  card: {
    maxWidth: 480,
    width: '100%',
    textAlign: 'center',
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-2xl)',
    padding: '56px 40px',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-lg)',
  },
  iconWrap: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 96,
    height: 96,
    borderRadius: '50%',
    background: 'var(--success-bg)',
    marginBottom: 24,
  },
  icon: {
    color: 'var(--success)',
  },
  title: {
    fontSize: 26,
    fontWeight: 800,
    color: 'var(--text)',
    margin: '0 0 12px',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: 15,
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    margin: '0 0 32px',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    alignItems: 'center',
  },
};
