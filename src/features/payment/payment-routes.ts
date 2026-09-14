/** Legacy payer routes redirect without creating or submitting a payment. */
export function paymentToken(route: string) {
  const match = route.match(/^\/?payment\/([^/?#]+)$/);
  if (!match) return '';
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return '';
  }
}

export function legacyPaymentPath(path: string, search: string) {
  if (
    ![
      '/admin/payments',
      '/admin/payments/checkout',
      '/super/billing',
      '/super/billing/cards',
      '/super/billing/history',
    ].includes(path)
  )
    return null;
  const params = new URLSearchParams(search);
  if (path.endsWith('/cards')) params.set('tab', 'cards');
  if (path.endsWith('/history')) params.set('tab', 'history');
  return '/payment' + (params.size ? '?' + params : '');
}
