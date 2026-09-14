import { useLayoutEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { preloadPage } from '@/app/navigation/page-preloading';
let visit: ((path: string) => void) | undefined;
const aliases: Record<string, string> = {
  panel: 'admin/dashboard',
  takvim: 'admin/calendar',
  ogrenciler: 'admin/students',
  raporlar: 'admin/education-reports',
};
export function routeURL(route: string) {
  const clean = route.replace(/^[/#]+/, '');
  return '/' + (aliases[clean] || clean || 'admin/dashboard');
}
export function useRoute() {
  const location = useLocation();
  return location.pathname.replace(/^\//, '') || 'admin/dashboard';
}
export function NavigationBridge() {
  const navigate = useNavigate();
  useLayoutEffect(() => {
    visit = (path) => {
      // Commands and entity/table actions do not always have an anchor to prefetch on hover.
      void preloadPage(path).catch(() => {
        /* The route error boundary handles failures. */
      });
      void navigate(path);
    };
    return () => {
      visit = undefined;
    };
  }, [navigate]);
  return null;
}
export function navigate(route: string) {
  visit?.(routeURL(route));
}
