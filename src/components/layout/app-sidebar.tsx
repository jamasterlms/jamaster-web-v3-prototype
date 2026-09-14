import { navIsActive } from '@/app/navigation/nav-active';
import { useWorkspace } from '@/app/workspace-provider';
import { Icon } from '@/components/shared/icon';
import { IconButton } from '@/components/shared/primitives';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { navIcon, navigation, navRoute } from '@/data/navigation';
import { useCoarsePointer } from '@/hooks/use-mobile';
import { useRoute } from '@/hooks/use-route';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ProfileMenu } from './utility-menus';
export function AppSidebar() {
  const { open, setOpen, isMobile, setOpenMobile } = useSidebar();
  const coarse = useCoarsePointer();
  const { state, openModal } = useWorkspace();
  const route = useRoute();
  const { search } = useLocation();
  const active = (path: string) => navIsActive(navRoute(path), route, search);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileOpen = useRef(false);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const close = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
    setOpenMobile(false);
  };
  const cancelTimer = () => {
    if (timer.current) clearTimeout(timer.current);
  };
  const labelVisible = open || isMobile;
  return (
    <>
      <Sidebar
        collapsible="icon"
        className={cn('jam-sidebar', labelVisible && 'expanded')}
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse' && !coarse) {
            cancelTimer();
            timer.current = setTimeout(() => setOpen(true), 300);
          }
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse' && !coarse && !profileOpen.current) {
            cancelTimer();
            timer.current = setTimeout(() => setOpen(false), 200);
          }
        }}
        onBlur={(event) => {
          if (!profileOpen.current && !event.currentTarget.contains(event.relatedTarget as Node))
            close();
        }}
        onFocus={() => {
          if (!coarse) setOpen(true);
        }}
        onClickCapture={(event) => {
          if (coarse && !isMobile && !open) {
            event.preventDefault();
            event.stopPropagation();
            setOpen(true);
          }
        }}
      >
        <SidebarHeader className="jam-sidebar-header">
          <div className="rail-brand-row">
            <Link
              to="/admin/dashboard"
              className="brand"
              aria-label="Jamaster ana sayfa"
              onClick={close}
            >
              <img
                src={state.settings.logoBlack || `${import.meta.env.BASE_URL}assets/logo.png`}
                alt="Jamaster"
              />
            </Link>
            <span className="brand-wordmark">
              Jamaster <span>LMS</span>
            </span>
            <IconButton icon="x" label="Menüyü kapat" className="sidebar-close" onClick={close} />
          </div>
          <button
            className="rail-search"
            onClick={() => {
              close();
              openModal({ type: 'search' });
            }}
            aria-label="Hızlı arama"
          >
            <Icon name="search" />
            <span className="nav-label">Hızlı arama</span>
            <kbd>⌘K</kbd>
          </button>
        </SidebarHeader>
        <SidebarContent className="jam-sidebar-content">
          <nav className="sidebar-full-navigation" aria-label="Tüm sayfalar">
            {navigation.map((group, gi) => (
              <section className="nav-group" key={group.label}>
                <div className="nav-group-title">{group.label}</div>
                {group.items.map((item, ii) => {
                  const id = `${gi}-${ii}`,
                    current = navRoute(item.path),
                    hasChildren = !!item.children?.length,
                    childActive = item.children?.some((child) => active(child.path)),
                    isExpanded = expanded.has(id);
                  return (
                    <div className={cn('nav-item', isExpanded && 'expanded')} key={id}>
                      <Link
                        to={`/${current}`}
                        className={cn(
                          'rail-link',
                          hasChildren && 'has-children',
                          (active(item.path) || childActive) && 'active',
                        )}
                        title={item.label}
                        aria-label={item.label}
                        aria-current={active(item.path) ? 'page' : undefined}
                        onClick={close}
                      >
                        <Icon name={navIcon(item.icon)} />
                        <span className="nav-label">
                          {item.label}
                          {item.badge && <span className="nav-badge">{item.badge}</span>}
                        </span>
                      </Link>
                      {hasChildren && (
                        <>
                          <button
                            className="nav-disclosure"
                            aria-expanded={isExpanded}
                            aria-label={`${item.label} alt menüsü`}
                            onClick={() =>
                              setExpanded((previous) => {
                                const next = new Set(previous);
                                next.has(id) ? next.delete(id) : next.add(id);
                                return next;
                              })
                            }
                          >
                            <Icon name="chevron-right" />
                          </button>
                          <div className="nav-children">
                            {item.children!.map((child) => (
                              <Link
                                to={`/${navRoute(child.path)}`}
                                key={child.path}
                                title={child.label}
                                aria-label={child.label}
                                className={cn('nav-child', active(child.path) && 'active')}
                                onClick={close}
                              >
                                <span className="nav-child-marker" aria-hidden="true" />
                                <span className="nav-label">
                                  {child.label}
                                  {child.badge && <span className="nav-badge">{child.badge}</span>}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </section>
            ))}
          </nav>
        </SidebarContent>
        <SidebarFooter className="jam-sidebar-footer">
          <button
            className="rail-link"
            onClick={() => {
              close();
              openModal({ type: 'help' });
            }}
            title="Yardım"
          >
            <Icon name="circle-help" />
            <span className="nav-label">Yardım merkezi</span>
          </button>
          <ProfileMenu
            rail
            onOpenChange={(value) => {
              profileOpen.current = value;
              if (value) {
                cancelTimer();
                setOpen(true);
              }
            }}
          />
        </SidebarFooter>
      </Sidebar>
      {coarse && !isMobile && open && (
        <button className="sidebar-scrim" onClick={close} aria-label="Menüyü kapat" />
      )}
    </>
  );
}
