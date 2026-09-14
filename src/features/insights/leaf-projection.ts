import type { WorkspaceState } from '../../app/workspace-reducer.ts';
import type { OperationsState } from '../operations/model.ts';
import type { MembershipRecords } from '../education/membership-model.ts';
import {
  financeRecords,
  installmentRows,
  saleBalance,
  paymentMethodCode,
  type Sale,
} from '../finance/finance-model.ts';
import { localDate } from '../../lib/validation.ts';
import {
  educationLeafDefinitions,
  salesLeafDefinitions,
  paymentTypeOptions,
} from './leaf-definitions.ts';
import {
  both,
  compare,
  calendarDays,
  educationCriteriaDecision,
  partitionCohort,
  type Decision,
  type LocalEducationFacts,
} from './report-criteria.ts';
import { readReportData, criteriaForSlug } from './report-data.ts';
type ReportSale = Sale & {
  advisorName?: string;
  groupIdAtSale?: string;
  groupNameAtSale?: string;
  refundedAmount?: number;
};
export type LeafRow = { id: string; [key: string]: string | number | null };
export type LeafFilters = {
  search: string;
  status: string[];
  paymentType: string[];
  startDate: string;
  endDate: string;
  sort: string;
  order: string;
};
export type LeafResult = {
  rows: LeafRow[];
  trend: [string, number][];
  unknown: number;
  criteriaMissing: string[];
  notice: string;
  unavailable?: string;
  contextRows: LeafRow[];
  trendTitle?: string;
  measure?: string;
};
export const within = (
  date: string | null | undefined,
  f: Pick<LeafFilters, 'startDate' | 'endDate'>,
) =>
  (!f.startDate && !f.endDate) ||
  (!!date &&
    (!f.startDate || date.slice(0, 10) >= f.startDate) &&
    (!f.endDate || date.slice(0, 10) <= f.endDate));
const normalized = (v: string) => v.normalize('NFC').toLocaleLowerCase('tr-TR');
const latest = (dates: (string | null | undefined)[]) =>
  dates
    .filter((v): v is string => !!v)
    .sort()
    .at(-1) || null;
const cents = (v: number) => Math.round(v * 100) / 100;
const knownSum = (v: (number | undefined | null)[]) =>
  v.some((x) => x == null) ? null : cents(v.reduce<number>((a, b) => a + b!, 0));
