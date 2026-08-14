import React, { useEffect, useState } from 'react';
import type { DealerApplication } from '@/features/dealers/types/dealer.types';
import { approveDealerApplication, getPendingDealerApplications, openDealerDocument, rejectDealerApplication } from '@/features/dealers/services/dealerApi';

export const DealerApprovals: React.FC = () => {
  const [dealers, setDealers] = useState<DealerApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');

  const loadApplications = async () => {
    try { setError(''); setDealers(await getPendingDealerApplications()); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Could not load dealer applications.'); }
    finally { setIsLoading(false); }
  };
  useEffect(() => { void loadApplications(); }, []);

  const decide = async (dealerId: string, decision: 'approve' | 'reject') => {
    if (decision === 'reject' && rejectionReason.trim().length < 3) {
      setError('Enter a clear rejection reason of at least 3 characters.');
      return;
    }
    setProcessingId(dealerId);
    setError('');
    try {
      if (decision === 'approve') await approveDealerApplication(dealerId);
      else await rejectDealerApplication(dealerId, rejectionReason.trim());
      setRejectingId(null); setRejectionReason(''); await loadApplications();
    } catch (actionError) { setError(actionError instanceof Error ? actionError.message : 'The application could not be reviewed.'); }
    finally { setProcessingId(null); }
  };

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Dealer Applications</h1><p className="page-subtitle">Review business details and verification documents before granting dealer access.</p></div></div>
      {error && <div className="auth-message auth-message-error" role="alert">{error}</div>}
      {isLoading && <div className="loading-spinner" style={{ margin: '3rem auto', display: 'block' }} />}
      {!isLoading && dealers.map((dealer) => (
        <article key={dealer.id} className="glass-card dealer-review-card">
          <div className="dealer-review-header"><div><span className="badge badge-warning">Pending approval</span><h2>{dealer.businessName}</h2><p>{dealer.representativeName} &bull; submitted {new Date(dealer.createdAt).toLocaleDateString()}</p></div></div>
          <div className="dealer-review-grid">
            <div><span>Registration</span><strong>{dealer.registrationNumber}</strong></div>
            <div><span>Dealership type</span><strong>{dealer.dealershipType}</strong></div>
            <div><span>Business contact</span><strong>{dealer.businessPhone}</strong><small>{dealer.businessEmail}</small></div>
            <div><span>Location</span><strong>{dealer.city}, {dealer.province}</strong><small>{dealer.address}</small></div>
            <div><span>Brands</span><strong>{dealer.brands.join(', ') || 'Not specified'}</strong></div>
            <div><span>Typical inventory</span><strong>{dealer.inventoryCount ?? 'Not specified'}</strong></div>
          </div>
          <div className="dealer-description"><span>Business description</span><p>{dealer.description}</p>{dealer.website && <a href={dealer.website} target="_blank" rel="noreferrer">Open dealership website</a>}</div>
          <div className="dealer-documents"><span>Verification documents</span><div>{dealer.verificationDocuments.map((document, index) => <button key={document.key} className="btn btn-secondary btn-sm" onClick={() => void openDealerDocument(dealer.id, index)}>{document.category.replace(/([A-Z])/g, ' $1')} &mdash; {document.originalName}</button>)}</div></div>
          {rejectingId === dealer.id && <div className="rejection-editor"><label className="form-label" htmlFor={`reason-${dealer.id}`}>Rejection reason</label><textarea id={`reason-${dealer.id}`} className="form-textarea" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} maxLength={500} placeholder="Explain what information is missing or why the application cannot be approved." /></div>}
          <div className="dealer-review-actions">
            {rejectingId === dealer.id ? <><button className="btn btn-secondary" onClick={() => { setRejectingId(null); setRejectionReason(''); }}>Cancel</button><button className="btn btn-danger" disabled={processingId === dealer.id} onClick={() => void decide(dealer.id, 'reject')}>{processingId === dealer.id ? 'Rejecting...' : 'Confirm rejection'}</button></> : <><button className="btn btn-danger" disabled={Boolean(processingId)} onClick={() => setRejectingId(dealer.id)}>Reject</button><button className="btn btn-success" disabled={Boolean(processingId)} onClick={() => void decide(dealer.id, 'approve')}>{processingId === dealer.id ? 'Approving...' : 'Approve dealer'}</button></>}
          </div>
        </article>
      ))}
      {!isLoading && dealers.length === 0 && <div className="glass-card empty-state"><h3>All caught up</h3><p>There are no pending dealership applications.</p></div>}
    </div>
  );
};
