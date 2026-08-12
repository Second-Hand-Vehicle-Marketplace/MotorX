import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function PortalRedirect() {
  const { localUser, loading } = useAuth();
  if (loading) return <p>Loading…</p>;
  if (!localUser) return <Navigate to="/login" replace />;
  return <Navigate to={localUser.role === 'admin' ? '/admin' : localUser.role === 'dealer' ? '/dealer' : '/marketplace'} replace />;
}
