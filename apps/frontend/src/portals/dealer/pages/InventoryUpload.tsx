import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { csvTemplatesByCategory, vehicleCategories, type VehicleCategory } from '@motorx/shared-contracts';
import { inventoryApi } from '@/features/inventory/services/inventoryApi';
import { formatFileSize, formatDate } from '@/shared/utils/formatters';

const statusBadgeClass = (status: string) => status === 'completed' ? 'badge-success' : status === 'processing' || status === 'pending' ? 'badge-info' : status === 'completedWithErrors' ? 'badge-warning' : 'badge-error';

// Only categories with a defined CSV template can be bulk-uploaded; 'other' is manual-form-only.
const uploadableCategories = vehicleCategories.filter((category): category is Exclude<VehicleCategory, 'other'> => category in csvTemplatesByCategory);

export const InventoryUpload: React.FC = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState<VehicleCategory>('car');
  const uploadsQuery = useQuery({ queryKey: ['my-uploads', 1, 20], queryFn: () => inventoryApi.listUploads(1, 20) });
  const uploads = uploadsQuery.data?.data ?? [];
  const template = csvTemplatesByCategory[category];

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError('');
    }
  };

  const handleStartUpload = async () => {
    if (!selectedFile) return;
    setError('');
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const job = await inventoryApi.uploadCsv(category, selectedFile, setUploadProgress);
      navigate(`/dealer/uploads/${job.id}`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Could not upload the inventory file.');
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    try {
      const blob = await inventoryApi.downloadTemplate(category);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `motorx-${category}-template.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Could not download the CSV template.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Bulk Vehicle Upload</h1>
          <p className="page-subtitle">Upload a category-specific CSV batch file to add multiple vehicle listings at once</p>
        </div>
      </div>

      {/* Step 1 — Category */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>1. Select the type of vehicles you want to upload</h3>
        <select className="form-select" style={{ maxWidth: 320 }} value={category} onChange={(e) => { setCategory(e.target.value as VehicleCategory); setSelectedFile(null); }}>
          {uploadableCategories.map((value) => <option key={value} value={value}>{csvTemplatesByCategory[value]?.label}</option>)}
        </select>
      </div>

      {/* Step 2 — Template */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>2. Download the MotorX CSV template</h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', marginBottom: '1rem' }}>
          The template already has the right columns for {template?.label} listings, with one filled-in example row.
        </p>
        <button onClick={() => void handleDownloadTemplate()} disabled={isDownloading} className="btn btn-secondary btn-sm">
          ↓ Download {template?.label} CSV Template
        </button>
      </div>

      {/* Step 3 — Upload */}
      <div className="glass-card" style={{ padding: '2.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>3. Add your vehicle information, then upload the completed CSV</h3>
        {error && <div className="glass-card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', color: 'var(--color-error)' }}>{error}</div>}
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
                  {selectedFile ? `${formatFileSize(selectedFile.size)} · Ready to upload` : `Supports UTF-8 CSV files up to 10MB, using the ${template?.label} template`}
                </p>
              </div>
            </label>

            {selectedFile && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button onClick={() => void handleStartUpload()} className="btn btn-primary btn-lg">
                  Start Upload & ETL Processing
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Uploading CSV...</h3>
            <div className="progress-bar" style={{ maxWidth: 400, margin: '0 auto 1rem' }}>
              <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>
              {uploadProgress}% uploaded — ETL processing continues in the background after upload completes.
            </p>
          </div>
        )}
      </div>

      {/* Field guide */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>{template?.label} CSV Field Guide</h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', marginBottom: '1rem' }}>
          Leave optional or non-applicable fields blank — for example, an electric vehicle's engine capacity, or a petrol vehicle's battery fields.
        </p>
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Field</th><th>Required</th><th>Example</th></tr></thead>
            <tbody>
              {template?.fields.map((field) => (
                <tr key={field.key}><td style={{ fontFamily: 'monospace' }}>{field.key}</td><td>{field.required}</td><td>{field.example || '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Upload History */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>Upload History</h3>

        {uploadsQuery.isLoading && <div className="loading-spinner" style={{ margin: '2rem auto', display: 'block' }} />}
        {uploadsQuery.isError && <div className="glass-card" style={{ padding: '1rem', color: 'var(--color-error)' }}>Could not load upload history.</div>}
        {!uploadsQuery.isLoading && !uploadsQuery.isError && uploads.length === 0 && <div className="empty-state"><p>No inventory uploads yet.</p></div>}

        {!uploadsQuery.isLoading && uploads.length > 0 && (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Category</th>
                  <th>Records</th>
                  <th>Valid / Rejected</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map(job => (
                  <tr key={job.id}>
                    <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{job.fileName}</td>
                    <td>{csvTemplatesByCategory[job.category]?.label ?? job.category}</td>
                    <td>{job.totalRecords}</td>
                    <td>
                      <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{job.validRecords}</span> / <span style={{ color: job.rejectedRecords > 0 ? 'var(--color-error)' : 'inherit' }}>{job.rejectedRecords}</span>
                    </td>
                    <td>
                      <span className={`badge ${statusBadgeClass(job.status)}`}>
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
        )}
      </div>
    </div>
  );
};
