import { paymentError } from './payment-service.ts';

export type PaymentResourceResult<T> =
  | { kind: 'success'; data: T }
  | { kind: 'error'; error: string }
  | { kind: 'superseded' };
type Snapshot<T> = { data?: T; error?: string; loading: boolean };

/** A displayed previous value is not evidence that a new verification succeeded. */
export function createPaymentResource<T>(
  query: () => Promise<T>,
  initial: Snapshot<T> = { loading: true },
) {
  let snapshot = initial;
  let generation = 0;
  const listeners = new Set<() => void>();
  const publish = (next: Snapshot<T>) => {
    snapshot = next;
    listeners.forEach((listener) => listener());
  };
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    invalidate: () => {
      generation++;
    },
    refresh: async (): Promise<PaymentResourceResult<T>> => {
      const request = ++generation;
      publish({ data: snapshot.data, loading: true });
      try {
        const data = await query();
        if (request !== generation) return { kind: 'superseded' };
        publish({ data, loading: false });
        return { kind: 'success', data };
      } catch (cause) {
        if (request !== generation) return { kind: 'superseded' };
        const error = paymentError(cause);
        publish({ data: snapshot.data, loading: false, error });
        return { kind: 'error', error };
      }
    },
  };
}
