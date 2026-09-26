import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { BulkListingAction, BulkListingActionResult } from '@motorx/shared-contracts';
import { LISTING_IMAGE_ASPECT_RATIO } from '@motorx/shared-contracts';
import { listingApi } from '@/features/listings/services/listingApi';
import { ListingStatusBadge } from '@/features/listings/components/ListingStatusBadge';
import { ListingPhoto } from '@/features/listings/components/ListingPhoto';
import { ReducePriceDialog } from '@/features/listings/components/ReducePriceDialog';
import type { Listing } from '@/features/listings/types/listing.types';
import { getMileageKm } from '@/features/listings/utils/vehicleAttributes';
import { ResponsiveTable } from '@/shared/components/ResponsiveTable';
import { formatMileage, formatPrice } from '@/shared/utils/formatters';

const TABLE_THUMB_WIDTH = 44;
const TABLE_THUMB_HEIGHT = Math.round(TABLE_THUMB_WIDTH / LISTING_IMAGE_ASPECT_RATIO);
const PAGE_SIZE = 20;
const DAY_MS = 24 * 60 * 60 * 1000;

type View = 'all' | 'stale' | 'archived';
const views: View[] = ['all', 'stale', 'archived'];

const pastTense: Record<BulkListingAction, string> = {
  publish: 'published', 'mark-sold': 'marked sold', archive: 'archived', 'confirm-available': 'confirmed as still available', 'reduce-price': 're-priced', delete: 'deleted',
};

// "Published 5 listings. 2 were skipped because the action does not apply to their status."
export function describeBulkResult(result: BulkListingActionResult) {
  const done = `${result.updated} listing${result.updated === 1 ? '' : 's'} ${pastTense[result.action]}.`;
  return result.skipped ? `${done} ${result.skipped} skipped because the action does not apply to their current status.` : done;
}

function daysSince(value: string | null | undefined) {
  return value ? Math.floor((Date.now() - new Date(value).getTime()) / DAY_MS) : null;
}

