import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getMyDealerApplication } from '../../dealers/services/dealerApi';
import type { DealerApplication } from '../../dealers/types/dealer.types';
import { useAuth } from '../hooks/useAuth';

export const DealerPendingPage: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const state = location.state as { email?: string; businessName?: string } | null;
  const [application, setApplication] = useState<DealerApplication | null>(null);

  useEffect(() => {
    if (isAuthenticated) getMyDealerApplication().then(setApplication).catch(() => undefined);
  }, [isAuthenticated]);

  const status = application?.status ?? 'pending';
  const rejected = status === 'rejected';

  return (
    <div className="auth-page">
      <div className="glass-card application-status-card">
        <span className={`badge ${rejected ? 'badge-error' : status === 'approved' ? 'badge-success' : 'badge-warning'}`}>
          {status.replace('-', ' ').toUpperCase()}
        </span>
        <h1>{rejected ? 'Application needs attention' : status === 'approved' ? 'Application approved' : 'Application submitted'}</h1>
        <p>
          {rejected
            ? 'Your dealer application was not approved. Review the reason below before contacting MotorX support.'
            : status === 'approved'
              ? 'Your dealership is approved. Sign in again to open the dealer dashboard.'
              : 'Your dealer application has been submitted successfully and is waiting for administrator approval.'}
        </p>
        {(application?.businessName || state?.businessName) && <strong>{application?.businessName ?? state?.businessName}</strong>}
        {rejected && application?.rejectionReason && <div className="rejection-reason"><span>Reason provided by the administrator</span>{application.rejectionReason}</div>}
        {application?.reviewedAt && <small>Reviewed {new Date(application.reviewedAt).toLocaleString()}</small>}
        <div className="auth-status-actions">
          {isAuthenticated
            ? <button className="btn btn-primary" onClick={() => void logout()}>Sign Out</button>
            : <Link to="/login" className="btn btn-primary">Return to Sign In</Link>}
          <Link to="/marketplace" className="btn btn-secondary">Browse Marketplace</Link>
        </div>
      </div>
    </div>
  );
};
