import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPrototypePaymentService } from '../src/features/payment/prototype-payment-service.ts';
const request = {
  addressId: 'billing-address',
  userCardId: 'test-card',
  installments: 1,
  locale: 'tr' as const,
};
test('payment prototype completes selected items once and retains a separate receipt history', async () => {
  const service = createPrototypePaymentService(),
    before = await service.obligations();
  const link = await service.create([before.items[0].sourceId, before.items[0].sourceId]);
  assert.equal((await service.link(link.token)).items.length, 1);
  await service.checkout(link.token, request);
  assert.equal((await service.link(link.token)).status, 'PROCESSING');
  await assert.rejects(service.checkout(link.token, request));
  await assert.rejects(service.cancel(link.token));
  await service.prototype!.verify(link.token, true);
  assert.equal((await service.link(link.token)).status, 'COMPLETED');
  assert.equal((await service.obligations()).count, before.count - 1);
  assert.equal((await service.history(1)).totalItems, 2);
  await assert.rejects(service.prototype!.verify(link.token, true));
});
test('declined and rejected verification payments remain unpaid and can be retried', async () => {
  const service = createPrototypePaymentService(),
    ids = (await service.obligations()).items.map((i) => i.sourceId);
  const { token } = await service.create(ids);
  service.prototype!.setScenario('decline');
  await assert.rejects(service.checkout(token, request), /reddedildi/);
  assert.equal((await service.link(token)).status, 'OPEN');
  service.prototype!.setScenario('verification');
  await assert.rejects(service.checkout(token, request), /bekleniyor/);
  assert.equal((await service.link(token)).status, 'PROCESSING');
  await service.prototype!.verify(token, false);
  assert.equal((await service.obligations()).count, 3);
  assert.equal((await service.link(token)).status, 'OPEN');
});
test('new links replace only open links and cannot replace a processing transaction', async () => {
  const service = createPrototypePaymentService(),
    id = (await service.obligations()).items[0].sourceId;
  const first = await service.create([id]),
    second = await service.create([id]);
  assert.equal((await service.link(first.token)).status, 'SUPERSEDED');
  await service.checkout(second.token, request);
  await assert.rejects(service.create([id]));
});
test('reload preserves payment progress without keeping PAN, CVC or billing fields', async () => {
  const data = new Map<string, string>(),
    storage = {
      getItem: (key: string) => data.get(key) || null,
      setItem: (key: string, value: string) => {
        data.set(key, value);
      },
    };
  const service = createPrototypePaymentService(storage),
    id = (await service.obligations()).items[0].sourceId;
  const { token } = await service.create([id]);
  await service.checkout(token, {
    ...request,
    userCardId: undefined,
    cardData: {
      cardHolderName: 'PRIVATE-HOLDER',
      cardNumber: '4111111111111111',
      cvc: '987',
      expireMonth: '12',
      expireYear: '2030',
    },
    saveCard: true,
  });
  const serialized = [...data.values()].join('');
  assert.ok(
    !serialized.includes('4111111111111111') &&
      !serialized.includes('PRIVATE-HOLDER') &&
      !serialized.includes('cvc'),
  );
  assert.equal((await createPrototypePaymentService(storage).link(token)).status, 'PROCESSING');
});
test('service responses are snapshots and cancel/reset do not silently settle obligations', async () => {
  const service = createPrototypePaymentService(),
    result = await service.obligations();
  result.items[0].amount = 1;
  assert.equal((await service.obligations()).items[0].amount, 3500);
  const { token } = await service.create([result.items[0].sourceId]);
  await service.cancel(token);
  assert.equal((await service.obligations()).count, 3);
  service.prototype!.reset();
  assert.equal(await service.active(), null);
  await assert.rejects(service.create(['unknown']));
});
test('collector receipt cannot double settle a processing card transaction', async () => {
  const service = createPrototypePaymentService(),
    id = (await service.obligations()).items[0].sourceId;
  const { token } = await service.create([id]);
  await service.checkout(token, request);
  await assert.rejects(service.receiveBranchPayment(id, { paymentType: 'CASH' }), /devam eden/);
  await service.prototype!.verify(token, true);
  await assert.rejects(service.receiveBranchPayment(id, { paymentType: 'CASH' }));
});
test('deleted saved cards and missing billing references cannot enter processing', async () => {
  const service = createPrototypePaymentService(),
    id = (await service.obligations()).items[0].sourceId;
  const { token } = await service.create([id]);
  await assert.rejects(service.checkout(token, { ...request, addressId: 'missing' }));
  await service.removeCard('BRANCH_PAYMENT', 'saved-card');
  await assert.rejects(service.checkout(token, request));
  assert.equal((await service.link(token)).status, 'OPEN');
});
test('switching branch keeps payment demonstrations and active links separate', async () => {
  const data = new Map<string, string>();
  const storage = {
    getItem: (key: string) => data.get(key) || null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
  const first = createPrototypePaymentService(storage),
    second = createPrototypePaymentService(storage, 'Kadıköy');
  const { token } = await first.create(['license-current']);
  await first.checkout(token, request);
  await first.prototype!.verify(token, true);
  assert.equal((await second.obligations()).count, 3);
  assert.equal((await second.scope()).scope?.branchId, encodeURIComponent('Kadıköy'));
  await assert.rejects(second.link(token));
  assert.equal((await createPrototypePaymentService(storage).obligations()).count, 2);
});

test('tenant invoices use tenant scope and stay isolated from branch payment state', async () => {
  const data = new Map<string, string>();
  const storage = {
    getItem: (key: string) => data.get(key) || null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
  const tenant = createPrototypePaymentService(storage, 'New York', 'tenant');
  assert.equal((await tenant.scope()).sourceType, 'TENANT_INVOICE');
  assert.equal((await tenant.scope()).scope.branchId, undefined);
  const { token } = await tenant.create(['tenant-invoice-current']);
  await tenant.checkout(token, request);
  await tenant.prototype!.verify(token, true);
  assert.equal((await tenant.obligations()).count, 1);
  assert.equal((await createPrototypePaymentService(storage).obligations()).count, 3);
});

test('blocked tenant stays blocked after partial payment and unlocks after the final invoice', async () => {
  const service = createPrototypePaymentService(undefined, 'New York', 'blocked');
  assert.deepEqual(await service.access(), {
    blocked: true,
    action: 'PAYMENT_REQUIRED',
    panelPath: '/admin/dashboard',
  });
  for (const sourceId of ['tenant-invoice-previous', 'tenant-invoice-current']) {
    const { token } = await service.create([sourceId]);
    await service.checkout(token, request);
    await service.prototype!.verify(token, true);
    const completed = await service.link(token);
    assert.equal(completed.completionSummary?.stillBlocked, sourceId === 'tenant-invoice-previous');
  }
  assert.equal((await service.access()).blocked, false);
  assert.equal((await service.history(1)).totalItems, 3);
});

test('missing scope fails before returning synthetic payer data', async () => {
  const service = createPrototypePaymentService(undefined, 'New York', 'missing-scope');
  await assert.rejects(service.scope(), /kapsamı alınamadı/);
});

test('expired scenario creates a terminal link without settling or activating it', async () => {
  const service = createPrototypePaymentService();
  service.prototype!.setScenario('expired');
  const { token } = await service.create(['license-current']);
  assert.equal((await service.link(token)).status, 'CANCELLED');
  assert.equal(await service.active(), null);
  assert.equal((await service.obligations()).count, 3);
  await assert.rejects(service.checkout(token, request));
  await assert.rejects(service.cancel(token));
  await assert.rejects(service.prototype!.verify(token, true));
});

test('resetting one v2 branch context does not reset another branch', async () => {
  const data = new Map<string, string>();
  const storage = {
    getItem: (key: string) => data.get(key) || null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
  const first = createPrototypePaymentService(storage, 'New York');
  const second = createPrototypePaymentService(storage, 'Kadıköy');
  const { token } = await second.create(['license-current']);
  await second.checkout(token, request);
  await second.prototype!.verify(token, true);
  first.prototype!.reset();
  assert.equal((await createPrototypePaymentService(storage, 'Kadıköy').obligations()).count, 2);
});
