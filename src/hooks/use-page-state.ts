import { pageStateKey, readPageValue, writePageValue } from '@/app/navigation/page-state-store';
import { useWorkspace } from '@/app/workspace-provider';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { useLocation } from 'react-router-dom';
const storage = () => {
  try {
    return typeof sessionStorage === 'undefined' ? undefined : sessionStorage;
  } catch {
    return undefined;
  }
};
// State is scoped to a branch and canonical page; inactive page trees are unmounted.
export function usePageState<T>(
  name: string,
  initial: T | (() => T),
): [T, Dispatch<SetStateAction<T>>] {
  const { pathname } = useLocation(),
    { state } = useWorkspace();
  const key = pageStateKey(state.branch, pathname, name);
  const read = () =>
    readPageValue(storage(), key, initial instanceof Function ? initial() : initial);
  const [entry, setEntry] = useState(() => ({ key, value: read() }));
  // A branch/route change must never persist the previous page's value under the new key.
  const current = entry.key === key ? entry : { key, value: read() };
  if (entry.key !== key) setEntry(current);
  const value = current.value;
  const setValue: Dispatch<SetStateAction<T>> = (next) =>
    setEntry((previous) => {
      const value = previous.key === key ? previous.value : read();
      return { key, value: next instanceof Function ? next(value) : next };
    });
  useEffect(() => {
    writePageValue(storage(), key, value);
  }, [key, value]);
  return [value, setValue];
}
