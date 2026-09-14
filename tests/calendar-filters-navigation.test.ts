import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readCalendarFilters,
  writeCalendarFilters,
} from '../src/features/calendar/calendar-filter-model.ts';
import { navIsActive } from '../src/app/navigation/nav-active.ts';
import { splitCalendarEvents } from '../src/lib/calendar.ts';
import type { CalendarEvent } from '../src/types/index.ts';
test('calendar URL preserves repeated filters and unrelated date/scope', () => {
  const params = new URLSearchParams(
    'date=2026-09-14&group=12&room=A&room=B&event=meeting&event=lesson&view=Gün&teacher=t1&lessonType=PRIVATE',
  );
  const filters = readCalendarFilters(params);
  assert.deepEqual(filters.rooms, ['A', 'B']);
  assert.equal(filters.view, 'Gün');
  writeCalendarFilters(params, { ...filters, rooms: [], eventTypes: [] });
  assert.equal(params.get('date'), '2026-09-14');
  assert.equal(params.get('group'), '12');
  assert.deepEqual(readCalendarFilters(params), { ...filters, rooms: [], eventTypes: [] });
});
test('calendar query rejects invalid enum values and deduplicates rooms', () => {
  assert.deepEqual(
    readCalendarFilters(
      new URLSearchParams('view=invalid&lessonType=oops&room=A&room=A&event=invalid&event=lesson'),
    ),
    { view: 'Hafta', rooms: ['A'], eventTypes: ['lesson'], lessonType: 'ALL', teacher: 'all' },
  );
});
test('sidebar identifies query-specific auth and payment entries', () => {
  assert.equal(navIsActive('/login?role=teacher', 'login', '?role=student'), false);
  assert.equal(
    navIsActive('/login?role=teacher', '/login', '?role=teacher&returnTo=%2Fteacher%2Fcourses'),
    true,
  );
  assert.equal(navIsActive('/payment?tab=cards', 'payment', '?tab=history'), false);
  assert.equal(navIsActive('/payment', 'payment', '?tab=history'), true);
});
test('daily display retains identity and shows continuation after midnight', () => {
  const event = {
    id: 321,
    day: 10,
    time: '23:30',
    duration: 90,
    type: 'lesson',
    status: 'active',
    title: 'Gece dersi',
  } as CalendarEvent;
  const next = splitCalendarEvents([event]).filter((e) => e.day === 11);
  assert.equal(next.length, 1);
  assert.equal(next[0].time, '00:00');
  assert.equal(next[0].duration, 60);
  assert.equal(next[0].id, event.id);
});
