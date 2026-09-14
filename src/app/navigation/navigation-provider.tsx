import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { initialTabs, tabsReducer, type TabsState } from './tab-model';
const Context = createContext<{ state: TabsState; close: (path: string) => void }>({
  state: initialTabs,
  close: () => {},
});
function restore(): TabsState {
  try {
    const value = JSON.parse(sessionStorage.getItem('jamaster:working-tabs') || 'null');
    if (
      value &&
      Array.isArray(value.tabs) &&
      value.tabs.length &&
      value.tabs.every(
        (t: { path: unknown; search: unknown }) =>
          typeof t.path === 'string' &&
          /^\/(admin|super|user)\//.test(t.path) &&
          typeof t.search === 'string',
      ) &&
      value.tabs.some((t: { path: string }) => t.path === value.active)
    )
      return value;
  } catch {
    /* A fresh session starts with General pages. */
  }
  return initialTabs;
}
export function NavigationProvider({ children }: { children: ReactNode }) {
  const location = useLocation(),
    navigate = useNavigate();
  const [state, dispatch] = useReducer(tabsReducer, undefined, restore);
  useEffect(() => {
    if (location.pathname === '/') {
      void navigate('/admin/dashboard', { replace: true });
      return;
    }
    dispatch({ type: 'visit', path: location.pathname, search: location.search });
  }, [location.pathname, location.search, navigate]);
  useEffect(() => {
    try {
      sessionStorage.setItem('jamaster:working-tabs', JSON.stringify(state));
    } catch {
      /* Storage may be unavailable in file previews. */
    }
  }, [state]);
  const close = (path: string) => {
    const next = tabsReducer(state, { type: 'close', path });
    dispatch({ type: 'close', path });
    if (path === location.pathname) {
      const tab = next.tabs.find((t) => t.path === next.active)!;
      void navigate(tab.path + tab.search);
    }
  };
  return <Context.Provider value={{ state, close }}>{children}</Context.Provider>;
}
export const useWorkingTabs = () => useContext(Context);
