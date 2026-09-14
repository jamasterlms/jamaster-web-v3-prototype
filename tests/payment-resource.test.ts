import assert from 'node:assert/strict';
import test from 'node:test';
import { createPaymentResource } from '../src/features/payment/payment-resource.ts';
import { PaymentServiceError } from '../src/features/payment/payment-service.ts';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

test('Failed manual verification retains the displayed link but never returns stale OPEN as a successful response', async () => {
  let fail = false;
  const resource = createPaymentResource(async () => {
    if (fail) throw new PaymentServiceError('Bağlantı kesildi');
    return { status: 'OPEN' };
  });
  await resource.refresh();
  fail = true;
  const result = await resource.refresh();
  assert.equal(result.kind, 'error');
  assert.equal(resource.getSnapshot().data?.status, 'OPEN');
  assert.equal(resource.getSnapshot().error, 'Bağlantı kesildi');
  assert.equal(resource.getSnapshot().loading, false);
});

test('An older OPEN response cannot replace a newer completed payment or unlock a retry', async () => {
  const first = deferred<{ status: string }>(),
    second = deferred<{ status: string }>();
  let count = 0;
  const resource = createPaymentResource(() => (++count === 1 ? first.promise : second.promise));
  const oldRequest = resource.refresh(),
    currentRequest = resource.refresh();
  assert.equal(resource.getSnapshot().loading, true);
  second.resolve({ status: 'COMPLETED' });
  assert.equal((await currentRequest).kind, 'success');
  first.resolve({ status: 'OPEN' });
  assert.equal((await oldRequest).kind, 'superseded');
  assert.equal(resource.getSnapshot().data?.status, 'COMPLETED');
});

test('Leaving a token or account invalidates pending results, including the refresh caller', async () => {
  const pending = deferred<string>();
  const resource = createPaymentResource(() => pending.promise);
  const request = resource.refresh();
  resource.invalidate();
  pending.resolve('previous-account');
  assert.equal((await request).kind, 'superseded');
  assert.equal(resource.getSnapshot().data, undefined);
  const next = createPaymentResource(async () => 'new-account');
  assert.equal(next.getSnapshot().data, undefined);
  assert.deepEqual(await next.refresh(), { kind: 'success', data: 'new-account' });
});

test('An explicit fresh OPEN confirmation succeeds after a failed check without retrying any mutation', async () => {
  let attempt = 0;
  const resource = createPaymentResource(async () => {
    if (++attempt === 1) throw new Error('Offline');
    return { status: 'OPEN' };
  });
  assert.equal((await resource.refresh()).kind, 'error');
  assert.deepEqual(await resource.refresh(), { kind: 'success', data: { status: 'OPEN' } });
  assert.equal(resource.getSnapshot().error, undefined);
});
