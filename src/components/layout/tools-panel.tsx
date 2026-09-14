import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useDisplay } from '@/app/display-provider';
import { Icon } from '@/components/shared/icon';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useToolsDrawer } from '@/hooks/use-mobile';
import { DailyPanel } from './daily-panel';
export function ToolsPanel() {
  const display = useDisplay(),
    mobile = useToolsDrawer(),
    location = useLocation();
  const opener = useRef<HTMLButtonElement | null>(null),
    previousPath = useRef(location.pathname);
  const mobileNav = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const nav = mobileNav.current;
    if (!nav) return;
    const measure = () =>
      document.documentElement.style.setProperty(
        '--mobile-tools-height',
        `${nav.getBoundingClientRect().height}px`,
      );
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    measure();
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--mobile-tools-height');
    };
  }, []);
  useEffect(() => {
    if (!mobile) display.setMobileOpen(false);
  }, [mobile, display.setMobileOpen]);
  useEffect(() => {
    if (location.pathname !== previousPath.current) display.setMobileOpen(false);
    previousPath.current = location.pathname;
  }, [location.pathname, display.setMobileOpen]);
  return (
    <>
      {!mobile && display.toolsOpen && <DailyPanel />}
      <Drawer
        open={mobile && display.mobileOpen}
        onOpenChange={display.setMobileOpen}
        repositionInputs={false}
        autoFocus
      >
        <nav ref={mobileNav} className="mobile-tools" aria-label="Günlük araçlar">
          {(['daily', 'jamai'] as const).map((tool) => (
            <DrawerTrigger asChild key={tool}>
              <Button
                variant="ghost"
                onClick={(event) => {
                  opener.current = event.currentTarget;
                  display.setPreview(null);
                  display.setTool(tool);
                }}
              >
                <Icon name={tool === 'daily' ? 'calendar-days' : 'sparkles'} />
                {tool === 'daily' ? 'Günlük akış' : 'JamAI'}
              </Button>
            </DrawerTrigger>
          ))}
        </nav>
        <DrawerContent
          className="tools-drawer"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const target = opener.current;
            if (target?.isConnected && target.getClientRects().length)
              target.focus({ preventScroll: true });
          }}
        >
          <DrawerHeader className="sr-only">
            <DrawerTitle>Çalışma alanı araçları</DrawerTitle>
            <DrawerDescription>Günlük akış, JamAI ve hızlı önizleme.</DrawerDescription>
          </DrawerHeader>
          <DailyPanel mobile />
        </DrawerContent>
      </Drawer>
    </>
  );
}
