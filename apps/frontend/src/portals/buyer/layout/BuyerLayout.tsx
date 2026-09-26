import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCompare } from '@/features/compare/CompareProvider';
import { CompareTray } from '@/features/compare/CompareTray';
import { LanguageSwitcher } from '@/shared/i18n/LanguageSwitcher';
import { useI18n } from '@/shared/i18n/useI18n';

export const BuyerLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { ids: compareIds } = useCompare();
  const { t } = useI18n();
  const location = useLocation();
  // Phones: the links and account actions fold into a menu under the navbar.
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMenuOpen(false); }, [location.pathname, location.search]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMenuOpen(false); menuButtonRef.current?.focus(); } };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const compareLabel = compareIds.length ? `${t('nav.compare')} (${compareIds.length})` : t('nav.compare');
  const links = <>
    <NavLink to="/" end className="nav-link">{t('nav.home')}</NavLink>
    <NavLink to="/marketplace" className="nav-link">{t('nav.browse')}</NavLink>
    <NavLink to="/compare" className="nav-link">{compareLabel}</NavLink>
    <NavLink to="/dealer/apply" className="nav-link">{t('nav.dealers')}</NavLink>
  </>;
  const account = isAuthenticated ? (
    <>
      <span className="nav-user-name">{user?.displayName}</span>
      <button type="button" onClick={() => void logout()} className="btn btn-ghost btn-sm">{t('nav.signOut')}</button>
    </>
  ) : (
    <>
      <Link to="/login" className="btn btn-ghost btn-sm">{t('nav.signIn')}</Link>
      <Link to="/signup" className="btn btn-primary btn-sm">{t('nav.signUp')}</Link>
    </>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="buyer-navbar">
        <Link to="/" className="nav-logo">
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--color-accent) 0%, #1D4ED8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 3.1C1.4 11.4 1 12.2 1 13v3c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <circle cx="17" cy="17" r="2" />
            </svg>
          </div>
          <span>Motor<span style={{ color: 'var(--color-accent)' }}>X</span></span>
        </Link>

        <nav className="nav-links" aria-label={t('nav.main')}>{links}</nav>

        <div className="nav-actions">
          <LanguageSwitcher />
          <div className="nav-account">{account}</div>
          <button ref={menuButtonRef} type="button" className="buyer-menu-button" aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')} aria-expanded={menuOpen} aria-controls="buyer-mobile-menu" onClick={() => setMenuOpen((open) => !open)}>
            <svg aria-hidden="true" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? <path strokeLinecap="round" strokeWidth={2} d="M6 6l12 12M18 6L6 18" /> : <path strokeLinecap="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </header>

      {menuOpen && (
        <div id="buyer-mobile-menu" className="buyer-mobile-menu">
          <nav aria-label={t('nav.main')}>{links}</nav>
          <div className="buyer-mobile-account">{account}</div>
        </div>
      )}

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <CompareTray />

      <footer className="site-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">Motor<span style={{ color: 'var(--color-accent)' }}>X</span></div>
            <p>{t('footer.tagline')}</p>
          </div>

          <div className="footer-column">
            <h4>{t('footer.marketplace')}</h4>
            <Link to="/marketplace?bodyType=sedan">{t('footer.sedans')}</Link>
            <Link to="/marketplace?bodyType=suv">{t('footer.suvs')}</Link>
            <Link to="/marketplace?fuelType=electric">{t('footer.electric')}</Link>
            <Link to="/marketplace?fuelType=hybrid">{t('footer.hybrids')}</Link>
          </div>

          <div className="footer-column">
            <h4>{t('footer.portals')}</h4>
            <Link to="/dealer">{t('footer.dealerPortal')}</Link>
            <Link to="/dealer/uploads/new">{t('footer.csvUpload')}</Link>
            <Link to="/admin">{t('footer.adminPanel')}</Link>
          </div>

          <div className="footer-column">
            <h4>{t('footer.account')}</h4>
            <Link to="/login">{t('nav.signIn')}</Link>
            <Link to="/signup">{t('nav.signUp')}</Link>
            <Link to="/marketplace">{t('footer.browseCars')}</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p>{t('footer.rights')}</p>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <a href="#privacy">{t('footer.privacy')}</a>
            <a href="#terms">{t('footer.terms')}</a>
            <a href="#support">{t('footer.support')}</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
