import { ThinkingOrb } from 'thinking-orbs';
import { useEffect, useState } from 'react';

/** The application bootstrap only; route changes do not display the orb. */
export function AppLoading() {
  const [hidden, setHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const update = () => setHidden(document.hidden);
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  return (
    <div className="app-loading" role="status" aria-live="polite" aria-busy="true">
      <ThinkingOrb
        state="breathing"
        size={64}
        theme="light"
        paused={reducedMotion || hidden}
        aria-hidden="true"
      />
      <span>Jamaster yükleniyor…</span>
    </div>
  );
}
