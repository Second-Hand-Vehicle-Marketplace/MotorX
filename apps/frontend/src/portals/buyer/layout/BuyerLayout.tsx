import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const BuyerLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header className="buyer-navbar">
        <Link to="/" className="nav-logo">
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, var(--color-accent) 0%, #1D4ED8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 3.1C1.4 11.4 1 12.2 1 13v3c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <circle cx="17" cy="17" r="2" />
            </svg>
          </div>
          <span>Motor<span style={{ color: 'var(--color-accent)' }}>X</span></span>
        </Link>

        <nav className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/marketplace" className="nav-link">Explore Marketplace</Link>
        </nav>

        <div className="nav-actions">
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{user?.displayName}</span>
              <button onClick={logout} className="btn btn-ghost btn-sm">Sign Out</button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">Sign In</Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">Motor<span style={{ color: 'var(--color-accent)' }}>X</span></div>
            <p>The premium second-hand vehicle marketplace connecting buyers with verified dealerships.</p>
          </div>

          <div className="footer-column">
            <h4>Marketplace</h4>
            <Link to="/marketplace?bodyType=sedan">Sedans</Link>
            <Link to="/marketplace?bodyType=suv">SUVs</Link>
            <Link to="/marketplace?fuelType=electric">Electric Vehicles</Link>
            <Link to="/marketplace?fuelType=hybrid">Hybrids</Link>
          </div>

          <div className="footer-column">
            <h4>Portals</h4>
            <Link to="/dealer">Dealer Portal</Link>
            <Link to="/dealer/uploads/new">Inventory Upload (CSV)</Link>
            <Link to="/admin">Admin Control Panel</Link>
          </div>

          <div className="footer-column">
            <h4>Account</h4>
            <Link to="/login">Sign In / Register</Link>
            <Link to="/marketplace">Browse Cars</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 MotorX Inc. Group 23 — All rights reserved.</p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#support">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};