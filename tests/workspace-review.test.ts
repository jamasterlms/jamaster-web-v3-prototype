import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyPreview, openPreview, movePreview } from '../src/features/entities/preview-model.ts';
import { tabDensity } from '../src/app/navigation/tab-density.ts';
import { sourceRedirect } from '../src/app/navigation/source-redirects.ts';
import {
  changePermission,
  normalizePermissions,
  setManager,
  permissionResources,
} from '../src/features/administration/permissions-model.ts';
import { salaryPaymentIssue, type SalaryRecord } from '../src/features/payroll/payroll-model.ts';
import { activitySchema } from '../src/features/activities/activity-model.ts';
import {
  educationProjection,
  salesProjection,
  type LeafFilters,
} from '../src/features/insights/leaf-projection.ts';
import {
  educationLeafDefinitions,
  salesLeafDefinitions,
} from '../src/features/insights/leaf-definitions.ts';
import type { WorkspaceState } from '../src/app/workspace-reducer.ts';
import { initialOperations } from '../src/features/operations/model.ts';
const a = { kind: 'students', id: '1' } as const,
  b = { kind: 'students', id: '2' } as const,
  c = { kind: 'teachers', id: '1' } as const;
test('Preview follows sorted filtered records; boundaries, duplicate records and branching history stay valid', () => {
  const initial = openPreview(emptyPreview, b, [a, b, a]);
  assert.deepEqual(initial, { items: [a, b], index: 1 });
  assert.equal(movePreview(initial, 1), initial);
  const back = movePreview(initial, -1);
  assert.equal(movePreview(back, -1), back);
  assert.deepEqual(openPreview(back, c), { items: [a, c], index: 1 });
  assert.equal(openPreview(initial, b), initial);
  let history = emptyPreview;
  for (let i = 0; i < 130; i++) history = openPreview(history, { kind: 'students', id: String(i) });
  assert.equal(history.items.length, 100);
  assert.equal(history.index, 99);
  assert.equal(history.items[0].id, '30');
});
test('Working tabs progressively remove icons, padding and then reduce type', () => {
  assert.equal(tabDensity(3, 60), 0);
  assert.equal(tabDensity(6, 100), 1);
  assert.equal(tabDensity(9, 100), 2);
  assert.equal(tabDensity(12, 100), 3);
  assert.equal(tabDensity(5, 32), 3);
});
test('Source aliases retain repeated filters and force only their target view', () => {
  const result = sourceRedirect(
    '/admin/students/abc%2F123/installments',
    '?status=a&status=b&tab=old&secondTab=unpaid&secondTab=paid&page=2',
  );
  const url = new URL(result!, 'https://app.test');
  assert.equal(url.pathname, '/admin/students/abc%2F123/payments');
  assert.deepEqual(url.searchParams.getAll('status'), ['a', 'b']);
  assert.equal(url.searchParams.get('tab'), 'installments');
  assert.equal(url.searchParams.get('installmentsTab'), 'unpaid');
  assert.equal(url.searchParams.has('secondTab'), false);
  assert.equal(url.searchParams.get('page'), '2');
  assert.equal(
    sourceRedirect('/admin/teachers/t1/schedule', '?tab=audit'),
    '/admin/teachers/t1/history?tab=schedule',
  );
  assert.equal(sourceRedirect('/admin/students/1/documents'), null);
  assert.equal(sourceRedirect('/en/student/dashboard'), '/student/dashboard');
});
test('Permission edits imply view, preserve other resources, and manager mode is reversible', () => {
  assert.equal(Object.keys(permissionResources).length, 30);
  const permissions = changePermission(['groups.view'], 'students', 'edit', true);
  assert.deepEqual(permissions, ['groups.view', 'students.edit', 'students.view']);
  assert.deepEqual(changePermission(permissions, 'students', 'view', false), permissions);
  assert.deepEqual(normalizePermissions(['unknown.delete', 'students.edit', 'students.edit']), [
    'students.edit',
    'students.view',
  ]);
  const manager = setManager({ branchId: 'b1', permissions: [], isManager: false }, true);
  assert.equal(manager.permissions.length, 120);
  assert.deepEqual(setManager(manager, false), {
    branchId: 'b1',
    permissions: [],
    isManager: false,
  });
});
test('Payroll rejects overpayment, invalid calendar dates, future dates and cancelled records', () => {
  const row: SalaryRecord = {
    id: 's1',
    personId: 't1',
    kind: 'teacher',
    name: 'Öğretmen',
    totalAmount: 1000,
    paidAmount: 750,
    dueDate: '2026-01-01',
    salaryType: 'MONTHLY',
    status: 'PARTIALLY_PAID',
  };
  assert.equal(salaryPaymentIssue(row, 250, '2026-01-01'), null);
  for (const [amount, date] of [
    [251, '2026-01-01'],
    [NaN, '2026-01-01'],
    [0, '2026-01-01'],
    [1, '2026-02-31'],
    [1, '2099-01-01'],
  ] as const)
    assert.ok(salaryPaymentIssue(row, amount, date));
  assert.ok(salaryPaymentIssue({ ...row, status: 'CANCELLED' }, 1, '2026-01-01'));
});
test('Activity draft validates required group, scoring and date fields without inventing submission values', () => {
  const value = {
    id: 'a1',
    title: 'Okuma',
    type: 'READING',
    groupId: 'g1',
    gradingMethod: 'POINTS',
    maxPoints: 100,
    description: '',
    allowLateSubmission: false,
    status: 'DRAFT',
    createdAt: '2026-09-10',
    updatedAt: '2026-09-10',
  };
  assert.ok(activitySchema.safeParse(value).success);
  assert.ok(!activitySchema.safeParse({ ...value, groupId: '' }).success);
  assert.ok(!activitySchema.safeParse({ ...value, maxPoints: 0 }).success);
  assert.ok(
    !activitySchema.safeParse({
      ...value,
      gradingMethod: 'PERCENTAGE',
      maxPoints: 50,
    }).success,
  );
  assert.ok(!activitySchema.safeParse({ ...value, dueDate: 'bad' }).success);
});
const filters: LeafFilters = {
  search: '',
  status: [],
  paymentType: [],
  startDate: '2026-09-01',
  endDate: '2026-09-30',
  sort: 'totalRevenue',
  order: 'desc',
};
const seed = {
  students: [
    {
      id: 1,
      name: 'Ada',
      email: 'ada@school.test',
      advisor: 'Derya',
      date: '2026-09-01',
      status: 'Aktif',
      group: 'g1',
      amount: 0,
    },
  ],
  events: [],
  meetings: [],
  attendance: {},
  moduleRows: {},
  branch: 'A',
  privacy: false,
  chat: [],
  settings: {},
  sales: [
    {
      id: 's1',
      studentId: 1,
      course: 'İngilizce',
      amount: 1000,
      method: 'Nakit',
      installments: 1,
      discount: 10,
      date: '2026-09-02',
    },
    {
      id: 's2',
      studentId: 1,
      course: 'İngilizce',
      amount: 500,
      method: 'Kredi kartı',
      installments: 1,
      discount: 0,
      date: '2026-08-01',
    },
  ],
  receipts: [
    {
      id: 'r1',
      saleId: 's1',
      studentId: 1,
      amount: 200,
      method: 'Havale / EFT',
      date: '2026-09-04',
    },
  ],
} as unknown as WorkspaceState;
test('Source report definitions cover 24 education and 18 sales leaves', () => {
  assert.equal(Object.keys(educationLeafDefinitions).length, 24);
  assert.equal(Object.keys(salesLeafDefinitions).length, 18);
});
test('Sales channel and discount reports use sales, period totals and advisor attribution rather than receipt methods', () => {
  const result = salesProjection(seed, initialOperations, 'payment-method-performance', filters);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].label, 'Nakit');
  assert.equal(result.rows[0].totalSales, 1);
  assert.equal(result.rows[0].totalRevenue, 1000);
  assert.equal(result.rows[0].totalRemaining, 800);
  const missingDiscount = salesProjection(seed, initialOperations, 'discount-impact', filters);
  assert.equal(missingDiscount.rows.length, 0);
  assert.equal(missingDiscount.unknown, 1);
  const documentedSale = {
    ...seed,
    sales: seed.sales!.map((s) =>
      s.id === 's1' ? { ...s, listAmount: 1100, discountedAmount: 100 } : s,
    ),
  };
  assert.equal(
    salesProjection(documentedSale, initialOperations, 'discount-impact', filters).rows[0].label,
    'Derya',
  );
  const statusUnknown = salesProjection(seed, initialOperations, 'payment-method-performance', {
    ...filters,
    status: ['completed'],
  });
  assert.equal(statusUnknown.rows.length, 0);
  assert.equal(statusUnknown.unknown, 1);
  const completed = {
    ...seed,
    sales: seed.sales!.map((s) => (s.id === 's1' ? { ...s, status: 'completed' as const } : s)),
  };
  assert.equal(
    salesProjection(completed, initialOperations, 'payment-method-performance', {
      ...filters,
      status: ['completed'],
    }).rows[0].totalRemaining,
    800,
  );
});
test('Recent absence does not flag a student who also attended; imported unresolved groups are not unassigned', () => {
  const session = {
    id: 'poll',
    branch: 'A',
    eventId: 1,
    groupId: 'g1',
    groupName: 'G',
    date: '2026-09-01',
    time: '09:00',
    title: 'Ders',
    marks: { 1: 'absent' as const },
    updatedAt: '2026-09-01',
  };
  const state = {
    ...seed,
    // This test concerns one explicit active enrollment, not ambiguous multi-sale rollups.
    sales: [{ ...seed.sales![0], educationStatus: 'active' as const }],
    attendanceSessions: [
      session,
      {
        ...session,
        id: 'poll2',
        date: '2026-09-03',
        marks: { 1: 'present' as const },
      },
    ],
  };
  const membership = {
    memberships: [],
    history: [],
    unresolved: [{ studentId: 1, groupName: 'Eski grup' }],
  };
  assert.equal(
    educationProjection(state, membership, 'no-attendance-recently', filters).rows.length,
    0,
  );
  assert.equal(
    educationProjection(state, membership, 'active-unassigned-students', filters).rows.length,
    0,
  );
  assert.equal(
    educationProjection({ ...state, sales: seed.sales }, membership, 'active-students', filters)
      .unknown,
    1,
  );
  const row = educationProjection(state, membership, 'active-students', filters).rows[0];
  assert.equal(row.attendanceRate, 50);
  assert.equal(row.lastAttendanceAt, '2026-09-03');
  assert.equal(row.saleStatus, null);
  assert.equal(row.activeGroupCount, null);
});

