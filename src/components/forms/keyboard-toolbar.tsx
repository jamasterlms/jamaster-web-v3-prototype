import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/shared/icon';
import { isSoftwareKeyboardVisible } from '@/lib/keyboard-viewport';
const selector =
  'input:not([type=hidden]):not([type=file]):not([type=checkbox]):not([type=radio]),textarea,button[role=combobox],button.editable-setting-value';
export function KeyboardToolbar() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [viewport, setViewport] = useState({ top: 0, height: 0, open: false });
  useEffect(() => {
    let baseline = window.innerHeight;
    let layoutWidth = window.innerWidth;
    const rotate = () => {
      baseline = window.innerHeight;
    };
    window.addEventListener('orientationchange', rotate);
    const update = () => {
      if (window.innerWidth !== layoutWidth) {
        layoutWidth = window.innerWidth;
        baseline = window.innerHeight;
      }
      const element = document.activeElement as HTMLElement | null;
      const editable = element?.matches(
        'input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]),textarea',
      );
      const vv = window.visualViewport;
      baseline = Math.max(baseline, window.innerHeight, vv?.height || 0);
      const open =
        !!vv &&
        isSoftwareKeyboardVisible({
          editable: !!editable,
          coarse: window.matchMedia('(pointer:coarse)').matches,
          baseline,
          height: vv.height,
          scale: vv.scale,
        });
      if (editable) setTarget(element!);
      setViewport({ top: vv?.offsetTop || 0, height: vv?.height || window.innerHeight, open });
      document.documentElement.dataset.keyboardOpen = String(open);
      document.documentElement.style.setProperty(
        '--keyboard-toolbar-height',
        open ? '44px' : '0px',
      );
    };
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', update);
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    return () => {
      window.removeEventListener('orientationchange', rotate);
      document.removeEventListener('focusin', update);
      document.removeEventListener('focusout', update);
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
      delete document.documentElement.dataset.keyboardOpen;
      document.documentElement.style.removeProperty('--keyboard-toolbar-height');
    };
  }, []);
  const scope = target
    ? target.closest('[data-slot=popover-content],form,[role=dialog]') || target.ownerDocument
    : null;
  const inputs =
    target && scope
      ? Array.from(scope.querySelectorAll<HTMLElement>(selector)).filter(
          (e) => !e.matches(':disabled,[readonly]') && e.getClientRects().length > 0,
        )
      : [];
  const index = target ? inputs.indexOf(target) : -1;
  const move = (step: number) => {
    const next = inputs[index + step];
    if (next?.matches('.editable-setting-value')) {
      next.click();
      return;
    }
    next?.focus({ preventScroll: true });
    next?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };
  if (!viewport.open) return null;
  const container = target?.closest<HTMLElement>(
    '[data-slot="dialog-content"], [data-slot="sheet-content"], [data-slot="drawer-content"]',
  );
  // The drawer's bottom already reserves 44px above the keyboard. CSS anchoring follows
  // its resize/animation without a stale getBoundingClientRect read before the viewport RAF.
  const toolbarTop = viewport.top + viewport.height - 44;
  return createPortal(
    <div
      className="keyboard-toolbar"
      role="toolbar"
      aria-label="Form alanları"
      style={
        container?.dataset.slot === 'drawer-content'
          ? {
              position: 'absolute',
              top: '100%',
            }
          : { top: toolbarTop }
      }
      onPointerDown={(e) => e.preventDefault()}
    >
      <Button
        type="button"
        variant="ghost"
        aria-label="Önceki alan"
        disabled={index <= 0}
        onClick={() => move(-1)}
      >
        <Icon name="chevron-up" />
        Geri
      </Button>
      <Button
        type="button"
        variant="ghost"
        aria-label="Sonraki alan"
        disabled={index < 0 || index >= inputs.length - 1}
        onClick={() => move(1)}
      >
        İleri
        <Icon name="chevron-down" />
      </Button>
      <Button type="button" variant="ghost" onClick={() => target?.blur()}>
        <Icon name="keyboard" />
        Klavyeyi kapat
      </Button>
    </div>,
    container || document.body,
  );
}
