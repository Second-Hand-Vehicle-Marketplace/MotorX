import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listingApi } from '@/features/listings/services/listingApi';
import { inventoryApi } from '@/features/inventory/services/inventoryApi';
import { ListingStatusBadge } from '@/features/listings/components/ListingStatusBadge';
import { getMileageKm } from '@/features/listings/utils/vehicleAttributes';
import { formatMileage, formatPrice } from '@/shared/utils/formatters';
import { ResponsiveTable } from '@/shared/components/ResponsiveTable';

const uploadStatusBadge = (status: string) => status === 'completed' ? 'badge-success' : status === 'processing' || status === 'pending' ? 'badge-info' : status === 'completedWithErrors' ? 'badge-warning' : 'badge-error';

export const DealerDashboard: React.FC = () => {
  const listingsQuery = useQuery({ queryKey: ['my-listing-stats'], queryFn: () => listingApi.getMyListingStats() });
  const recentListingsQuery = useQuery({ queryKey: ['my-listings', 'recent'], queryFn: () => listingApi.getMyListings(1, 5) });
  const uploadsQuery = useQuery({ queryKey: ['my-uploads', 1, 4], queryFn: () => inventoryApi.listUploads(1, 4) });
  const listings = recentListingsQuery.data?.data ?? [];
  const uploads = uploadsQuery.data?.data ?? [];

  return <div>
    <div className="page-header"><div><h1 className="page-title">Dealer Dashboard</h1><p className="page-subtitle">Live inventory overview from MongoDB Atlas</p></div><div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}><Link to="/dealer/uploads/new" className="btn btn-secondary">Upload CSV</Link><Link to="/dealer/listings/new" className="btn btn-primary">+ Add Listing</Link></div></div>
    {listingsQuery.isLoading && <div className="loading-spinner" style={{ margin: '2rem auto', display: 'block' }} />}
    {listingsQuery.isError && <div className="glass-card" style={{ padding: '1rem', color: 'var(--color-error)', marginBottom: '1rem' }}>Could not load dealer inventory.</div>}
    {(listingsQuery.data?.stale ?? 0) > 0 && (
      <div className="stale-banner" role="status">
        <span><strong>{listingsQuery.data!.stale} listing{listingsQuery.data!.stale === 1 ? " hasn't" : "s haven't"} been updated in {listingsQuery.data!.staleAfterDays} days.</strong> Mark them sold, archive them, reduce the price, or confirm they are still available.</span>
        <Link to="/dealer/listings?view=stale" className="btn btn-sm btn-secondary">Review now</Link>
      </div>
    )}
    <div className="stats-grid" style={{ marginBottom: '2rem' }}>
      {[['Total Listings', listingsQuery.data?.total ?? 0], ['Active', listingsQuery.data?.active ?? 0], ['Draft', listingsQuery.data?.draft ?? 0], ['Sold', listingsQuery.data?.sold ?? 0]].map(([label, value]) => <div className="stat-card" key={label}><span className="stat-label">{label}</span><div className="stat-value">{listingsQuery.isLoading ? '—' : value}</div></div>)}
    </div>
    <div className="dashboard-columns">
      <div className="glass-card" style={{ padding: '1.5rem' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}><h3>Recent Inventory</h3><Link to="/dealer/listings">View all ({listingsQuery.data?.total ?? listings.length})</Link></div><div className="table-container"><ResponsiveTable><thead><tr><th>Vehicle</th><th>Price</th><th>Status</th><th>Mileage</th><th>Location</th></tr></thead><tbody>{listings.slice(0, 5).map((listing) => <tr key={listing.id}><td>{listing.year} {listing.make} {listing.model}</td><td>{formatPrice(listing.price, listing.currency)}</td><td><ListingStatusBadge status={listing.status} /></td><td>{formatMileage(getMileageKm(listing) ?? 0)}</td><td>{listing.location}</td></tr>)}</tbody></ResponsiveTable></div></div>
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}><h3>Upload Activity</h3><Link to="/dealer/uploads/new">View all</Link></div>
        {uploadsQuery.isLoading && <div className="loading-spinner" style={{ margin: '1rem auto', display: 'block' }} />}
        {uploadsQuery.isError && <p style={{ fontSize: '0.8125rem', color: 'var(--color-error)' }}>Could not load upload activity.</p>}
        {!uploadsQuery.isLoading && !uploadsQuery.isError && uploads.length === 0 && <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)' }}>No inventory uploads yet.</p>}
        {uploads.map((job) => <Link key={job.id} to={`/dealer/uploads/${job.id}`} style={{ display: 'block', padding: '0.75rem', borderBottom: '1px solid var(--color-glass-border)', color: 'inherit', textDecoration: 'none' }}><strong>{job.fileName}</strong><div><span className={`badge ${uploadStatusBadge(job.status)}`}>{job.status}</span></div></Link>)}
      </div>
    </div>
  </div>;
};
