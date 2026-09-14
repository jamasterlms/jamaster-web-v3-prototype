import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { useDisplay, displayScales } from '@/app/display-provider';
import { useWorkspace } from '@/app/workspace-provider';
import { Icon } from '@/components/shared/icon';
import { Avatar, IconButton } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { useSidebar } from '@/components/ui/sidebar';
import { useToolsDrawer, useCoarsePointer } from '@/hooks/use-mobile';
import { operationalData } from '@/data/institution';
import { useState } from 'react';
import { toast } from 'sonner';
import { NotificationsMenu, ProfileMenu } from './utility-menus';
export function Topbar() {
  const { state, dispatch } = useWorkspace();
  const { isMobile, toggleSidebar } = useSidebar();
  const coarse = useCoarsePointer();
  const display = useDisplay();
  const drawer = useToolsDrawer();
  const toolsVisible = drawer ? display.mobileOpen : display.toolsOpen;
  const go = useNavigate();
  const [locked, setLocked] = useState(false);
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      toast('Tarayıcınızın tam ekran seçeneğini kullanabilirsiniz.');
    }
  };
  return (
    <>
      <header className="topbar">
        <div className="topbar-primary flex items-center gap-3 min-w-0">
          {(isMobile || coarse) && (
            <IconButton icon="menu" label="Menüyü aç" onClick={toggleSidebar} />
          )}
          <IconButton
            icon="arrow-left"
            label="Geri dön"
            className="back-button"
            onClick={() => void go(-1)}
          />
          <div className="branch-control">
            <span className="eyebrow">ÇALIŞMA ALANI</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="branch-button" aria-label={`Şube değiştir: ${state.branch}`}>
                  <span>{state.branch}</span>
                  <Icon name="chevron-down" className="small" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Şube değiştir</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {[
                  ...new Set([
                    state.branch,
                    ...(state.moduleRows.branches || operationalData.branches.rows)
                      .filter((row) => row[4] === 'Aktif')
                      .map((row) => row[0]),
                  ]),
                ].map((branch) => (
                  <DropdownMenuItem
                    key={branch}
                    onSelect={() => dispatch({ type: 'branch/set', branch })}
                  >
                    {branch}
                    {branch === state.branch && <Icon name="check" className="small ml-auto" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="topbar-actions flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="topbar-more"
                aria-label="Diğer araçlar"
              >
                <Icon name="more-horizontal" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Çalışma alanı araçları</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => dispatch({ type: 'privacy/toggle' })}>
                <Icon name={state.privacy ? 'eye' : 'eye-off'} />
                {state.privacy ? 'Tutarları göster' : 'Tutarları gizle'}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setLocked(true)}>
                <Icon name="lock-keyhole" />
                Ekranı kilitle
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void fullscreen()}>
                <Icon name="maximize" />
                Tam ekran
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Icon name="sliders-horizontal" />
                  Ölçek · %{display.scale}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={String(display.scale)}
                    onValueChange={(value) => display.setScale(Number(value))}
                  >
                    {displayScales.map((scale) => (
                      <DropdownMenuRadioItem key={scale} value={String(scale)}>
                        %{scale}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
          <NotificationsMenu />
          <Button
            variant="ghost"
            size="icon"
            className="tools-toggle topbar-tool-toggle"
            id="workspace-tools-toggle"
            aria-label={toolsVisible ? 'Araçları kapat' : 'Araçları aç'}
            aria-expanded={toolsVisible}
            aria-controls={
              toolsVisible ? (drawer ? 'mobile-tools-panel' : 'workspace-tools-panel') : undefined
            }
            onClick={() =>
              drawer
                ? display.setMobileOpen(!display.mobileOpen)
                : display.setToolsOpen(!display.toolsOpen)
            }
          >
            <Icon name="panel-right" />
          </Button>
          <ProfileMenu />
        </div>
      </header>
      <Dialog open={locked} onOpenChange={setLocked}>
        <DialogContent className="lock-card" showCloseButton={false} preventOutsideClose>
          <Avatar name="Furkan Çolak" className="profile-avatar" />
          <DialogTitle>Ekran kilitlendi</DialogTitle>
          <DialogDescription>Furkan Çolak · {state.branch}</DialogDescription>
          <Button onClick={() => setLocked(false)}>Devam et</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
