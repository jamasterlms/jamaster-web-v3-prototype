import { useEffect, useState } from 'react';

/** Re-evaluate schedule boundaries while open and immediately on returning to the app. */
export function useLessonClock() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const update = () => setNow(Date.now());
    const interval = window.setInterval(update, 30000);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  return now;
}
