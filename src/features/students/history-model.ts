import type { CommunicationLog } from '../entities/record-model.ts';
import type { Meeting } from '../../types/index.ts';
import { normalize } from '../../lib/format.ts';
import { labelFor, meetingResults, meetingTypes } from '../meetings/meeting-options.ts';

export type HistoryFilter = {
  search: string;
  sort: string;
  order: 'asc' | 'desc';
  startDate: string;
  endDate: string;
};
export const emptyHistoryFilter: HistoryFilter = {
  search: '',
  sort: 'createdAt',
  order: 'desc',
  startDate: '',
  endDate: '',
};
export function readHistoryFilter(
  params: URLSearchParams,
  fields: readonly string[],
): HistoryFilter {
  return {
    search: params.get('search') || '',
    sort: fields.includes(params.get('sort') || '') ? params.get('sort')! : 'createdAt',
    order: params.get('order') === 'asc' ? 'asc' : 'desc',
    startDate: params.get('startDate') || '',
    endDate: params.get('endDate') || '',
  };
}
const inRange = (date: string, filter: HistoryFilter) =>
  (!filter.startDate || date.slice(0, 10) >= filter.startDate) &&
  (!filter.endDate || date.slice(0, 10) <= filter.endDate);
export function communicationHistory(
  records: CommunicationLog[],
  studentId: number,
  channel: CommunicationLog['channel'],
  filter: HistoryFilter,
) {
  return records
    .filter(
      (r) =>
        r.studentId === studentId &&
        r.channel === channel &&
        inRange(r.createdAt, filter) &&
        normalize([r.title, r.content, r.address, r.senderName || '', r.status].join(' ')).includes(
          normalize(filter.search),
        ),
    )
    .sort((a, b) => {
      const key = filter.sort === 'status' ? 'status' : 'createdAt';
      return (
        (a[key].localeCompare(b[key], 'tr') || a.id.localeCompare(b.id)) *
        (filter.order === 'asc' ? 1 : -1)
      );
    });
}
export function studentMeetingHistory(
  records: Meeting[],
  studentId: number,
  filter: HistoryFilter,
) {
  return records
    .filter(
      (r) =>
        r.studentId === studentId &&
        inRange(r.createdAt, filter) &&
        normalize(
          [r.note, labelFor(meetingTypes, r.type), labelFor(meetingResults, r.result)].join(' '),
        ).includes(normalize(filter.search)),
    )
    .sort((a, b) => {
      const key = filter.sort === 'meetingDate' ? 'date' : 'createdAt';
      // Unscheduled meetings remain last for either direction.
      if (!a[key] || !b[key]) return a[key] ? -1 : b[key] ? 1 : a.id - b.id;
      return (a[key].localeCompare(b[key]) || a.id - b.id) * (filter.order === 'asc' ? 1 : -1);
    });
}
export const messageStatusLabel = (status: string) =>
  ({
    SIMULATED: 'Gönderim denemesi',
    PENDING: 'Bekliyor',
    QUEUED: 'Sırada',
    SENT: 'Gönderildi',
    DELIVERED: 'İletildi',
    READ: 'Okundu',
    FAILED: 'Başarısız',
    RECEIVED: 'Alındı',
  })[status.toUpperCase()] || status;
export function messageDateTime(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Belirtilmedi';
}
