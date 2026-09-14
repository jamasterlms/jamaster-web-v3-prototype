import { PrototypePaymentProvider } from '@/features/payment/payment-provider';
import { PrototypeToolsProvider } from '@/features/prototype/prototype-tools';
import { BulkActionsProvider } from '@/components/shared/bulk-action-bar';
import { ErrorBoundary } from '@/app/error-boundary';
import { AppLoading } from '@/components/shared/app-loading';
import { DisplayProvider } from '@/app/display-provider';
import { NavigationProvider } from '@/app/navigation/navigation-provider';
import { WorkspaceProvider } from '@/app/workspace-provider';
import { OperationsProvider } from '@/features/operations/operations-provider';
import { NavigationBridge } from '@/hooks/use-route';
import '@/styles/theme.css';
import '@/styles/base.css';
import '@/styles/layout.css';
import '@/styles/sidebar.css';
import '@/styles/working-tabs.css';
import '@/styles/tools.css';
import '@/styles/dashboard.css';
import '@/styles/pages.css';
import '@/styles/dialogs.css';
import '@/styles/refinements.css';
import '@/styles/payment.css';
import '@/styles/access-help.css';
import '@/styles/floating-actions.css';
import '@/styles/review-september.css';
import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
const Router = window.location.protocol === 'file:' ? MemoryRouter : BrowserRouter;
const App = lazy(() => import('@/app/app').then((module) => ({ default: module.App })));
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Router useTransitions>
        <NavigationBridge />
        <NavigationProvider>
          <OperationsProvider>
            <WorkspaceProvider>
              <PrototypePaymentProvider>
                <DisplayProvider>
                  <Suspense fallback={<AppLoading />}>
                    <BulkActionsProvider>
                      <PrototypeToolsProvider>
                        <App />
                      </PrototypeToolsProvider>
                    </BulkActionsProvider>
                  </Suspense>
                </DisplayProvider>
              </PrototypePaymentProvider>
            </WorkspaceProvider>
          </OperationsProvider>
        </NavigationProvider>
      </Router>
    </ErrorBoundary>
  </StrictMode>,
);
