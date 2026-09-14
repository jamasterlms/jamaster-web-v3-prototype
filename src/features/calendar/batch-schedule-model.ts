import type { CalendarEvent } from '../../types/index.ts';
import { isDate, localDate } from '../../lib/validation.ts';
import { eventDate } from '../../lib/calendar.ts';

export const scheduleWeekdays = [
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi',
  'Pazar',
];
export type ScheduleTime = { startTime: string; endTime: string };
export type ScheduleDay = { dayId: number; isSelected: boolean; lessons: ScheduleTime[] };
export type BatchScheduleDraft = {
  weekStartDate: string;
  weekCount: number;
  type: 'GROUP' | 'PRIVATE';
  teacherId: string;
  educationId: string;
  excludeDates: string[];
  days: ScheduleDay[];
};
export type GeneratedLesson = ScheduleTime & { date: string; dayId: number; weekNumber: number };
const minutes = (time: string) => time.split(':').reduce((h, m) => h * 60 + Number(m), 0);
const timeValid = (time: string) => /^([01]?\d|2[0-3]):[0-5]\d$/.test(time);
export function scheduleMonday(date: string) {
  if (!isDate(date)) return '';
  const day = new Date(`${date}T12:00:00`);
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  return localDate(day);
}
export function batchScheduleDraft(date = localDate(), privateLesson = false): BatchScheduleDraft {
  return {
    weekStartDate: scheduleMonday(date),
    weekCount: 1,
    type: privateLesson ? 'PRIVATE' : 'GROUP',
    teacherId: '',
    educationId: '',
    excludeDates: [],
    days: scheduleWeekdays.map((_, i) => ({ dayId: i + 1, isSelected: false, lessons: [] })),
  };
}
export function generateBatchSchedule(value: BatchScheduleDraft): {
  lessons: GeneratedLesson[];
  error: string | null;
} {
  const fail = (error: string) => ({ lessons: [], error });
  if (!isDate(value.weekStartDate)) return fail('Geçerli bir başlangıç tarihi seçin.');
  if (!Number.isInteger(value.weekCount) || value.weekCount < 1 || value.weekCount > 52)
    return fail('Hafta sayısı 1–52 arasında bir tam sayı olmalıdır.');
  if (!['GROUP', 'PRIVATE'].includes(value.type)) return fail('Ders tipini seçin.');
  if (value.excludeDates.some((d) => !isDate(d)))
    return fail('Hariç tutulan tarihleri kontrol edin.');
  if (
    value.days.length !== 7 ||
    new Set(value.days.map((d) => d.dayId)).size !== 7 ||
    value.days.some((d) => !Number.isInteger(d.dayId) || d.dayId < 1 || d.dayId > 7)
  )
    return fail('Haftanın günleri doğrulanamadı.');
  const days = value.days.filter((d) => d.isSelected);
  if (!days.length) return fail('En az bir gün ve ders saati ekleyin.');
  for (const day of days) {
    if (!day.lessons.length)
      return fail(`${scheduleWeekdays[day.dayId - 1]} için en az bir ders saati ekleyin.`);
    const slots = [...day.lessons].sort((a, b) => minutes(a.startTime) - minutes(b.startTime));
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (!timeValid(slot.startTime) || !timeValid(slot.endTime))
        return fail(`${scheduleWeekdays[day.dayId - 1]} için başlangıç ve bitiş saatlerini girin.`);
      if (minutes(slot.endTime) <= minutes(slot.startTime))
        return fail('Dersin bitişi aynı gün içinde başlangıcından sonra olmalıdır.');
      if (i && minutes(slot.startTime) < minutes(slots[i - 1].endTime))
        return fail(`${scheduleWeekdays[day.dayId - 1]} ders saatleri birbiriyle çakışıyor.`);
    }
  }
  const start = new Date(`${scheduleMonday(value.weekStartDate)}T12:00:00`),
    excluded = new Set(value.excludeDates);
  const lessons: GeneratedLesson[] = [];
  for (let week = 0; week < value.weekCount; week++)
    for (const day of days) {
      const date = new Date(start);
      date.setDate(start.getDate() + week * 7 + day.dayId - 1);
      const formatted = localDate(date);
      if (excluded.has(formatted)) continue;
      for (const slot of day.lessons)
        lessons.push({
          date: formatted,
          dayId: day.dayId,
          weekNumber: week + 1,
          startTime: slot.startTime.padStart(5, '0'),
          endTime: slot.endTime.padStart(5, '0'),
        });
    }
  lessons.sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  return lessons.length
    ? { lessons, error: null }
    : fail('Hariç tutulan tarihlerden sonra oluşturulacak ders kalmadı.');
}
const interval = (event: CalendarEvent) => {
  const start = event.day * 1440 + minutes(event.time);
  return { start, end: start + event.duration };
};
const duplicateKey = (e: CalendarEvent) =>
  `${e.groupId}:${e.studentId || ''}:${e.day}:${e.time}:${e.duration}`;
/** Validate the entire append before changing the calendar; never overwrite existing event IDs. */
export function batchEventIssue(events: CalendarEvent[], existing: CalendarEvent[]) {
  if (!events.length) return 'Oluşturulacak ders bulunmuyor.';
  const ids = new Set(existing.map((e) => e.id));
  const slots = new Set(
    existing.filter((e) => e.type === 'lesson' && e.status !== 'cancelled').map(duplicateKey),
  );
  for (const event of events) {
    if (!Number.isSafeInteger(event.id) || event.id < 1 || ids.has(event.id))
      return 'Ders kimliği zaten kullanılıyor. Önizlemeyi yeniden oluşturun.';
    if (
      event.type !== 'lesson' ||
      !['GROUP', 'PRIVATE'].includes(event.lessonType || '') ||
      event.status !== 'active' ||
      !event.groupId ||
      event.groupId !== events[0].groupId ||
      !Number.isInteger(event.day) ||
      !isDate(localDate(eventDate(event.day))) ||
      !timeValid(event.time) ||
      !Number.isFinite(event.duration) ||
      event.duration <= 0 ||
      minutes(event.time) + event.duration >= 1440
    )
      return 'Ders programındaki tarih ve saatleri kontrol edin.';
    if (slots.has(duplicateKey(event)))
      return 'Aynı grup, öğrenci ve saat için bir ders zaten var. Tarih veya saatleri değiştirin.';
    ids.add(event.id);
    slots.add(duplicateKey(event));
  }
  return null;
}
export function scheduleConflicts(event: CalendarEvent, existing: CalendarEvent[]) {
  const a = interval(event);
  return existing.filter((other) => {
    if (other.type !== 'lesson' || other.status === 'cancelled') return false;
    const shared =
      other.groupId === event.groupId ||
      (!!event.teacherId && other.teacherId === event.teacherId) ||
      (!!event.studentId && other.studentId === event.studentId);
    const b = interval(other);
    return shared && a.start < b.end && b.start < a.end;
  });
}
