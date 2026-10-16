export function peso(amount: number, decimals = false): string {
  return `₱${amount.toLocaleString('en-US', decimals ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : undefined)}`;
}

/** Server sends MySQL 'YYYY-MM-DD HH:MM:SS' or 'YYYY-MM-DD'. */
export function formatDateTime(value?: string): string {
  if (!value) return '';
  const d = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatDate(value?: string): string {
  if (!value) return '';
  const d = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { dateStyle: 'medium' });
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
