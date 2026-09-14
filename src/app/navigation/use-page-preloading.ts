import { useEffect } from 'react';
import { useWorkingTabs } from './navigation-provider';
import { pageNameForPath, preloadPage } from './page-preloading';
import { internalPagePath, mayWarmPages, type ConnectionHints } from './preloading-policy';

const frequentPages = ['/admin/students', '/admin/groups', '/admin/teachers'];

/** Download code only: no page is mounted, no form effects or data mutations are run. */
export function usePagePreloading() {
  const { state } = useWorkingTabs();
  const workingPaths = state.tabs.map((tab) => tab.path).join('\n');

  useEffect(() => {
    const onIntent = (event: Event) => {
      const connection = (navigator as Navigator & { connection?: ConnectionHints }).connection;
      if (
        event.type !== 'pointerdown' &&
        !mayWarmPages(connection, document.visibilityState === 'visible')
      )
        return;
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>('a[href]');
      if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self'))
        return;
      const path = internalPagePath(link.getAttribute('href') || '', window.location.origin);
      if (path)
        void preloadPage(path).catch(() => {
          /* Navigation owns visible error recovery. */
        });
    };
    // Capture also covers portalled menus; this never focuses fields or triggers navigation.
    document.addEventListener('pointerover', onIntent, { passive: true, capture: true });
    document.addEventListener('focusin', onIntent, true);
    document.addEventListener('pointerdown', onIntent, { passive: true, capture: true });
    return () => {
      document.removeEventListener('pointerover', onIntent, true);
      document.removeEventListener('focusin', onIntent, true);
      document.removeEventListener('pointerdown', onIntent, true);
    };
  }, []);

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: ConnectionHints }).connection;
    const allowed = () => mayWarmPages(connection, document.visibilityState === 'visible');
    if (!allowed()) return;
    // Restore open work first; cap the queue and fetch one page family at a time.
    const seen = new Set<string>();
    const queue = [...workingPaths.split('\n'), ...frequentPages]
      .filter((path) => {
        const name = pageNameForPath(path);
        if (!name || seen.has(name)) return false;
        seen.add(name);
        return true;
      })
      .slice(0, 8);
    let cancelled = false;
    let cancelScheduled = () => {};
    function schedule() {
      if (cancelled || !queue.length || !allowed()) return;
      const run = () => {
        if (cancelled || !allowed()) return;
        void preloadPage(queue.shift()!)
          .catch(() => {})
          .then(schedule);
      };
      if ('requestIdleCallback' in window) {
        const id = window.requestIdleCallback(run);
        cancelScheduled = () => window.cancelIdleCallback(id);
      } else {
        const id = setTimeout(run, 80);
        cancelScheduled = () => clearTimeout(id);
      }
    }
    schedule();
    return () => {
      cancelled = true;
      cancelScheduled();
    };
  }, [workingPaths]);
}
