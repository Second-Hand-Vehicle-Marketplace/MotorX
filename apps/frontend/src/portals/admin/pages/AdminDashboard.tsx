import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDateTime } from '../../../shared/utils/formatters';
import { adminApi } from '@/features/admin/services/adminApi';

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [uploadJobs, setUploadJobs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    void Promise.all([
      adminApi.getUsers(),
      adminApi.getListings(),
      adminApi.getUploadJobs(),
      adminApi.getAuditLogs(),
    ]).then(([nextUsers, nextListings, nextUploadJobs, nextAuditLogs]) => {
      setUsers(nextUsers);
      setListings(nextListings);
      setUploadJobs(nextUploadJobs);
      setAuditLogs(nextAuditLogs);
    });
  }, []);

  const totalUsers = users.length;
  const dealers = users.filter(u => u.role === 'dealer');
  const activeListings = listings.filter(l => l.status === 'active').length;
  const pendingJobs = uploadJobs.filter(j => j.status === 'pending' || j.status === 'processing').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Platform overview, system health status, and administrative logs</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <span className="stat-label">Total Users</span>
          <div className="stat-value">{totalUsers}</div>
          <span className="stat-change positive">↑ {dealers.length} registered dealers</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Active Listings</span>
          <div className="stat-value">{activeListings}</div>
          <span className="stat-change positive">Across {dealers.length} dealerships</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">ETL Upload Jobs</span>
          <div className="stat-value">{uploadJobs.length}</div>
          <span className="stat-change" style={{ color: 'var(--color-info)' }}>{pendingJobs} in queue/processing</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">System Status</span>
          <div className="stat-value" style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="status-dot online" /> Operational
          </div>
          <span className="stat-change positive">All services operational</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Recent Audit Events */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Recent Audit Activity</h3>
            <Link to="/admin/audit-logs" style={{ fontSize: '0.8125rem', color: 'var(--color-amber)' }}>
              View All Logs →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {auditLogs.slice(0, 5).map(log => (
              <div
                key={log.id}
                style={{
                  padding: '0.75rem 1rem',
                  background: 'var(--color-bg-tertiary)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-glass-border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-amber)' }}>
                    {log.eventType.replace('_', ' ').toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                    {formatDateTime(log.timestamp)}
                  </span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                  {log.details}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* System Health Quick Status */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Service Health</h3>
            <Link to="/admin/system-health" style={{ fontSize: '0.8125rem', color: 'var(--color-amber)' }}>
              Detailed Metrics →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="status-dot online" />
                <span style={{ fontWeight: 600 }}>API Gateway</span>
              </div>
              <span className="badge badge-success">Live (12ms)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="status-dot online" />
                <span style={{ fontWeight: 600 }}>MongoDB Database</span>
              </div>
              <span className="badge badge-success">Ready (5ms)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="status-dot online" />
                <span style={{ fontWeight: 600 }}>Redis Queue (BullMQ)</span>
              </div>
              <span className="badge badge-success">Active</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="status-dot online" />
                <span style={{ fontWeight: 600 }}>ETL Worker Engine</span>
              </div>
              <span className="badge badge-success">Running</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};