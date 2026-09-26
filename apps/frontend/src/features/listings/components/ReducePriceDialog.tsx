import React, { useEffect, useRef, useState } from 'react';
import { BULK_PRICE_REDUCTION_MAX_PERCENT } from '@motorx/shared-contracts';
import { formatPrice } from '@/shared/utils/formatters';
import type { Listing } from '../types/listing.types';

const PRESETS = [5, 10, 15];

interface ReducePriceDialogProps {
  listings: Listing[];
  onConfirm: (percent: number) => Promise<void>;
  onClose: () => void;
}

// Asks how much to cut the price of one or many listings, and previews the new prices first.
export const ReducePriceDialog: React.FC<ReducePriceDialogProps> = ({ listings, onConfirm, onClose }) => {
  const [percent, setPercent] = useState(5);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const valid = Number.isInteger(percent) && percent >= 1 && percent <= BULK_PRICE_REDUCTION_MAX_PERCENT;

  // Focus moves into the dialog once, when it opens (not on every re-render while typing).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>('button')?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onCloseRef.current(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const confirm = async () => {
    if (!valid) return;
    setIsSaving(true); setError('');
    try { await onConfirm(percent); onClose(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not change the price.'); setIsSaving(false); }
  };

  const preview = listings.slice(0, 3);
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div ref={dialogRef} className="glass-card dialog" role="dialog" aria-modal="true" aria-labelledby="reduce-price-title" onClick={(event) => event.stopPropagation()}>
        <h2 id="reduce-price-title" className="dialog-title">Reduce price{listings.length > 1 ? ` of ${listings.length} listings` : ''}</h2>
        <p className="dialog-text">A lower price also marks the listing as up to date.</p>
        <div className="reduce-price-options" role="group" aria-label="Reduce by">
          {PRESETS.map((preset) => (
            <button key={preset} type="button" className={`btn btn-sm ${percent === preset ? 'btn-primary' : 'btn-secondary'}`} aria-pressed={percent === preset} onClick={() => setPercent(preset)}>{preset}%</button>
          ))}
          <label className="reduce-price-custom">
            <span>Other</span>
            <input type="number" inputMode="numeric" min={1} max={BULK_PRICE_REDUCTION_MAX_PERCENT} className="form-input" value={percent} onChange={(event) => setPercent(Number(event.target.value))} aria-label="Percent to reduce by" />
            <span>%</span>
          </label>
        </div>
        {!valid && <p role="alert" className="dialog-error">Choose between 1% and {BULK_PRICE_REDUCTION_MAX_PERCENT}%.</p>}
        {valid && preview.length > 0 && (
          <ul className="reduce-price-preview">
            {preview.map((listing) => (
              <li key={listing.id}><span>{listing.title}</span><span><s>{formatPrice(listing.price, listing.currency)}</s> → <strong>{formatPrice(Math.round(listing.price * (1 - percent / 100)), listing.currency)}</strong></span></li>
            ))}
            {listings.length > preview.length && <li>…and {listings.length - preview.length} more</li>}
          </ul>
        )}
        {error && <p role="alert" className="dialog-error">{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSaving}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={() => void confirm()} disabled={!valid || isSaving}>{isSaving ? 'Saving…' : `Reduce by ${valid ? percent : '…'}%`}</button>
        </div>
      </div>
    </div>
  );
};
