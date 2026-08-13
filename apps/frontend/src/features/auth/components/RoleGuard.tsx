import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types/auth.types';

export function RoleGuard({ roles }: { roles: readonly UserRole[] }) {
  const { localUser } = useAuth();
  return localUser && roles.includes(localUser.role) ? <Outlet /> : <Navigate to="/" replace />;
}
