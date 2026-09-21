import React, { useEffect, useState } from 'react';
import { adminApi, type AdminAuditEvent, type AdminAuditLog } from '@/features/admin/services/adminApi';
import { formatDateTime } from '@/shared/utils/formatters';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]); const [filter, setFilter] = useState<AdminAuditEvent | ''>('');
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { setLoading(true); setError(''); void adminApi.listAuditLogs(filter || undefined).then(setLogs).catch((e: unknown) => setError(e instanceof Error ? e.message : 'Unable to load audit logs.')).finally(() => setLoading(false)); }, [filter]);
  return <div><div className="page-header"><div><h1 className="page-title">Audit Logs</h1><p className="page-subtitle">Persistent record of significant administrative operations</p></div></div>
    {error && <div className="alert alert-error">{error}</div>}
    <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem' }}><select className="form-select" style={{ maxWidth: 240 }} value={filter} onChange={(e) => setFilter(e.target.value as AdminAuditEvent | '')}><option value="">All Event Types</option><option value="dealer_approved">Dealer Approved</option><option value="dealer_rejected">Dealer Rejected</option><option value="user_suspended">User Suspended</option><option value="user_activated">User Activated</option><option value="listing_removed">Listing Removed</option></select></div>
    <div className="glass-card" style={{ padding: 0 }}><div className="table-container"><table className="data-table"><thead><tr><th>Event</th><th>Actor</th><th>Target</th><th>Details</th><th>Timestamp</th></tr></thead><tbody>
      {loading && <tr><td colSpan={5}>Loading audit logs...</td></tr>}{!loading && logs.length === 0 && <tr><td colSpan={5}>No administrative events recorded.</td></tr>}
      {!loading && logs.map((log) => <tr key={log.id}><td><span className="badge badge-warning">{log.eventType}</span></td><td>{log.actorName}</td><td>{log.targetName}</td><td>{log.details}</td><td>{formatDateTime(log.timestamp)}</td></tr>)}
    </tbody></table></div></div></div>;
};
