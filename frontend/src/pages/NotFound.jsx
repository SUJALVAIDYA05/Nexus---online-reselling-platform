import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';
import PageTransition from '../components/ui/PageTransition';

export default function NotFound() {
  return (
    <PageTransition>
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', maxWidth: 500 }}>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            style={{ fontSize: 120, fontWeight: 900, color: 'var(--accent)', lineHeight: 1, marginBottom: 16 }}
          >
            404
          </motion.div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#ffffff', marginBottom: 12 }}>Page Not Found</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 36, lineHeight: 1.7 }}>
            The page you're looking for might have been moved or removed.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button onClick={() => window.history.back()} variant="secondary" icon={ArrowLeft}>
              Go Back
            </Button>
            <Link to="/">
              <Button variant="primary" icon={Home}>
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
