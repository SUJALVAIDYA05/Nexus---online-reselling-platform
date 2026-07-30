import { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { CheckCircle2, Package, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button';
import PageTransition from '../components/ui/PageTransition';

export default function ListingSuccess() {
  const location = useLocation();
  const listingTitle = location.state?.title || 'Your item';

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  return (
    <PageTransition>
      <div style={styles.page}>
        <motion.div 
          style={styles.card}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <motion.div 
            style={styles.iconWrap}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
          >
            <CheckCircle2 size={56} style={styles.icon} />
          </motion.div>

          <h1 style={styles.title}>Listing Live on Platform!</h1>
          <p style={styles.subtitle}>
            <strong>"{listingTitle}"</strong> is now visible to thousands of buyers across Nexus.
          </p>

          <div style={styles.actions}>
            <Link to="/dashboard/my-listings" style={{ textDecoration: 'none', width: '100%' }}>
              <Button variant="primary" fullWidth size="lg" icon={Package}>
                Manage My Listings
              </Button>
            </Link>
            <Link to="/create-listing" style={{ textDecoration: 'none', width: '100%' }}>
              <Button variant="ghost" fullWidth size="lg" iconRight={ArrowRight}>
                Post Another Item
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}

const styles = {
  page: {
    minHeight: 'calc(80vh - var(--nav-height))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
  },
  card: {
    maxWidth: 520,
    width: '100%',
    textAlign: 'center',
    background: 'var(--bg-glass)',
    backdropFilter: 'blur(20px)',
    borderRadius: 'var(--radius-2xl)',
    padding: '56px 40px',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-2xl)',
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
    border: '1px solid var(--success-border)',
  },
  icon: {
    color: 'var(--success)',
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    color: '#ffffff',
    margin: '0 0 12px',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: 16,
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    margin: '0 0 36px',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
};
