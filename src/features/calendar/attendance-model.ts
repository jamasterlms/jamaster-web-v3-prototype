import { groupStudentIds, type MembershipRecords } from '../education/membership-model.ts';
import type { CalendarEvent, Student } from '../../types/index.ts';
import { eventDate } from '../../lib/calendar.ts';
import { isDate, localDate } from '../../lib/validation.ts';

export type AttendanceMark = 'present' | 'absent' | null;
export type AttendanceSession = {
  id: string;
  branch: string;
  eventId: number;
  groupId: string;
  groupName: string;
  date: string;
  time: string;
  duration?: number;
  lessonType?: 'GROUP' | 'PRIVATE';
  room?: string;
  level?: string;
  subLevel?: string;
  checkInTimes?: Record<number, string | null>;
  title: string;
  marks: Record<number, AttendanceMark>;
  updatedAt: string;
};
export const sessionKey = (branch: string, eventId: number) => JSON.stringify([branch, eventId]);
export const attendanceBranchConflict = (
  sessions: AttendanceSession[],
  eventId: number,
  branch: string,
) => sessions.some((s) => s.eventId === eventId && s.branch !== branch);
export const attendanceLabel = (mark?: AttendanceMark) =>
  mark === 'present' ? 'Katıldı' : mark === 'absent' ? 'Katılmadı' : 'Bekliyor';
export function attendanceStats(sessions: AttendanceSession[], studentId?: number) {
  const marks = sessions.flatMap((s) =>
    studentId === undefined ? Object.values(s.marks) : [s.marks[studentId]],
  );
  const present = marks.filter((m) => m === 'present').length;
  const absent = marks.filter((m) => m === 'absent').length;
  const total = present + absent;
  return { present, absent, total, rate: total ? Math.round((present / total) * 100) : null };
}
export function studentAttendance(sessions: AttendanceSession[], id: number) {
  return attendanceStats(sessions, id).rate;
}
/** Calendar periods use the user's local day; future sessions do not count as attendance. */
export function attendancePeriodStats(
  sessions: AttendanceSession[],
  studentId: number,
  now = new Date(),
) {
  const today = localDate(now);
  const week = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - ((now.getDay() + 6) % 7),
  );
  const month = localDate(new Date(now.getFullYear(), now.getMonth(), 1));
  const from = (date: string) =>
    attendanceStats(
      sessions.filter((s) => s.date >= date && s.date <= today),
      studentId,
    );
  return {
    week: from(localDate(week)),
    month: from(month),
    all: attendanceStats(
      sessions.filter((s) => s.date <= today),
      studentId,
    ),
  };
}

export type LessonStatus = 'pending' | 'active' | 'completed' | 'cancelled' | 'unknown';
export const lessonStatusLabels: Record<LessonStatus, string> = {
  pending: 'Planlandı',
  active: 'Devam ediyor',
  completed: 'Tamamlandı',
  cancelled: 'İptal edildi',
  unknown: 'Saat bilgisi eksik',
};

/** Schedule time is not a server polling window; never infer a poll ID or check-in. */
export function lessonWindow(event: CalendarEvent, now: number) {
  const valid =
    Number.isInteger(event.day) &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(event.time) &&
    Number.isFinite(event.duration) &&
    event.duration > 0;
  const start = valid
    ? new Date(`${localDate(eventDate(event.day))}T${event.time}`).getTime()
    : NaN;
  const end = start + event.duration * 60000;
  const status: LessonStatus =
    event.status === 'cancelled'
      ? 'cancelled'
      : !Number.isFinite(start) || !Number.isFinite(end)
        ? 'unknown'
        : now < start
          ? 'pending'
          : now <= end
            ? 'active'
            : 'completed';
  return { start, end, status };
}

export function branchAttendanceOverview(events: CalendarEvent[], now: number) {
  const lessons = events
    .filter((e) => e.type === 'lesson')
    .sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
  const today = localDate(new Date(now));
  return {
    active: lessons.filter((e) => lessonWindow(e, now).status === 'active'),
    today: lessons.filter((e) => localDate(eventDate(e.day)) === today),
    upcoming: lessons
      .filter(
        (e) => localDate(eventDate(e.day)) > today && lessonWindow(e, now).status === 'pending',
      )
      .slice(0, 10),
  };
}

export function attendanceRosterIds(
  event: CalendarEvent | undefined,
  session: AttendanceSession | undefined,
  students: Student[],
  groupName: string,
  memberships?: MembershipRecords,
) {
  if (session) return Object.keys(session.marks).map(Number);
  if (event?.lessonType === 'PRIVATE')
    return event.studentId === undefined ? [] : [event.studentId];
  const ids =
    memberships && event?.groupId ? new Set(groupStudentIds(memberships, event.groupId)) : null;
  return students
    .filter((s) => (ids ? ids.has(s.id) : s.group === groupName) && s.status === 'Aktif')
    .map((s) => s.id);
}

