import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatFileSize, formatDate } from '../../../shared/utils/formatters';
import { adminApi } from '@/features/admin/services/adminApi';
import { apiClient } from '@/shared/services/apiClient';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const InventoryUpload: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCsvFile, setSelectedCsvFile] = useState<File | null>(null);
  const [selectedZipFile, setSelectedZipFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadJobs, setUploadJobs] = useState<any[]>([]);

  useEffect(() => {
    void adminApi.getUploadJobs().then((jobs) => {
      setUploadJobs(jobs.filter((job: any) => job.dealerId === user?.id));
    }).catch(() => setUploadJobs([]));
  }, [user?.id]);

  const handleFileChange = (kind: 'csv' | 'zip', e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (kind === 'csv') {
        setSelectedCsvFile(e.target.files[0]);
      } else {
        setSelectedZipFile(e.target.files[0]);
      }
    }
  };

  const handleStartUpload = async () => {
    if (!selectedCsvFile || !selectedZipFile) return;

    setIsUploading(true);
    setUploadProgress(15);

    try {
      const formData = new FormData();
      formData.append('csv', selectedCsvFile);
      if (selectedZipFile) formData.append('zip', selectedZipFile);
      formData.append('dealerId', user?.id ?? '');
      formData.append('dealerName', user?.displayName ?? '');

      const response = await apiClient.post<{ data: { id: string } }>('/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadProgress(100);
      setTimeout(() => {
        navigate(`/dealer/uploads/${response.data.data.id}`);
      }, 500);
    } catch (error) {
      console.error('Inventory upload failed', error);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">CSV / ZIP Inventory Upload</h1>
          <p className="page-subtitle">Upload CSV batch files or image ZIP archives to add or update multiple vehicle listings at once</p>
        </div>
      </div>

      {/* Linked CSV + ZIP submission */}
      <div className="glass-card" style={{ padding: '2.5rem', marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.75rem' }}>Inventory Batch</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>Choose one CSV and its matching image ZIP, then submit both together as one inventory batch.</p>
        {!isUploading ? (
          <div>
            <label className="drop-zone">
              <input type="file" accept=".csv" onChange={(event) => handleFileChange('csv', event)} style={{ display: 'none' }} />
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {selectedCsvFile ? selectedCsvFile.name : 'Click or drag CSV file to upload'}
                </p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>
                  {selectedCsvFile ? `${formatFileSize(selectedCsvFile.size)} · Ready to upload` : 'Supports UTF-8 CSV files up to 10MB'}
                </p>
              </div>
            </label>

            <div style={{ marginTop: '1.5rem' }}>
            <label className="drop-zone">
              <input type="file" accept=".zip" onChange={(event) => handleFileChange('zip', event)} style={{ display: 'none' }} />
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {selectedZipFile ? selectedZipFile.name : 'Click or drag ZIP image bundle to upload'}
                </p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>
                  {selectedZipFile ? `${formatFileSize(selectedZipFile.size)} · Ready to upload` : 'Supports ZIP bundles up to 10MB'}
                </p>
              </div>
            </label>
            </div>

            {selectedCsvFile && selectedZipFile && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button onClick={() => void handleStartUpload()} className="btn btn-primary btn-lg">
                  Submit CSV + ZIP Batch
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Uploading and processing batch...</h3>
            <div className="progress-bar" style={{ maxWidth: 400, margin: '0 auto 1rem' }}>
              <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)' }}>
              {uploadProgress}% complete — validating rows and matching images...
            </p>
          </div>
        )}
      </div>

      {/* CSV / ZIP format guide */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>CSV + ZIP Template & Format Requirements</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
          CSV rows can include image columns such as <code>image1,image2,...,imageN</code>. ZIP uploads should contain the matching vehicle photos referenced by those columns. Required CSV fields include: <code>make, model, year, price, mileage, bodyType, fuelType, transmission, condition, vin, plateNumber, title, description</code>. Every row must include both <code>vin</code> and <code>plateNumber</code>, and both identifiers must be unique.
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
              {uploadJobs.map(job => (
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