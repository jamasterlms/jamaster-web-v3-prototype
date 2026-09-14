export type PageStorage = Pick<Storage, 'getItem' | 'setItem'>;
export function pageStateKey(branch: string, path: string, name: string) {
  return `jamaster:page:${encodeURIComponent(branch)}:${path}:${name}`;
}
export function readPageValue<T>(storage: PageStorage | undefined, key: string, fallback: T): T {
  try {
    const saved = storage?.getItem(key);
    if (saved === null || saved === undefined) return fallback;
    const value = JSON.parse(saved);
    if (Array.isArray(fallback)) return Array.isArray(value) ? (value as T) : fallback;
    if (fallback !== null && typeof fallback === 'object')
      return value !== null && !Array.isArray(value) && typeof value === 'object'
        ? { ...fallback, ...value }
        : fallback;
    return typeof value === typeof fallback ? (value as T) : fallback;
  } catch {
    return fallback;
  }
}
export function writePageValue(storage: PageStorage | undefined, key: string, value: unknown) {
  try {
    storage?.setItem(key, JSON.stringify(value));
    return !!storage;
  } catch {
    return false;
  }
}
