import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function RequireRole({ allow = [], children }) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user) return;
    if (!allow.includes(user.role)) {
      const msg = user.role === 'seller'
        ? 'This action is for buyers only'
        : 'This action is for sellers only';
      toast.error(msg);
    }
  }, [loading, user, allow]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}
