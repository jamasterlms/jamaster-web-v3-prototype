import {
  workspaceNotifications,
  readNotificationIds,
} from '@/features/settings/notification-model';
import { eventDay } from '@/lib/calendar';
import { useDisplay, displayScales } from '@/app/display-provider';
import { useWorkspace } from '@/app/workspace-provider';
import { Icon } from '@/components/shared/icon';
import { Avatar } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Link } from 'react-router-dom';
import { useState } from 'react';
export function ProfileMenu({
  rail = false,
  onOpenChange,
}: {
  rail?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { state } = useWorkspace();
  const name = state.settings.profileName || 'Furkan Çolak';
  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={rail ? 'rail-profile' : 'profile-trigger'}
          aria-label="Profil menüsü"
        >
          <span className={rail ? 'profile-icon-slot' : undefined}>
            <Avatar
              name={name}
              src={state.settings.profileImage}
              className={rail ? 'profile-avatar' : 'top-avatar'}
            />
          </span>
          {rail && (
            <span className="nav-label">
              <b>{name}</b>
              <small>Şube yöneticisi</small>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={rail ? 'right' : 'bottom'} align="end">
        <DropdownMenuLabel>
          {name}
          <small className="block text-muted-foreground">Şube yöneticisi</small>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/payment">
            <Icon name="wallet" />
            Ödeme merkezi
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/user/account">Hesap bilgileri</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/admin/settings">Çalışma alanı ayarları</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export function DisplayMenu() {
  const display = useDisplay();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="display-trigger" aria-label="Görünüm ve ölçeklendirme">
          <Icon name="sliders-horizontal" />
          <span>%{display.scale}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Uygulama ölçeği</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={String(display.scale)}
          onValueChange={(v) => display.setScale(Number(v))}
        >
          {displayScales.map((v) => (
            <DropdownMenuRadioItem key={v} value={String(v)}>
              %{v}
              {v === 100 ? ' · Varsayılan' : ''}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const { state, dispatch } = useWorkspace();
  const notifications = workspaceNotifications(state, eventDay()),
    read = readNotificationIds(state.settings.readNotifications);
  const unread = notifications.filter((n) => !read.includes(n.id));
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Bildirimler">
          <Icon name="bell" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="notifications-popover">
        <h3>Bildirimler</h3>
        <p className="text-muted-foreground text-sm">Çalışma alanından son gelişmeler</p>
        {unread.slice(0, 4).map((n) => (
          <Link
            key={n.id}
            to={n.href}
            className="notification-item"
            onClick={() => {
              dispatch({
                type: 'settings/save',
                values: { readNotifications: JSON.stringify([...new Set([...read, n.id])]) },
              });
              setOpen(false);
            }}
          >
            <strong>{n.title}</strong>
            <small>{n.body}</small>
          </Link>
        ))}
        {!unread.length && <p className="empty-inline">Yeni bildiriminiz bulunmuyor.</p>}
        <Button asChild variant="ghost" className="w-full mt-3">
          <Link to="/user/notifications" onClick={() => setOpen(false)}>
            Tüm bildirimler
            <Icon name="arrow-up-right" />
          </Link>
        </Button>
      </PopoverContent>
    </Popover>
  );
}
