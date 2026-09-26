import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { NotificationCenter } from '@/features/notifications/components/NotificationCenter';
import { getInitials } from '@/shared/utils/formatters';

export interface PortalNavLink { to: string; label: string; icon: React.ReactNode; end?: boolean }
export interface PortalNavSection { label?: string; links: PortalNavLink[] }

interface PortalLayoutProps {
  brand: React.ReactNode;
  sections: PortalNavSection[];
  userName: string;
  userRole: string;
  onSignOut: () => void;
  toolbarLabel: string;
  sidebarStyle?: React.CSSProperties;
  avatarStyle?: React.CSSProperties;
}

// Shared shell for the dealer and admin portals. On wide screens the sidebar is always shown; below
// 1024 px it becomes a drawer opened from the menu button, so every page stays reachable on phones
// and tablets. The drawer closes on navigation, on Escape, or by tapping outside it.
export const PortalLayout: React.FC<PortalLayoutProps> = ({ brand, sections, userName, userRole, onSignOut, toolbarLabel, sidebarStyle, avatarStyle }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => { setMenuOpen(false); }, [location.pathname, location.search]);

  useEffect(() => {
    if (!menuOpen) return;
    // Keep the page behind the drawer still, and move focus into the drawer for keyboard users.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sidebarRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMenuOpen(false); menuButtonRef.current?.focus(); } };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKeyDown); };
  }, [menuOpen]);

  return (
    <div className="portal-layout">
      <aside id="portal-sidebar" ref={sidebarRef} className={`portal-sidebar ${menuOpen ? 'is-open' : ''}`} style={sidebarStyle} aria-label="Portal navigation">
        <div className="sidebar-logo">{brand}</div>

        <nav className="sidebar-nav">
          {sections.map((section, index) => (
            <React.Fragment key={section.label ?? index}>
              {section.label && <span className="sidebar-section-label">{section.label}</span>}
              {section.links.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                  {link.icon}
                  {link.label}
                </NavLink>
              ))}
            </React.Fragment>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar" style={avatarStyle}>{getInitials(userName)}</div>
          <div className="user-info">
            <div className="user-name">{userName}</div>
            <div className="user-role">{userRole}</div>
          </div>
          <button type="button" onClick={onSignOut} title="Sign Out" aria-label="Sign out" className="sidebar-sign-out">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </aside>

      {menuOpen && <button type="button" className="portal-backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}

      <main className="portal-main">
        <div className="portal-toolbar">
          <button ref={menuButtonRef} type="button" className="portal-menu-button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="portal-sidebar" onClick={() => setMenuOpen((open) => !open)}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="portal-toolbar-label">{toolbarLabel}</span>
          <NotificationCenter />
        </div>
        <Outlet />
      </main>
    </div>
  );
};
