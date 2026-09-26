import React from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { PortalLayout, type PortalNavSection } from '@/shared/components/PortalLayout';

const icon = (path: string) => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} /></svg>;

const sections: PortalNavSection[] = [
  { links: [
    { to: '/admin', end: true, label: 'Dashboard', icon: icon('M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z') },
  ] },
  { label: 'Management', links: [
    { to: '/admin/users', label: 'User Accounts', icon: icon('M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z') },
  ] },
  { label: 'System', links: [
    { to: '/admin/dealers', label: 'Dealer Approvals', icon: icon('M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z') },
    { to: '/admin/uploads', label: 'Upload Monitoring', icon: icon('M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12') },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: icon('M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2') },
  ] },
];

const brand = <>
  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--color-amber) 0%, var(--color-amber-dark) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  </div>
  <div>
    <span className="logo-text">Motor<span style={{ color: 'var(--color-amber)' }}>X</span></span>
    <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--color-amber)', fontWeight: 600 }}>ADMIN CONSOLE</span>
  </div>
</>;

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  return <PortalLayout brand={brand} sections={sections} userName={user?.displayName || 'Admin User'} userRole="System Administrator"
    onSignOut={() => void logout()} toolbarLabel="Operations center"
    sidebarStyle={{ background: 'var(--color-bg-secondary)' }} avatarStyle={{ background: 'var(--color-amber-glow)', color: 'var(--color-amber)' }} />;
};