export const ListingManager: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const view: View = views.includes(searchParams.get('view') as View) ? searchParams.get('view') as View : 'all';
  const statusFilter = searchParams.get('status') ?? 'all';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [priceDialogFor, setPriceDialogFor] = useState<Listing[] | null>(null);
  const queryClient = useQueryClient();

  // Updates the URL (so views, filters and pages survive reloads and can be linked to), resetting the page.
  const setParams = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) { if (value) next.set(key, value); else next.delete(key); }
    if (!('page' in changes)) next.delete('page');
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { if ((searchParams.get('q') ?? '') !== search.trim()) setParams({ q: search.trim() || undefined }); }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  // A selection only makes sense for the rows on screen.
  useEffect(() => { setSelected(new Set()); }, [view, statusFilter, page, searchParams.get('q')]);

  const statsQuery = useQuery({ queryKey: ['my-listing-stats'], queryFn: () => listingApi.getMyListingStats() });
  const filters = {
    search: searchParams.get('q') || undefined,
    status: view === 'archived' ? 'archived' : view === 'all' && statusFilter !== 'all' ? statusFilter : undefined,
    stale: view === 'stale' ? true : undefined,
  };
  const query = useQuery({ queryKey: ['my-listings', view, page, filters], queryFn: () => listingApi.getMyListings(page, PAGE_SIZE, filters) });
  const listings = query.data?.data ?? [];
  const totalPages = Math.max(1, query.data?.totalPages ?? 1);
  const stats = statsQuery.data;
  const staleDays = stats?.staleAfterDays ?? 60;

  const refresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['my-listings'] }),
    queryClient.invalidateQueries({ queryKey: ['my-listing-stats'] }),
    queryClient.invalidateQueries({ queryKey: ['listings'] }),
  ]);

  const run = async (action: BulkListingAction, ids: string[], percent?: number) => {
    setBusy(true); setMessage(null);
    try {
      const result = await listingApi.bulkAction({ action, listingIds: ids, ...(percent ? { percent } : {}) });
      setMessage({ kind: 'success', text: describeBulkResult(result) });
      setSelected(new Set());
      await refresh();
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'The change could not be saved.' });
      throw error;
    } finally {
      setBusy(false);
    }
  };
  const runSafely = (action: BulkListingAction, ids: string[]) => { void run(action, ids).catch(() => undefined); };
  const deleteForever = (ids: string[]) => {
    if (!window.confirm(`Permanently delete ${ids.length === 1 ? 'this listing' : `${ids.length} listings`}? This cannot be undone.`)) return;
    runSafely('delete', ids);
  };

  const selectedIds = [...selected];
  const allOnPageSelected = listings.length > 0 && listings.every((listing) => selected.has(listing.id));
  const toggleAll = () => setSelected(allOnPageSelected ? new Set() : new Set(listings.map((listing) => listing.id)));
  const toggleOne = (id: string) => setSelected((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  const tab = (value: View, label: string, count?: number) => (
    <button type="button" role="tab" aria-selected={view === value} className={`btn btn-sm ${view === value ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setParams({ view: value === 'all' ? undefined : value, status: undefined })}>
      {label}{count !== undefined ? ` (${count})` : ''}
    </button>
  );

  return <div>
    <div className="page-header"><div><h1 className="page-title">Manage Inventory</h1><p className="page-subtitle">Review, edit, and publish your vehicle listings.</p></div><Link to="/dealer/listings/new" className="btn btn-primary">+ Add New Vehicle</Link></div>

    {view !== 'stale' && (stats?.stale ?? 0) > 0 && (
      <div className="stale-banner" role="status">
        <span><strong>{stats!.stale} listing{stats!.stale === 1 ? " hasn't" : "s haven't"} been updated in {staleDays} days.</strong> Buyers may call about cars already sold.</span>
        <button type="button" className="btn btn-sm btn-secondary" onClick={() => setParams({ view: 'stale', status: undefined })}>Review now</button>
      </div>
    )}

    <div className="listing-tabs" role="tablist" aria-label="Listing views">
      {tab('all', 'My Listings')}
      {tab('stale', 'Needs attention', stats?.stale)}
      {tab('archived', 'Archived', stats?.archived)}
    </div>

    {view === 'stale' && <p className="listing-view-help">Active listings not confirmed for {staleDays} days, oldest first. Mark them sold, archive them, reduce the price, or confirm they are still available.</p>}

    <div className="glass-card listing-filters">
      <input className="form-input" type="search" aria-label="Search listings" placeholder="Search listings…" value={search} onChange={(e) => setSearch(e.target.value)} />
      {view === 'all' && <select className="form-select" aria-label="Status" value={statusFilter} onChange={(e) => setParams({ status: e.target.value === 'all' ? undefined : e.target.value })}><option value="all">All statuses</option><option value="draft">Draft</option><option value="active">Active</option><option value="sold">Sold</option></select>}
    </div>

    {message && <div role={message.kind === 'error' ? 'alert' : 'status'} className={`listing-message listing-message-${message.kind}`}>{message.text}</div>}

    {selected.size > 0 && (
      <div className="bulk-bar" role="region" aria-label="Bulk actions">
        <span className="bulk-bar-count">{selected.size} selected</span>
        <div className="bulk-bar-actions">
          {view === 'archived' ? (
            <button type="button" className="btn btn-danger btn-sm" disabled={busy} onClick={() => deleteForever(selectedIds)}>Delete permanently</button>
          ) : (
            <>
              {view === 'all' && <button type="button" className="btn btn-success btn-sm" disabled={busy} onClick={() => runSafely('publish', selectedIds)}>Publish</button>}
              <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => runSafely('confirm-available', selectedIds)}>Still available</button>
              <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => setPriceDialogFor(listings.filter((listing) => selected.has(listing.id)))}>Reduce price</button>
              <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => runSafely('mark-sold', selectedIds)}>Mark sold</button>
              <button type="button" className="btn btn-danger btn-sm" disabled={busy} onClick={() => runSafely('archive', selectedIds)}>Archive</button>
            </>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      </div>
    )}

    {query.isLoading && <div className="loading-spinner" style={{ margin: '3rem auto', display: 'block' }} />}
    {query.isError && <div className="glass-card" role="alert" style={{ padding: '1rem', color: 'var(--color-error)' }}>Could not load your listings.</div>}
    {!query.isLoading && !query.isError && <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="table-container">
        <ResponsiveTable className="listing-table">
          <thead><tr>
            <th><input type="checkbox" aria-label="Select all listings on this page" checked={allOnPageSelected} onChange={toggleAll} disabled={!listings.length} /></th>
            <th>Vehicle</th><th>Year</th><th>Price</th><th>Mileage</th><th>Status</th><th>Last confirmed</th><th>Actions</th>
          </tr></thead>
          <tbody>{listings.map((listing) => {
            const days = listing.status === 'active' ? daysSince(listing.lastConfirmedAt) : null;
            const stale = days !== null && days >= staleDays;
            return <tr key={listing.id} className={selected.has(listing.id) ? 'is-selected' : undefined}>
              <td className="listing-select-cell"><input type="checkbox" aria-label={`Select ${listing.title}`} checked={selected.has(listing.id)} onChange={() => toggleOne(listing.id)} /></td>
              <td className="listing-vehicle-cell"><div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>{listing.images[0] && <ListingPhoto image={listing.images[0]} alt="" sizes={`${TABLE_THUMB_WIDTH}px`} style={{ width: TABLE_THUMB_WIDTH, height: TABLE_THUMB_HEIGHT, borderRadius: 4, objectFit: 'cover' }} />}<strong>{listing.title}</strong></div></td>
              <td>{listing.year}</td>
              <td>{formatPrice(listing.price, listing.currency)}</td>
              <td>{formatMileage(getMileageKm(listing) ?? 0)}</td>
              <td><ListingStatusBadge status={listing.status} /></td>
              <td>{days === null ? '—' : <span className={stale ? 'stale-age' : undefined}>{days === 0 ? 'Today' : `${days} day${days === 1 ? '' : 's'} ago`}</span>}</td>
              <td><div className="listing-row-actions">
                {view === 'stale' ? <>
                  <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => runSafely('confirm-available', [listing.id])}>Still available</button>
                  <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => setPriceDialogFor([listing])}>Reduce price</button>
                  <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => runSafely('mark-sold', [listing.id])}>Mark sold</button>
                  <button type="button" className="btn btn-danger btn-sm" disabled={busy} onClick={() => runSafely('archive', [listing.id])}>Archive</button>
                </> : <>
                  <Link to={`/dealer/listings/${listing.id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
                  {listing.status === 'active' && <Link to={`/marketplace/${listing.id}`} className="btn btn-ghost btn-sm">Preview</Link>}
                  {listing.status === 'draft' && <button type="button" className="btn btn-success btn-sm" disabled={busy} onClick={() => runSafely('publish', [listing.id])}>Publish</button>}
                  {listing.status === 'active' && <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => runSafely('mark-sold', [listing.id])}>Mark sold</button>}
                  {listing.status !== 'archived' && <button type="button" className="btn btn-danger btn-sm" disabled={busy} onClick={() => runSafely('archive', [listing.id])}>Archive</button>}
                  {listing.status === 'archived' && <button type="button" className="btn btn-danger btn-sm" disabled={busy} onClick={() => deleteForever([listing.id])}>Delete</button>}
                </>}
              </div></td>
            </tr>;
          })}</tbody>
        </ResponsiveTable>
        {listings.length === 0 && <div className="empty-state"><p>{view === 'archived' ? 'No archived listings.' : view === 'stale' ? 'Nothing needs attention. Every active listing was confirmed recently.' : 'No listings found.'}</p></div>}
        <div className="listing-pager">
          <button type="button" className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setParams({ page: String(page - 1) })}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button type="button" className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setParams({ page: String(page + 1) })}>Next</button>
        </div>
      </div>
    </div>}

    {priceDialogFor && <ReducePriceDialog listings={priceDialogFor} onClose={() => setPriceDialogFor(null)} onConfirm={(percent) => run('reduce-price', priceDialogFor.map((listing) => listing.id), percent)} />}
  </div>;
};
