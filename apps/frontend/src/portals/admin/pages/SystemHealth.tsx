import React, { useEffect, useState } from 'react';
import { adminApi, type AdminSystemHealth } from '@/features/admin/services/adminApi';
import { formatDateTime } from '@/shared/utils/formatters';

export const SystemHealth: React.FC = () => {
  const [health, setHealth] = useState<AdminSystemHealth | null>(null); const [error, setError] = useState('');
  useEffect(() => { void adminApi.getSystemHealth().then(setHealth).catch((e: unknown) => setError(e instanceof Error ? e.message : 'Unable to load system health.')); }, []);
  const services = health ? [['Backend API', health.backend.status], ['MongoDB Database', health.database.status], ['Redis Queue', health.queue.status], ['ETL Worker', health.worker.status]] : [];
  return <div><div className="page-header"><div><h1 className="page-title">System Health</h1><p className="page-subtitle">Current state reported by protected backend checks</p></div></div>{error && <div className="alert alert-error">{error}</div>}
    {!health && !error && <div className="glass-card" style={{ padding: '1.5rem' }}>Checking services...</div>}
    {health && <><div className="stats-grid" style={{ marginBottom: '2rem' }}>{services.map(([name, status]) => <div className="stat-card" key={name}><span className="stat-label">{name}</span><div className="stat-value" style={{ fontSize: '1.25rem' }}>{status}</div><span className={`badge ${status === 'operational' ? 'badge-success' : 'badge-warning'}`}>{status}</span></div>)}</div><p style={{ color: 'var(--color-text-tertiary)' }}>Last checked {formatDateTime(health.checkedAt)} · Backend uptime {health.backend.uptimeSeconds}s</p></>}
  </div>;
};
