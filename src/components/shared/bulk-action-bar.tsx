import {
  createContext,
  useContext,
  useEffect,
  useId,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { CheckCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BulkActionHost = createContext<HTMLElement | null>(null);

/** One fixed layer also keeps multiple selected tables from covering one another. */
export function BulkActionsProvider({ children }: PropsWithChildren) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!host) return;
    const measure = () => {
      const height = host.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--bulk-actions-height', `${height}px`);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    measure();
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--bulk-actions-height');
    };
  }, [host]);
  return (
    <BulkActionHost.Provider value={host}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(<div className="bulk-action-stack" ref={setHost} />, document.body)}
    </BulkActionHost.Provider>
  );
}

export function BulkActionBar({
  count,
  onClear,
  children,
  summary,
  label = 'Toplu işlemler',
  busy = false,
  countLabel = 'seçildi',
  saveActions = false,
}: PropsWithChildren<{
  count: number;
  onClear: () => void;
  summary?: ReactNode;
  label?: string;
  busy?: boolean;
  countLabel?: string;
  saveActions?: boolean;
}>) {
  const host = useContext(BulkActionHost);
  const id = useId();
  if (count < 1 || !host) return null;
  return createPortal(
    <section
      className="bulk-action-bar"
      data-save-actions={saveActions || undefined}
      aria-label={label}
      aria-describedby={id}
      onPointerDownCapture={(event) => {
        if (saveActions && document.documentElement.dataset.keyboardOpen === 'true')
          event.preventDefault();
      }}
    >
      <div className="bulk-action-summary">
        <span className="bulk-selection-count" id={id} role="status">
          <CheckCheck size={17} />
          {count} {countLabel}
        </span>
        {summary}
      </div>
      <div className="bulk-action-buttons">{children}</div>
      {!saveActions && (
        <Button
          type="button"
          className="bulk-clear"
          variant="ghost"
          size="icon"
          aria-label={saveActions ? 'Değişikliklerden vazgeç' : 'Seçimi temizle'}
          title={saveActions ? 'Değişikliklerden vazgeç' : 'Seçimi temizle'}
          disabled={busy}
          onClick={onClear}
        >
          <X size={17} />
        </Button>
      )}
    </section>,
    host,
  );
}
