import React, { useEffect, useState } from 'react';
import { firebaseAuth } from '../services/firebaseAuth';

// Shown to signed-in users whose email address is not verified yet. Buyers can use MotorX without
// it, but a dealer application cannot be approved until the applicant has verified their email.
export const EmailVerificationBanner: React.FC = () => {
  const [email, setEmail] = useState<string | null>(null);
  const [verified, setVerified] = useState(true);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => firebaseAuth.onUserChanged((user) => {
    setEmail(user?.email ?? null);
    setVerified(!user || user.emailVerified);
  }), []);

  if (verified || !email) return null;

  const run = async (action: () => Promise<string>) => {
    setBusy(true); setMessage('');
    try { setMessage(await action()); } catch { setMessage('Something went wrong. Please try again in a minute.'); } finally { setBusy(false); }
  };

  return (
    <div role="status" className="glass-card" style={{ margin: '0.75rem auto', maxWidth: 1100, padding: '0.75rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <span style={{ flex: '1 1 320px' }}>
        Please verify your email address (<strong>{email}</strong>). Check your inbox for the link. Dealer applications can only be approved after verification.
      </span>
      <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => void run(async () => { await firebaseAuth.resendEmailVerification(); return 'Verification email sent.'; })}>Resend email</button>
      <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => void run(async () => {
        const nowVerified = await firebaseAuth.refreshEmailVerification();
        if (nowVerified) setVerified(true);
        return nowVerified ? 'Email verified. Thank you!' : 'Not verified yet. Open the link in the email first.';
      })}>I have verified</button>
      {message && <span style={{ width: '100%', fontSize: '0.8125rem' }}>{message}</span>}
    </div>
  );
};
