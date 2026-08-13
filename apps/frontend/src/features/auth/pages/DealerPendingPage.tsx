import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const DealerPendingPage: React.FC = () => {
  const location = useLocation();
  const state = location.state as { email?: string; businessName?: string } | null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 640, padding: '2rem', textAlign: 'center' }}>
        <span className="badge badge-warning" style={{ marginBottom: '1rem' }}>PENDING APPROVAL</span>
        <h1 className="page-title" style={{ marginBottom: '0.75rem' }}>Registration submitted</h1>
        <p className="page-subtitle" style={{ marginBottom: '1rem' }}>
          An administrator must approve your dealership application before you can sign in.
        </p>
        {state?.businessName && (
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
            {state.businessName} {state.email ? `(${state.email})` : ''}
          </p>
        )}
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/login" className="btn btn-primary">Return to Login</Link>
          <Link to="/marketplace" className="btn btn-secondary">Browse Marketplace</Link>
        </div>
      </div>
    </div>
  );
};