/** Explicit report criteria. Null means unknown, never zero. */
export type ReportCriteria = {
  attendanceLowBelow: number | null;
  attendanceHighAtLeast: number | null;
  highRemainingAtLeast: number | null;
  bonusRemainingAtMost: number | null;
  endingWithinDays: number | null;
  longFreezeAtLeastDays: number | null;
  meetingsAtLeast: number | null;
  highDiscountAtLeastPercent: number | null;
};
export const emptyReportCriteria: ReportCriteria = {
  attendanceLowBelow: null,
  attendanceHighAtLeast: null,
  highRemainingAtLeast: null,
  bonusRemainingAtMost: null,
  endingWithinDays: null,
  longFreezeAtLeastDays: null,
  meetingsAtLeast: null,
  highDiscountAtLeastPercent: null,
};
export type Decision = true | false | 'unknown';
export function compare(
  value: number | null | undefined,
  threshold: number | null,
  op: 'lt' | 'lte' | 'gte',
): Decision {
  if (value == null || threshold == null || !Number.isFinite(value) || !Number.isFinite(threshold))
    return 'unknown';
  return op === 'lt' ? value < threshold : op === 'lte' ? value <= threshold : value >= threshold;
}
export function both(...values: Decision[]): Decision {
  return values.includes(false) ? false : values.includes('unknown') ? 'unknown' : true;
}
export function either(...values: Decision[]): Decision {
  return values.includes(true) ? true : values.includes('unknown') ? 'unknown' : false;
}
export function partitionCohort<T>(records: T[], predicate: (record: T) => Decision) {
  const included: T[] = [],
    excluded: T[] = [],
    unknown: T[] = [];
  for (const record of records) {
    const match = predicate(record);
    (match === true ? included : match === false ? excluded : unknown).push(record);
  }
  return { included, excluded, unknown };
}
export function nullableSum(values: (number | null | undefined)[]) {
  return values.some((v) => v == null)
    ? null
    : values.reduce<number>((sum, value) => sum + Math.round(value! * 100), 0) / 100;
}
export function knownMean(values: (number | null | undefined)[]) {
  const known = values.filter((v): v is number => v != null && Number.isFinite(v));
  return known.length ? known.reduce((sum, v) => sum + v, 0) / known.length : null;
}
export function calendarDays(from: string, to: string) {
  // Caller validates ISO date strings; UTC avoids daylight-saving-hour errors.
  return Math.round(
    (Date.parse(to.slice(0, 10) + 'T00:00:00Z') - Date.parse(from.slice(0, 10) + 'T00:00:00Z')) /
      86400000,
  );
}
export type LocalEducationFacts = {
  educationStatus: string | null;
  attendanceRate: number | null;
  remainingAmount: number | null;
  remainingBonusCount: number | null;
  usedBonusCount: number | null;
  daysToEnd: number | null;
  freezeElapsedDays: number | null;
  meetingCount: number | null;
  groupSwitchCount: number | null;
  transferredAt: string | null;
};
export function educationCriteriaDecision(
  slug: string,
  r: LocalEducationFacts,
  c: ReportCriteria,
): Decision {
  switch (slug) {
    case 'attendance-risk-students':
      return compare(r.attendanceRate, c.attendanceLowBelow, 'lt');
    case 'high-attendance-students':
      return compare(r.attendanceRate, c.attendanceHighAtLeast, 'gte');
    case 'low-attendance-high-remaining':
      return both(
        compare(r.attendanceRate, c.attendanceLowBelow, 'lt'),
        compare(r.remainingAmount, c.highRemainingAtLeast, 'gte'),
      );
    case 'bonus-used-students':
      return r.usedBonusCount == null ? 'unknown' : r.usedBonusCount > 0;
    case 'zero-bonus-remaining':
      return r.remainingBonusCount == null ? 'unknown' : r.remainingBonusCount === 0;
    case 'bonus-remaining-risk':
      return compare(r.remainingBonusCount, c.bonusRemainingAtMost, 'lte');
    case 'ending-soon-students':
      return both(
        r.daysToEnd == null ? 'unknown' : r.daysToEnd >= 0,
        compare(r.daysToEnd, c.endingWithinDays, 'lte'),
      );
    case 'long-freeze-students':
      return both(
        r.educationStatus == null ? 'unknown' : r.educationStatus === 'frozen',
        compare(r.freezeElapsedDays, c.longFreezeAtLeastDays, 'gte'),
      );
    case 'meeting-intensive-students':
      return compare(r.meetingCount, c.meetingsAtLeast, 'gte');
    case 'reactivation-candidates':
      return r.educationStatus == null
        ? 'unknown'
        : ['frozen', 'expired'].includes(r.educationStatus);
    case 'group-switch-history':
      return r.groupSwitchCount == null ? 'unknown' : r.groupSwitchCount > 0;
    case 'transfer-out-students':
      return r.transferredAt == null ? 'unknown' : true;
    default:
      return 'unknown';
  }
}
