import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listingApi } from '@/features/listings/services/listingApi';
import { ListingStatusBadge } from '@/features/listings/components/ListingStatusBadge';
import { formatMileage, formatPrice, mockUploadJobs } from '@/shared/mockData';

export const DealerDashboard: React.FC = () => {
  const query = useQuery({ queryKey: ['my-listings'], queryFn: () => listingApi.getMyListings(1, 100) });
  const listings = query.data?.data ?? [];
  const count = (status: string) => listings.filter((listing) => listing.status === status).length;

  return <div>
    <div className="page-header"><div><h1 className="page-title">Dealer Dashboard</h1><p className="page-subtitle">Live inventory overview from MongoDB Atlas</p></div><div style={{ display: 'flex', gap: '0.75rem' }}><Link to="/dealer/uploads/new" className="btn btn-secondary">Upload CSV</Link><Link to="/dealer/listings/new" className="btn btn-primary">+ Add Listing</Link></div></div>
    {query.isLoading && <div className="loading-spinner" style={{ margin: '2rem auto', display: 'block' }} />}
    {query.isError && <div className="glass-card" style={{ padding: '1rem', color: 'var(--color-error)', marginBottom: '1rem' }}>Could not load dealer inventory.</div>}
    <div className="stats-grid" style={{ marginBottom: '2rem' }}>
      {[['Total Listings', listings.length], ['Active', count('active')], ['Draft', count('draft')], ['Sold', count('sold')]].map(([label, value]) => <div className="stat-card" key={label}><span className="stat-label">{label}</span><div className="stat-value">{value}</div></div>)}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
      <div className="glass-card" style={{ padding: '1.5rem' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}><h3>Recent Inventory</h3><Link to="/dealer/listings">View all ({listings.length})</Link></div><div className="table-container"><table className="data-table"><thead><tr><th>Vehicle</th><th>Price</th><th>Status</th><th>Mileage</th><th>Location</th></tr></thead><tbody>{listings.slice(0, 5).map((listing) => <tr key={listing.id}><td>{listing.year} {listing.make} {listing.model}</td><td>{formatPrice(listing.price, listing.currency)}</td><td><ListingStatusBadge status={listing.status} /></td><td>{formatMileage(listing.mileage)}</td><td>{listing.location}</td></tr>)}</tbody></table></div></div>
      <div className="glass-card" style={{ padding: '1.5rem' }}><h3 style={{ marginBottom: '0.5rem' }}>Upload Activity <span className="badge badge-warning">Demo data</span></h3><p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '1rem' }}>CSV upload APIs are not implemented yet.</p>{mockUploadJobs.slice(0, 4).map((job) => <div key={job.id} style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-glass-border)' }}><strong>{job.fileName}</strong><div><span className="badge badge-neutral">{job.status}</span></div></div>)}</div>
    </div>
  </div>;
};
