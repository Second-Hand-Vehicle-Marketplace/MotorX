import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { PaginationMeta } from '@motorx/shared-contracts';
import { adminApi, type AdminUpload, type AdminUser } from '@/features/admin/services/adminApi';
import { PagerControls } from '@/shared/components/PagerControls';
import { formatDate } from '@/shared/utils/formatters';

const statusBadge = (status: AdminUpload['status']) => status === 'completed' ? 'badge-success' : status === 'processing' ? 'badge-info' : status === 'failed' ? 'badge-error' : status === 'completedWithErrors' ? 'badge-warning' : 'badge-neutral';

// Filters live in the URL, so dashboard links (?uploadId=…) open the exact record and a filtered
// view can be shared or reloaded.
export const UploadMonitoring: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const uploadId = params.get('uploadId') ?? '';
  const dealerId = params.get('dealerId') ?? '';
  const status = params.get('status') ?? '';
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const page = Number(params.get('page') ?? '1') || 1;

  const [uploads, setUploads] = useState<AdminUpload[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [dealers, setDealers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) { if (value) next.set(key, value); else next.delete(key); }
    if (!('page' in changes)) next.delete('page'); // a new filter starts from the first page
    setParams(next);
  };

  useEffect(() => { adminApi.listUsers({ role: 'dealer', limit: 100 }).then((result) => setDealers(result.users)).catch(() => undefined); }, []);

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    adminApi.listUploads(uploadId ? { uploadId } : { dealerId: dealerId || undefined, status: (status || undefined) as AdminUpload['status'] | undefined, from: from || undefined, to: to || undefined, page })
      .then((result) => { if (active) { setUploads(result.uploads); setMeta(result.meta); } })
      .catch((e: unknown) => { if (active) { setUploads([]); setMeta(null); setError(e instanceof Error ? e.message : 'Unable to load upload jobs.'); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [uploadId, dealerId, status, from, to, page]);

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">CSV Upload Monitoring</h1><p className="page-subtitle">Review inventory processing by dealer, status, and date.</p></div></div>
      {error && <div className="alert alert-error" role="alert">Upload jobs are unavailable right now: {error}</div>}
      {uploadId ? (
        <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Showing one upload from the dashboard.</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => update({ uploadId: '' })}>Show all uploads</button>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <label className="form-group" style={{ flex: 1, minWidth: 200 }}><span className="form-label">Dealer</span><select className="form-select" value={dealerId} onChange={(event) => update({ dealerId: event.target.value })}><option value="">All dealers</option>{dealers.map((dealer) => <option key={dealer.id} value={dealer.id}>{dealer.displayName || dealer.email}</option>)}</select></label>
          <label className="form-group" style={{ flex: 1, minWidth: 180 }}><span className="form-label">Upload status</span><select className="form-select" value={status} onChange={(event) => update({ status: event.target.value })}><option value="">All statuses</option><option value="pending">Pending</option><option value="processing">Processing</option><option value="completed">Completed</option><option value="completedWithErrors">Completed with errors</option><option value="failed">Failed</option></select></label>
          <label className="form-group" style={{ minWidth: 150 }}><span className="form-label">From</span><input type="date" className="form-input" value={from} max={to || undefined} onChange={(event) => update({ from: event.target.value })} /></label>
          <label className="form-group" style={{ minWidth: 150 }}><span className="form-label">To</span><input type="date" className="form-input" value={to} min={from || undefined} onChange={(event) => update({ to: event.target.value })} /></label>
        </div>
      )}
      <div className="glass-card" style={{ padding: 0 }}>
        <div className="table-container"><table className="data-table">
          <thead><tr><th>Job ID</th><th>Dealership</th><th>File</th><th>Records</th><th>Valid / Rejected</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={7}>Loading upload jobs...</td></tr>}
            {!loading && !error && uploads.length === 0 && <tr><td colSpan={7}>{uploadId ? 'This upload was not found.' : dealerId || status || from || to ? 'No uploads match these filters.' : 'No inventory uploads have been submitted.'}</td></tr>}
            {!loading && uploads.map((job) => (
              <tr key={job.id} aria-current={job.id === uploadId ? 'true' : undefined} style={job.id === uploadId ? { outline: '2px solid var(--color-accent)' } : undefined}>
                <td style={{ fontFamily: 'monospace' }}>{job.id}</td><td>{job.dealerName}</td>
                <td>{job.fileName}{job.status === 'failed' && job.failureReason && <small style={{ display: 'block', color: 'var(--color-error)' }}>{job.failureReason}</small>}</td>
                <td>{job.totalRecords}</td><td>{job.validRecords} / {job.rejectedRecords}</td>
                <td><span className={`badge ${statusBadge(job.status)}`}>{job.status}</span></td><td>{formatDate(job.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
        {!uploadId && <PagerControls meta={meta} label="uploads" onPage={(next) => update({ page: String(next) })} />}
      </div>
    </div>
  );
};
