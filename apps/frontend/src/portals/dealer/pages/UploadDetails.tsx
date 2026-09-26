import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/features/inventory/services/inventoryApi';
import { listingApi } from '@/features/listings/services/listingApi';
import { ResponsiveTable } from '@/shared/components/ResponsiveTable';
import type { ImageProcessingStatus } from '@/features/inventory/types/inventory.types';
import { formatDateTime, formatFileSize } from '@/shared/utils/formatters';

const activeImageStatuses = new Set<ImageProcessingStatus>(['pending', 'processing']);

// CSV rows are imported as drafts so the dealer can check them first. This publishes every draft
// from this upload in one step, instead of opening each listing.
const PublishDraftsCard: React.FC<{ uploadId: string }> = ({ uploadId }) => {
  const queryClient = useQueryClient();
  const draftsQuery = useQuery({ queryKey: ['my-listings', 'upload-drafts', uploadId], queryFn: () => listingApi.getMyListings(1, 1, { status: 'draft', uploadJobId: uploadId }) });
  const [isPublishing, setIsPublishing] = useState(false);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const drafts = draftsQuery.data?.total ?? 0;

  const publishAll = async () => {
    if (!window.confirm(`Publish all ${drafts} draft listings from this upload? Buyers will see them straight away.`)) return;
    setIsPublishing(true); setMessage(null);
    try {
      const result = await listingApi.bulkAction({ action: 'publish', uploadJobId: uploadId });
      setMessage({ kind: 'success', text: `${result.updated} listing${result.updated === 1 ? '' : 's'} published.` });
      await Promise.all([queryClient.invalidateQueries({ queryKey: ['my-listings'] }), queryClient.invalidateQueries({ queryKey: ['my-listing-stats'] })]);
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Could not publish these listings.' });
    } finally {
      setIsPublishing(false);
    }
  };

  if (!drafts && !message) return null;
  return (
    <div className="glass-card publish-drafts-card">
      <div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Ready to publish</h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>
          {drafts ? `${drafts} draft listing${drafts === 1 ? '' : 's'} from this upload ${drafts === 1 ? 'is' : 'are'} not visible to buyers yet.` : 'Every listing from this upload is published.'}
        </p>
        {message && <p role={message.kind === 'error' ? 'alert' : 'status'} style={{ marginTop: '0.5rem', color: message.kind === 'error' ? 'var(--color-error)' : 'var(--color-success)' }}>{message.text}</p>}
      </div>
      {drafts > 0 && <button type="button" className="btn btn-success" disabled={isPublishing} onClick={() => void publishAll()}>{isPublishing ? 'Publishing…' : `Publish all ${drafts}`}</button>}
    </div>
  );
};

// Re-queues a failed stage and refreshes the job so its new pending status shows immediately.
const RetryButton: React.FC<{ uploadId: string; stage: 'csv' | 'images' }> = ({ uploadId, stage }) => {
  const queryClient = useQueryClient();
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState('');
  const retry = async () => {
    setError(''); setIsRetrying(true);
    try {
      await (stage === 'csv' ? inventoryApi.retryUpload(uploadId) : inventoryApi.retryImages(uploadId));
      await queryClient.invalidateQueries({ queryKey: ['upload', uploadId] });
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : 'Could not retry this upload.');
    } finally { setIsRetrying(false); }
  };
  return (
    <span style={{ display: 'inline-flex', gap: '0.75rem', alignItems: 'center', marginLeft: '0.75rem' }}>
      <button onClick={() => void retry()} disabled={isRetrying} className="btn btn-secondary btn-sm">{isRetrying ? 'Retrying...' : 'Retry'}</button>
      {error && <span>{error}</span>}
    </span>
  );
};

const VehiclePhotosCard: React.FC<{ uploadId: string; canUpload: boolean; imageProcessingStatus: ImageProcessingStatus; imageZipFileName: string | null; imagesAttached: number; matchedListings: number; unmatchedFolders: string[]; imageFailureReason: string | null }> = ({
  uploadId, canUpload, imageProcessingStatus, imageZipFileName, imagesAttached, matchedListings, unmatchedFolders, imageFailureReason,
}) => {
  const queryClient = useQueryClient();
  const [selectedZip, setSelectedZip] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const handleUpload = async () => {
    if (!selectedZip) return;
    setError(''); setIsUploading(true); setUploadProgress(0);
    try {
      await inventoryApi.uploadImagesZip(uploadId, selectedZip, setUploadProgress);
      setSelectedZip(null);
      await queryClient.invalidateQueries({ queryKey: ['upload', uploadId] });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Could not upload the vehicle photos.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>Vehicle Photos</h3>
      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', marginBottom: '1rem' }}>
        Upload a .zip with one folder per registration number (e.g. <code>CAX-1234/photo1.jpg</code>) to attach photos to the vehicles this upload created.
      </p>

      {!canUpload && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)' }}>Available once the CSV upload has finished processing.</p>
      )}

      {canUpload && (imageProcessingStatus === 'pending' || imageProcessingStatus === 'processing') && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="loading-spinner" />
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Matching and attaching photos from {imageZipFileName}...</span>
        </div>
      )}

      {canUpload && (imageProcessingStatus === 'completed' || imageProcessingStatus === 'completedWithErrors') && (
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{imagesAttached}</span> photo(s) attached to{' '}
            <span style={{ fontWeight: 600 }}>{matchedListings}</span> vehicle(s) from {imageZipFileName}.
          </p>
          {unmatchedFolders.length > 0 && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-warning)', marginTop: '0.5rem' }}>
              No matching vehicle for: {unmatchedFolders.join(', ')} — check the folder name matches a registration number from this upload.
            </p>
          )}
        </div>
      )}

      {canUpload && imageProcessingStatus === 'failed' && imageFailureReason && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-error)', marginBottom: '1rem' }}>Processing failed: {imageFailureReason}<RetryButton uploadId={uploadId} stage="images" /></p>
      )}

      {canUpload && !activeImageStatuses.has(imageProcessingStatus) && (
        <div>
          {error && <div className="glass-card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', color: 'var(--color-error)' }}>{error}</div>}
          {!isUploading ? (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="file" accept=".zip" onChange={(e) => setSelectedZip(e.target.files?.[0] ?? null)} className="form-input" style={{ maxWidth: 320 }} />
              <button onClick={() => void handleUpload()} disabled={!selectedZip} className="btn btn-primary btn-sm">
                {imageProcessingStatus === 'none' ? 'Upload Photos' : 'Upload More Photos'}
              </button>
            </div>
          ) : (
            <div className="progress-bar" style={{ maxWidth: 300 }}><div className="progress-fill" style={{ width: `${uploadProgress}%` }} /></div>
          )}
        </div>
      )}
    </div>
  );
};

