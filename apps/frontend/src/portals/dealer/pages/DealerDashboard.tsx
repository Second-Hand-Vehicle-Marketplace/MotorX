import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listingApi } from '@/features/listings/services/listingApi';
import { inventoryApi } from '@/features/inventory/services/inventoryApi';
import { ListingStatusBadge } from '@/features/listings/components/ListingStatusBadge';
import { getMileageKm } from '@/features/listings/utils/vehicleAttributes';
import { formatMileage, formatPrice } from '@/shared/utils/formatters';

const uploadStatusBadge = (status: string) => status === 'completed' ? 'badge-success' : status === 'processing' || status === 'pending' ? 'badge-info' : status === 'completedWithErrors' ? 'badge-warning' : 'badge-error';

export const DealerDashboard: React.FC = () => {
  const listingsQuery = useQuery({ queryKey: ['my-listings'], queryFn: () => listingApi.getMyListings(1, 100) });
  const uploadsQuery = useQuery({ queryKey: ['my-uploads', 1, 4], queryFn: () => inventoryApi.listUploads(1, 4) });
  const listings = listingsQuery.data?.data ?? [];
  const uploads = uploadsQuery.data?.data ?? [];
  const count = (status: string) => listings.filter((listing) => listing.status === status).length;

  return <div>
    <div className="page-header"><div><h1 className="page-title">Dealer Dashboard</h1><p className="page-subtitle">Live inventory overview from MongoDB Atlas</p></div><div style={{ display: 'flex', gap: '0.75rem' }}><Link to="/dealer/uploads/new" className="btn btn-secondary">Upload CSV</Link><Link to="/dealer/listings/new" className="btn btn-primary">+ Add Listing</Link></div></div>
    {listingsQuery.isLoading && <div className="loading-spinner" style={{ margin: '2rem auto', display: 'block' }} />}
    {listingsQuery.isError && <div className="glass-card" style={{ padding: '1rem', color: 'var(--color-error)', marginBottom: '1rem' }}>Could not load dealer inventory.</div>}
    <div className="stats-grid" style={{ marginBottom: '2rem' }}>
      {[['Total Listings', listings.length], ['Active', count('active')], ['Draft', count('draft')], ['Sold', count('sold')]].map(([label, value]) => <div className="stat-card" key={label}><span className="stat-label">{label}</span><div className="stat-value">{value}</div></div>)}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
      <div className="glass-card" style={{ padding: '1.5rem' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}><h3>Recent Inventory</h3><Link to="/dealer/listings">View all ({listings.length})</Link></div><div className="table-container"><table className="data-table"><thead><tr><th>Vehicle</th><th>Price</th><th>Status</th><th>Mileage</th><th>Location</th></tr></thead><tbody>{listings.slice(0, 5).map((listing) => <tr key={listing.id}><td>{listing.year} {listing.make} {listing.model}</td><td>{formatPrice(listing.price, listing.currency)}</td><td><ListingStatusBadge status={listing.status} /></td><td>{formatMileage(getMileageKm(listing) ?? 0)}</td><td>{listing.location}</td></tr>)}</tbody></table></div></div>
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
