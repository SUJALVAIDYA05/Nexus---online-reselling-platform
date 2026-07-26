import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="page-enter" style={styles.page}>
      <div style={styles.container}>
        <div style={styles.visual}>
          <div style={styles.bgCircle} />
          <div style={styles.bgCircleSmall} />
          <span style={styles.code404}>404</span>
        </div>

        <h1 style={styles.title}>Page Not Found</h1>
        <p style={styles.subtitle}>
          Looks like this page has wandered off. The link might be broken or the page may have been moved.
        </p>

        <div style={styles.actions}>
          <Button onClick={() => window.history.back()} variant="ghost" icon={ArrowLeft}>
            Go Back
          </Button>
          <Button as={Link} to="/" variant="primary" icon={Home}>
            Go Home
          </Button>
          <Button as={Link} to="/browse" variant="outline" icon={Search}>
            Browse Listings
          </Button>
        </div>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            If you think this is a mistake, please{' '}
            <Link to="/contact" style={styles.footerLink}>contact support</Link>.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.9); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 0.2; }
          100% { transform: scale(0.9); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '85vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 24px',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: 500,
  },
  visual: {
    position: 'relative',
    width: 220,
    height: 180,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  bgCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: '50%',
    background: 'var(--accent-light)',
    animation: 'pulse-ring 3s ease-in-out infinite',
  },
  bgCircleSmall: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: '50%',
    background: 'rgba(233, 69, 96, 0.06)',
    animation: 'pulse-ring 3s ease-in-out infinite 0.5s',
  },
  code404: {
    fontSize: 96,
    fontWeight: 900,
    color: 'var(--accent)',
    position: 'relative',
    zIndex: 1,
    animation: 'float 3s ease-in-out infinite',
    letterSpacing: '-3px',
    lineHeight: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--text)',
    margin: '0 0 12px',
  },
  subtitle: {
    fontSize: 16,
    color: 'var(--text-secondary)',
    lineHeight: 1.7,
    margin: '0 0 36px',
  },
  actions: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  footer: { marginTop: 56 },
  footerText: { fontSize: 14, color: 'var(--text-tertiary)', margin: 0 },
  footerLink: { color: 'var(--accent)', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s ease' },
};
