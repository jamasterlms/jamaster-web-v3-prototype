import assert from 'node:assert/strict';
import test from 'node:test';
import type { Receipt, Sale } from '../src/features/finance/finance-model.ts';
import {
  applyLifecycleCommand,
  lifecycleCommandIssue,
  saleLifecycleRevision,
  transferInvariant,
} from '../src/features/finance/sale-lifecycle.ts';

const sale: Sale = {
  id: 'sale-1',
  studentId: 1,
  course: 'İngilizce',
  planId: 'plan-a',
  pricingId: 'plan-a',
  amount: 1000,
  method: 'Nakit',
  installments: 2,
  discount: 0,
  date: '2026-01-01',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  educationStatus: 'active',
};
const receipts: Receipt[] = [
  {
    id: 'receipt-1',
    saleId: sale.id,
    studentId: 1,
    amount: 250,
    method: 'Nakit',
    date: '2026-02-01',
  },
];
const context = {
  id: 'transfer-1',
  now: '2026-09-14T10:00:00.000Z',
  branchId: 'New York',
  actor: 'Demo kullanıcı',
};

test('transfer invariant uses minor units and never exceeds unpaid balance', () => {
  assert.deepEqual(transferInvariant(sale, receipts, 750), {
    paid: 250,
    outstanding: 750,
    issue: null,
  });
  assert.match(transferInvariant(sale, receipts, 750.01).issue || '', /aşamaz/);
  assert.match(transferInvariant(sale, receipts, 1.001).issue || '', /ondalıklı/);
});

test('STUDENT, PERIOD and BOTH require only their source-specific targets', () => {
  const common = { kind: 'transfer' as const, transferredAmount: 100, reason: '' };
  assert.equal(
    lifecycleCommandIssue(
      sale,
      { ...common, transferType: 'STUDENT', toStudentId: 2 },
      [1, 2],
      ['plan-a', 'plan-b'],
      receipts,
    ),
    null,
  );
  assert.equal(
    lifecycleCommandIssue(
      sale,
      { ...common, transferType: 'PERIOD', toPricingId: 'plan-b' },
      [1, 2],
      ['plan-a', 'plan-b'],
      receipts,
    ),
    null,
  );
  assert.equal(
    lifecycleCommandIssue(
      sale,
      { ...common, transferType: 'BOTH', toStudentId: 2, toPricingId: 'plan-b' },
      [1, 2],
      ['plan-a', 'plan-b'],
      receipts,
    ),
    null,
  );
  assert.match(
    lifecycleCommandIssue(
      sale,
      { ...common, transferType: 'BOTH', toStudentId: 2 },
      [1, 2],
      ['plan-a', 'plan-b'],
      receipts,
    ) || '',
    /dönem/,
  );
});

test('local transfer records pending metadata without mutating financial fields or receipts', () => {
  const beforeReceipts = structuredClone(receipts);
  const next = applyLifecycleCommand(
    sale,
    {
      kind: 'transfer',
      transferType: 'BOTH',
      toStudentId: 2,
      toPricingId: 'plan-b',
      transferredAmount: 400,
      reason: 'Dönem değişikliği',
    },
    context,
    receipts,
  );
  assert.equal(next.amount, sale.amount);
  assert.equal(next.studentId, sale.studentId);
  assert.equal(next.pricingId, sale.pricingId);
  assert.equal(next.educationStatus, sale.educationStatus);
  assert.deepEqual(receipts, beforeReceipts);
  assert.deepEqual(next.transfers?.[0], {
    id: 'transfer-1',
    originalSaleId: 'sale-1',
    newSaleId: null,
    fromStudentId: '1',
    toStudentId: '2',
    fromPricingId: 'plan-a',
    toPricingId: 'plan-b',
    transferType: 'BOTH',
    transferredAmount: '400.00',
    paidAmount: '250.00',
    reason: 'Dönem değişikliği',
    status: 'pending',
    branchId: 'New York',
    transferredBy: 'Demo kullanıcı',
    createdAt: context.now,
    updatedAt: context.now,
  });
});

