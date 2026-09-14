import { downloadText, serializeCSV } from './table-export.ts';
export const money = (n: number) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
export const dateTR = (date: Date | string) => {
  const parsed = new Date(
    typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date + 'T12:00:00' : date,
  );
  return Number.isFinite(parsed.getTime())
    ? new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' }).format(parsed)
    : 'Belirtilmedi';
};
export const fullDateTR = (value?: string) => {
  if (!value) return 'Belirtilmedi';
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Belirtilmedi';
};
export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');
export const normalize = (text: string) => text.toLocaleLowerCase('tr-TR').trim();
export function downloadCSV(name: string, rows: unknown[][]) {
  downloadText(name, serializeCSV(rows), 'text/csv;charset=utf-8');
}
export function localDateTime(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
