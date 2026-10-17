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

/** Formats a peso amount being typed into a text input with thousands separators (e.g. "123123" -> "123,123"); keeps at most 2 decimal places. */
export function formatAmountInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, '');
  const firstDot = cleaned.indexOf('.');
  const intPart = firstDot === -1 ? cleaned : cleaned.slice(0, firstDot);
  const decPart = firstDot === -1 ? '' : `.${cleaned.slice(firstDot + 1).replace(/\./g, '').slice(0, 2)}`;
  const normalizedInt = intPart.replace(/^0+(?=\d)/, '');
  const withCommas = normalizedInt ? Number(normalizedInt).toLocaleString('en-US') : normalizedInt;
  return withCommas + decPart;
}

/** Strips the thousands separators formatAmountInput adds, so the string can be parsed as a number. */
export function parseAmountInput(formatted: string): number {
  return Number(formatted.replace(/,/g, ''));
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
