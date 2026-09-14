import { useEffect, type SetStateAction } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { usePageState } from './use-page-state';
import { useWorkspace } from '@/app/workspace-provider';

/** Explicit URL filters win over remembered page state, including after back/forward. */
export function useQueryFilter<T>(
  name: string,
  initial: T,
  options: {
    keys: string[];
    read: (params: URLSearchParams) => T;
    write: (params: URLSearchParams, value: T) => void;
  },
) {
  const [saved, setSaved] = usePageState(name, initial);
  const { state } = useWorkspace();
  const [params, setParams] = useSearchParams();
  const { pathname } = useLocation();
  const explicit = options.keys.some((key) => params.has(key));
  const value = explicit ? options.read(params) : saved;
  // Preserve parameter presence: no search parameter and an explicit empty search are different.
  const signature = JSON.stringify(options.keys.map((key) => [key, params.getAll(key)]));
  useEffect(() => {
    if (explicit) setSaved(options.read(params));
  }, [signature, state.branch, pathname, name]);
  const update = (next: SetStateAction<T>) => {
    const result = next instanceof Function ? next(value) : next;
    setSaved(result);
    setParams(
      (previous) => {
        const updated = new URLSearchParams(previous);
        options.keys.forEach((key) => updated.delete(key));
        options.write(updated, result);
        return updated;
      },
      { replace: true },
    );
  };
  return [value, update] as const;
}
