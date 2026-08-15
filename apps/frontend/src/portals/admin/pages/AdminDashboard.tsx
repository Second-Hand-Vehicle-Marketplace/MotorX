import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, type AdminStats } from '@/features/admin/services/adminApi';

const emptyStats: AdminStats = { totalUsers: 0, registeredDealers: 0, totalListings: 0, pendingDealerApplications: 0 };

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    // Ignore late responses after navigation away from the dashboard.
    void adminApi.getStats().then((result) => { if (active) setStats(result); })
      .catch((requestError: unknown) => { if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load dashboard statistics.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <div>
    <div className="page-header"><div><h1 className="page-title">Admin Dashboard</h1><p className="page-subtitle">Live platform overview and administrative shortcuts</p></div></div>
    {error && <div className="alert alert-error" role="alert" style={{ marginBottom: '1rem' }}>{error}</div>}
    <div className="stats-grid" style={{ marginBottom: '2rem' }}>
      <div className="stat-card"><span className="stat-label">Total Users</span><div className="stat-value">{loading ? '—' : stats.totalUsers}</div><span className="stat-change positive">{stats.registeredDealers} active dealers</span></div>
      <div className="stat-card"><span className="stat-label">Total Listings</span><div className="stat-value">{loading ? '—' : stats.totalListings}</div><Link to="/admin/listings" className="stat-change positive">Review listings →</Link></div>
      <div className="stat-card"><span className="stat-label">Pending Applications</span><div className="stat-value">{loading ? '—' : stats.pendingDealerApplications}</div><Link to="/admin/dealers" className="stat-change" style={{ color: 'var(--color-info)' }}>Review dealers →</Link></div>
      <div className="stat-card"><span className="stat-label">Upload Jobs</span><div className="stat-value">—</div><span className="stat-change">Available after the upload pipeline</span></div>
    </div>
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <h3 style={{ marginBottom: '1rem' }}>Administration</h3>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link className="btn btn-secondary" to="/admin/users">Manage Users</Link><Link className="btn btn-secondary" to="/admin/dealers">Dealer Approvals</Link><Link className="btn btn-secondary" to="/admin/listings">Listing Oversight</Link><Link className="btn btn-secondary" to="/admin/system-health">System Health</Link>
      </div>
    </div>
  </div>;
};
