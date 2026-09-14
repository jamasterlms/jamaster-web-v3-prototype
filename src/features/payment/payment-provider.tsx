import { useWorkspace } from '@/app/workspace-provider';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from 'react';
import { type PaymentService } from './payment-service';
import { createPrototypePaymentService } from './prototype-payment-service';
import type { PaymentDemoContext } from './prototype-payment-service';
import { createPaymentResource } from './payment-resource';
function prototypeService(branchName?: string, demoContext: PaymentDemoContext = 'branch') {
  try {
    return createPrototypePaymentService(
      typeof window !== 'undefined' ? window.sessionStorage : undefined,
      branchName,
      demoContext,
    );
  } catch {
    return createPrototypePaymentService(undefined, branchName, demoContext);
  }
}
const Context = createContext<PaymentService>(prototypeService());
const PrototypeContext = createContext<{
  context: PaymentDemoContext;
  setContext?: (context: PaymentDemoContext) => void;
}>({ context: 'branch' });
export function PaymentProvider({
  service,
  children,
}: PropsWithChildren<{ service: PaymentService }>) {
  return <Context.Provider value={service}>{children}</Context.Provider>;
}
export function PrototypePaymentProvider({ children }: PropsWithChildren) {
  const { state } = useWorkspace();
  const [context, setContext] = useState<PaymentDemoContext>(() => {
    try {
      const saved = sessionStorage.getItem('jamaster:payment-context');
      return ['branch', 'tenant', 'blocked', 'missing-scope'].includes(saved || '')
        ? (saved as PaymentDemoContext)
        : 'branch';
    } catch {
      return 'branch';
    }
  });
  useEffect(() => {
    try {
      sessionStorage.setItem('jamaster:payment-context', context);
    } catch {
      /* The current context still works without persistence. */
    }
  }, [context]);
  const service = useMemo(() => prototypeService(state.branch, context), [state.branch, context]);
  return (
    <PrototypeContext.Provider value={{ context, setContext }}>
      <PaymentProvider service={service}>{children}</PaymentProvider>
    </PrototypeContext.Provider>
  );
}
export const usePaymentService = () => useContext(Context);
export const usePrototypePaymentContext = () => useContext(PrototypeContext);
/** Ignore responses belonging to a previous token, scope, tab or unmounted page. */
export function usePaymentResource<T>(key: string, query: () => Promise<T>, enabled = true) {
  const service = usePaymentService(),
    fn = useRef(query);
  fn.current = query;
  // New tokens and authenticated service scopes get separate snapshots immediately.
  const resource = useMemo(
    () =>
      createPaymentResource<T>(() => fn.current(), {
        loading: service.configured && enabled,
        error:
          enabled && !service.configured
            ? 'Ödeme hizmetine bağlantı kurulamadı. Tutarlar ve ödeme durumları doğrulanamıyor.'
            : undefined,
      }),
    [key, service, enabled],
  );
  const result = useSyncExternalStore(
    resource.subscribe,
    resource.getSnapshot,
    resource.getSnapshot,
  );
  useEffect(() => {
    if (!enabled) return;
    void resource.refresh();
    return resource.invalidate;
  }, [resource, enabled]);
  return { ...result, refresh: resource.refresh };
}
