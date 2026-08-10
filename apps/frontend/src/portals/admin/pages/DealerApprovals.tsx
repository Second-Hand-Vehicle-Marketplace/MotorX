import React, { useState } from 'react';

interface PendingDealer {
  id: string;
  businessName: string;
  applicantName: string;
  email: string;
  phone: string;
  address: string;
  businessLicense: string;
  appliedDate: string;
}

export const DealerApprovals: React.FC = () => {
  const [dealers, setDealers] = useState<PendingDealer[]>([
    {
      id: 'del_001',
      businessName: 'Apex Motor Group',
      applicantName: 'Robert Vance',
      email: 'robert@apexmotors.com',
      phone: '+1 (555) 234-5678',
      address: '1420 Auto Mall Pkwy, San Jose, CA',
      businessLicense: 'BL-98234-CA',
      appliedDate: '2026-08-08T10:00:00Z',
    },
    {
      id: 'del_002',
      businessName: 'Metro Select Cars',
      applicantName: 'Elena Rostova',
      email: 'elena@metroselect.com',
      phone: '+1 (555) 876-5432',
      address: '88 Commerce St, Austin, TX',
      businessLicense: 'BL-44129-TX',
      appliedDate: '2026-08-09T14:30:00Z',
    },
  ]);

  const handleApprove = (id: string) => {
    setDealers(prev => prev.filter(d => d.id !== id));
  };

  const handleReject = (id: string) => {
    setDealers(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dealer Onboarding Approvals</h1>
          <p className="page-subtitle">Review dealership registration applications and verify business documentation</p>
        </div>
      </div>

      {dealers.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {dealers.map(dealer => (
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