import {
  primaryReportRows,
  accountingTotals,
} from '../src/features/finance/primary-report-model.ts';
import { workspaceReducer } from '../src/app/workspace-reducer.ts';
test('Primary finance reports keep bills separate, installment receipts linked and recurring plans outside actual cash totals', () => {
  const state = {
    students: [{ id: 1, name: 'A', advisor: 'Danışman' }],
    settings: {},
    sales: [
      {
        id: 's1',
        studentId: 1,
        course: 'İngilizce',
        amount: 200,
        method: 'BANK_TRANSFER',
        installments: 2,
        discount: 0,
        date: '2026-09-01',
        dueDates: ['2026-09-02', '2026-10-02'],
      },
    ],
    receipts: [
      {
        id: 'r1',
        saleId: 's1',
        studentId: 1,
        amount: 20,
        method: 'CASH',
        date: '2026-09-02',
        installmentId: 's1:0',
      },
    ],
  } as unknown as WorkspaceState;
  const ops = {
    ...initialOperations,
    expenses: [
      {
        id: 'e1',
        title: 'Kira',
        category: 'Ofis',
        amount: 10,
        date: '2026-09-01',
        status: 'Ödendi',
        note: '',
        type: 'EXPENSE',
        transactionMode: 'ONE_TIME',
      },
      {
        id: 'e2',
        title: 'Aylık plan',
        category: 'Ofis',
        amount: 1000,
        date: '2026-09-01',
        status: 'Ödendi',
        note: '',
        type: 'EXPENSE',
        transactionMode: 'RECURRING',
      },
      {
        id: 'e3',
        title: 'Diğer gelir',
        category: 'Diğer',
        amount: 5,
        date: '2026-09-01',
        status: 'Ödendi',
        note: '',
        type: 'INCOME',
        transactionMode: 'ONE_TIME',
      },
    ],
  } as typeof initialOperations;
  assert.deepEqual(primaryReportRows(state, ops, 'bills'), []);
  const collected = primaryReportRows(state, ops, 'collections')[0];
  assert.equal(collected.method, 'CASH');
  assert.equal(collected.sourceType, 'INSTALLMENT');
  assert.match(collected.href!, /tab=installments&installmentId=s1%3A0/);
  const overdue = primaryReportRows(state, ops, 'overdue-receivables', '2026-09-10');
  assert.equal(overdue.length, 1);
  assert.equal(overdue[0].amount, 100);
  assert.equal(overdue[0].balance, 80);
  assert.equal(overdue[0].daysOverdue, 8);
  assert.equal(overdue[0].method, 'BANK_TRANSFER');
  assert.deepEqual(accountingTotals(primaryReportRows(state, ops, 'accounting')), {
    income: 5,
    expenses: 10,
    collections: 20,
    net: 15,
  });
});
test('Entity notes preserve creation time, reject stale edits/deletes and cannot change their target', () => {
  const note = {
    id: 'n1',
    targetType: 'student' as const,
    targetId: '1',
    title: 'Takip',
    content: 'Öğrenci görüşmesi',
    createdAt: '2026-09-01T09:00:00Z',
    updatedAt: '2026-09-02T09:00:00Z',
  };
  const state = { entityNotes: [note] } as WorkspaceState;
  assert.equal(
    workspaceReducer(state, {
      type: 'entity-note/save',
      note: { ...note, title: 'Eski değişiklik' },
      expectedUpdatedAt: 'old',
    }),
    state,
  );
  assert.equal(
    workspaceReducer(state, {
      type: 'entity-note/save',
      note: { ...note, targetId: '2' },
      expectedUpdatedAt: note.updatedAt,
    }),
    state,
  );
  const updated = workspaceReducer(state, {
    type: 'entity-note/save',
    note: {
      ...note,
      title: 'Yeni görüşme',
      createdAt: 'wrong',
      updatedAt: '2026-09-03T09:00:00Z',
    },
    expectedUpdatedAt: note.updatedAt,
  });
  assert.equal(updated.entityNotes?.[0].createdAt, note.createdAt);
  assert.equal(
    workspaceReducer(updated, {
      type: 'entity-note/delete',
      id: note.id,
      targetType: 'student',
      targetId: '1',
      expectedUpdatedAt: note.updatedAt,
    }).entityNotes?.length,
    1,
  );
  assert.equal(
    workspaceReducer(updated, {
      type: 'entity-note/delete',
      id: note.id,
      targetType: 'student',
      targetId: '1',
      expectedUpdatedAt: '2026-09-03T09:00:00Z',
    }).entityNotes?.length,
    0,
  );
});

import { paymentMethodCode } from '../src/features/finance/finance-model.ts';
test('Payment report filters accept both canonical source codes and historical display labels', () => {
  for (const [input, expected] of [
    ['Havale / EFT', 'BANK_TRANSFER'],
    ['BANK_TRANSFER', 'BANK_TRANSFER'],
    ['Nakit', 'CASH'],
    ['CASH', 'CASH'],
    ['Kredi kartı', 'CREDIT_CARD_SINGLE'],
    ['IYZICO', 'IYZICO'],
    ['PROMISSORY_NOTE', 'PROMISSORY_NOTE'],
  ])
    assert.equal(paymentMethodCode(input), expected);
});
