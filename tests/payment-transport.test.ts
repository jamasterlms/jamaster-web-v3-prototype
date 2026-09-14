import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createCredentialedPaymentTransport,
  HttpPaymentTransportError,
  readPaymentTransportConfig,
} from '../src/features/payment/payment-transport.ts';

test('configuration is explicit and validated', () => {
  assert.throws(() => readPaymentTransportConfig({}), /VITE_API_URL/);
  assert.throws(
    () =>
      readPaymentTransportConfig({
        VITE_API_URL: 'http://api.example.com',
        VITE_TENANT_ID: 'demo',
      }),
    /HTTPS/,
  );
  assert.throws(
    () =>
      readPaymentTransportConfig({
        VITE_API_URL: 'file://localhost/tmp/api',
        VITE_TENANT_ID: 'demo',
      }),
    /HTTPS/,
  );
  assert.deepEqual(
    readPaymentTransportConfig({
      VITE_API_URL: 'https://api.example.com/',
      VITE_TENANT_ID: 'demo-tenant',
      VITE_BRANCH_ID: 'branch-uuid',
    }),
    {
      apiUrl: 'https://api.example.com',
      tenantId: 'demo-tenant',
      branchId: 'branch-uuid',
      defaultTimeoutMs: 10_000,
    },
  );
});

test('sends cookie credentials and tenant/branch headers, returning the source payload directly', async () => {
  let captured: [RequestInfo | URL, RequestInit | undefined] | undefined;
  const transport = createCredentialedPaymentTransport(
    { apiUrl: 'https://api.example.com', tenantId: 'demo', branchId: 'b1' },
    async (input, init) => {
      captured = [input, init];
      return new Response(JSON.stringify({ sourceType: 'BRANCH_PAYMENT' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  );
  assert.deepEqual(await transport('/payment/scopes'), { sourceType: 'BRANCH_PAYMENT' });
  assert.equal(captured?.[0], 'https://api.example.com/payment/scopes');
  assert.equal(captured?.[1]?.credentials, 'include');
  const headers = new Headers(captured?.[1]?.headers);
  assert.equal(headers.get('x-tenant-id'), 'demo');
  assert.equal(headers.get('x-branch-id'), 'b1');
  assert.equal(headers.has('authorization'), false);
});

test('204 returns null and HTTP rejection remains determinate with raw response data', async () => {
  const empty = createCredentialedPaymentTransport(
    { apiUrl: 'https://api.example.com', tenantId: 'demo' },
    async () => new Response(null, { status: 204 }),
  );
  assert.equal(await empty('/payment/active-link'), null);

  const rejected = createCredentialedPaymentTransport(
    { apiUrl: 'https://api.example.com', tenantId: 'demo' },
    async () =>
      new Response(JSON.stringify({ error: { message: 'Already started' } }), {
        status: 409,
        headers: { 'content-type': 'application/json' },
      }),
  );
  await assert.rejects(
    rejected('/payment-links/t/checkout', { method: 'POST', body: {} }),
    (error) => {
      assert.ok(error instanceof HttpPaymentTransportError);
      assert.equal(error.status, 409);
      assert.equal(error.indeterminate, false);
      assert.deepEqual(error.data, { error: { message: 'Already started' } });
      return true;
    },
  );
});

test('a successful mutation with an unreadable payload is indeterminate; an HTTP rejection is determinate', async () => {
  const malformedSuccess = createCredentialedPaymentTransport(
    { apiUrl: 'https://api.example.com', tenantId: 'demo' },
    async () =>
      new Response('<html>gateway replacement</html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
  );
  await assert.rejects(
    malformedSuccess('/payment-links/t/checkout', { method: 'POST', body: {} }),
    (error) => {
      assert.ok(error instanceof HttpPaymentTransportError);
      assert.equal(error.status, 200);
      assert.equal(error.indeterminate, true);
      return true;
    },
  );

  const malformedRejection = createCredentialedPaymentTransport(
    { apiUrl: 'https://api.example.com', tenantId: 'demo' },
    async () =>
      new Response('<html>bad request</html>', {
        status: 502,
        headers: { 'content-type': 'text/html' },
      }),
  );
  await assert.rejects(
    malformedRejection('/payment-links', { method: 'POST', body: {} }),
    (error) => {
      assert.ok(error instanceof HttpPaymentTransportError);
      assert.equal(error.status, 502);
      assert.equal(error.indeterminate, false);
      return true;
    },
  );
});

test('network failure and timeout are indeterminate', async () => {
  for (const fetchImpl of [
    async () => {
      throw new TypeError('network');
    },
    async (_input: RequestInfo | URL, init?: RequestInit) => {
      await new Promise((_resolve, reject) =>
        init?.signal?.addEventListener('abort', () =>
          reject(new DOMException('Aborted', 'AbortError')),
        ),
      );
      throw new Error('unreachable');
    },
  ]) {
    const transport = createCredentialedPaymentTransport(
      { apiUrl: 'https://api.example.com', tenantId: 'demo', defaultTimeoutMs: 2 },
      fetchImpl,
    );
    await assert.rejects(transport('/payment/obligations'), (error) => {
      assert.ok(error instanceof HttpPaymentTransportError);
      assert.equal(error.status, undefined);
      assert.equal(error.indeterminate, true);
      return true;
    });
  }
});

test('rejects network-path references before fetch', async () => {
  const transport = createCredentialedPaymentTransport(
    { apiUrl: 'https://api.example.com', tenantId: 'demo' },
    async () => {
      throw new Error('must not run');
    },
  );
  await assert.rejects(transport('//attacker.example/path'), /same-origin/);
  await assert.rejects(transport('/payment/../admin'), /same-origin/);
  await assert.rejects(transport('/payment/%2e%2e/admin'), /same-origin/);
  await assert.rejects(transport('/payment/%ZZ/admin'), /same-origin/);
});
