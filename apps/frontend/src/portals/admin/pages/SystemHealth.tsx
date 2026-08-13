import React from 'react';

export const SystemHealth: React.FC = () => {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">System Health & Infrastructure</h1>
          <p className="page-subtitle">Real-time status of API endpoints, database connections, message queues, and ETL workers</p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <span className="stat-label">API Health (`/health/live`)</span>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>200 OK</div>
          <span className="stat-change positive">Latency: 14ms</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Database Health (`/health/ready`)</span>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>Connected</div>
          <span className="stat-change positive">MongoDB pool: 8/20 active</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Redis Queue Health</span>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>Healthy</div>
          <span className="stat-change positive">BullMQ jobs: 0 failed</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">ETL Worker Engine</span>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>Processing</div>
          <span className="stat-change positive">Worker uptime: 99.98%</span>
        </div>
      </div>

      {/* Component breakdown */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>Subsystem Health Check Results</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Backend API Service</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', marginTop: '0.125rem' }}>Express modular monolith backend</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>GET /health/live</span>
              <span className="badge badge-success">HTTP 200</span>
            </div>
          </div>

          <div style={{ padding: '1rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Dependencies Readiness</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', marginTop: '0.125rem' }}>MongoDB, Redis, and S3 Storage ping checks</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>GET /health/ready</span>
              <span className="badge badge-success">HTTP 200</span>
            </div>
          </div>

          <div style={{ padding: '1rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Full Operational Health</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', marginTop: '0.125rem' }}>Combined status across backend, DB, queue, worker</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>GET /health</span>
              <span className="badge badge-success">HTTP 200</span>
            </div>
          </div>

          <div style={{ padding: '1rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Admin Detailed Metrics</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', marginTop: '0.125rem' }}>Protected operational metrics endpoint</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>GET /api/v1/admin/system-health</span>
              <span className="badge badge-success">HTTP 200</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};