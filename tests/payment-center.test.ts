import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addressErrors,
  cardErrors,
  checkoutPayload,
  selectedObligations,
  paymentTotals,
  mergeHistory,
  paymentView,
  legacyPaymentPath,
} from '../src/features/payment/payment-model.ts';
import { createPaymentService } from '../src/features/payment/payment-service.ts';
import { parseReceipt } from '../src/features/payment/receipt-model.ts';
import { paymentMutationFailure } from '../src/features/payment/payment-service.ts';
import { PaymentServiceError } from '../src/features/payment/payment-service.ts';
import { paymentToken } from '../src/features/payment/payment-routes.ts';
const items = [
  {
    sourceId: 'a',
    title: 'Eylül',
    description: 'Şube lisansı',
    dueDate: '2026-09-09',
    amount: 0.1,
    currency: 'TRY',
    status: 'PENDING',
  },
  {
    sourceId: 'b',
    title: 'Ekim',
    description: 'Şube lisansı',
    dueDate: '2026-10-09',
    amount: 0.2,
    currency: 'TRY',
    status: 'PENDING',
  },
];
test('Payment selection drops stale IDs, deduplicates selection and totals in minor units', () => {
  const selected = selectedObligations(items, ['a', 'a', 'b', 'deleted']);
  assert.equal(selected.length, 2);
  assert.deepEqual(paymentTotals(selected), [{ currency: 'TRY', amount: 0.3 }]);
  assert.equal(
    paymentTotals([...items, { ...items[0], sourceId: 'c', currency: 'USD' }]).length,
    2,
  );
});
test('History pagination deduplicates IDs and updates existing records', () => {
  assert.deepEqual(mergeHistory(items, [{ ...items[0], status: 'PAID' }]), [
    { ...items[0], status: 'PAID' },
    items[1],
  ]);
});
const address = {
  firstName: 'Deniz',
  lastName: 'Yılmaz',
  email: 'deniz@example.com',
  phone: '+905321234567',
  identityNumber: '10000000146',
  address: 'Atatürk Caddesi No: 15',
  city: 'İstanbul',
  country: 'Türkiye',
  zipCode: '34000',
};
const card = {
  cardHolderName: 'DENIZ YILMAZ',
  cardNumber: '4111 1111 1111 1111',
  expireMonth: '09',
  expireYear: '2026',
  cvc: '123',
};
test('Checkout validates required address, Turkish phone and postal code without accepting masked digits', () => {
  assert.deepEqual(addressErrors(address), {});
  assert.ok(addressErrors({ ...address, phone: '+12025550123' }).phone);
  assert.ok(addressErrors({ ...address, phone: '0532•••••••' }).phone);
  assert.ok(
    addressErrors({ ...address, zipCode: '340', email: 'invalid', identityNumber: '' })
      .identityNumber,
  );
});
test('Card validation allows current expiry month and rejects past expiry, invalid checksum and CVC', () => {
  const now = new Date(2026, 8, 10);
  assert.deepEqual(cardErrors(card, now), {});
  assert.ok(cardErrors({ ...card, expireMonth: '08' }, now).expireMonth);
  assert.ok(cardErrors({ ...card, cardNumber: '4111111111111112' }, now).cardNumber);
  assert.ok(cardErrors({ ...card, cvc: '1' }, now).cvc);
});
test('Checkout request includes only chosen address/card sources; PAN is normalized and phone follows source contract', () => {
  const draft = {
    addressSource: 'new' as const,
    cardSource: 'new' as const,
    address,
    card,
    addressId: 'old',
    cardId: 'old',
    saveAddress: true,
    saveCard: false,
    consent: true,
  };
  const result = checkoutPayload(draft);
  assert.equal(result.cardData?.cardNumber, '4111111111111111');
  assert.equal(result.addressData?.phone, '(532) 123 45 67');
  assert.equal(result.userCardId, undefined);
  const saved = checkoutPayload({ ...draft, addressSource: 'saved', cardSource: 'saved' });
  assert.deepEqual(saved, { addressId: 'old', userCardId: 'old', installments: 1, locale: 'tr' });
});
test('Terminal server states override local pending/error and indeterminate results never enable another payment', () => {
  assert.equal(paymentView('COMPLETED', true), 'completed');
  assert.equal(paymentView('CANCELLED', true), 'cancelled');
  assert.equal(paymentView('SUPERSEDED', false), 'superseded');
  assert.equal(paymentView('PROCESSING', false), 'processing');
  assert.equal(paymentView('OPEN', true), 'verification');
  assert.equal(paymentView('OPEN', false), 'checkout');
});
test('Legacy billing URLs preserve checkout IDs and unrelated query filters without creating a payment', () => {
  assert.equal(
    legacyPaymentPath('/admin/payments/checkout', '?id=abc&filter=1'),
    '/payment?id=abc&filter=1',
  );
  assert.equal(legacyPaymentPath('/super/billing/cards', '?foo=bar'), '/payment?foo=bar&tab=cards');
  assert.equal(legacyPaymentPath('/admin/payments/installments', ''), null);
});
test('Saved card mutations use relationship ID; checkout resources use underlying card ID', async () => {
  const calls: { path: string; method?: string; body?: unknown }[] = [];
  const service = createPaymentService(async (path, options) => {
    calls.push({ path, ...options });
    if (path.includes('user-addresses')) return { data: [] };
    if (!options?.method)
      return {
        data: [
          {
            id: 'link-1',
            cardId: 'card-2',
            priority: 1,
            isActive: true,
            lastFourDigits: '1111',
            cardAlias: 'İş kartı',
          },
        ],
      };
    return {};
  });
  const cards = await service.cards('BRANCH_PAYMENT');
  assert.equal(cards[0].id, 'link-1');
  assert.equal(cards[0].cardId, 'card-2');
  await service.setDefault('BRANCH_PAYMENT', cards[0].id);
  assert.equal(calls.at(-1)?.path, '/admin/branch-payment-cards/link-1');
  assert.deepEqual(calls.at(-1)?.body, { priority: 1 });
});
test('Student card/checkout capability is explicitly unavailable and makes no API call', async () => {
  let requests = 0;
  const service = createPaymentService(async () => {
    requests++;
    return {};
  });
  assert.deepEqual(await service.cards('STUDENT_INSTALLMENT'), []);
  await assert.rejects(() => service.resources('STUDENT_INSTALLMENT'));
  assert.equal(requests, 0);
});
test('Collector operations use branch-payment endpoints and preserve the selected source IDs', async () => {
  const calls: { path: string; method?: string; body?: unknown }[] = [];
  const service = createPaymentService(async (path, options) => {
    calls.push({ path, ...options });
    return { data: [], page: 1, totalPages: 1, totalItems: 0 };
  });
  await service.branchPayments('search=New+York&sortOrder=dueDate%3Adesc&page=1');
  assert.equal(
    calls[0].path,
    '/super/branch-payments?search=New+York&sortOrder=dueDate%3Adesc&page=1',
  );
  await service.collectorLink('branch-1', ['payment-2']);
  assert.deepEqual(calls.at(-1), {
    path: '/super/branch-payments/branch-1/payment-links',
    method: 'POST',
    body: { sourceIds: ['payment-2'] },
  });
});

