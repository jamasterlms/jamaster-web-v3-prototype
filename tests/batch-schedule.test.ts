import assert from 'node:assert/strict';
import test from 'node:test';
import {
  batchScheduleDraft,
  generateBatchSchedule,
  batchEventIssue,
  scheduleConflicts,
} from '../src/features/calendar/batch-schedule-model.ts';
import { lessonToEvent } from '../src/features/calendar/lesson-model.ts';

const draft = () => {
  const value = batchScheduleDraft('2026-09-09');
  value.weekCount = 2;
  value.days[0] = {
    dayId: 1,
    isSelected: true,
    lessons: [{ startTime: '09:00', endTime: '10:00' }],
  };
  value.days[2] = {
    dayId: 3,
    isSelected: true,
    lessons: [
      { startTime: '11:00', endTime: '12:00' },
      { startTime: '12:00', endTime: '12:30' },
    ],
  };
  return value;
};
test('batch schedule normalizes Monday, repeats weeks, and excludes calendar dates', () => {
  const value = draft();
  value.excludeDates = ['2026-09-09'];
  const result = generateBatchSchedule(value);
  assert.equal(result.error, null);
  assert.deepEqual(
    result.lessons.map((l) => l.date),
    ['2026-09-07', '2026-09-14', '2026-09-16', '2026-09-16'],
  );
  assert.deepEqual(
    result.lessons.map((l) => l.weekNumber),
    [1, 2, 2, 2],
  );
});
test('batch form rejects invalid dates, week counts, empty schedules, reversed and overlapping times', () => {
  for (const patch of [
    { weekCount: 0 },
    { weekCount: 53 },
    { weekCount: 1.5 },
    { weekStartDate: '2026-02-30' },
  ])
    assert.ok(generateBatchSchedule({ ...draft(), ...patch }).error);
  assert.ok(generateBatchSchedule(batchScheduleDraft('2026-09-09')).error);
  const value = draft();
  value.days[0].lessons[0].endTime = '08:00';
  assert.ok(generateBatchSchedule(value).error);
  value.days[0].lessons[0].endTime = '10:00';
  value.days[0].lessons.push({ startTime: '09:30', endTime: '10:30' });
  assert.ok(generateBatchSchedule(value).error);
  value.days[0].isSelected = false;
  assert.equal(generateBatchSchedule(value).error, null);
});
test('batch calendar arithmetic crosses month, year and daylight-saving boundaries', () => {
  for (const date of ['2026-12-31', '2026-10-25', '2026-03-29']) {
    const result = generateBatchSchedule({ ...draft(), weekStartDate: date });
    assert.equal(result.error, null);
    assert.equal(new Date(`${result.lessons[0].date}T12:00`).getDay(), 1);
    assert.equal(result.lessons[0].startTime, '09:00');
  }
});
test('batch records reject duplicates atomically and expose resource overlaps', () => {
  const items = generateBatchSchedule(draft())
    .lessons.slice(0, 2)
    .map((l, i) =>
      lessonToEvent(
        {
          ...l,
          groupId: 'g1',
          title: 'Grup dersi',
          date: l.date,
          endDate: l.date,
          type: 'GROUP',
          status: 'active',
          teacherId: 't1',
          educationId: '',
        },
        i + 100,
        { teacher: 'Selin', room: '02' },
      ),
    );
  assert.equal(batchEventIssue(items, []), null);
  assert.ok(batchEventIssue(items, [items[0]]));
  assert.ok(batchEventIssue([{ ...items[0], id: 102 }], [items[0]]));
  assert.ok(batchEventIssue([{ ...items[0], duration: 0 }], []));
  const overlap = { ...items[0], id: 900, groupId: 'g2', time: '09:30' };
  assert.equal(scheduleConflicts(items[0], [overlap]).length, 1);
  assert.equal(scheduleConflicts(items[0], [{ ...overlap, status: 'cancelled' }]).length, 0);
  assert.equal(scheduleConflicts(items[0], [{ ...overlap, teacherId: 't2' }]).length, 0);
});
