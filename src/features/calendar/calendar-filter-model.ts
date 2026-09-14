export type CalendarFilters = {
  view: string;
  rooms: string[];
  eventTypes: string[];
  lessonType: string;
  teacher: string;
};
export const defaultCalendarFilters: CalendarFilters = {
  view: 'Hafta',
  rooms: [],
  eventTypes: [],
  lessonType: 'ALL',
  teacher: 'all',
};
export const calendarFilterKeys = ['view', 'room', 'event', 'lessonType', 'teacher'];
const unique = (values: string[]) => [...new Set(values.filter(Boolean))];
export function readCalendarFilters(params: URLSearchParams): CalendarFilters {
  const view = params.get('view') || '',
    type = params.get('lessonType') || '';
  return {
    view: ['Ay', 'Hafta', 'Gün', 'Liste'].includes(view) ? view : 'Hafta',
    rooms: unique(params.getAll('room')),
    eventTypes: unique(
      params.getAll('event').filter((value) => ['meeting', 'lesson'].includes(value)),
    ),
    lessonType: ['GROUP', 'PRIVATE'].includes(type) ? type : 'ALL',
    teacher: params.get('teacher') || 'all',
  };
}
export function writeCalendarFilters(params: URLSearchParams, value: CalendarFilters) {
  calendarFilterKeys.forEach((key) => params.delete(key));
  params.set('view', value.view);
  params.set('teacher', value.teacher);
  params.set('lessonType', value.lessonType);
  if (value.rooms.length) value.rooms.forEach((v) => params.append('room', v));
  else params.set('room', '');
  if (value.eventTypes.length) value.eventTypes.forEach((v) => params.append('event', v));
  else params.set('event', '');
}
