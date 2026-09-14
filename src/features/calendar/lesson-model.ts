import type { CalendarEvent } from '../../types/index.ts';
import { eventDate, eventDay } from '../../lib/calendar.ts';
import { isDate, localDate } from '../../lib/validation.ts';
export type LessonDraft = {
  groupId: string;
  type: 'GROUP' | 'PRIVATE';
  title: string;
  date: string;
  endDate: string;
  startTime: string;
  endTime: string;
  teacherId: string;
  educationId: string;
  studentId?: string;
  status: 'active' | 'cancelled';
};
export function lessonDraft(
  event?: CalendarEvent,
  day = eventDay(),
  context: { fixedGroupId?: string; defaultTeacherId?: string } = {},
): LessonDraft {
  const start = event?.time || '09:00';
  const [h, m] = start.split(':').map(Number);
  const minutes = h * 60 + m + (event?.duration || 60);
  const end = minutes % 1440;
  return {
    groupId: event ? event.groupId || '' : context.fixedGroupId || '',
    type: event?.lessonType || 'GROUP',
    title: event?.title || '',
    date: localDate(eventDate(event?.day ?? day)),
    endDate: localDate(eventDate((event?.day ?? day) + Math.floor(minutes / 1440))),
    startTime: start,
    endTime: `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`,
    teacherId: event ? event.teacherId || '' : context.defaultTeacherId || '',
    educationId: event?.educationId || '',
    studentId: event?.studentId === undefined ? '' : String(event.studentId),
    status: event?.status || 'active',
  };
}
export function lessonIssue(draft: LessonDraft) {
  if (!draft.groupId) return 'Grup seçin.';
  if (!['GROUP', 'PRIVATE'].includes(draft.type)) return 'Ders tipini seçin.';
  if (
    draft.studentId &&
    (!/^\d+$/.test(draft.studentId) ||
      !Number.isSafeInteger(Number(draft.studentId)) ||
      Number(draft.studentId) <= 0)
  )
    return 'Geçerli bir öğrenci seçin.';
  if (!['active', 'cancelled'].includes(draft.status)) return 'Geçerli bir ders durumu seçin.';
  if (!isDate(draft.date)) return 'Geçerli bir ders tarihi seçin.';
  if (!isDate(draft.endDate)) return 'Geçerli bir bitiş tarihi seçin.';
  if (
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.startTime) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.endTime)
  )
    return 'Başlangıç ve bitiş saatlerini girin.';
  if (new Date(`${draft.endDate}T${draft.endTime}`) <= new Date(`${draft.date}T${draft.startTime}`))
    return 'Dersin bitişi başlangıcından sonra olmalıdır.';
  return null;
}
export function attendedLessonIssue(
  draft: LessonDraft,
  event: CalendarEvent | undefined,
  hasAttendance: boolean,
) {
  if (!event || !hasAttendance) return null;
  const before = lessonDraft(event);
  return (
    ['date', 'endDate', 'startTime', 'endTime', 'groupId', 'type', 'studentId'] as const
  ).some((key) => (before[key] || '') !== (draft[key] || ''))
    ? 'Yoklaması kaydedilmiş dersin zamanı, grubu veya öğrencisi değiştirilemez. Yeni bir ders oluşturun.'
    : null;
}
export function lessonToEvent(
  draft: LessonDraft,
  id: number,
  context: { teacher: string; room: string; studentName?: string },
  previous?: CalendarEvent,
): CalendarEvent {
  const start = new Date(`${draft.date}T${draft.startTime}`),
    end = new Date(`${draft.endDate}T${draft.endTime}`);
  return {
    ...previous,
    id,
    groupId: draft.groupId,
    lessonType: draft.type,
    studentId: draft.type === 'PRIVATE' && draft.studentId ? Number(draft.studentId) : undefined,
    person: draft.type === 'PRIVATE' && draft.studentId ? context.studentName : undefined,
    title:
      draft.title.trim() ||
      `${draft.type === 'PRIVATE' ? 'Özel ders' : 'Grup dersi'} · ${draft.startTime}–${draft.endTime}`,
    day: eventDay(start),
    time: draft.startTime,
    duration: (end.getTime() - start.getTime()) / 60000,
    type: 'lesson',
    color: draft.type === 'PRIVATE' ? 'lilac' : 'green',
    teacher: context.teacher,
    room: previous?.room ?? context.room,
    teacherId: draft.teacherId || undefined,
    educationId: draft.educationId || undefined,
    status: draft.status,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };
}
