import type { CalendarEvent } from '../types/index.ts';
// Existing event serials use this epoch; keeping it preserves saved calendars.
export const eventDate = (day: number) => new Date(2026, 8, day, 12);
export type CalendarScope = { groupId?: string; teacherId?: string; studentId?: number };
export function scopedCalendarEvents(
  events: CalendarEvent[],
  scope: CalendarScope | undefined,
  teachers: { id: string; name: string }[],
) {
  if (!scope) return events;
  const teacher = teachers.find((t) => t.id === scope.teacherId);
  const uniqueName = teacher && teachers.filter((t) => t.name === teacher.name).length === 1;
  return events.filter(
    (e) =>
      e.type === 'lesson' &&
      (!scope.groupId || e.groupId === scope.groupId) &&
      (!scope.teacherId ||
        e.teacherId === scope.teacherId ||
        (!e.teacherId && uniqueName && e.teacher === teacher?.name)),
  );
}
export function eventDay(date = new Date()) {
  return (
    Math.round(
      (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(2026, 8, 1)) /
        86400000,
    ) + 1
  );
}
export function startOfWeek(date = new Date()) {
  return eventDay(date) - ((date.getDay() + 6) % 7);
}
/** Split display segments at midnight, retaining the original identity for detail/edit actions. */
export function splitCalendarEvents(events: CalendarEvent[]) {
  return events.flatMap((event) => {
    const [hour, minute] = event.time.split(':').map(Number);
    if (
      !Number.isInteger(hour) ||
      !Number.isInteger(minute) ||
      !Number.isFinite(event.duration) ||
      event.duration <= 0 ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59
    )
      return [];
    let remaining = Math.min(event.duration, 1440 * 31),
      day = event.day,
      start = hour * 60 + minute;
    const segments: CalendarEvent[] = [];
    while (remaining > 0) {
      const duration = Math.min(remaining, 1440 - start);
      segments.push({
        ...event,
        day,
        time: `${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`,
        duration,
      });
      remaining -= duration;
      day++;
      start = 0;
    }
    return segments;
  });
}
export function meetingMinimumDate(now = new Date()) {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T00:00`;
}
export function layoutEvents(events: CalendarEvent[]) {
  const rows = events
    .map((event) => {
      const [hour, minute] = event.time.split(':').map(Number);
      return {
        event,
        start: hour * 60 + minute,
        end: hour * 60 + minute + event.duration,
        column: 0,
        columns: 1,
      };
    })
    .sort((a, b) => a.start - b.start || b.end - a.end);
  let cluster: typeof rows = [],
    clusterEnd = -1;
  const finish = () => {
    const count = Math.max(1, ...cluster.map((r) => r.column + 1));
    cluster.forEach((r) => {
      r.columns = count;
    });
  };
  for (const row of rows) {
    if (row.start >= clusterEnd) {
      finish();
      cluster = [];
      clusterEnd = -1;
    }
    const used = new Set(cluster.filter((r) => r.end > row.start).map((r) => r.column));
    while (used.has(row.column)) row.column++;
    cluster.push(row);
    clusterEnd = Math.max(clusterEnd, row.end);
  }
  finish();
  return rows;
}
