import { Component, startTransition, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
export class ErrorBoundary extends Component<
  { children: ReactNode; onRetry?: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="error-recovery" role="alert">
        <h1>Bu görünüm açılamadı</h1>
        <p>Sayfayı yeniden yükleyebilir veya menüden başka bir sayfaya geçebilirsiniz.</p>
        <div className="form-actions">
          <Button
            variant="outline"
            onClick={() => {
              this.props.onRetry?.();
              startTransition(() => this.setState({ failed: false }));
            }}
          >
            Tekrar dene
          </Button>
          <Button onClick={() => window.location.reload()}>Sayfayı yenile</Button>
        </div>
      </section>
    );
  }
}
