import React from 'react';
import type { ListingStatus } from '../types/listing.types';

interface ListingStatusBadgeProps {
  status: ListingStatus;
}

export const ListingStatusBadge: React.FC<ListingStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'active':
      return <span className="badge badge-success">● Active</span>;
    case 'pending':
      return <span className="badge badge-warning">● Pending</span>;
    case 'sold':
      return <span className="badge badge-neutral">● Sold</span>;
    case 'draft':
      return <span className="badge badge-info">● Draft</span>;
    case 'rejected':
      return <span className="badge badge-error">● Rejected</span>;
    case 'archived':
      return <span className="badge badge-neutral">● Archived</span>;
    default:
      return <span className="badge badge-neutral">{status}</span>;
  }
};