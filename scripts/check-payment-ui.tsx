import assert from 'node:assert/strict';
import { renderToString } from 'react-dom/server';
import type { ReactNode } from 'react';
import { DataTable } from '../src/components/ui/data-table';
import { CheckoutAddressFields, CheckoutCardFields } from '../src/features/payment/checkout-fields';
import { PaymentOverview } from '../src/features/payment/payment-center';
import { PaymentResult } from '../src/features/payment/payment-checkout';
import {
  emptyCheckout,
  paymentView,
  type PaymentLink,
} from '../src/features/payment/payment-model';

export function checkPaymentUI(
  wrap: (node: ReactNode, path?: string) => ReactNode,
  checkMarkup: (html: string, context: string) => void,
) {
  const serverRows = Array.from({ length: 30 }, (_, i) => ({
    id: String(i),
    label: 'Server record ' + i,
  }));
  const serverTable = renderToString(
    wrap(
      <DataTable
        name="server-pagination-check"
        data={serverRows}
        getRowId={(row) => row.id}
        columns={[{ accessorKey: 'label', header: 'Kayıt' }]}
        manualPagination
        mobileCard={(row) => <span>{row.label}</span>}
      />,
    ),
  );
  assert.ok(
    serverTable.includes('Server record 29'),
    'Server-paginated rows must not be sliced again by client pagination',
  );
  assert.ok(
    !serverTable.includes('data-table-pagination'),
    'Server page must not get a second pagination footer',
  );
  const resources = { addresses: [], cards: [] };
  for (const [name, Component] of [
    ['address', CheckoutAddressFields],
    ['card', CheckoutCardFields],
  ] as const) {
    const html = renderToString(
      wrap(
        <Component draft={emptyCheckout} onChange={() => {}} errors={{}} resources={resources} />,
        '/payment/test-link',
      ),
    );
    checkMarkup(html, 'checkout-' + name);
    for (const input of html.matchAll(/<(input|textarea)\b[^>]*>/g)) {
      if (/type="hidden"|type="checkbox"/.test(input[0])) continue;
      assert.match(
        input[0],
        /placeholder="[^"]+"/,
        'Checkout input lacks placeholder: ' + input[0],
      );
      assert.match(input[0], /id="[^"]+"/);
    }
    assert.ok(
      html.indexOf('checkout-optional') > html.indexOf('checkout-field-grid'),
      'Optional section must follow required fields',
    );
    assert.ok(!html.includes('app-loading'));
  }
  const link: PaymentLink = {
    id: 'test-id',
    token: 'test-token',
    status: 'OPEN',
    sourceType: 'BRANCH_PAYMENT',
    scope: { type: 'BRANCH', tenantId: 'tenant', branchId: 'branch' },
    returnPath: '/admin/dashboard',
    panelPath: '/admin/dashboard',
    totalAmount: 1000000000.99,
    currency: 'TRY',
    items: [
      {
        sourceId: 'due-1',
        title: 'Eylül şube lisansı',
        description: 'Uzun açıklama '.repeat(20),
        amount: 1000000000.99,
        currency: 'TRY',
        status: 'PENDING',
        dueDate: '2026-09-30',
      },
    ],
  };
  const overview = renderToString(
    wrap(
      <PaymentOverview
        items={link.items}
        active={link}
        ids={['due-1']}
        onSelect={() => {}}
        disabled={false}
        unavailable={false}
      />,
      '/payment',
    ),
  );
  checkMarkup(overview, 'payment-overview');
  assert.match(
    overview,
    /role="checkbox"[^>]*aria-checked="true"|aria-checked="true"[^>]*role="checkbox"/,
  );
  assert.ok(overview.includes('/payment/test-token'));
  assert.ok(overview.includes('payment-mobile-obligation'));
  const filtered = renderToString(
    wrap(
      <PaymentOverview
        items={link.items}
        active={null}
        ids={[]}
        onSelect={() => {}}
        disabled={false}
        unavailable={false}
      />,
      '/payment?search=bulunmayan&status=PENDING',
    ),
  );
  assert.ok(
    !filtered.includes('Eylül şube lisansı'),
    'Payment search must survive route/tab restoration through the URL',
  );
  assert.match(filtered, /value="bulunmayan"/);
  for (const status of ['COMPLETED', 'CANCELLED', 'SUPERSEDED', 'PROCESSING', 'OPEN'] as const) {
    const html = renderToString(
      wrap(
        <PaymentResult
          link={{ ...link, status }}
          view={paymentView(status, status === 'OPEN')}
          loading={false}
          refresh={() => {}}
          bankHtml=""
        />,
        '/payment/test-token',
      ),
    );
    checkMarkup(html, 'payment-result-' + status);
    assert.ok(!html.includes('Ödemeyi tamamla'));
    if (status !== 'COMPLETED') assert.ok(!html.includes('Ödemeniz tamamlandı'));
    assert.ok(!html.includes('app-loading'));
  }
  const bank = renderToString(
    wrap(
      <PaymentResult
        link={link}
        view="verification"
        loading={false}
        refresh={() => {}}
        bankHtml="<form action='https://bank.example/3ds'></form>"
      />,
    ),
  );
  assert.match(bank, /sandbox="allow-forms allow-scripts"/);
  assert.ok(!bank.includes('allow-same-origin'));
  console.log(
    'Payment required fields/placeholders, optional hierarchy, large totals, selected records, mobile cards and all result states rendered; bank verification is isolated.',
  );
}
