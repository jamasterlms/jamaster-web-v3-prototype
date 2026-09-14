import { eventDate } from '../../lib/calendar.ts';
import { localDate } from '../../lib/validation.ts';
import type { LessonDraft } from './lesson-model.ts';
/** Pointer coordinates are measured in rendered pixels, independent of UI scale. */
export function gridMinute(
  y: number,
  top: number,
  height: number,
  startHour: number,
  hours: number,
) {
  if (!Number.isFinite(height) || height <= 0) return startHour * 60;
  return Math.max(
    startHour * 60,
    Math.min(
      (startHour + hours) * 60 - 15,
      Math.floor((((y - top) / height) * hours * 60 + startHour * 60) / 15) * 15,
    ),
  );
}
export function calendarRange(
  day: number,
  start: number,
  duration: number,
): Pick<LessonDraft, 'date' | 'endDate' | 'startTime' | 'endTime'> {
  const total = Math.max(0, Math.min(1425, Math.round(start / 15) * 15)),
    end = total + Math.max(15, Math.round(duration / 15) * 15);
  const time = (m: number) =>
    `${String(Math.floor((m % 1440) / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  return {
    date: localDate(eventDate(day)),
    endDate: localDate(eventDate(day + Math.floor(end / 1440))),
    startTime: time(total),
    endTime: time(end),
  };
}

/** Include both anchor and current 15-minute cells in either drag direction. */
export function selectedCalendarRange(anchor: number, current: number) {
  return { start: Math.min(anchor, current), duration: Math.abs(current - anchor) + 15 };
}
