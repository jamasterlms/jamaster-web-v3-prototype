import type { EntityRef } from '@/features/entities/entity-model';
import { emptyPreview, movePreview, openPreview } from '@/features/entities/preview-model';
import { eventDay } from '@/lib/calendar';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
export const displayScales = [70, 75, 80, 85, 90, 100, 110, 125, 150];
type Tool = 'daily' | 'jamai';
const defaults = {
  dailyDay: eventDay(),
  scale: 100,
  toolsOpen: true,
  tool: 'daily' as Tool,
};
const Context = createContext({
  ...defaults,
  setDailyDay: (_: number) => {},
  setScale: (_: number) => {},
  setToolsOpen: (_: boolean) => {},
  setTool: (_: Tool) => {},
  preview: null as EntityRef | null,
  setPreview: (_: EntityRef | null) => {},
  openPreview: (_: EntityRef, _collection?: EntityRef[]) => {},
  previousPreview: () => {},
  nextPreview: () => {},
  previewIndex: -1,
  previewCount: 0,
  mobileOpen: false,
  setMobileOpen: (_: boolean) => {},
});
export function DisplayProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<typeof defaults>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('jamaster:display') || '{}');
      return {
        ...defaults,
        scale: displayScales.includes(saved?.scale) ? saved.scale : defaults.scale,
        toolsOpen: typeof saved?.toolsOpen === 'boolean' ? saved.toolsOpen : defaults.toolsOpen,
        tool: saved?.tool === 'jamai' ? 'jamai' : 'daily',
        dailyDay:
          Number.isInteger(saved?.dailyDay) && Math.abs(saved.dailyDay) < 100000
            ? saved.dailyDay
            : defaults.dailyDay,
      };
    } catch {
      return defaults;
    }
  });
  const [previewState, setPreviewState] = useState(emptyPreview);
  const preview = previewState.items[previewState.index] || null;
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--ui-scale',
      String(displayScales.includes(settings.scale) ? settings.scale / 100 : 1),
    );
    try {
      localStorage.setItem('jamaster:display', JSON.stringify(settings));
    } catch {}
  }, [settings]);
  return (
    <Context.Provider
      value={{
        ...settings,
        preview,
        setPreview: (entity) =>
          setPreviewState((v) => (entity ? openPreview(v, entity) : emptyPreview)),
        openPreview: (entity, collection) =>
          setPreviewState((v) => openPreview(v, entity, collection)),
        previousPreview: () => setPreviewState((v) => movePreview(v, -1)),
        nextPreview: () => setPreviewState((v) => movePreview(v, 1)),
        previewIndex: previewState.index,
        previewCount: previewState.items.length,
        mobileOpen,
        setMobileOpen,
        setDailyDay: (dailyDay) => setSettings((v) => ({ ...v, dailyDay })),
        setScale: (scale) => {
          if (displayScales.includes(scale)) setSettings((v) => ({ ...v, scale }));
        },
        setToolsOpen: (toolsOpen) => setSettings((v) => ({ ...v, toolsOpen })),
        setTool: (tool) => setSettings((v) => ({ ...v, tool })),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useDisplay = () => useContext(Context);
