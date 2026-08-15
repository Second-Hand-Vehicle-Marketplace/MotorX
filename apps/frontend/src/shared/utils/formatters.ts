export function formatPrice(price: number, currency = 'LKR') { return new Intl.NumberFormat('en-LK', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price); }
export function formatDate(value: string) { return new Intl.DateTimeFormat('en-LK', { dateStyle: 'medium' }).format(new Date(value)); }
export function formatDateTime(value: string) { return new Intl.DateTimeFormat('en-LK', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
export function getInitials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U'; }
export function formatMileage(mileageKm: number) { return `${new Intl.NumberFormat('en-LK').format(mileageKm)} km`; }
export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
