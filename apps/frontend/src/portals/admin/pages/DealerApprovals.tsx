import React, { useEffect, useState } from 'react';
import type { DealerApplication } from '@/features/auth/types/auth.types';
import {
  approveDealerApplication,
  listDealerApplications,
  rejectDealerApplication,
} from '@/features/auth/services/dealerApplications';

export const DealerApprovals: React.FC = () => {
  const [dealers, setDealers] = useState<DealerApplication[]>([]);
  const pendingDealers = dealers.filter((dealer) => dealer.status === 'pending');

  useEffect(() => {
    void listDealerApplications().then(setDealers).catch(() => setDealers([]));
  }, []);

  const refreshDealers = async () => {
    const next = await listDealerApplications();
    setDealers(next);
  };

  const handleApprove = async (id: string) => {
    await approveDealerApplication(id);
    await refreshDealers();
  };

  const handleReject = async (id: string) => {
    await rejectDealerApplication(id);
    await refreshDealers();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dealer Onboarding Approvals</h1>
          <p className="page-subtitle">Review dealership registration applications and verify business documentation</p>
        </div>
      </div>

      {pendingDealers.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {pendingDealers.map(dealer => (
            <div key={dealer.id} className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="badge badge-warning" style={{ marginBottom: '0.5rem' }}>Pending Approval</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{dealer.businessName}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>
                    Applicant: {dealer.applicantName} ({dealer.email})
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={() => handleReject(dealer.id)} className="btn btn-danger btn-sm">
                    Reject Application
                  </button>
                  <button onClick={() => handleApprove(dealer.id)} className="btn btn-success btn-sm">
                    ✓ Approve Dealership
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1.25rem', padding: '1rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-lg)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Phone</span>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{dealer.phone}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Business License #</span>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, fontFamily: 'monospace' }}>{dealer.businessLicense}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Address</span>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{dealer.address}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card empty-state">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3>All Caught Up</h3>
          <p>There are no pending dealership applications awaiting review.</p>
        </div>
      )}
    </div>
  );
};