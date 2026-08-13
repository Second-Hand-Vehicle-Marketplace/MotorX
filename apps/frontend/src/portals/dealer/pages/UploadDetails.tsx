import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatDateTime, formatFileSize } from '../../../shared/utils/formatters';
import { apiClient } from '@/shared/services/apiClient';
import { env } from '@/config/env';

export const UploadDetails: React.FC = () => {
  const { uploadId } = useParams<{ uploadId: string }>();
  const [job, setJob] = useState<any | null>(null);

  useEffect(() => {
    if (!uploadId) return;
    void apiClient
      .get<{ data: any }>(`/uploads/${uploadId}`)
      .then((response) => setJob(response.data.data))
      .catch(() => setJob(null));
  }, [uploadId]);

  const rejectedRows = useMemo(() => job?.rejectedRows ?? [], [job]);

  if (!job) {
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Upload job not found</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
            The upload report is not available yet. Please return to uploads and retry.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', marginBottom: '0.5rem' }}>
            <Link to="/dealer/uploads/new" style={{ color: 'var(--color-text-secondary)' }}>Uploads</Link>
            <span>/</span>
            <span>{job.id}</span>
          </div>
          <h1 className="page-title">{job.fileName}</h1>
          <p className="page-subtitle">Detailed record summary and rejection log for upload job</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <span className="stat-label">File Size</span>
          <div className="stat-value">{formatFileSize(job.fileSize)}</div>
          <span className="stat-change">Uploaded {formatDateTime(job.createdAt)}</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Total Records</span>
          <div className="stat-value">{job.totalRecords}</div>
          <span className="stat-change">Processed in ETL pipeline</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Valid Listings Created</span>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>{job.validRecords}</div>
          <span className="stat-change positive">Added to active inventory</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Rejected Records</span>
          <div className="stat-value" style={{ color: 'var(--color-error)' }}>{job.rejectedRecords}</div>
          <span className="stat-change negative">Validation errors</span>
        </div>
      </div>

      {/* Rejected Records Log Table */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Rejected Records Log</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>
              Rows that failed schema or business rule validation during upload
            </p>
          </div>
          <a className="btn btn-secondary btn-sm" href={`${env.API_URL}/uploads/${job.id}/errors.csv`}>
            Download Error Log (.csv)
          </a>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>CSV Row</th>
                <th>Make / Model</th>
                <th>Validation Errors</th>
              </tr>
            </thead>
            <tbody>
              {rejectedRows.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ color: 'var(--color-text-secondary)' }}>
                    No rejected records for this upload.
                  </td>
                </tr>
              ) : rejectedRows.map((record: any, idx: number) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600, color: 'var(--color-accent-light)' }}>Row #{record.row}</td>
                  <td style={{ fontWeight: 500 }}>
                    {record.data?.make || '(Missing Make)'} {record.data?.model || '(Missing Model)'}
                  </td>
                  <td>
                    {record.errors.map((err: string, i: number) => (
                      <span key={i} className="badge badge-error" style={{ marginRight: '0.375rem' }}>
                        {err}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};