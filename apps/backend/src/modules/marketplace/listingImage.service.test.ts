import { describe, expect, it } from 'vitest';
import { hasValidImageSignature } from './listingImage.signature.js';

describe('listing image signatures', () => {
  it('accepts supported image headers', () => {
    expect(hasValidImageSignature({ mimetype: 'image/jpeg', buffer: Buffer.from([0xff, 0xd8, 0xff]) })).toBe(true);
    expect(hasValidImageSignature({ mimetype: 'image/png', buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) })).toBe(true);
    expect(hasValidImageSignature({ mimetype: 'image/webp', buffer: Buffer.from('RIFF0000WEBP') })).toBe(true);
  });

  it('rejects spoofed and unsupported files', () => {
    expect(hasValidImageSignature({ mimetype: 'image/jpeg', buffer: Buffer.from('not-an-image') })).toBe(false);
    expect(hasValidImageSignature({ mimetype: 'image/gif', buffer: Buffer.from('GIF89a') })).toBe(false);
  });
});
