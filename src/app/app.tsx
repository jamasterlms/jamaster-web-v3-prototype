import { isStandaloneRoute } from './navigation/route-layout';
import { StandaloneLayout } from '@/features/access/standalone-layout';
import { KeyboardToolbar } from '@/components/forms/keyboard-toolbar';
import { entityFromPath } from '@/features/entities/entity-model';
import { useEntityNavigation } from '@/features/entities/use-entity-navigation';
import { resetFailedPages, type PageComponents } from './page-loaders';
import { usePagePreloading } from './navigation/use-page-preloading';
import { ErrorBoundary } from './error-boundary';
import { useVisualViewport } from '@/hooks/use-visual-viewport';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { PageTabs } from '@/components/layout/page-tabs';
import { ToolsPanel } from '@/components/layout/tools-panel';
import { Topbar } from '@/components/layout/topbar';
import { AppDialogs } from '@/components/shared/app-dialogs';
import { SidebarProvider } from '@/components/ui/sidebar';
import { pageFor } from '@/data/navigation';
import { useRoute } from '@/hooks/use-route';
import { useEffect, useLayoutEffect } from 'react';
import { Toaster } from 'sonner';
import { useDisplay } from './display-provider';
import { PageRouter } from './page-router';
import { useWorkspace } from './workspace-provider';
const scrollPositions = new Map<string, number>();
export function App({ pages }: { pages?: PageComponents } = {}) {
  // BrowserRouter transitions keep the current screen visible until its replacement is ready.
  // Only main.tsx owns Suspense, so navigation cannot mount a fresh blank/loading boundary.
  usePagePreloading();
  useVisualViewport();
  const route = useRoute();
  const openEntity = useEntityNavigation();
  const display = useDisplay();
  const { state } = useWorkspace();
  useEffect(() => display.setPreview(null), [state.branch]);
  useLayoutEffect(() => {
    const key = `${state.branch}:${route}`;
    window.scrollTo({ top: scrollPositions.get(key) || 0, behavior: 'instant' });
    return () => {
      scrollPositions.set(key, window.scrollY);
    };
  }, [route, state.branch]);
  useEffect(() => {
    document.title = `${pageFor(route).title} · Jamaster`;
  }, [route]);
  if (isStandaloneRoute(route))
    return (
      <StandaloneLayout route={route.split('?')[0]}>
        <ErrorBoundary key={route.split('?')[0]} onRetry={resetFailedPages}>
          <PageRouter route={route} pages={pages} />
        </ErrorBoundary>
        <KeyboardToolbar />
        <Toaster position="bottom-center" richColors closeButton />
      </StandaloneLayout>
    );
  return (
    <SidebarProvider defaultOpen={false} className={state.privacy ? 'privacy-on' : ''}>
      <a
        href="#main"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        İçeriğe geç
      </a>
      <div
        className="app-shell"
        onClickCapture={(event) => {
          const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
          if (
            !anchor ||
            anchor.closest('.working-tabs-bar,.page-navigation,[data-entity-table]') ||
            anchor.hasAttribute('data-full-page') ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey
          )
            return;
          const entity = entityFromPath(anchor.getAttribute('href') || '');
          if (entity) {
            event.preventDefault();
            event.stopPropagation();
            openEntity(entity, event.detail > 1);
          }
        }}
        onDoubleClickCapture={(event) => {
          const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
          const entity = anchor && entityFromPath(anchor.getAttribute('href') || '');
          if (entity) {
            event.preventDefault();
            event.stopPropagation();
            openEntity(entity, true);
          }
        }}
      >
        <AppSidebar />
        <div className="workspace">
          <Topbar />
          <div className={`workspace-body ${display.toolsOpen ? '' : 'tools-collapsed'}`}>
            <div className="main-column">
              <PageTabs />
              <main id="main" className="main-surface" tabIndex={-1}>
                <ErrorBoundary
                  key={`${state.branch}:${route.split('?')[0]}`}
                  onRetry={resetFailedPages}
                >
                  <PageRouter route={route} pages={pages} />
                </ErrorBoundary>
              </main>
              <footer className="workspace-footer">
                <span>
                  jamaster<span className="footer-dot">.</span>
                </span>
                <span>Her şey bir arada.</span>
                <span>
                  {new Date().toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    weekday: 'long',
                  })}
                </span>
              </footer>
            </div>
            <ToolsPanel />
          </div>
        </div>
      </div>
      <AppDialogs />
      <KeyboardToolbar />
      <Toaster position="bottom-center" richColors closeButton />
    </SidebarProvider>
  );
}
