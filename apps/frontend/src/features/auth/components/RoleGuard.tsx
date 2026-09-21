import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types/auth.types';

interface RoleGuardProps {
  allowedRoles: UserRole[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading-spinner" style={{ margin: '4rem auto', display: 'block' }} />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.includes('dealer') && (user.dealerStatus === 'pending' || user.dealerStatus === 'rejected')) {
    return <Navigate to="/dealer/application-status" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-error)' }}>Access Restricted</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
          Your account role ({user.role}) does not have permission to view this page.
        </p>
      </div>
    );
  }

  return <Outlet />;
};
