import { useLayoutEffect, useRef } from 'react';

/** Fit the panel below its actual sticky position, including app scaling and page scroll. */
export function useStickyPanel(mobile: boolean) {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const panel = ref.current;
    if (!panel || mobile) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        panel.style.setProperty(
          '--panel-top',
          `${Math.max(0, panel.getBoundingClientRect().top)}px`,
        );
      });
    };
    measure();
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    const observer = new ResizeObserver(measure);
    const topbar = document.querySelector('.topbar');
    if (topbar) observer.observe(topbar);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [mobile]);
  return ref;
}
