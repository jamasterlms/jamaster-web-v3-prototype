import type { Obligation } from './payment-model.ts';

/** First visit selects all; a URL selection (including an explicit clear) always wins. */
export function initialPaymentIds(params: URLSearchParams, items: Obligation[]) {
  if (params.get('selection') === 'none') return [];
  if (params.has('id')) {
    const available = new Set(items.map((item) => item.sourceId));
    return [...new Set(params.getAll('id'))].filter((id) => available.has(id));
  }
  return [...new Set(items.map((item) => item.sourceId))];
}
