import React, { useEffect, useState } from 'react';
import { formatDate } from '../../../shared/utils/formatters';
import { adminApi } from '@/features/admin/services/adminApi';

export const UploadMonitoring: React.FC = () => {
  const [uploadJobs, setUploadJobs] = useState<any[]>([]);

  useEffect(() => {
    void adminApi.getUploadJobs().then(setUploadJobs).catch(() => setUploadJobs([]));
  }, []);
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">CSV Upload Monitoring</h1>
          <p className="page-subtitle">Platform-wide overview of all dealer inventory batch upload jobs</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Dealership</th>
                <th>File Name</th>
                <th>Records</th>
                <th>Valid / Rejected</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {uploadJobs.map(job => (
                <tr key={job.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{job.id}</td>
                  <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{job.dealerName}</td>
                  <td>{job.fileName}</td>
                  <td>{job.totalRecords}</td>
                  <td>
                    <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{job.validRecords}</span> / <span style={{ color: job.rejectedRecords > 0 ? 'var(--color-error)' : 'inherit' }}>{job.rejectedRecords}</span>
                  </td>
                  <td>
                    <span className={`badge ${job.status === 'completed' ? 'badge-success' : job.status === 'processing' ? 'badge-info' : 'badge-error'}`}>
                      {job.status}
                    </span>
                  </td>
                  <td>{formatDate(job.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};