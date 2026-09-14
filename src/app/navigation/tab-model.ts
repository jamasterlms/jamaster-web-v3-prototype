export const defaultTabs = [
  '/admin/dashboard',
  '/admin/calendar',
  '/admin/reports/monthly-meetings',
];
export type WorkingTab = { path: string; search: string };
export type TabsState = { tabs: WorkingTab[]; active: string };
export const initialTabs: TabsState = {
  tabs: defaultTabs.map((path) => ({ path, search: '' })),
  active: defaultTabs[0],
};
export type TabAction =
  | { type: 'visit'; path: string; search?: string }
  | { type: 'close'; path: string };
export function tabsReducer(state: TabsState, action: TabAction): TabsState {
  if (action.type === 'visit') {
    // Payment-link tokens and standalone authentication/portal URLs do not belong in persisted workspace tabs.
    if (!/^\/(admin|super|user)\//.test(action.path)) return state;
    const tab = { path: action.path, search: action.search ?? '' };
    return {
      active: action.path,
      tabs: state.tabs.some((t) => t.path === action.path)
        ? state.tabs.map((t) => (t.path === action.path ? tab : t))
        : [...state.tabs, tab],
    };
  }
  const index = state.tabs.findIndex((t) => t.path === action.path);
  const tabs = state.tabs.filter((t) => t.path !== action.path);
  if (!tabs.length) return initialTabs;
  return {
    tabs,
    active: state.active === action.path ? tabs[Math.max(0, index - 1)].path : state.active,
  };
}
