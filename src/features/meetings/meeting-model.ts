import { eventDay } from '../../lib/calendar.ts';
import { isDateTime } from '../../lib/validation.ts';
import type { CalendarEvent, Meeting } from '../../types/index.ts';
import {
  labelFor,
  meetingResults,
  meetingTypes,
  negativeReasonOptions,
  normalizeNegativeReason,
  scheduledResults,
} from './meeting-options.ts';
export type MeetingDraft = {
  studentId: number;
  type: string;
  score: number;
  result: string;
  date: string;
  reason: string;
  note: string;
};
export const newMeetingDraft = (studentId: number): MeetingDraft => ({
  studentId,
  type: 'PHONE',
  score: 3,
  result: '',
  date: '',
  reason: '',
  note: '',
});
export function meetingIssue(
  draft: MeetingDraft,
): { field: keyof MeetingDraft; message: string } | null {
  if (!meetingResults.some(([key]) => key === draft.result))
    return { field: 'result', message: 'Görüşme sonucunu seçin.' };
  if (!meetingTypes.some(([key]) => key === draft.type))
    return { field: 'type', message: 'Geçerli bir görüşme tipi seçin.' };
  if (!Number.isInteger(draft.score) || draft.score < 1 || draft.score > 5)
    return { field: 'score', message: '1 ile 5 arasında bir skor seçin.' };
  if (scheduledResults.has(draft.result) && !isDateTime(draft.date))
    return { field: 'date', message: 'Geçerli bir tarih ve saat seçin.' };
  if (
    draft.result === 'NEGATIVE' &&
    draft.reason &&
    !negativeReasonOptions.some(([code]) => code === normalizeNegativeReason(draft.reason))
  )
    return { field: 'reason', message: 'Geçerli bir olumsuzluk nedeni seçin veya boş bırakın.' };
  if (draft.note.length > 1500)
    return { field: 'note', message: 'Görüşme notu en fazla 1500 karakter olabilir.' };
  return null;
}
export function validateMeeting(draft: MeetingDraft) {
  return meetingIssue(draft)?.message || null;
}
export function createMeeting(
  draft: MeetingDraft,
  studentName: string,
  id = Date.now(),
): { meeting: Meeting; event?: CalendarEvent } {
  const scheduled = scheduledResults.has(draft.result);
  const meeting: Meeting = {
    ...draft,
    note: draft.note.trim(),
    id,
    score: draft.score,
    date: scheduled ? draft.date : '',
    reason: draft.result === 'NEGATIVE' ? normalizeNegativeReason(draft.reason) : '',
    createdAt: new Date().toISOString(),
  };
  if (!scheduled) return { meeting };
  const date = new Date(draft.date);
  const day = eventDay(date);
  return {
    meeting,
    event: {
      id,
      studentId: draft.studentId,
      day,
      time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
      duration: 30,
      title: labelFor(meetingResults, draft.result),
      person: studentName,
      teacher: 'Furkan Çolak',
      room: 'Görüşme odası',
      type: 'meeting',
      color: 'yellow',
    },
  };
}
