import { useLayoutEffect, useRef, useState } from 'react';
import { tabDensity } from '@/app/navigation/tab-density';
import { useWorkingTabs } from '@/app/navigation/navigation-provider';
import { Icon } from '@/components/shared/icon';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { pageFor } from '@/data/navigation';
import { Link, useLocation } from 'react-router-dom';
export function PageTabs() {
  const tabList = useRef<HTMLUListElement>(null);
  const restoreFocus = useRef(false);
  const [density, setDensity] = useState<0 | 1 | 2 | 3>(0);
  const { state, close } = useWorkingTabs(),
    { pathname } = useLocation();
  useLayoutEffect(() => {
    const list = tabList.current;
    if (!list) return;
    const revealActive = () => {
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      setDensity(tabDensity(state.tabs.length, list.clientWidth / rem));
      const active = list.querySelector<HTMLElement>('.working-tab.active');
      if (!active) return;
      const bounds = list.getBoundingClientRect();
      const tab = active.getBoundingClientRect();
      if (tab.left < bounds.left) list.scrollLeft += tab.left - bounds.left;
      else if (tab.right > bounds.right) list.scrollLeft += tab.right - bounds.right;
      if (restoreFocus.current) {
        active.querySelector<HTMLAnchorElement>('.page-tab')?.focus({ preventScroll: true });
        restoreFocus.current = false;
      }
    };
    revealActive();
    const observer = new ResizeObserver(revealActive);
    observer.observe(list);
    return () => observer.disconnect();
  }, [pathname, state.tabs.length]);
  return (
    <div className="working-tabs-bar" data-density={density}>
      <NavigationMenu className="working-tabs" viewport={false} aria-label="Açık çalışma sayfaları">
        <NavigationMenuList
          ref={tabList}
          className="page-tabs"
          style={{ '--tab-count': state.tabs.length } as React.CSSProperties}
        >
          {state.tabs.map((tab) => {
            const page = pageFor(tab.path.slice(1) + tab.search);
            return (
              <NavigationMenuItem
                onAuxClick={(event) => {
                  if (event.button === 1) {
                    event.preventDefault();
                    close(tab.path);
                  }
                }}
                key={tab.path}
                className={`working-tab ${tab.path === pathname ? 'active' : ''}`}
              >
                <NavigationMenuLink asChild active={tab.path === pathname}>
                  <Link
                    data-full-page
                    to={tab.path + tab.search}
                    className="page-tab"
                    title={page.title}
                    aria-current={tab.path === pathname ? 'page' : undefined}
                  >
                    <Icon name={page.icon} />
                    <span>{page.title}</span>
                  </Link>
                </NavigationMenuLink>
                <Button
                  variant="ghost"
                  size="icon"
                  className="tab-close"
                  title={`${page.title} sekmesini kapat`}
                  aria-label={`${page.title} sekmesini kapat`}
                  onClick={(event) => {
                    restoreFocus.current = event.detail === 0;
                    close(tab.path);
                  }}
                >
                  <Icon name="x" />
                </Button>
              </NavigationMenuItem>
            );
          })}
        </NavigationMenuList>
      </NavigationMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="tab-overflow" aria-label="Açık sayfalar">
            <Icon name="chevron-down" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="tab-overflow-list">
          {state.tabs.map((tab) => (
            <DropdownMenuItem key={tab.path} asChild>
              <Link data-full-page to={tab.path + tab.search}>
                {pageFor(tab.path.slice(1) + tab.search).title}
                {tab.path === pathname && <Icon name="check" />}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
