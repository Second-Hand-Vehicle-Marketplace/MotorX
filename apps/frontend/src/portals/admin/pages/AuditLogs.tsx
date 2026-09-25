import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { PaginationMeta } from '@motorx/shared-contracts';
import { adminApi, type AdminAuditEvent, type AdminAuditLog } from '@/features/admin/services/adminApi';
import { PagerControls } from '@/shared/components/PagerControls';
import { formatDateTime } from '@/shared/utils/formatters';

const eventLabels: Record<AdminAuditEvent, string> = {
  dealer_approved: 'Dealer Approved', dealer_rejected: 'Dealer Rejected', user_suspended: 'User Suspended',
  user_activated: 'User Activated', listing_removed: 'Listing Removed', dealer_document_viewed: 'Document Viewed',
};

// Filters (event type, date range, page) live in the URL so a filtered view can be shared or reloaded.
export const AuditLogs: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const eventType = (params.get('eventType') ?? '') as AdminAuditEvent | '';
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const page = Number(params.get('page') ?? '1') || 1;

  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) { if (value) next.set(key, value); else next.delete(key); }
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    adminApi.listAuditLogs({ eventType: eventType || undefined, from: from || undefined, to: to || undefined, page })
      .then((result) => { if (active) { setLogs(result.logs); setMeta(result.meta); } })
      .catch((e: unknown) => { if (active) { setLogs([]); setMeta(null); setError(e instanceof Error ? e.message : 'Unable to load audit logs.'); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [eventType, from, to, page]);

  const filtered = Boolean(eventType || from || to);
  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Audit Logs</h1><p className="page-subtitle">Persistent record of significant administrative operations</p></div></div>
      {error && <div className="alert alert-error" role="alert">Audit logs are unavailable right now: {error}</div>}
      <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <label className="form-group" style={{ minWidth: 220 }}><span className="form-label">Event type</span>
          <select className="form-select" value={eventType} onChange={(event) => update({ eventType: event.target.value })}>
            <option value="">All event types</option>
            {(Object.keys(eventLabels) as AdminAuditEvent[]).map((value) => <option key={value} value={value}>{eventLabels[value]}</option>)}
          </select>
        </label>
        <label className="form-group" style={{ minWidth: 150 }}><span className="form-label">From</span><input type="date" className="form-input" value={from} max={to || undefined} onChange={(event) => update({ from: event.target.value })} /></label>
        <label className="form-group" style={{ minWidth: 150 }}><span className="form-label">To</span><input type="date" className="form-input" value={to} min={from || undefined} onChange={(event) => update({ to: event.target.value })} /></label>
      </div>
      <div className="glass-card" style={{ padding: 0 }}>
        <div className="table-container"><table className="data-table">
          <thead><tr><th>Event</th><th>Actor</th><th>Target</th><th>Details</th><th>Timestamp</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={5}>Loading audit logs...</td></tr>}
            {!loading && !error && logs.length === 0 && <tr><td colSpan={5}>{filtered ? 'No events match these filters.' : 'No administrative events recorded.'}</td></tr>}
            {!loading && logs.map((log) => <tr key={log.id}><td><span className="badge badge-warning">{eventLabels[log.eventType] ?? log.eventType}</span></td><td>{log.actorName}</td><td>{log.targetName}</td><td>{log.details}</td><td>{formatDateTime(log.timestamp)}</td></tr>)}
          </tbody>
        </table></div>
        <PagerControls meta={meta} label="events" onPage={(next) => update({ page: String(next) })} />
      </div>
    </div>
  );
};
