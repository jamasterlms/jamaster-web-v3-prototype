import { useEffect, useRef } from 'react';
import { Save, Undo2 } from 'lucide-react';
import { BulkActionBar } from './bulk-action-bar';
import { Button } from '@/components/ui/button';

export function SaveActionBar({
  count,
  onDiscard,
  onSave,
  form,
  label = 'Kaydedilmemiş değişiklikler',
  busy = false,
}: {
  count: number;
  onDiscard: () => void;
  onSave?: () => void;
  form?: string;
  label?: string;
  busy?: boolean;
}) {
  const lastField = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const remember = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (
        target?.matches('input,textarea,button[role=combobox],.editable-setting-value') &&
        (!form || target.closest('form')?.id === form)
      )
        lastField.current = target;
    };
    document.addEventListener('focusin', remember);
    return () => document.removeEventListener('focusin', remember);
  }, [form]);
  const afterAction = (action?: () => void) => {
    action?.();
    requestAnimationFrame(() => {
      // Keep validation's explicit focus. Restore only if the saved/cleared bar disappeared.
      if (document.activeElement !== document.body) return;
      const previous = lastField.current;
      const target = previous?.id
        ? document.getElementById(previous.id)
        : previous?.isConnected
          ? previous
          : null;
      const fallback = form ? document.getElementById(form) : null;
      if (target) target.focus({ preventScroll: true });
      else if (fallback) {
        fallback.tabIndex = -1;
        fallback.focus({ preventScroll: true });
      }
    });
  };
  return (
    <BulkActionBar
      count={count}
      countLabel="değişiklik"
      label={label}
      onClear={() => afterAction(onDiscard)}
      saveActions
      busy={busy}
    >
      <Button type="button" variant="ghost" disabled={busy} onClick={() => afterAction(onDiscard)}>
        <Undo2 size={16} />
        Vazgeç
      </Button>
      <Button
        type={form ? 'submit' : 'button'}
        form={form}
        onClick={() => afterAction(onSave)}
        disabled={busy}
      >
        <Save size={16} />
        {busy ? 'Kaydediliyor' : 'Değişiklikleri kaydet'}
      </Button>
    </BulkActionBar>
  );
}
