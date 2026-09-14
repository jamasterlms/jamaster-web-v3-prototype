import {
  createContext,
  useContext,
  useEffect,
  useId,
  useState,
  type PropsWithChildren,
} from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import {
  CodeXml,
  ArrowUpRight,
  LogIn,
  Users,
  GraduationCap,
  PanelTop,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const PrototypeTools = createContext<{ host: HTMLElement | null; close: () => void }>({
  host: null,
  close: () => {},
});
export const usePrototypeTools = () => useContext(PrototypeTools);

/** Presentation controls live outside the product surface. This is not an authorization boundary. */
export function PrototypeToolsProvider({ children }: PropsWithChildren) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const titleId = useId();
  useEffect(() => setOpen(false), [location.pathname, location.search]);
  const queryRole = new URLSearchParams(location.search).get('role');
  const role =
    location.pathname.startsWith('/teacher') || queryRole === 'teacher'
      ? 'teacher'
      : location.pathname.startsWith('/student') || queryRole === 'student'
        ? 'student'
        : 'user';
  const enabled = import.meta.env?.VITE_PROTOTYPE_TOOLS !== 'false';
  return (
    <PrototypeTools.Provider value={{ host: enabled ? host : null, close: () => setOpen(false) }}>
      {children}
      {enabled &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="prototype-dock">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  className="prototype-dock-trigger"
                  aria-label="Prototip araçlarını aç"
                  title="Prototip araçları"
                >
                  <CodeXml size={17} />
                  <span>Prototip</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="prototype-tools-menu"
                side="top"
                align="start"
                sideOffset={10}
                aria-labelledby={titleId}
                onInteractOutside={(event) => {
                  // Slot content retains its page React ancestry; Radix also checks that tree.
                  // Treat the slot DOM and its explicitly owned select portals as inside.
                  const target = event.detail.originalEvent.target;
                  if (
                    target instanceof Element &&
                    (host?.contains(target) || target.closest('[data-prototype-tools-overlay]'))
                  )
                    event.preventDefault();
                }}
              >
                <div className="prototype-tools-heading">
                  <CodeXml size={18} />
                  <div>
                    <h2 id={titleId}>Prototip araçları</h2>
                    <p>Sunum ve senaryo kontrolleri</p>
                  </div>
                </div>
                <nav className="prototype-tools-links" aria-label="Prototip ekranları">
                  {[
                    { to: '/admin/dashboard', label: 'Panele dön', icon: PanelTop },
                    { to: `/login?role=${role}`, label: 'Giriş ekranı', icon: LogIn },
                    { to: '/payment', label: 'Ödeme merkezi', icon: CreditCard },
                    { to: '/student/dashboard', label: 'Öğrenci portalı', icon: Users },
                    { to: '/teacher/dashboard', label: 'Öğretmen portalı', icon: GraduationCap },
                    {
                      to: `/access/examples?role=${role}`,
                      label: 'Erişim durumları',
                      icon: ShieldCheck,
                    },
                  ].map(({ to, label, icon: ItemIcon }) => (
                    <Button key={to} asChild variant="ghost" onClick={() => setOpen(false)}>
                      <Link to={to}>
                        <ItemIcon size={17} />
                        <span>{label}</span>
                        <ArrowUpRight size={14} />
                      </Link>
                    </Button>
                  ))}
                </nav>
                <div ref={setHost} className="prototype-tools-sections" />
              </PopoverContent>
            </Popover>
          </div>,
          document.body,
        )}
    </PrototypeTools.Provider>
  );
}

/** A portal preserves page state and callbacks without duplicating controls in the product UI. */
export function PrototypeToolsSection({ title, children }: PropsWithChildren<{ title: string }>) {
  const { host } = useContext(PrototypeTools);
  const id = useId();
  return host
    ? createPortal(
        <section className="prototype-tools-section" aria-labelledby={id}>
          <h3 id={id}>{title}</h3>
          {children}
        </section>,
        host,
      )
    : null;
}
