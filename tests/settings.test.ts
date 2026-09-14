import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bankErrors,
  blankBankAccount,
  readBankAccounts,
  saveBankAccount,
} from '../src/features/settings/bank-model.ts';
import {
  branchDraft,
  branchSchema,
  branchToRow,
} from '../src/features/administration/branch-model.ts';

test('bank accounts preserve independent identities and exactly one selected default', () => {
  const first = {
    ...blankBankAccount(),
    id: 'a',
    bankName: 'Birinci Banka',
    accountHolder: 'Jamaster',
    accountNumber: '12345',
    currency: 'TRY',
    isDefault: true,
  };
  const second = { ...first, id: 'b', bankName: 'İkinci Banka', currency: 'EUR' };
  const saved = saveBankAccount([first], second);
  assert.equal(saved.length, 2);
  assert.equal(saved.find((v) => v.id === 'a')?.isDefault, false);
  assert.equal(saved.find((v) => v.id === 'b')?.isDefault, true);
  const edited = saveBankAccount(saved, { ...second, accountNumber: '98765' });
  assert.deepEqual(
    edited.map((v) => v.id),
    ['a', 'b'],
  );
  assert.equal(edited[0].accountNumber, '12345');
  assert.equal(edited[1].accountNumber, '98765');
});
test('bank migration does not resurrect a deleted last account', () => {
  const old = { bank: 'İş Bankası', accountNumber: '12345', bankCurrency: 'TRY' };
  assert.equal(readBankAccounts(old)[0].isActive, true);
  assert.deepEqual(readBankAccounts({ ...old, bankAccounts: '[]' }), []);
});
test('bank requirements keep optional IBAN distinct from a required currency', () => {
  const draft = {
    ...blankBankAccount(),
    bankName: 'Banka',
    accountHolder: 'Jamaster',
    accountNumber: '12345',
  };
  assert.deepEqual(Object.keys(bankErrors(draft)), ['currency']);
  assert.deepEqual(bankErrors({ ...draft, currency: 'TRY' }), {});
  assert.ok(bankErrors({ ...draft, currency: 'TRY', iban: 'TR123' }).iban);
});

test('branch source fields round-trip without losing zero fees or optional website', () => {
  const draft = {
    ...branchDraft(),
    id: 'branch-1',
    name: 'Kadıköy',
    address: 'Moda Caddesi 1',
    phone: '+905321234567',
    email: 'kadikoy@jamaster.com.tr',
    monthlyPayment: 0,
    paymentDay: 31,
  };
  const result = branchSchema.safeParse(draft);
  assert.equal(result.success, true);
  assert.deepEqual(branchDraft(branchToRow(draft)), draft);
  const legacy = ['Kadıköy', 'İstanbul', '8', 'Furkan Çolak', 'Aktif', 'branch-1'];
  const edited = branchToRow(draft, legacy);
  assert.equal(edited[3], 'Furkan Çolak');
  assert.equal(edited[7], draft.email);
  assert.equal(branchSchema.safeParse({ ...draft, paymentDay: 32 }).success, false);
  assert.equal(branchSchema.safeParse({ ...draft, monthlyPayment: -1 }).success, false);
  assert.equal(branchSchema.safeParse({ ...draft, website: 'invalid' }).success, false);
});
