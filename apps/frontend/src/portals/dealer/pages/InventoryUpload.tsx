import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mockUploadJobs, formatFileSize, formatDate } from '../../../shared/mockData';
import { DemoDataNotice } from '../../../shared/components/DemoDataNotice';

export const InventoryUpload: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleStartUpload = () => {
    if (!selectedFile) return;
    setIsUploading(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          navigate('/dealer/uploads/upl_001');
        }, 500);
      }
    }, 200);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <DemoDataNotice />
      <div className="page-header">
        <div>
          <h1 className="page-title">CSV Inventory Upload</h1>
          <p className="page-subtitle">Upload CSV batch files to add or update multiple vehicle listings at once</p>
        </div>
      </div>

      {/* Drag & Drop Upload Card */}
      <div className="glass-card" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
        {!isUploading ? (
          <div>
            <label className="drop-zone">
              <input type="file" accept=".csv" onChange={handleFileChange} style={{ display: 'none' }} />
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {selectedFile ? selectedFile.name : 'Click or drag CSV file to upload'}
                </p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>
                  {selectedFile ? `${formatFileSize(selectedFile.size)} · Ready to upload` : 'Supports UTF-8 CSV files up to 10MB'}
                </p>
              </div>
            </label>

            {selectedFile && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button onClick={handleStartUpload} className="btn btn-primary btn-lg">
                  Start Upload & ETL Processing
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Uploading & Processing CSV...</h3>
            <div className="progress-bar" style={{ maxWidth: 400, margin: '0 auto 1rem' }}>
              <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>
              {uploadProgress}% complete — validating headers and records...
            </p>
          </div>
        )}
      </div>

      {/* CSV Format Guide */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>CSV Template & Format Requirements</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
          Your CSV file must include header columns: <code>make, model, year, price, mileage, bodyType, fuelType, transmission, condition, title, description</code>.
        </p>
        <button className="btn btn-secondary btn-sm">
          ↓ Download Sample CSV Template
        </button>
      </div>

      {/* Recent Upload History */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>Upload History</h3>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Records</th>
                <th>Valid / Rejected</th>
                <th>Status</th>
                <th>Date</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {mockUploadJobs.map(job => (
                <tr key={job.id}>
                  <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{job.fileName}</td>
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
                  <td>
                    <Link to={`/dealer/uploads/${job.id}`} className="btn btn-ghost btn-sm">
                      View Report
                    </Link>
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
