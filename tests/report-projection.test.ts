import { test } from 'node:test';
import assert from 'node:assert/strict';
import { educationProjection, salesProjection } from '../src/features/insights/leaf-projection.ts';
import { emptyReportCriteria } from '../src/features/insights/report-criteria.ts';
const memberships = { memberships: [], history: [], unresolved: [] };
const filters = {
  search: '',
  status: [],
  paymentType: [],
  startDate: '2026-09-01',
  endDate: '2026-09-14',
  sort: 'createdAt',
  order: 'desc',
};
const student = {
  id: 1,
  name: 'Ada',
  email: 'ada@example.test',
  date: '2026-09-01',
  status: 'Aktif',
  advisor: 'Ece',
};
const sale = {
  id: 's1',
  studentId: 1,
  course: 'English',
  amount: 1000,
  method: 'CASH',
  installments: 2,
  discount: 0,
  date: '2026-09-02',
  dueDates: ['2026-09-01', '2026-09-10'],
};
function state(extra = {}) {
  return {
    branch: 'A',
    students: [student],
    sales: [sale],
    receipts: [],
    attendanceSessions: [],
    meetings: [],
    events: [],
    settings: {},
    ...extra,
  } as any;
}
function settings(value = {}) {
  return {
    'report-data:A': JSON.stringify({
      version: 1,
      criteria: { ...emptyReportCriteria },
      sales: {},
      students: {},
      ...value,
    }),
  };
}
const ops = { plans: [] } as any;
test('risk threshold remains unknown until set and unrounded rate drives decisions', () => {
  const s = state({
    attendanceSessions: [
      { branch: 'A', date: '2026-09-03', marks: { 1: 'present' } },
      { branch: 'A', date: '2026-09-04', marks: { 1: 'absent' } },
    ],
  });
  assert.equal(
    educationProjection(s, memberships, 'attendance-risk-students', filters).criteriaMissing.length,
    1,
  );
  s.settings = settings({
    criteria: { ...emptyReportCriteria, attendanceLowBelow: 50 },
  });
  assert.equal(
    educationProjection(s, memberships, 'attendance-risk-students', filters).rows.length,
    0,
  );
  s.settings = settings({
    criteria: { ...emptyReportCriteria, attendanceLowBelow: 50.1 },
  });
  assert.equal(
    educationProjection(s, memberships, 'attendance-risk-students', filters).rows.length,
    1,
  );
});
test('never attended inspects lifetime, no recent attendance uses period', () => {
  const s = state({
    attendanceSessions: [
      { branch: 'A', date: '2026-08-01', marks: { 1: 'present' } },
      { branch: 'A', date: '2026-09-04', marks: { 1: 'absent' } },
    ],
    settings: settings({
      students: { 1: { attendanceHistoryComplete: true } },
    }),
  });
  assert.equal(
    educationProjection(s, memberships, 'never-attended-students', filters).rows.length,
    0,
  );
  assert.equal(
    educationProjection(s, memberships, 'no-attendance-recently', filters).rows.length,
    1,
  );
});
test('missing bonus never becomes zero; verified zero can qualify', () => {
  const s = state();
  assert.equal(educationProjection(s, memberships, 'zero-bonus-remaining', filters).unknown, 1);
  s.sales[0] = { ...s.sales[0], remainingBonusCount: 0, usedBonusCount: 2 };
  assert.equal(educationProjection(s, memberships, 'zero-bonus-remaining', filters).rows.length, 1);
});
test('frozen student without end date is a reactivation candidate', () => {
  const s = state({ students: [{ ...student, status: 'Dondurulmuş' }] });
  assert.equal(
    educationProjection(s, memberships, 'reactivation-candidates', filters).rows.length,
    1,
  );
});
test('partial receipt does not change sale lifecycle; risky sale counted once for two overdue installments', () => {
  const s = state({
    receipts: [
      {
        id: 'r1',
        saleId: 's1',
        studentId: 1,
        amount: 100,
        date: '2026-09-03',
        method: 'CASH',
      },
    ],
  });
  const risk = salesProjection(s, ops, 'installment-risk', filters, '2026-09-14');
  assert.equal(risk.rows[0].totalSales, 1);
  assert.equal(risk.rows[0].riskCount, 2);
  assert.equal(risk.rows[0].totalRemaining, 900);
  assert.equal(salesProjection(s, ops, 'pending-sales', filters).unknown, 1);
  s.sales[0] = { ...s.sales[0], status: 'completed' };
  assert.equal(salesProjection(s, ops, 'completed-sales', filters).rows[0].totalRemaining, 900);
});
test('legacy discount zero is unknown; full discount metadata enables no-discount cohort', () => {
  const s = state();
  assert.equal(salesProjection(s, ops, 'no-discount-sales', filters).unknown, 1);
  s.sales[0] = { ...s.sales[0], listAmount: 1000, discountedAmount: 0 };
  assert.equal(salesProjection(s, ops, 'no-discount-sales', filters).rows[0].totalSales, 1);
});
test('unknown due date produces unknown risk count, never zero', () => {
  const s = state({ sales: [{ ...sale, dueDates: undefined }] });
  assert.equal(salesProjection(s, ops, 'sales-by-advisor', filters).rows[0].riskCount, null);
  assert.equal(salesProjection(s, ops, 'installment-risk', filters).unknown, 1);
});
test('source-like sale metadata supports configured high discount and expiry', () => {
  const s = state({
    settings: settings({
      criteria: {
        ...emptyReportCriteria,
        highDiscountAtLeastPercent: 10,
        endingWithinDays: 20,
      },
      sales: {
        s1: {
          listAmount: 1250,
          discountedAmount: 250,
          endDate: '2026-09-30',
          educationStatus: 'active',
        },
      },
    }),
  });
  s.sales[0] = {
    ...s.sales[0],
    listAmount: 1250,
    discountedAmount: 250,
    endDate: '2026-09-30',
    educationStatus: 'active',
  };
  assert.equal(salesProjection(s, ops, 'high-discount-sales', filters).rows.length, 1);
  assert.equal(
    salesProjection(s, ops, 'expiring-soon-sales', filters, '2026-09-14').rows.length,
    1,
  );
});

import {
  educationLeafDefinitions,
  salesLeafDefinitions,
} from '../src/features/insights/leaf-definitions.ts';
test('all 42 definitions have executable local projections without static unavailable gates', () => {
  assert.equal(Object.keys(educationLeafDefinitions).length, 24);
  assert.equal(Object.keys(salesLeafDefinitions).length, 18);
  for (const slug of Object.keys(educationLeafDefinitions))
    assert.equal(
      educationProjection(state(), memberships, slug, filters).unavailable,
      undefined,
      slug,
    );
  for (const slug of Object.keys(salesLeafDefinitions))
    assert.equal(salesProjection(state(), ops, slug, filters).unavailable, undefined, slug);
});