export const UploadDetails: React.FC = () => {
  const { uploadId } = useParams<{ uploadId: string }>();
  const jobQuery = useQuery({
    queryKey: ['upload', uploadId],
    queryFn: () => inventoryApi.getUpload(uploadId!),
    enabled: !!uploadId,
    // Poll while either stage is queued or running (including after a Retry).
    refetchInterval: (query) => activeImageStatuses.has(query.state.data?.imageProcessingStatus ?? 'none') || query.state.data?.status === 'pending' || query.state.data?.status === 'processing' ? 2_000 : false,
  });
  const recordsQuery = useQuery({ queryKey: ['upload-rejected-records', uploadId], queryFn: () => inventoryApi.getRejectedRecords(uploadId!, 1, 100), enabled: !!uploadId });

  if (jobQuery.isLoading) return <div className="loading-spinner" style={{ margin: '3rem auto', display: 'block' }} />;
  if (jobQuery.isError || !jobQuery.data) return <div className="glass-card" style={{ padding: '1rem', color: 'var(--color-error)' }}>Could not load this upload job.</div>;

  const job = jobQuery.data;
  const rejectedRecords = recordsQuery.data?.data ?? [];

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
          <span className="stat-change positive">Imported as drafts</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Rejected Records</span>
          <div className="stat-value" style={{ color: 'var(--color-error)' }}>{job.rejectedRecords}</div>
          <span className="stat-change negative">Validation errors</span>
        </div>
      </div>

      {job.status === 'failed' && job.failureReason && (
        <div className="glass-card" style={{ padding: '1rem', marginBottom: '2rem', color: 'var(--color-error)' }}>
          Processing failed: {job.failureReason}<RetryButton uploadId={job.id} stage="csv" />
        </div>
      )}

      {(job.status === 'completed' || job.status === 'completedWithErrors') && <PublishDraftsCard uploadId={job.id} />}

      <VehiclePhotosCard
        uploadId={job.id}
        canUpload={job.status === 'completed' || job.status === 'completedWithErrors'}
        imageProcessingStatus={job.imageProcessingStatus}
        imageZipFileName={job.imageZipFileName}
        imagesAttached={job.imagesAttached}
        matchedListings={job.matchedListings}
        unmatchedFolders={job.unmatchedFolders}
        imageFailureReason={job.imageFailureReason}
      />

      {/* Rejected Records Log Table */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Rejected Records Log</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>
            Rows that failed schema, business rule, or duplicate-detection checks during upload
          </p>
        </div>

        {recordsQuery.isLoading && <div className="loading-spinner" style={{ margin: '1rem auto', display: 'block' }} />}
        {recordsQuery.isError && <p style={{ color: 'var(--color-error)' }}>Could not load rejected records.</p>}
        {!recordsQuery.isLoading && !recordsQuery.isError && rejectedRecords.length === 0 && <div className="empty-state"><p>No rejected records for this upload.</p></div>}

        {rejectedRecords.length > 0 && (
          <div className="table-container">
            <ResponsiveTable>
              <thead>
                <tr>
                  <th>CSV Row</th>
                  <th>Make / Model</th>
                  <th>Reason</th>
                  <th>Validation Errors</th>
                </tr>
              </thead>
              <tbody>
                {rejectedRecords.map((record) => (
                  <tr key={record.id}>
                    <td style={{ fontWeight: 600, color: 'var(--color-accent-light)' }}>Row #{record.rowNumber}</td>
                    <td style={{ fontWeight: 500 }}>
                      {String(record.originalData.make ?? '(Missing Make)')} {String(record.originalData.model ?? '(Missing Model)')}
                    </td>
                    <td>
                      <span className={`badge ${record.reason === 'duplicate' ? 'badge-warning' : 'badge-error'}`}>{record.reason}</span>
                    </td>
                    <td>
                      {record.errors.map((err, i) => (
                        <span key={i} className="badge badge-error" style={{ marginRight: '0.375rem' }}>
                          {err}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </ResponsiveTable>
          </div>
        )}
      </div>
    </div>
  );
};
