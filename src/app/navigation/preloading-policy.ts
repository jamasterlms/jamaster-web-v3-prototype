export type ConnectionHints = { saveData?: boolean; effectiveType?: string };

export function mayWarmPages(connection?: ConnectionHints, visible = true) {
  return (
    visible && !connection?.saveData && !['slow-2g', '2g'].includes(connection?.effectiveType || '')
  );
}

/** Do not speculate on downloads, fragments, external URLs or links into another window. */
export function internalPagePath(href: string, origin: string): string | null {
  if (!href || href.startsWith('#')) return null;
  try {
    const url = new URL(href, origin);
    if (url.origin !== origin || !['http:', 'https:'].includes(url.protocol)) return null;
    return url.pathname + url.search;
  } catch {
    return null;
  }
}