test('freeze records source dates without inventing freezeDays or extending the sale end date', () => {
  const previouslyFrozen = { ...sale, frozenDays: '12', freezes: [] };
  const next = applyLifecycleCommand(
    previouslyFrozen,
    {
      kind: 'freeze',
      freezeStartDate: '2026-09-01',
      freezeEndDate: '2026-09-10',
      note: 'Ara',
    },
    { ...context, id: 'freeze-1' },
    receipts,
  );
  assert.equal(next.endDate, sale.endDate);
  assert.equal(next.frozenDays, '12');
  assert.equal(next.freezes?.[0].freezeDays, null);
  assert.equal(next.freezes?.[0].newEndDate, null);
  assert.equal(next.freezes?.[0].originalEndDate, sale.endDate);
  assert.equal(next.freezes?.[0].reason, 'Ara');
});

test('unfreeze date cannot precede the active freeze and the chosen date is retained', () => {
  const frozen = applyLifecycleCommand(
    sale,
    {
      kind: 'freeze',
      freezeStartDate: '2026-09-01',
      freezeEndDate: '2026-09-30',
      note: '',
    },
    { ...context, id: 'freeze-1' },
    receipts,
  );
  assert.match(
    lifecycleCommandIssue(
      frozen,
      { kind: 'unfreeze', effectiveDate: '2026-08-31', note: '' },
      [1, 2],
      ['plan-a'],
      receipts,
    ) || '',
    /başlangıç/,
  );
  const unfrozen = applyLifecycleCommand(
    frozen,
    { kind: 'unfreeze', effectiveDate: '2026-09-10', note: '' },
    { ...context, id: 'unfreeze-1' },
    receipts,
  );
  assert.equal(unfrozen.freezes?.[0].unfrozenAt, '2026-09-10T00:00:00.000Z');
  assert.equal(unfrozen.freezes?.[0].unfrozenBy, context.actor);
  assert.equal(unfrozen.freezes?.[0].status, 'completed');
});

test('a pending transfer blocks duplicate drafts without changing financial state', () => {
  const first = applyLifecycleCommand(
    sale,
    {
      kind: 'transfer',
      transferType: 'STUDENT',
      toStudentId: 2,
      transferredAmount: 100,
      reason: '',
    },
    context,
    receipts,
  );
  assert.match(
    lifecycleCommandIssue(
      first,
      {
        kind: 'transfer',
        transferType: 'STUDENT',
        toStudentId: 2,
        transferredAmount: 100,
        reason: '',
      },
      [1, 2],
      ['plan-a'],
      receipts,
    ) || '',
    /bekleyen/,
  );
  assert.equal(first.amount, sale.amount);
});

test('lifecycle revision changes for same-status concurrent edits', () => {
  const next = applyLifecycleCommand(
    sale,
    { kind: 'endDate', effectiveDate: '2026-09-14', endDate: '2027-01-31', note: '' },
    { ...context, id: 'date-1' },
    receipts,
  );
  assert.notEqual(saleLifecycleRevision(next), saleLifecycleRevision(sale));
});

test('workspace reducer rejects replayed lifecycle action even when education status is unchanged', async () => {
  const { workspaceReducer } = await import('../src/app/workspace-reducer.ts');
  const nextSale = applyLifecycleCommand(
    sale,
    {
      kind: 'transfer',
      transferType: 'STUDENT',
      toStudentId: 2,
      transferredAmount: 100,
      reason: '',
    },
    context,
    receipts,
  );
  const student = {
    id: 1,
    name: 'Ada',
    email: 'ada@example.com',
    phone: '05550000000',
    course: 'İngilizce',
    group: '',
    teacher: '',
    date: '2026-01-01',
    type: '',
    status: 'Aktif',
    payment: 'Bekliyor',
    amount: 1000,
    attendance: 0,
    color: '#000',
  };
  const state = {
    students: [student],
    events: [],
    meetings: [],
    attendance: {},
    sales: [sale],
    receipts,
    moduleRows: {},
    branch: 'New York',
    privacy: false,
    chat: [],
    settings: {},
  };
  const action = {
    type: 'sale/lifecycle' as const,
    sale: nextSale,
    expectedRevision: saleLifecycleRevision(sale),
  };
  const applied = workspaceReducer(state, action);
  assert.equal(applied.sales?.[0].transfers?.length, 1);
  assert.strictEqual(workspaceReducer(applied, action), applied);
});
