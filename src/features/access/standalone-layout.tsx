import { CircleHelp } from 'lucide-react';
import { helpLink, helpRole } from '@/features/help/help-model';
import type { PropsWithChildren } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PageNavigation } from '@/components/navigation/page-navigation';
export function StandaloneLayout({ route, children }: PropsWithChildren<{ route: string }>) {
  const location = useLocation();
  const role = route.split('/')[0];
  const special =
    /^(login|forgot-password|reset-password|access|help|forbidden|unauthorized|offline|maintenance|error)$/.test(
      role,
    );
  const portal = role === 'student' || role === 'teacher';
  const items =
    role === 'student'
      ? [
          ['dashboard', 'Genel bakış'],
          ['courses', 'Derslerim'],
          ['activities', 'Aktiviteler'],
          ['grades', 'Notlarım'],
          ['announcements', 'Duyurular'],
        ]
      : [
          ['dashboard', 'Genel bakış'],
          ['courses', 'Derslerim'],
          ['activities', 'Aktiviteler'],
          ['announcements', 'Duyurular'],
          ['grade-overview', 'Not özeti'],
        ];
  return (
    <div
      className={`standalone-layout${role === 'payment' ? ' payment-layout' : ''}${special ? ' access-layout' : ''}`}
    >
      <header className="standalone-header">
        <Link
          className="standalone-brand"
          to={
            portal
              ? `/${role}/dashboard`
              : role === 'payment'
                ? '/payment'
                : `/login?role=${new URLSearchParams(location.search).get('role') === 'teacher' ? 'teacher' : new URLSearchParams(location.search).get('role') === 'user' ? 'user' : 'student'}`
          }
        >
          <img
            className="standalone-logo"
            src={`${import.meta.env.BASE_URL}assets/logo.png`}
            alt=""
          />
          Jamaster <small>{portal ? (role === 'teacher' ? 'Öğretmen' : 'Öğrenci') : 'LMS'}</small>
        </Link>
        <div className="standalone-help-actions">
          <Link
            className="standalone-return"
            to={helpLink(
              helpRole(location.pathname, new URLSearchParams(location.search).get('role')),
              location.pathname,
            )}
          >
            <CircleHelp size={17} /> Yardım merkezi
          </Link>
        </div>
      </header>
      {portal && (
        <PageNavigation
          items={items.map(([slug, label]) => ({
            to: `/${role}/${slug}`,
            label,
            includeDescendants: true,
          }))}
        />
      )}
      <main id="main" className="standalone-surface" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
