import React, { useEffect, useState } from 'react';
import type { PaginationMeta } from '@motorx/shared-contracts';
import { adminApi, type AdminUpload, type AdminUploadRecord } from '@/features/admin/services/adminApi';
import { PagerControls } from '@/shared/components/PagerControls';
import { ResponsiveTable } from '@/shared/components/ResponsiveTable';
import { AccountDetails } from './AccountDetails';

export function UploadCollection({ job }: { job: AdminUpload }) {
  const [outcome, setOutcome] = useState<'completed' | 'rejected'>('completed');
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState<AdminUploadRecord[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [account, setAccount] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setRecords([]); setMeta(null);
    adminApi.listUploadRecords(job.id, outcome, page).then((result) => { if (active) { setRecords(result.records); setMeta(result.meta); } }).catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : 'Unable to load records.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [job.id, outcome, page, refresh]);
  return <section aria-label={`Collection ${job.fileName}`} style={{ padding: '1rem' }}>
    <h2>{job.fileName}</h2>
    <p>{job.processedRecords} of {job.totalRecords} rows processed. Upload status: {job.status}.</p>
    {job.failureReason && <p role="alert">{job.failureReason}</p>}
    <button className="btn btn-secondary btn-sm" onClick={() => setAccount(!account)}>View dealer account</button>
    {account && <AccountDetails userId={job.dealerId} onClose={() => setAccount(false)} />}
    <label className="form-group"><span className="form-label">Row outcome</span><select className="form-select" value={outcome} onChange={(e) => { setOutcome(e.target.value as typeof outcome); setPage(1); }}><option value="completed">Completed imports</option><option value="rejected">Rejected rows</option></select></label>
    <button className="btn btn-secondary btn-sm" onClick={() => setRefresh((value) => value + 1)}>Refresh records</button>
    <p>Completed imports show the current listing status. Rejected rows include the original values and rejection reasons.</p>
    {loading ? <p>Loading collection...</p> : error ? <p role="alert">{error}</p> : records.length === 0 ? <p>No {outcome} records available.</p> : <div className="table-container"><ResponsiveTable><thead><tr><th>CSV row</th><th>Listing / original values</th><th>Outcome</th><th>Status / rejection reason</th></tr></thead><tbody>{records.map((record) => <tr key={record.id}><td>{record.rowNumber ?? 'Unavailable'}</td><td>{record.outcome === 'completed' ? <><button className="btn btn-secondary btn-sm" onClick={() => setAccount(true)}>{record.title}</button><p>{record.year} {record.make} {record.model} ? {record.registrationNumber}</p><span>{record.currency} {record.price.toLocaleString()}</span></> : <dl>{Object.entries(record.originalData).map(([key, value]) => <React.Fragment key={key}><dt>{key}</dt><dd style={{ overflowWrap: 'anywhere' }}>{typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')}</dd></React.Fragment>)}</dl>}</td><td>{record.outcome === 'completed' ? 'Completed' : 'Rejected'}</td><td>{record.outcome === 'completed' ? record.status : <>{record.reason}<ul>{record.errors.map((error, index) => <li key={index}>{error}</li>)}</ul></>}</td></tr>)}</tbody></ResponsiveTable></div>}
    <PagerControls meta={meta} label="records" onPage={setPage} />
  </section>;
}
