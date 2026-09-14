import { lazyPages } from '../page-loaders';
import { resolvePage, type PageName } from './resolve-page';

/** Use the renderer's exact route matcher, including legacy links and their query strings. */
export function pageNameForPath(path: string): PageName | null {
  for (let redirects = 0; redirects < 5; redirects++) {
    const match = resolvePage(path);
    if (!match) return null;
    if ('name' in match) return match.name;
    path = match.redirect;
  }
  return null;
}

export function preloadPage(path: string): Promise<unknown> {
  const name = pageNameForPath(path);
  return name ? lazyPages[name].preload() : Promise.resolve();
}