export type AttendanceRecord = {
  id: string;
  eventId: number;
  event?: CalendarEvent;
  session?: AttendanceSession;
  archiveReason?: 'removed' | 'rescheduled';
  date: string;
  time: string;
  title: string;
  room?: string;
  lessonType?: 'GROUP' | 'PRIVATE';
  start: number;
  end: number;
  status: LessonStatus;
  rosterCount: number | null;
  present: number | null;
  participation: number | null;
};

export function groupAttendanceRecords(
  events: CalendarEvent[],
  sessions: AttendanceSession[],
  branch: string,
  groupId: string,
  now: number,
): AttendanceRecord[] {
  const saved = sessions.filter((s) => s.branch === branch && s.groupId === groupId);
  const lessons = events.filter((e) => e.type === 'lesson' && e.groupId === groupId);
  const entries: { event?: CalendarEvent; session?: AttendanceSession }[] = lessons.map(
    (event) => ({ event, session: saved.find((s) => s.eventId === event.id) }),
  );
  saved
    .filter((s) => !lessons.some((e) => e.id === s.eventId))
    .forEach((session) => entries.push({ session }));
  return entries
    .map(({ event: liveEvent, session }) => {
      const moved = !!(
        liveEvent &&
        session &&
        (localDate(eventDate(liveEvent.day)) !== session.date ||
          liveEvent.time !== session.time ||
          (session.duration !== undefined && liveEvent.duration !== session.duration) ||
          (session.lessonType !== undefined && liveEvent.lessonType !== session.lessonType) ||
          (liveEvent.lessonType === 'PRIVATE' &&
            (liveEvent.studentId === undefined ||
              !Object.hasOwn(session.marks, liveEvent.studentId))))
      );
      const event = moved ? undefined : liveEvent;
      const date = session?.date ?? localDate(eventDate(event!.day));
      const time = session?.time ?? event!.time;
      const start = event
        ? lessonWindow(event, now).start
        : isDate(date) && /^([01]\d|2[0-3]):[0-5]\d$/.test(time)
          ? new Date(`${date}T${time}`).getTime()
          : NaN;
      const end = event ? lessonWindow(event, now).end : start + (session?.duration ?? NaN) * 60000;
      const marks = session ? Object.values(session.marks) : null;
      const present = marks?.filter((m) => m === 'present').length ?? null;
      return {
        id: session?.id ?? sessionKey(branch, event!.id),
        eventId: event?.id ?? session!.eventId,
        event,
        session,
        archiveReason: moved ? ('rescheduled' as const) : !event ? ('removed' as const) : undefined,
        date,
        time,
        title: session?.title ?? event!.title,
        room: session?.room ?? event?.room,
        lessonType: session?.lessonType ?? event?.lessonType,
        start,
        end,
        status: event ? lessonWindow(event, now).status : 'unknown',
        rosterCount: marks?.length ?? null,
        present,
        participation: marks?.length ? Math.round((present! / marks.length) * 100) : null,
      };
    })
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

export type AttendanceFilters = {
  from: string;
  to: string;
  statuses: string[];
  types: string[];
  sort: 'asc' | 'desc';
};
export function filterAttendanceRecords(records: AttendanceRecord[], filters: AttendanceFilters) {
  if (
    (filters.from && !isDate(filters.from)) ||
    (filters.to && !isDate(filters.to)) ||
    (filters.from && filters.to && filters.from > filters.to)
  )
    return [];
  return records
    .filter(
      (r) =>
        (!filters.from || r.date >= filters.from) &&
        (!filters.to || r.date <= filters.to) &&
        (!filters.statuses.length || filters.statuses.includes(r.status)) &&
        (!filters.types.length || filters.types.includes(r.lessonType || 'unknown')),
    )
    .sort(
      (a, b) =>
        (a.date + a.time).localeCompare(b.date + b.time) * (filters.sort === 'asc' ? 1 : -1),
    );
}

export function selectAttendanceRecord(records: AttendanceRecord[], eventId: string) {
  return eventId
    ? records.find((r) => String(r.eventId) === eventId)
    : (records.find((r) => r.status === 'active') ?? records[0]);
}

export function attendanceRoute(
  event: CalendarEvent,
  sessions: AttendanceSession[],
  branch: string,
) {
  if (!event.groupId) return '/admin/calendar/pollings';
  const archived = groupAttendanceRecords(
    [event],
    sessions,
    branch,
    event.groupId,
    Date.now(),
  ).find((r) => r.eventId === event.id && r.archiveReason);
  return `/admin/groups/${encodeURIComponent(event.groupId)}/polling?tab=${archived ? 'past' : 'current'}&date=${archived?.date || localDate(eventDate(event.day))}&eventId=${event.id}`;
}
