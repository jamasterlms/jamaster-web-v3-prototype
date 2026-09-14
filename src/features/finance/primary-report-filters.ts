import type { PrimaryReportKind, PrimaryReportRow } from './primary-report-model.ts';
/** A local missing-relation selector; never an API ID. */
export const UNKNOWN_RELATION = '__unknown__';
export type PrimaryFilters = {
  search: string;
  startDate: string;
  endDate: string;
  status: string[];
  paymentType: string[];
  type: string[];
  advisorId: string;
  education: string;
  pricing: string;
  categoryId: string;
  transactionMode: string;
  sort: string;
  order: string;
};
type IdentityKey = 'advisorId' | 'categoryId' | 'educationId' | 'planId';
const norm = (value: string) => value.normalize('NFC').toLocaleLowerCase('tr-TR');
export function relationOptions(
  rows: PrimaryReportRow[],
  key: IdentityKey,
  labelKey: 'advisor' | 'category' | 'course' | 'pricing',
) {
  const options = new Map<string, string>();
  for (const row of rows) {
    const id = row[key];
    if (id) options.set(id, row[labelKey] || id);
  }
  const names = [...options.values()];
  const result = [...options]
    .map(([value, label]) => ({
      value,
      label: names.filter((n) => n === label).length > 1 ? `${label} · ${value}` : label,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'tr'));
  if (rows.some((row) => !row[key]))
    result.push({ value: UNKNOWN_RELATION, label: 'Bilgisi eksik' });
  return result;
}
const all = (value: string) => !value || value === 'all';
type Decision = true | false | 'unknown';
function identity(actual: string | undefined, selected: string): Decision {
  if (all(selected)) return true;
  if (selected === UNKNOWN_RELATION) return !actual;
  return actual ? actual === selected : 'unknown';
}
function multi(actual: string | undefined, selected: string[]): Decision {
  return !selected.length ? true : actual ? selected.includes(actual) : 'unknown';
}
export function primaryFilteredRows(
  raw: PrimaryReportRow[],
  kind: PrimaryReportKind,
  f: PrimaryFilters,
) {
  const rows: PrimaryReportRow[] = [];
  let unknown = 0;
  const sales = kind === 'sales',
    collections = kind === 'collections',
    bills = kind === 'bills',
    accounting = kind === 'accounting';
  for (const r of raw) {
    if (
      !norm([r.title, r.description, r.course, r.pricing, r.advisor].join(' ')).includes(
        norm(f.search),
      )
    )
      continue;
    const day = r.date?.slice(0, 10);
    const checks: Decision[] = [
      f.startDate || f.endDate
        ? day
          ? (!f.startDate || day >= f.startDate.slice(0, 10)) &&
            (!f.endDate || day <= f.endDate.slice(0, 10))
          : 'unknown'
        : true,
    ];
    if (sales || bills) checks.push(multi(r.status, f.status));
    if (collections || kind === 'overdue-receivables') checks.push(multi(r.method, f.paymentType));
    if (bills || collections) checks.push(identity(r.advisorId, f.advisorId));
    if (sales) checks.push(identity(r.educationId, f.education), identity(r.planId, f.pricing));
    if (accounting)
      checks.push(
        multi(r.type, f.type),
        identity(r.categoryId, f.categoryId),
        identity(r.transactionMode, f.transactionMode),
      );
    if (checks.includes(false)) continue;
    if (checks.includes('unknown')) {
      unknown++;
      continue;
    }
    rows.push(r);
  }
  rows.sort((a, b) => {
    const av = a[f.sort as keyof PrimaryReportRow],
      bv = b[f.sort as keyof PrimaryReportRow];
    if (av == null || av === '') return bv == null || bv === '' ? 0 : 1;
    if (bv == null || bv === '') return -1;
    return (
      (f.order === 'asc' ? 1 : -1) *
      (typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv), 'tr'))
    );
  });
  return { rows, unknown };
}
