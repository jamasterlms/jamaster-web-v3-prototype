import { createElement, type ComponentType } from 'react';
import { lazyPages, type PageComponents } from './page-loaders';
import { resolvePage } from './navigation/resolve-page';
import { PageHeading } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { Link, Navigate, useLocation } from 'react-router-dom';

export function PageRouter({
  route,
  pages = lazyPages,
}: {
  route: string;
  pages?: PageComponents;
}) {
  const { search } = useLocation();
  const match = resolvePage(route, search);
  if (match && 'redirect' in match) return <Navigate to={match.redirect} replace />;
  if (match) {
    // resolvePage checks the props for each page at the point the match is created.
    const Page = pages[match.name] as ComponentType<typeof match.props>;
    return createElement(Page, { ...match.props, key: route.split(/[?#]/)[0] });
  }
  return (
    <>
      <PageHeading
        title="Sayfa bulunamadı"
        description="Menüden bir çalışma alanı seçebilirsiniz."
      />
      <Button asChild>
        <Link
          to={
            route.startsWith('teacher/')
              ? '/teacher/dashboard'
              : route.startsWith('student/')
                ? '/student/dashboard'
                : '/admin/dashboard'
          }
        >
          Çalışma alanına dön
        </Link>
      </Button>
    </>
  );
}
