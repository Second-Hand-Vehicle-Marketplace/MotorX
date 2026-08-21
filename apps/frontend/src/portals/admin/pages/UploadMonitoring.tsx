import React, { useEffect, useState } from 'react';
import { adminApi, type AdminUpload } from '@/features/admin/services/adminApi';
import { formatDate } from '@/shared/utils/formatters';

export const UploadMonitoring: React.FC = () => {
  const [uploads, setUploads] = useState<AdminUpload[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { void adminApi.listUploads().then(setUploads).catch((e: unknown) => setError(e instanceof Error ? e.message : 'Unable to load upload jobs.')).finally(() => setLoading(false)); }, []);
  return <div><div className="page-header"><div><h1 className="page-title">CSV Upload Monitoring</h1><p className="page-subtitle">Platform-wide inventory processing activity</p></div></div>{error && <div className="alert alert-error">{error}</div>}
    <div className="glass-card" style={{ padding: 0 }}><div className="table-container"><table className="data-table"><thead><tr><th>Job ID</th><th>Dealership</th><th>File</th><th>Records</th><th>Valid / Rejected</th><th>Status</th><th>Date</th></tr></thead><tbody>
      {loading && <tr><td colSpan={7}>Loading upload jobs...</td></tr>}{!loading && uploads.length === 0 && <tr><td colSpan={7}>No inventory uploads have been submitted.</td></tr>}
      {!loading && uploads.map((job) => <tr key={job.id}><td style={{ fontFamily: 'monospace' }}>{job.id}</td><td>{job.dealerName}</td><td>{job.fileName}</td><td>{job.totalRecords}</td><td>{job.validRecords} / {job.rejectedRecords}</td><td><span className={`badge ${job.status === 'completed' ? 'badge-success' : job.status === 'processing' ? 'badge-info' : job.status === 'failed' ? 'badge-error' : 'badge-neutral'}`}>{job.status}</span></td><td>{formatDate(job.createdAt)}</td></tr>)}
    </tbody></table></div></div></div>;
};
