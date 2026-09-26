import React from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { PortalLayout, type PortalNavSection } from '@/shared/components/PortalLayout';

const icon = (path: string) => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} /></svg>;

const sections: PortalNavSection[] = [
  { links: [
    { to: '/dealer', end: true, label: 'Dashboard', icon: icon('M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 00-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6') },
    { to: '/dealer/listings', label: 'My Listings', icon: icon('M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10') },
    { to: '/dealer/listings/new', label: 'Add New Vehicle', icon: icon('M12 4v16m8-8H4') },
  ] },
  { label: 'Bulk Inventory', links: [
    { to: '/dealer/uploads/new', label: 'CSV Inventory Upload', icon: icon('M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12') },
  ] },
  { label: 'Account', links: [
    { to: '/dealer/profile', label: 'Business Profile', icon: icon('M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4') },
  ] },
];

const brand = <>
  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--color-accent) 0%, #1D4ED8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 3.1C1.4 11.4 1 12.2 1 13v3c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  </div>
  <div>
    <span className="logo-text">Motor<span className="logo-accent">X</span></span>
    <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--color-accent-light)', fontWeight: 600 }}>DEALER PORTAL</span>
  </div>
</>;

export const DealerLayout: React.FC = () => {
  const { user, logout } = useAuth();
  return <PortalLayout brand={brand} sections={sections} userName={user?.displayName || 'Dealer'} userRole="Authorized Dealer" onSignOut={() => void logout()} toolbarLabel="Dealer workspace" />;
};
