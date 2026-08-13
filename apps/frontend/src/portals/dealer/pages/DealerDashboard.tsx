import React from 'react';
import { Link } from 'react-router-dom';
import { mockListings, mockUploadJobs, formatPrice, formatDate } from '@/shared/mockData';
import { ListingStatusBadge } from '@/features/listings/components/ListingStatusBadge';

export const DealerDashboard: React.FC = () => {
  const dealerListings = mockListings.filter(l => l.dealerId === 'usr_002');
  const activeCount = dealerListings.filter(l => l.status === 'active').length;
  const pendingCount = dealerListings.filter(l => l.status === 'pending').length;
  const totalViews = dealerListings.reduce((sum, l) => sum + l.views, 0);
  const totalLeads = dealerListings.reduce((sum, l) => sum + l.leads, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dealer Dashboard</h1>
          <p className="page-subtitle">Overview of your inventory, vehicle performance, and bulk uploads</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/dealer/uploads/new" className="btn btn-secondary">
            Upload CSV
          </Link>
          <Link to="/dealer/listings/new" className="btn btn-primary">
            + Add Listing
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <span className="stat-label">Total Listings</span>
          <div className="stat-value">{dealerListings.length}</div>
          <span className="stat-change positive">↑ {activeCount} active on marketplace</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Pending Approval</span>
          <div className="stat-value">{pendingCount}</div>
          <span className="stat-change" style={{ color: 'var(--color-warning)' }}>Under review</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Total Listing Views</span>
          <div className="stat-value">{totalViews.toLocaleString()}</div>
          <span className="stat-change positive">↑ 18% this month</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Buyer Leads Generated</span>
          <div className="stat-value">{totalLeads}</div>
          <span className="stat-change positive">↑ 12 new inquiries</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Recent Listings */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Recent Inventory</h3>
            <Link to="/dealer/listings" style={{ fontSize: '0.8125rem', color: 'var(--color-accent-light)' }}>
              View All ({dealerListings.length}) →
            </Link>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Views</th>
                  <th>Leads</th>
                </tr>
              </thead>
              <tbody>
                {dealerListings.slice(0, 5).map(listing => (
                  <tr key={listing.id}>
                    <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {listing.year} {listing.make} {listing.model}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--color-accent-light)' }}>
                      {formatPrice(listing.price)}
                    </td>
                    <td><ListingStatusBadge status={listing.status} /></td>
                    <td>{listing.views}</td>
                    <td style={{ fontWeight: 600, color: 'var(--color-success)' }}>{listing.leads}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Bulk Upload Jobs */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Upload Activity</h3>
            <Link to="/dealer/uploads/new" style={{ fontSize: '0.8125rem', color: 'var(--color-accent-light)' }}>
              Upload New →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {mockUploadJobs.slice(0, 4).map(job => (
              <div
                key={job.id}
                style={{
                  padding: '0.75rem 1rem',
                  background: 'var(--color-bg-tertiary)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-glass-border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                    {job.fileName}
                  </span>
                  <span className={`badge ${job.status === 'completed' ? 'badge-success' : job.status === 'processing' ? 'badge-info' : 'badge-error'}`}>
                    {job.status}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.375rem' }}>
                  <span>{job.validRecords} valid / {job.totalRecords} total</span>
                  <span>{formatDate(job.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};