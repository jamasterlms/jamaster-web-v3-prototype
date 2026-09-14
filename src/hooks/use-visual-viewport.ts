import { useEffect } from 'react';
export function useVisualViewport() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--visual-height', `${viewport.height}px`);
        document.documentElement.style.setProperty('--visual-top', `${viewport.offsetTop}px`);
        document.documentElement.style.setProperty(
          '--visual-bottom',
          `${Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)}px`,
        );
      });
    };
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      document.documentElement.style.removeProperty('--visual-height');
      document.documentElement.style.removeProperty('--visual-top');
      document.documentElement.style.removeProperty('--visual-bottom');
    };
  }, []);
}
