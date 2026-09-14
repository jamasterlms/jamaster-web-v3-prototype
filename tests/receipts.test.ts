import test from 'node:test';
import assert from 'node:assert/strict';
import {
  installmentRows,
  validateReceipt,
  type Sale,
  type Receipt,
} from '../src/features/finance/finance-model.ts';
const sale: Sale = {
  id: 'sale',
  studentId: 1,
  course: 'İngilizce',
  amount: 100,
  installments: 3,
  discount: 0,
  method: 'Nakit',
  date: '2026-09-01',
  dueDates: ['2026-09-01', '2026-10-01', '2026-11-01'],
};
const receipt: Receipt = {
  id: 'receipt',
  saleId: 'sale',
  studentId: 1,
  amount: 10,
  date: '2026-09-08',
  method: 'Nakit',
};

test('targeted partial receipts affect only the selected installment and preserve pooled history', () => {
  const pooled = { ...receipt, id: 'old', amount: 40 };
  const targeted = { ...receipt, installmentId: 'sale:2', amount: 20 };
  const records = { sales: [sale], receipts: [pooled] };
  assert.equal(validateReceipt(targeted, records), null);
  const rows = installmentRows({ ...records, receipts: [pooled, targeted] });
  assert.deepEqual(
    rows.map((r) => r.paid),
    [33.34, 6.66, 20],
  );
  assert.deepEqual(
    rows.map((r) => r.balance),
    [0, 26.67, 13.33],
  );
  assert.equal(
    rows.reduce((n, r) => n + Math.round(r.paid * 100), 0),
    6000,
  );
});

test('a targeted receipt validates identity and installment balance, not just sale balance', () => {
  const records = {
    sales: [sale],
    receipts: [{ ...receipt, installmentId: 'sale:2', amount: 30 }],
  };
  assert.ok(validateReceipt({ ...receipt, installmentId: 'sale:2', amount: 4 }, records));
  assert.ok(validateReceipt({ ...receipt, installmentId: 'other:2' }, records));
  assert.equal(
    validateReceipt({ ...receipt, installmentId: 'sale:2', amount: 3.33 }, records),
    null,
  );
});

test('new bank transfers require an active matching account; disabled methods are rejected', () => {
  const records = { sales: [sale], receipts: [] };
  const account = {
    id: 'bank',
    bankName: 'Banka',
    accountHolder: 'Jamaster',
    accountNumber: '12345',
    iban: '',
    currency: 'TRY',
    isActive: true,
    isDefault: true,
  };
  const transfer = { ...receipt, method: 'Havale / EFT', bankAccountId: 'bank' };
  const settings = { bankAccounts: JSON.stringify([account]) };
  assert.equal(validateReceipt(transfer, records, settings), null);
  assert.ok(validateReceipt(transfer, records, { bankAccounts: '[]' }));
  assert.ok(
    validateReceipt(transfer, records, {
      bankAccounts: JSON.stringify([{ ...account, isActive: false }]),
    }),
  );
  assert.ok(
    validateReceipt(transfer, records, {
      bankAccounts: JSON.stringify([{ ...account, currency: 'EUR' }]),
    }),
  );
  assert.ok(validateReceipt(receipt, records, { 'payment:Nakit ödeme': 'false' }));
});
