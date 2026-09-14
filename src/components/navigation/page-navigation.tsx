import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { Link, useLocation } from 'react-router-dom';
export function PageNavigation({
  items,
}: {
  items: { to: string; label: string; count?: number; includeDescendants?: boolean }[];
}) {
  const { pathname, search } = useLocation();
  const currentParams = new URLSearchParams(search);
  const queryKeys = new Set(
    items.flatMap((item) => {
      const [path, query] = item.to.split('?');
      return path === pathname ? [...new URLSearchParams(query).keys()] : [];
    }),
  );
  return (
    <NavigationMenu viewport={false} className="page-navigation" aria-label="Alt sayfalar">
      <NavigationMenuList>
        {items.map((item) => {
          const [path, query] = item.to.split('?');
          const itemParams = new URLSearchParams(query);
          const active =
            (path === pathname || (item.includeDescendants && pathname.startsWith(path + '/'))) &&
            [...queryKeys].every((key) => currentParams.get(key) === itemParams.get(key));
          return (
            <NavigationMenuItem key={item.to}>
              <NavigationMenuLink active={active} asChild>
                <Link to={item.to} aria-current={active ? 'page' : undefined}>
                  <span>{item.label}</span>
                  {item.count !== undefined && (
                    <span className="page-navigation-count">{item.count}</span>
                  )}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
