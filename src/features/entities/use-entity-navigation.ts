import { useDisplay } from '@/app/display-provider';
import { useToolsDrawer } from '@/hooks/use-mobile';
import { navigate } from '@/hooks/use-route';
import { entityPath, shouldPreview, type EntityRef } from './entity-model';
export function useEntityNavigation() {
  const display = useDisplay();
  const mobile = useToolsDrawer();
  return (entity: EntityRef, fullPage = false, collection?: EntityRef[]) => {
    if (
      shouldPreview({
        fullPage,
        drawer: mobile,
        toolsOpen: display.toolsOpen,
        mobileOpen: display.mobileOpen,
      })
    ) {
      display.openPreview(entity, collection);
    } else {
      display.setPreview(null);
      display.setMobileOpen(false);
      navigate(entityPath(entity));
    }
  };
}
