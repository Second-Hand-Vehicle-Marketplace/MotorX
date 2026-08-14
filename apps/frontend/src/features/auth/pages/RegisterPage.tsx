import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface RegisterPageProps {
  mode?: 'buyer' | 'dealer';
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ mode = 'buyer' }) => {
  const { registerBuyer, registerDealerApplication } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [buyerForm, setBuyerForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [dealerForm, setDealerForm] = useState({
    applicantName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessLicense: '',
    businessContact: '',
    businessEmail: '',
    address: '',
    city: '',
    province: '',
    website: '',
    dealershipType: 'both',
    brandFocus: '',
    businessDescription: '',
    inventoryCount: '',
  });
  const [documents, setDocuments] = useState<{
    businessRegistration?: File;
    identityProof?: File;
    additionalDocument?: File;
  }>({});

  const isBuyerMode = mode === 'buyer';

  const handleBuyerChange = (field: keyof typeof buyerForm, value: string) => {
    setBuyerForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDealerChange = (field: keyof typeof dealerForm, value: string) => {
    setDealerForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleBuyerSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (buyerForm.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (buyerForm.password !== buyerForm.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await registerBuyer({
        fullName: buyerForm.fullName,
        email: buyerForm.email,
        phone: buyerForm.phone,
        password: buyerForm.password,
      });
      navigate('/marketplace');
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Could not create buyer account.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDealerSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (dealerForm.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (dealerForm.password !== dealerForm.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!documents.businessRegistration || !documents.identityProof) {
      setError('Business registration and identity proof documents are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const application = await registerDealerApplication({
        applicantName: dealerForm.applicantName,
        email: dealerForm.email,
        phone: dealerForm.phone,
        password: dealerForm.password,
        businessName: dealerForm.businessName,
        businessLicense: dealerForm.businessLicense,
        address: dealerForm.address,
        city: dealerForm.city,
        province: dealerForm.province,
        businessContact: dealerForm.businessContact,
        businessEmail: dealerForm.businessEmail,
        website: dealerForm.website,
        dealershipType: dealerForm.dealershipType as 'new' | 'used' | 'both',
        brandFocus: dealerForm.brandFocus,
        businessDescription: dealerForm.businessDescription,
        inventoryCount: dealerForm.inventoryCount,
        businessRegistration: documents.businessRegistration,
        identityProof: documents.identityProof,
        additionalDocument: documents.additionalDocument,
      });

      navigate('/dealer/application-status', {
        state: {
          email: dealerForm.email,
          businessName: application.businessName,
        },
      });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Could not submit dealer application.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="glass-card auth-registration-card" style={{ maxWidth: isBuyerMode ? 560 : 920 }}>
        <Link to="/" className="auth-brand">Motor<span>X</span></Link>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 className="page-title">{isBuyerMode ? 'Create Buyer Account' : 'Dealer Application'}</h1>
          <p className="page-subtitle">
            {isBuyerMode
              ? 'Create a new buyer account and start browsing the marketplace.'
              : 'Submit your dealership details for admin review before your dealer account is activated.'}
          </p>
        </div>

        {error && (
          <div className="glass-card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', borderColor: 'var(--color-error)' }}>
            <p style={{ color: 'var(--color-error)', fontSize: '0.875rem', margin: 0 }}>{error}</p>
          </div>
        )}

        {isBuyerMode ? (
          <form onSubmit={handleBuyerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="John Smith" value={buyerForm.fullName} onChange={(e) => handleBuyerChange('fullName', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" placeholder="name@example.com" value={buyerForm.email} onChange={(e) => handleBuyerChange('email', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="tel" className="form-input" placeholder="+94 77 123 4567" value={buyerForm.phone} onChange={(e) => handleBuyerChange('phone', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <span className="password-field"><input type={showPassword ? 'text' : 'password'} className="form-input" placeholder="Create a password" value={buyerForm.password} onChange={(e) => handleBuyerChange('password', e.target.value)} required /><button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Hide' : 'Show'}</button></span>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input type={showPassword ? 'text' : 'password'} className="form-input" placeholder="Confirm your password" value={buyerForm.confirmPassword} onChange={(e) => handleBuyerChange('confirmPassword', e.target.value)} required />
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting} style={{ width: '100%' }}>
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>

            <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--color-accent-light)', fontWeight: 700 }}>Sign In</Link>
            </p>

            <div style={{ marginTop: '0.5rem', padding: '1rem', borderRadius: 'var(--radius-lg)', background: 'var(--color-accent-subtle)', border: '1px solid var(--color-glass-border)' }}>
              <p style={{ margin: '0 0 0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                Are you a vehicle dealer? Apply for a Dealer Account.
              </p>
              <button type="button" onClick={() => navigate('/dealer/apply')} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                Apply as Dealer
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleDealerSubmit} className="auth-form-grid stagger-children">
            <div style={{ gridColumn: '1 / -1' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Account Information</h3>
            </div>
            <div className="form-group">
              <label className="form-label">Dealer Representative Name</label>
              <input className="form-input" value={dealerForm.applicantName} onChange={(e) => handleDealerChange('applicantName', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" value={dealerForm.email} onChange={(e) => handleDealerChange('email', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="tel" className="form-input" value={dealerForm.phone} onChange={(e) => handleDealerChange('phone', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <span className="password-field"><input type={showPassword ? 'text' : 'password'} className="form-input" value={dealerForm.password} onChange={(e) => handleDealerChange('password', e.target.value)} required /><button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Hide' : 'Show'}</button></span>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input type={showPassword ? 'text' : 'password'} className="form-input" value={dealerForm.confirmPassword} onChange={(e) => handleDealerChange('confirmPassword', e.target.value)} required />
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Dealership Information</h3>
            </div>
            <div className="form-group">
              <label className="form-label">Dealership / Business Name</label>
              <input className="form-input" value={dealerForm.businessName} onChange={(e) => handleDealerChange('businessName', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Business Registration Number</label>
              <input className="form-input" value={dealerForm.businessLicense} onChange={(e) => handleDealerChange('businessLicense', e.target.value)} required />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Business Address</label>
              <textarea className="form-textarea" rows={3} value={dealerForm.address} onChange={(e) => handleDealerChange('address', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">City / District</label>
              <input className="form-input" value={dealerForm.city} onChange={(e) => handleDealerChange('city', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Province</label>
              <input className="form-input" value={dealerForm.province} onChange={(e) => handleDealerChange('province', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Business Contact Number</label>
              <input className="form-input" value={dealerForm.businessContact} onChange={(e) => handleDealerChange('businessContact', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Business Email</label>
              <input type="email" className="form-input" value={dealerForm.businessEmail} onChange={(e) => handleDealerChange('businessEmail', e.target.value)} required />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Dealership Website or Social Page (optional)</label>
              <input className="form-input" value={dealerForm.website} onChange={(e) => handleDealerChange('website', e.target.value)} />
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Dealer Details</h3>
            </div>
            <div className="form-group">
              <label className="form-label">Type of Dealership</label>
              <select className="form-input" value={dealerForm.dealershipType} onChange={(e) => handleDealerChange('dealershipType', e.target.value)}>
                <option value="new">New vehicles</option>
                <option value="used">Used vehicles</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Main Vehicle Brands Handled (optional)</label>
              <input className="form-input" value={dealerForm.brandFocus} onChange={(e) => handleDealerChange('brandFocus', e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Short Business Description</label>
              <textarea className="form-textarea" rows={3} value={dealerForm.businessDescription} onChange={(e) => handleDealerChange('businessDescription', e.target.value)} minLength={20} required />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Approximate Number of Vehicles Normally Available (optional)</label>
              <input className="form-input" value={dealerForm.inventoryCount} onChange={(e) => handleDealerChange('inventoryCount', e.target.value)} />
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Verification Information</h3>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Verification Documents</label>
              <div className="document-grid">
                <label className="document-upload"><strong>Business registration</strong><span>{documents.businessRegistration?.name ?? 'PDF, JPG or PNG (max 10 MB)'}</span><input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setDocuments((current) => ({ ...current, businessRegistration: e.target.files?.[0] }))} required /></label>
                <label className="document-upload"><strong>Representative identity proof</strong><span>{documents.identityProof?.name ?? 'PDF, JPG or PNG (max 10 MB)'}</span><input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setDocuments((current) => ({ ...current, identityProof: e.target.files?.[0] }))} required /></label>
                <label className="document-upload"><strong>Additional verification (optional)</strong><span>{documents.additionalDocument?.name ?? 'PDF, JPG or PNG (max 10 MB)'}</span><input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setDocuments((current) => ({ ...current, additionalDocument: e.target.files?.[0] }))} /></label>
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <Link to="/login" className="btn btn-secondary">Back to Login</Link>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Dealer Application'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