test('Receipt validation rejects invalid dates before a financial request and preserves source field constraints', () => {
  assert.equal(parseReceipt({ paymentType: 'CASH', paymentDate: 'not-a-date' }).ok, false);
  assert.equal(parseReceipt({ paymentType: 'CASH', paymentDate: '2026-02-30T13:45' }).ok, false);
  assert.equal(parseReceipt({ paymentType: 'CASH', paymentReference: 'x'.repeat(256) }).ok, false);
  const result = parseReceipt({
    paymentType: 'BANK_TRANSFER',
    paymentDate: '2026-09-10T13:45',
    paymentReference: '  ABC-42  ',
    notes: '  ',
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.paymentDate, new Date('2026-09-10T13:45').toISOString());
    assert.equal(result.value.paymentReference, 'ABC-42');
    assert.equal(result.value.notes, undefined);
  }
});

test('A rejected receipt can be corrected; conflict, timeout or network uncertainty requires verification', () => {
  assert.equal(
    paymentMutationFailure(new PaymentServiceError('Geçersiz referans', 422)),
    'rejected',
  );
  assert.equal(paymentMutationFailure(new PaymentServiceError('Çakışma', 409)), 'verify');
  assert.equal(paymentMutationFailure(new PaymentServiceError('Zaman aşımı', 408, true)), 'verify');
  assert.equal(paymentMutationFailure(new Error('Offline')), 'verify');
});

test('Payment token path segments decode once and malformed or nested paths do not become API tokens', async () => {
  assert.equal(paymentToken('payment/token%2Babc%3D'), 'token+abc=');
  assert.equal(paymentToken('payment/literal%252B'), 'literal%2B');
  assert.equal(paymentToken('payment/%invalid'), '');
  assert.equal(paymentToken('payment/one/two'), '');
  let path = '';
  const service = createPaymentService(async (value) => {
    path = value;
    return {};
  });
  await service.link(paymentToken('payment/token%2Babc%3D'));
  assert.equal(path, '/payment-links/token%2Babc%3D');
});
