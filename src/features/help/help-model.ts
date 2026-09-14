import raw from './tutorials.json' with { type: 'json' };
export type HelpRole = 'student' | 'teacher' | 'staff' | 'super';
export type TutorialRoute = string | { pattern: string; priority: number };
export type Tutorial = {
  id: string;
  title: string;
  category: string;
  roles: HelpRole[];
  routes: TutorialRoute[];
  steps: { title: string; text: string }[];
};
export const tutorials = raw as Tutorial[];
export const roleLabels: Record<HelpRole, string> = {
  student: 'Öğrenci',
  teacher: 'Öğretmen',
  staff: 'Personel',
  super: 'Kurum yöneticisi',
};
export function helpRole(path: string, queryRole?: string | null): HelpRole {
  const first = path.replace(/^\//, '').split(/[/?#]/)[0];
  if (first === 'student' || first === 'teacher' || first === 'super') return first;
  if (
    [
      'login',
      'forgot-password',
      'reset-password',
      'access',
      'unauthorized',
      'forbidden',
      'offline',
      'maintenance',
      'error',
    ].includes(first) &&
    !queryRole
  )
    return 'student';
  if (first === 'admin') return 'staff';
  if (['student', 'teacher', 'staff', 'super'].includes(queryRole || ''))
    return queryRole as HelpRole;
  return 'staff';
}
export function tutorialsFor(role: HelpRole) {
  return tutorials.filter((t) => t.roles.includes(role));
}
function routeMatch(route: TutorialRoute, target: string) {
  const pattern = typeof route === 'string' ? route : route.pattern;
  return new RegExp(pattern).test(target);
}

function routePriority(route: TutorialRoute) {
  return typeof route === 'string' ? 0 : route.priority;
}

export function tutorialFor(path: string, role: HelpRole): Tutorial {
  const url = new URL(path.startsWith('/') ? path : '/' + path, 'https://help.local');
  const target = url.pathname + url.search;
  const list = tutorialsFor(role);
  const matches = list.flatMap((tutorial, tutorialIndex) =>
    tutorial.routes.flatMap((route, routeIndex) =>
      routeMatch(route, target)
        ? [{ tutorial, priority: routePriority(route), tutorialIndex, routeIndex }]
        : [],
    ),
  );
  matches.sort(
    (a, b) =>
      b.priority - a.priority || a.tutorialIndex - b.tutorialIndex || a.routeIndex - b.routeIndex,
  );
  return (
    matches[0]?.tutorial ||
    list.find((t) => t.id === `${role}-overview`) ||
    list.find((t) => t.id === 'workspace') ||
    list.find((t) => t.id === 'support')!
  );
}

export function tutorialAsset(id: string, extension: 'mp4' | 'vtt' | 'webp') {
  return `/tutorials/${id}.${extension}`;
}
export function helpLink(role: HelpRole, path?: string) {
  const params = new URLSearchParams({ role });
  if (path) {
    const url = new URL(path, 'https://help.local');
    const safe = new URLSearchParams();
    for (const key of ['tab', 'installmentsTab', 'role']) {
      const value = url.searchParams.get(key);
      if (value) safe.set(key, value);
    }
    params.set('from', url.pathname + (safe.size ? '?' + safe : ''));
  }
  return '/help?' + params;
}
