import type { WorkspaceState } from '../../app/workspace-reducer.ts';
import { emptyReportCriteria, type ReportCriteria } from './report-criteria.ts';
export type ReportData = { version: 1; criteria: ReportCriteria };
export const reportDataKey = (branch: string) => `report-data:${branch}`;
export function readReportData(state: Pick<WorkspaceState, 'settings' | 'branch'>): ReportData {
  try {
    const value = JSON.parse(state.settings[reportDataKey(state.branch)] || '{}');
    const criteria = { ...emptyReportCriteria };
    for (const field of criteriaFields) {
      const candidate = value.criteria?.[field.key];
      if (
        typeof candidate === 'number' &&
        Number.isFinite(candidate) &&
        candidate >= 0 &&
        (field.max == null || candidate <= field.max) &&
        (!['gün', 'hak', 'görüşme'].includes(field.unit) || Number.isInteger(candidate))
      ) {
        criteria[field.key] = candidate;
      }
    }
    return {
      version: 1,
      criteria,
    };
  } catch {
    return {
      version: 1,
      criteria: { ...emptyReportCriteria },
    };
  }
}
export const criteriaFields: {
  key: keyof ReportCriteria;
  label: string;
  unit: string;
  max?: number;
}[] = [
  {
    key: 'attendanceLowBelow',
    label: 'Düşük devam: altında',
    unit: '%',
    max: 100,
  },
  {
    key: 'attendanceHighAtLeast',
    label: 'Yüksek devam: en az',
    unit: '%',
    max: 100,
  },
  { key: 'highRemainingAtLeast', label: 'Yüksek bakiye: en az', unit: 'TL' },
  {
    key: 'bonusRemainingAtMost',
    label: 'Riskli kalan bonus: en çok',
    unit: 'hak',
  },
  { key: 'endingWithinDays', label: 'Yaklaşan bitiş: içinde', unit: 'gün' },
  { key: 'longFreezeAtLeastDays', label: 'Uzun dondurma: en az', unit: 'gün' },
  { key: 'meetingsAtLeast', label: 'Yoğun görüşme: en az', unit: 'görüşme' },
  {
    key: 'highDiscountAtLeastPercent',
    label: 'Yüksek indirim: en az',
    unit: '%',
    max: 100,
  },
];
export const criteriaForSlug: Record<string, (keyof ReportCriteria)[]> = {
  'attendance-risk-students': ['attendanceLowBelow'],
  'high-attendance-students': ['attendanceHighAtLeast'],
  'low-attendance-high-remaining': ['attendanceLowBelow', 'highRemainingAtLeast'],
  'bonus-remaining-risk': ['bonusRemainingAtMost'],
  'ending-soon-students': ['endingWithinDays'],
  'expiring-soon-sales': ['endingWithinDays'],
  'contract-expiry-revenue-risk': ['endingWithinDays'],
  'long-freeze-students': ['longFreezeAtLeastDays'],
  'meeting-intensive-students': ['meetingsAtLeast'],
  'high-discount-sales': ['highDiscountAtLeastPercent'],
  'unpaid-balance-heavy': ['highRemainingAtLeast'],
};
