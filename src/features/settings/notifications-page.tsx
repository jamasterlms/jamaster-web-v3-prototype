import { Link, useSearchParams } from 'react-router-dom';
import { PageHeading, IconButton } from '@/components/shared/primitives';
import { SearchField } from '@/components/shared/feature-primitives';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useWorkspace } from '@/app/workspace-provider';
import { eventDay } from '@/lib/calendar';
import { normalize } from '@/lib/format';
import { workspaceNotifications, readNotificationIds } from './notification-model';
export function NotificationsPage() {
  const { state, dispatch } = useWorkspace(),
    [params, setParams] = useSearchParams();
  const type = params.get('type') || 'all',
    search = params.get('search') || '';
  const notifications = workspaceNotifications(state, eventDay()),
    read = new Set(readNotificationIds(state.settings.readNotifications));
  const updateRead = (ids: string[]) =>
    dispatch({
      type: 'settings/save',
      values: { readNotifications: JSON.stringify([...new Set(ids)]) },
    });
  const patch = (values: Record<string, string>) =>
    setParams(
      (p) => {
        const n = new URLSearchParams(p);
        Object.entries(values).forEach(([k, v]) => n.set(k, v));
        return n;
      },
      { replace: true },
    );
  const rows = notifications.filter(
    (n) =>
      normalize(n.title + ' ' + n.body).includes(normalize(search)) &&
      (type === 'all' || (type === 'unread' ? !read.has(n.id) : n.type === type)),
  );
  return (
    <>
      <PageHeading
        title="Bildirimler"
        description="Çalışma alanınızdan güncel gelişmeler ve görevler."
      />
      <div className="module-toolbar">
        <SearchField
          value={search}
          onChange={(search) => patch({ search })}
          placeholder="Bildirim ara"
        />
        <Button
          variant="outline"
          disabled={notifications.every((n) => read.has(n.id))}
          onClick={() => updateRead([...read, ...notifications.map((n) => n.id)])}
        >
          Tümünü okundu işaretle
        </Button>
      </div>
      <Tabs value={type} onValueChange={(type) => patch({ type })}>
        <TabsList className="detail-view-tabs">
          {Object.entries({
            all: 'Tümü',
            unread: 'Okunmamış',
            SYSTEM_UPDATE: 'Sistem',
            NEW_REQUEST: 'İstekler',
            TASK_ASSIGNED: 'Görevler',
          }).map(([value, label]) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="notification-list">
        {rows.map((n) => (
          <Card className="notification-row" key={n.id} data-unread={!read.has(n.id)}>
            <Link to={n.href} onClick={() => updateRead([...read, n.id])}>
              <strong>{n.title}</strong>
              <p>{n.body}</p>
            </Link>
            <IconButton
              icon={read.has(n.id) ? 'mail' : 'check'}
              label={read.has(n.id) ? 'Okunmadı işaretle' : 'Okundu işaretle'}
              onClick={() =>
                updateRead(read.has(n.id) ? [...read].filter((id) => id !== n.id) : [...read, n.id])
              }
            />
          </Card>
        ))}
      </div>
      {!rows.length && <p className="empty-inline">Bu filtrelerle eşleşen bildirim bulunmuyor.</p>}
    </>
  );
}
