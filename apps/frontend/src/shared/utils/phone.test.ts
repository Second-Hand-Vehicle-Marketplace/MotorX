import { describe, expect, it } from 'vitest';
import { toWhatsAppNumber, whatsAppLink } from './phone';

describe('WhatsApp numbers', () => {
  it('adds the Sri Lankan country code to local numbers, however they are written', () => {
    expect(toWhatsAppNumber('077 123 4567')).toBe('94771234567');
    expect(toWhatsAppNumber('0112345678')).toBe('94112345678');
    expect(toWhatsAppNumber('+94 77 123-4567')).toBe('94771234567');
    expect(toWhatsAppNumber('771234567')).toBe('94771234567');
  });

  it('keeps foreign numbers and rejects ones that cannot be dialled', () => {
    expect(toWhatsAppNumber('0044 20 7946 0958')).toBe('442079460958');
    expect(toWhatsAppNumber('123')).toBeNull();
    expect(toWhatsAppNumber('')).toBeNull();
  });

  it('builds a link with the message ready to send', () => {
    expect(whatsAppLink('0771234567', 'Is it still available?')).toBe('https://wa.me/94771234567?text=Is%20it%20still%20available%3F');
    expect(whatsAppLink(null, 'hi')).toBeNull();
  });
});
