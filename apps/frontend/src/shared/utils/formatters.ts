export function formatPrice(price: number, currency = 'LKR') { return new Intl.NumberFormat('en-LK', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price); }
export function formatDate(value: string) { return new Intl.DateTimeFormat('en-LK', { dateStyle: 'medium' }).format(new Date(value)); }
export function formatDateTime(value: string) { return new Intl.DateTimeFormat('en-LK', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
export function getInitials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U'; }
