import { eventDate } from '../../lib/calendar.ts';
import { localDate } from '../../lib/validation.ts';
import type { WorkspaceState } from '../../app/workspace-reducer.ts';
export type WorkspaceNotification = {
  id: string;
  title: string;
  body: string;
  type: 'SYSTEM_UPDATE' | 'NEW_REQUEST' | 'TASK_ASSIGNED';
  href: string;
};
export function workspaceNotifications(
  state: WorkspaceState,
  day: number,
): WorkspaceNotification[] {
  if (state.settings['notification-allowAll'] === 'false') return [];
  const events = (state.settings['notification-operations'] === 'false' ? [] : state.events).filter(
    (e) => e.day === day && e.status !== 'cancelled',
  );
  const awaiting = (
    state.settings['notification-students'] === 'false' ? [] : state.activitySubmissions || []
  ).filter((s) => ['SUBMITTED', 'LATE', 'RESUBMITTED'].includes(s.status));
  return [
    ...events.map((event) => ({
      id: `event-${event.id}-${day}`,
      title: `${event.time} · ${event.title}`,
      body: `${event.person || event.teacher} · ${event.room}`,
      type: 'TASK_ASSIGNED' as const,
      href: `/admin/calendar?date=${localDate(eventDate(day))}`,
    })),
    ...awaiting.map((s) => ({
      id: `submission-${s.id}-${s.submittedAt}`,
      title: `${s.studentName} bir çalışma teslim etti`,
      body: state.activities?.find((a) => a.id === s.activityId)?.title || 'Değerlendirme bekliyor',
      type: 'NEW_REQUEST' as const,
      href: `/admin/activities/${s.activityId}/submissions`,
    })),
    ...(state.settings['notification-system'] === 'false'
      ? []
      : [
          {
            id: 'workspace-welcome-v1',
            title: 'Çalışma alanınız hazır',
            body: 'Görünüm ölçeğinizi, bildirim tercihlerinizi ve kısayollarınızı düzenleyebilirsiniz.',
            type: 'SYSTEM_UPDATE' as const,
            href: '/user/account?tab=preferences',
          },
        ]),
  ];
}
export function readNotificationIds(value?: string): string[] {
  try {
    const items = JSON.parse(value || '[]');
    return Array.isArray(items) ? items.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    return [];
  }
}
