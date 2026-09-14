import { toast } from 'sonner';
import { restoreOperations } from '../education/group-teacher-model';
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type PropsWithChildren,
} from 'react';
import {
  initialOperations,
  operationsReducer,
  type OperationsState,
  type SaveAction,
} from './model';
const Context = createContext<{ operations: OperationsState; save: Dispatch<SaveAction> } | null>(
  null,
);
const storageKey = 'jamaster-operations-v3';
export function OperationsProvider({ children }: PropsWithChildren) {
  const [operations, save] = useReducer(operationsReducer, initialOperations, (seed) => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      return restoreOperations(saved, seed);
    } catch {
      /* Browser storage may be unavailable. */
    }
    return restoreOperations(null, seed);
  });
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(operations));
    } catch {
      toast.error(
        'Değişiklikler yalnız bu oturumda tutuluyor. Tarayıcı depolama alanını kontrol edin.',
        { id: 'operations-storage-error' },
      );
    }
  }, [operations]);
  return <Context.Provider value={{ operations, save }}>{children}</Context.Provider>;
}
export function useOperations() {
  const value = useContext(Context);
  if (!value) throw new Error('OperationsProvider is required');
  return value;
}