export function sortLeafRows(rows: LeafRow[], f: LeafFilters) {
  return [...rows].sort((a, b) => {
    const l = a[f.sort],
      r = b[f.sort];
    if (l == null) return r == null ? 0 : 1;
    if (r == null) return -1;
    return (
      (typeof l === 'number' && typeof r === 'number'
        ? l - r
        : String(l).localeCompare(String(r), 'tr')) * (f.order === 'asc' ? 1 : -1)
    );
  });
}
function result(
  rows: LeafRow[],
  unknown: number,
  criteriaMissing: string[],
  notice: string,
  f: LeafFilters,
  contextRows: LeafRow[] = rows,
): LeafResult {
  return {
    rows: sortLeafRows(rows, f),
    contextRows,
    unknown,
    criteriaMissing,
    notice,
    trend: [],
  };
}
/** Same unrounded attendance facts/criterion are consumed by report and JamAI. */
export function educationProjection(
  state: WorkspaceState,
  memberships: MembershipRecords,
  slug: string,
  f: LeafFilters,
  today = localDate(),
): LeafResult {
  if (!educationLeafDefinitions[slug])
    return { ...result([], 0, [], '', f), unavailable: 'Rapor bulunamadı.' };
  const config = readReportData(state),
    finance = financeRecords(state);
  const allSessions = (state.attendanceSessions || []).filter((s) => s.branch === state.branch);
  const sessions = allSessions.filter((s) => within(s.date, f));
  const unresolved = new Set(memberships.unresolved.map((m) => m.studentId));
  const facts = state.students
    .map((student) => {
      const id = student.id,
        extra = {} as {
          contextSaleId?: string;
          groupSwitchCount?: number;
          attendanceHistoryComplete?: boolean;
          meetingsHistoryComplete?: boolean;
          membershipHistoryComplete?: boolean;
        };
      const sales = finance.sales.filter((s) => s.studentId === id).map((s) => s as ReportSale);
      const selected =
        sales.find((s) => s.id === extra.contextSaleId) ||
        (sales.length === 1 ? sales[0] : undefined);
      const marks = sessions.filter((s) => s.marks[id] === 'present' || s.marks[id] === 'absent');
      const present = marks.filter((s) => s.marks[id] === 'present');
      const allPresent = allSessions.filter((s) => s.marks[id] === 'present');
      const meetings = state.meetings.filter((m) => m.studentId === id && within(m.createdAt, f));
      const groups = new Set(
        memberships.memberships
          .filter((m) => m.studentId === id && m.status === 'active')
          .map((m) => m.groupId),
      );
      const freezes = sales.flatMap((s) => s.freezes || []).filter((x) => x.status !== 'cancelled');
      const activeFreeze = freezes
        .filter((x) => x.status === 'active' && x.freezeStartDate.slice(0, 10) <= today)
        .sort((a, b) => a.freezeStartDate.localeCompare(b.freezeStartDate))
        .at(-1);
      const lastFreeze = [...freezes]
        .sort((a, b) => a.freezeStartDate.localeCompare(b.freezeStartDate))
        .at(-1);
      const transfers = sales
        .flatMap((s) => s.transfers || [])
        .filter(
          (t) =>
            String(t.fromStudentId) === String(id) &&
            t.status === 'completed' &&
            ['STUDENT', 'BOTH'].includes(t.transferType),
        );
      const switches = memberships.history.filter(
        (h) => h.studentId === id && h.toGroupId && h.fromGroupIds?.some((g) => g !== h.toGroupId),
      );
      const educationStatus =
        selected?.educationStatus ||
        (activeFreeze
          ? 'frozen'
          : sales.length > 1
            ? null
            : student.status === 'Aktif'
              ? 'active'
              : student.status === 'Dondurulmuş'
                ? 'frozen'
                : null);
      const row: LeafRow = {
        id: String(id),
        studentName: student.name,
        studentEmail: student.email,
        createdAt: student.date,
        advisorName:
          selected?.advisorName || (student.advisor && student.advisor !== 'Atanmadı')
            ? selected?.advisorName || student.advisor!
            : null,
        educationStatus,
        saleStatus: selected?.status || null,
        activeGroupCount: unresolved.has(id) ? null : groups.size,
        paidAmount: cents(
          finance.receipts.filter((r) => r.studentId === id).reduce((a, r) => a + r.amount, 0),
        ),
        remainingAmount: cents(sales.reduce((a, s) => a + saleBalance(s, finance.receipts), 0)),
        listAmount: sales.length ? knownSum(sales.map((s) => s.listAmount)) : null,
        startDate: selected?.startDate || null,
        endDate: selected?.endDate || null,
        daysToEnd: selected?.endDate ? calendarDays(today, selected.endDate) : null,
        usedBonusCount: sales.length ? knownSum(sales.map((s) => s.usedBonusCount)) : null,
        remainingBonusCount: sales.length
          ? knownSum(sales.map((s) => s.remainingBonusCount))
          : null,
        attendanceRate: marks.length ? (100 * present.length) / marks.length : null,
        lastAttendanceAt: latest(present.map((s) => s.date)),
        lastMeetingAt: latest(meetings.map((m) => m.createdAt)),
        meetingCount: meetings.length,
        groupSwitchCount:
          extra.groupSwitchCount ??
          (switches.length ? switches.length : extra.membershipHistoryComplete ? 0 : null),
        transferredAt: latest(
          transfers.filter((t) => within(t.createdAt, f)).map((t) => t.createdAt),
        ),
        lastFreezeStart: lastFreeze?.freezeStartDate || null,
        lastFreezeEnd: lastFreeze?.freezeEndDate || null,
        freezeElapsedDays: activeFreeze
          ? Math.max(0, calendarDays(activeFreeze.freezeStartDate, today))
          : null,
        hasActiveFreeze: activeFreeze ? 1 : 0,
        transferHistoryKnown: sales.length && sales.every((s) => s.transfers !== undefined) ? 1 : 0,
        periodPresent: present.length,
        lifetimePresent: allPresent.length,
        attendanceObserved: marks.length,
        attendanceHistoryComplete: extra.attendanceHistoryComplete ? 1 : 0,
        meetingsHistoryComplete: extra.meetingsHistoryComplete ? 1 : 0,
        membershipHistoryComplete: extra.membershipHistoryComplete ? 1 : 0,
        membershipCount: memberships.memberships.filter((m) => m.studentId === id).length,
        lastBonusUsedAt: latest(sales.map((s) => s.lastBonusUsedAt)),
      };
      return row;
    })
    .filter(
      (r) =>
        normalized(`${r.studentName} ${r.studentEmail} ${r.advisorName || ''}`).includes(
          normalized(f.search),
        ) &&
        (!f.status.length || f.status.includes(String(r.educationStatus))),
    );
  const decide = (r: LeafRow): Decision => {
    switch (slug) {
      case 'active-students':
        return r.educationStatus == null ? 'unknown' : r.educationStatus === 'active';
      case 'active-unassigned-students':
        return both(
          r.educationStatus == null ? 'unknown' : r.educationStatus === 'active',
          r.activeGroupCount == null ? 'unknown' : r.activeGroupCount === 0,
        );
      case 'frozen-students':
        return r.educationStatus === 'frozen' || r.hasActiveFreeze === 1
          ? true
          : r.educationStatus == null
            ? 'unknown'
            : false;
      case 'no-advisor-students':
        return r.advisorName === null;
      case 'meetings':
        return Number(r.meetingCount) > 0;
      case 'no-meeting-recently':
        return Number(r.meetingCount) > 0
          ? false
          : r.meetingsHistoryComplete === 1
            ? true
            : 'unknown';
      case 'no-attendance-recently':
        return Number(r.periodPresent) > 0
          ? false
          : Number(r.attendanceObserved) > 0 || r.attendanceHistoryComplete === 1
            ? true
            : 'unknown';
      case 'never-attended-students':
        return Number(r.lifetimePresent) > 0
          ? false
          : r.attendanceHistoryComplete === 1
            ? true
            : 'unknown';
      case 'never-group-assigned':
        return Number(r.membershipCount) > 0
          ? false
          : r.activeGroupCount === null || r.membershipHistoryComplete !== 1
            ? 'unknown'
            : true;
      case 'transfer-out-students':
        return r.transferredAt ? true : r.transferHistoryKnown === 1 ? false : 'unknown';
      case 'education-status-distribution':
      case 'attendance-trend':
      case 'group-assignment-load':
        return true;
      case 'bonus-used-students':
        return both(
          r.usedBonusCount == null ? 'unknown' : Number(r.usedBonusCount) > 0,
          !f.startDate && !f.endDate
            ? true
            : r.lastBonusUsedAt == null
              ? 'unknown'
              : within(String(r.lastBonusUsedAt), f),
        );
      default:
        return educationCriteriaDecision(
          slug,
          r as unknown as LocalEducationFacts,
          config.criteria,
        );
    }
  };
  const split = partitionCohort(facts, decide),
    missing = (criteriaForSlug[slug] || []).filter((k) => config.criteria[k] == null);
  const out = result(
    split.included,
    split.unknown.length,
    missing,
    'Yerel kayıtlar. Devam ve görüşmeler seçilen dönemi, bakiye ve bonus sayıları mevcut toplamı gösterir. Birden çok satışta eğitim bağlamı seçilmelidir.',
    f,
    split.unknown,
  );
  const ids = new Set(split.included.map((r) => Number(r.id))),
    trend = new Map<string, number>();
  for (const session of sessions) {
    const n = Object.entries(session.marks).filter(
      ([id, mark]) => ids.has(Number(id)) && mark === 'present',
    ).length;
    if (n) trend.set(session.date, (trend.get(session.date) || 0) + n);
  }
  out.trend = [...trend].sort(([a], [b]) => a.localeCompare(b));
  out.trendTitle = 'Kaydedilen katılım sayısı';
  return out;
}
export function salesProjection(
  state: WorkspaceState,
  operations: OperationsState,
  slug: string,
  f: LeafFilters,
  today = localDate(),
): LeafResult {
  const definition = salesLeafDefinitions[slug];
  if (!definition) return { ...result([], 0, [], '', f), unavailable: 'Rapor bulunamadı.' };
  const cfg = readReportData(state),
    finance = financeRecords(state),
    installments = installmentRows(finance);
  const datedSales = finance.sales
    .map((s) => s as ReportSale)
    .filter(
      (s) =>
        within(s.date, f) &&
        (!f.paymentType.length || f.paymentType.includes(paymentMethodCode(s.method))),
    );
  const statusFilterUnknown = f.status.length ? datedSales.filter((s) => !s.status).length : 0;
  const sales = datedSales.filter(
    (s) => !f.status.length || (!!s.status && f.status.includes(s.status)),
  );
  const remaining = (s: (typeof sales)[number]) => saleBalance(s, finance.receipts);
  const overdue = (s: (typeof sales)[number]) =>
    installments.filter((i) => i.saleId === s.id && i.date && i.date < today && i.balance > 0);
  const decide = (s: (typeof sales)[number]): Decision => {
    const bal = remaining(s),
      days = s.endDate ? calendarDays(today, s.endDate) : null;
    switch (slug) {
      case 'pending-sales':
      case 'completed-sales':
      case 'cancelled-sales':
      case 'refunded-sales':
        return s.status == null ? 'unknown' : s.status === slug.replace('-sales', '');
      case 'discount-impact':
        return s.discountedAmount == null ? 'unknown' : s.discountedAmount > 0;
      case 'no-discount-sales':
        return s.discountedAmount == null ? 'unknown' : s.discountedAmount === 0;
      case 'high-discount-sales':
        return compare(
          s.listAmount && s.discountedAmount != null
            ? (100 * s.discountedAmount) / s.listAmount
            : null,
          cfg.criteria.highDiscountAtLeastPercent,
          'gte',
        );
      case 'unpaid-balance-heavy':
        return compare(bal, cfg.criteria.highRemainingAtLeast, 'gte');
      case 'installment-risk':
      case 'advisor-revenue-risk':
        return overdue(s).length > 0
          ? true
          : installments.some((i) => i.saleId === s.id && !i.date) && bal > 0
            ? 'unknown'
            : false;
      case 'expiring-soon-sales':
        return both(
          s.educationStatus == null ? 'unknown' : s.educationStatus === 'active',
          days == null ? 'unknown' : days >= 0,
          compare(days, cfg.criteria.endingWithinDays, 'lte'),
        );
      case 'cancellation-refund-analysis':
        return s.status == null ? 'unknown' : ['cancelled', 'refunded'].includes(s.status);
      default:
        return true;
    }
  };
  const split = partitionCohort(sales, decide),
    missing = (criteriaForSlug[slug] || []).filter((k) => cfg.criteria[k] == null);
  const grouped = new Map<string, LeafRow>(),
    trend = new Map<string, number>();
  let unknown = split.unknown.length + statusFilterUnknown;
  for (const s of split.included) {
    const student = state.students.find((st) => st.id === s.studentId);
    let label = '',
      key = '';
    if (slug === 'contract-expiry-revenue-risk') {
      if (s.endDate === undefined || cfg.criteria.endingWithinDays == null) {
        unknown++;
        continue;
      }
      const days = s.endDate ? calendarDays(today, s.endDate) : null,
        horizon = cfg.criteria.endingWithinDays;
      label =
        days == null
          ? 'Bitiş tarihi yok'
          : days < 0
            ? 'Süresi dolmuş'
            : days <= horizon
              ? `0–${horizon} gün`
              : `${horizon} günden sonra`;
      key = label;
    } else if (slug === 'cancellation-refund-analysis') {
      key = s.status!;
      label = s.status === 'cancelled' ? 'İptal' : 'İade';
    } else if (definition.group === 'advisor') {
      label = s.advisorName || student?.advisor || 'Atanmadı';
      key = s.advisorId || `current:${label}`;
    } else if (definition.group === 'package') {
      label =
        operations.plans.find((p) => p.id === s.planId)?.name || s.course || 'Paket bilinmiyor';
      key = s.planId || `unknown:${label}`;
    } else if (definition.group === 'method') {
      key = paymentMethodCode(s.method) || 'unknown';
      label = paymentTypeOptions[key as keyof typeof paymentTypeOptions] || 'Bilinmiyor';
    } else {
      key = s.groupIdAtSale || 'unknown';
      label = s.groupNameAtSale || 'Satış grubu bilinmiyor';
    }
    if (!normalized(label).includes(normalized(f.search))) continue;
    const r = grouped.get(key) || {
      id: key,
      label,
      totalSales: 0,
      totalRevenue: 0,
      totalRemaining: 0,
      riskCount: 0,
      conversionRate: null,
    };
    r.totalSales = Number(r.totalSales) + 1;
    r.totalRevenue = cents(Number(r.totalRevenue) + s.amount);
    r.totalRemaining = cents(Number(r.totalRemaining) + remaining(s));
    const invalidDue = installments.some((i) => i.saleId === s.id && !i.date && i.balance > 0);
    r.riskCount =
      r.riskCount == null || invalidDue ? null : Number(r.riskCount) + overdue(s).length;
    grouped.set(key, r);
    const riskMeasure = [
      'installment-risk',
      'advisor-revenue-risk',
      'unpaid-balance-heavy',
      'contract-expiry-revenue-risk',
    ].includes(slug);
    if (s.date)
      trend.set(s.date, (trend.get(s.date) || 0) + (riskMeasure ? remaining(s) : s.amount));
  }
  let rows = [...grouped.values()];
  let notice =
    'Yerel satış tutarı ve bakiye toplamları. Risk sayısı: vadesi geçmiş ödenmemiş taksit adedi; servis risk puanı değildir. Danışman kaydı yoksa mevcut öğrenci danışmanı kullanılır.';
  let trendTitle = [
    'installment-risk',
    'advisor-revenue-risk',
    'unpaid-balance-heavy',
    'contract-expiry-revenue-risk',
  ].includes(slug)
    ? 'Satış tarihine göre kalan tutar'
    : 'Satış tarihine göre satış tutarı';
  if (slug === 'revenue-forecast-trend') {
    trend.clear();
    const ids = new Set(split.included.map((s) => s.id));
    for (const i of installments.filter((i) => ids.has(i.saleId) && i.balance > 0 && i.date))
      trend.set(i.date, (trend.get(i.date) || 0) + i.balance);
    trendTitle = 'Vadeye göre tahsil edilmemiş ödeme planı';
    notice += ' Tahmin grafiği kayıtlı vade planıdır; gerçekleşmiş gelir değildir.';
  }
  if (slug === 'conversion-funnel') {
    // A real, explicitly labeled local linked-student cohort. Server funnel formula remains separate.
    const met = new Set(
      state.meetings.filter((m) => within(m.createdAt, f)).map((m) => m.studentId),
    );
    const booked = new Set(
      state.events
        .filter(
          (e) =>
            e.type === 'meeting' &&
            e.status !== 'cancelled' &&
            e.studentId != null &&
            e.startTime &&
            within(e.startTime, f),
        )
        .map((e) => e.studentId!),
    );
    const buyers = new Set(sales.filter((s) => s.status === 'completed').map((s) => s.studentId));
    const linkedBooked = new Set([...booked].filter((id) => met.has(id))),
      linkedBuyers = new Set([...buyers].filter((id) => linkedBooked.has(id)));
    const counts = [met.size, linkedBooked.size, linkedBuyers.size],
      labels = [
        'Görüşülen öğrenciler',
        'Bu grupta randevulu öğrenciler',
        'Bu grupta tamamlanan satışı olan öğrenciler',
      ];
    rows = counts
      .map((n, i) => ({
        id: String(i),
        label: labels[i],
        totalSales: n,
        totalRevenue: null,
        totalRemaining: null,
        riskCount: null,
        conversionRate: i === 0 ? null : counts[i - 1] ? (100 * n) / counts[i - 1] : null,
      }))
      .filter((r) => normalized(r.label).includes(normalized(f.search)));
    trend.clear();
    notice =
      'Yerel dönüşüm: aynı dönemde görüşmesi olan benzersiz öğrenciler → bunlardan kayıtlı randevusu olanlar → bunlardan tamamlanmış satışı olanlar. Oran bir önceki aşamaya göredir; zaman sırası doğrulanmış servis hunisi değildir. Durum/ödeme filtreleri satış aşamasına uygulanır.';
  }
  const out = result(rows, unknown, missing, notice, f);
  out.trend = [...trend].sort(([a], [b]) => a.localeCompare(b));
  out.trendTitle = trendTitle;
  return out;
}
