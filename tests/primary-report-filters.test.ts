import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  primaryFilteredRows,
  relationOptions,
  UNKNOWN_RELATION,
} from '../src/features/finance/primary-report-filters.ts';
import {
  primaryReportRows,
  accountingTotals,
} from '../src/features/finance/primary-report-model.ts';
import { financeSummary } from '../src/features/insights/report-model.ts';
const f = {
  search: '',
  startDate: '2026-09-01',
  endDate: '2026-09-30',
  status: [],
  paymentType: [],
  type: [],
  advisorId: 'all',
  education: 'all',
  pricing: 'all',
  categoryId: 'all',
  transactionMode: 'all',
  sort: 'date',
  order: 'desc',
};
const rows = [
  {
    id: '1',
    title: 'A',
    date: '2026-09-05',
    amount: 100,
    advisorId: 'a1',
    advisor: 'Same',
    educationId: 'e1',
    course: 'English',
    planId: 'p1',
  },
  {
    id: '2',
    title: 'B',
    date: '2026-09-06',
    amount: 200,
    advisorId: 'a2',
    advisor: 'Same',
    educationId: 'e2',
    course: 'English',
    planId: 'p2',
  },
  {
    id: '3',
    title: 'C',
    date: '2026-09-07',
    amount: 300,
    advisor: 'Same',
    course: 'English',
  },
];
test('identity options preserve distinct same-name IDs and explicit missing relation', () => {
  const opts = relationOptions(rows, 'advisorId', 'advisor');
  assert.equal(opts.length, 3);
  assert.ok(opts.some((o) => o.value === 'a1'));
  assert.ok(opts.some((o) => o.value === 'a2'));
  assert.ok(opts.some((o) => o.value === UNKNOWN_RELATION));
  assert.notEqual(opts[0].label, opts[1].label);
});
test('education filter uses canonical ID not course name and preserves unknown count', () => {
  const p = primaryFilteredRows(rows, 'sales', { ...f, education: 'e1' });
  assert.deepEqual(
    p.rows.map((r) => r.id),
    ['1'],
  );
  assert.equal(p.unknown, 1);
  assert.deepEqual(
    primaryFilteredRows(rows, 'sales', {
      ...f,
      education: UNKNOWN_RELATION,
    }).rows.map((r) => r.id),
    ['3'],
  );
});
test('route-inapplicable hidden filters cannot empty collections; advisor missing is inspectable', () => {
  const p = primaryFilteredRows(rows, 'collections', {
    ...f,
    education: 'wrong',
    categoryId: 'wrong',
    status: ['cancelled'],
    advisorId: 'a2',
  });
  assert.deepEqual(
    p.rows.map((r) => r.id),
    ['2'],
  );
  assert.equal(p.unknown, 1);
});
test('partial category coverage filters known IDs without blanket blocking or name matching', () => {
  const ledger = rows.map((r, i) => ({
    ...r,
    type: 'EXPENSE' as const,
    category: 'Shared',
    categoryId: i === 0 ? 'c1' : i === 1 ? 'c2' : undefined,
    status: 'Ödendi',
  }));
  const p = primaryFilteredRows(ledger, 'accounting', {
    ...f,
    categoryId: 'c2',
  });
  assert.deepEqual(
    p.rows.map((r) => r.id),
    ['2'],
  );
  assert.equal(p.unknown, 1);
  assert.equal(accountingTotals(p.rows).expenses, 200);
});
const sale = {
  id: 's',
  studentId: 1,
  course: 'English',
  amount: 1000,
  method: 'CASH',
  installments: 1,
  discount: 0,
  date: '2026-09-02',
  advisorId: 'advisor-real',
  educationId: 'edu-real',
  pricingId: 'price-real',
  status: 'completed',
  startDate: '2026-09-01',
  endDate: null,
  discountedAmount: 50,
};
const state = {
  branch: 'A',
  students: [{ id: 1, name: 'A', advisor: 'Display only' }],
  settings: {},
  sales: [sale, { ...sale, id: 'old', date: '2026-08-01', amount: 500 }],
  receipts: [
    {
      id: 'r',
      saleId: 's',
      studentId: 1,
      amount: 200,
      date: '2026-09-06',
      method: 'CASH',
    },
  ],
} as any;
const ops = {
  plans: [{ id: 'price-real', name: 'Real plan' }],
  expenses: [
    {
      id: 'x',
      title: 'Expense',
      category: 'Name',
      categoryId: 'canonical-category',
      amount: 10,
      date: '2026-09-02',
      status: 'Ödendi',
    },
  ],
} as any;
test('primary rows propagate existing sale IDs and lifecycle and expense category IDs', () => {
  const s = primaryReportRows(state, ops, 'sales')[0];
  assert.equal(s.educationId, 'edu-real');
  assert.equal(s.planId, 'price-real');
  assert.equal(s.status, 'completed');
  assert.equal(s.endDate, null);
  assert.equal(s.discountAmount, 50);
  assert.equal(primaryReportRows(state, ops, 'collections')[0].advisorId, 'advisor-real');
  assert.equal(
    primaryReportRows(state, ops, 'accounting').find((r) => r.sourceType === 'EXPENSE')?.categoryId,
    'canonical-category',
  );
});
test('period balance and explicit all-time balance retain separate meanings', () => {
  const s = financeSummary(state, '2026-09');
  assert.equal(s.balance, 800);
  assert.equal(s.allTimeBalance, 1300);
  assert.equal(s.collected, 200);
});
