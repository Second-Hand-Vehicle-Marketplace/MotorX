import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listingApi } from '@/features/listings/services/listingApi';
import { formatMileage, formatPrice } from '@/shared/utils/formatters';
import { getMileageKm } from '@/features/listings/utils/vehicleAttributes';
import { ListingStatusBadge } from '@/features/listings/components/ListingStatusBadge';

export const ListingManager: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['my-listings'], queryFn: () => listingApi.getMyListings(1, 100) });
  const listings = query.data?.data ?? [];
  const filteredListings = listings.filter((listing) => {
    if (statusFilter !== 'all' && listing.status !== statusFilter) return false;
    const value = search.trim().toLowerCase();
    return !value || `${listing.title} ${listing.make} ${listing.model}`.toLowerCase().includes(value);
  });

  const changeStatus = async (id: string, status: 'active' | 'sold' | 'archived') => {
    await listingApi.updateListingStatus(id, { status });
    await queryClient.invalidateQueries({ queryKey: ['my-listings'] });
    await queryClient.invalidateQueries({ queryKey: ['listings'] });
  };

  return <div>
    <div className="page-header"><div><h1 className="page-title">Manage Inventory</h1><p className="page-subtitle">Your listings loaded from MongoDB Atlas</p></div><Link to="/dealer/listings/new" className="btn btn-primary">+ Add New Vehicle</Link></div>
    <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}><input className="form-input" placeholder="Search listings…" value={search} onChange={(e) => setSearch(e.target.value)} /><select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">All statuses</option><option value="draft">Draft</option><option value="active">Active</option><option value="sold">Sold</option><option value="archived">Archived</option></select></div>
    {query.isLoading && <div className="loading-spinner" style={{ margin: '3rem auto', display: 'block' }} />}
    {query.isError && <div className="glass-card" style={{ padding: '1rem', color: 'var(--color-error)' }}>Could not load your listings.</div>}
    {!query.isLoading && !query.isError && <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}><div className="table-container"><table className="data-table"><thead><tr><th>Vehicle</th><th>Year</th><th>Price</th><th>Mileage</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filteredListings.map((listing) => <tr key={listing.id}><td><div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>{listing.images[0]?.url && <img src={listing.images[0].url} alt="" style={{ width: 44, height: 32, borderRadius: 4, objectFit: 'cover' }} />}<strong>{listing.title}</strong></div></td><td>{listing.year}</td><td>{formatPrice(listing.price, listing.currency)}</td><td>{formatMileage(getMileageKm(listing) ?? 0)}</td><td><ListingStatusBadge status={listing.status} /></td><td><div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}><Link to={`/marketplace/${listing.id}`} className="btn btn-ghost btn-sm">View</Link>{listing.status === 'draft' && <button className="btn btn-success btn-sm" onClick={() => void changeStatus(listing.id, 'active')}>Publish</button>}{listing.status === 'active' && <button className="btn btn-secondary btn-sm" onClick={() => void changeStatus(listing.id, 'sold')}>Mark sold</button>}{listing.status !== 'archived' && <button className="btn btn-danger btn-sm" onClick={() => void changeStatus(listing.id, 'archived')}>Archive</button>}</div></td></tr>)}</tbody></table>{filteredListings.length === 0 && <div className="empty-state"><p>No listings found.</p></div>}</div></div>}
  </div>;
};
