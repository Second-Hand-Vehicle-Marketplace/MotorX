import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute() {
  const { localUser, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p>Checking your session…</p>;
  return localUser ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}
