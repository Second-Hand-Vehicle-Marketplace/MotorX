// WhatsApp links need the full international number without "+" or spaces. Dealers usually enter
// Sri Lankan numbers in local form ("077 123 4567"), so those get the 94 country code.
export function toWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (/^0\d{9}$/.test(digits)) return `94${digits.slice(1)}`;      // 0771234567
  if (/^94\d{9}$/.test(digits)) return digits;                     // +94 77 123 4567
  if (/^\d{9}$/.test(digits) && digits.startsWith('7')) return `94${digits}`; // 771234567
  if (/^00\d{8,15}$/.test(digits)) return digits.slice(2);         // 0044... international
  return digits.length >= 8 && digits.length <= 15 && !digits.startsWith('0') ? digits : null;
}

export function whatsAppLink(phone: string | null | undefined, message: string): string | null {
  const number = toWhatsAppNumber(phone);
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : null;
}
