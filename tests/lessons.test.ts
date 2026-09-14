import test from 'node:test';
import assert from 'node:assert/strict';
import { lessonDraft, lessonIssue, lessonToEvent } from '../src/features/calendar/lesson-model.ts';
import { splitCalendarEvents } from '../src/lib/calendar.ts';

test('lesson changes preserve event and polling identities', () => {
  const draft = {
    ...lessonDraft(undefined, 9),
    groupId: 'group-1',
    date: '2026-09-09',
    endDate: '2026-09-09',
    startTime: '10:15',
    endTime: '11:00',
    title: 'Konuşma',
  };
  assert.equal(lessonIssue(draft), null);
  const event = lessonToEvent(draft, 123, { teacher: 'Selin', room: 'Derslik 1' });
  const updated = lessonToEvent(
    { ...draft, endTime: '11:45', status: 'cancelled' },
    event.id,
    { teacher: 'Selin', room: 'Derslik 1' },
    { ...event, pollId: 'poll-uuid', scheduleId: 'schedule-uuid' },
  );
  assert.equal(updated.id, 123);
  assert.equal(updated.pollId, 'poll-uuid');
  assert.equal(updated.scheduleId, 'schedule-uuid');
  assert.equal(updated.duration, 90);
  assert.equal(updated.status, 'cancelled');
});

test('editing an overnight lesson preserves its duration and assigned room', () => {
  const initial = lessonToEvent(
    {
      ...lessonDraft(undefined, 9),
      groupId: 'group-1',
      startTime: '23:30',
      endDate: '2026-09-10',
      endTime: '00:30',
    },
    4,
    { teacher: 'Selin', room: 'Derslik 03' },
  );
  const draft = { ...lessonDraft(initial), title: 'Yeni başlık', status: 'cancelled' as const };
  assert.equal(lessonIssue(draft), null);
  const updated = lessonToEvent(
    draft,
    initial.id,
    { teacher: 'Selin', room: 'Derslik 02' },
    initial,
  );
  assert.equal(updated.duration, 60);
  assert.equal(updated.room, 'Derslik 03');
  assert.equal(updated.endTime, initial.endTime);
});

test('a missing or unrecognized lesson type/status cannot be saved', () => {
  const draft = { ...lessonDraft(), groupId: 'group-1' };
  for (const type of ['', 'unexpected']) {
    assert.ok(lessonIssue({ ...draft, type: type as typeof draft.type }));
  }
  for (const status of ['', 'unexpected']) {
    assert.ok(lessonIssue({ ...draft, status: status as typeof draft.status }));
  }
});
test('invalid times never produce calendar segments or a valid lesson', () => {
  const draft = { ...lessonDraft(), groupId: 'group-1', startTime: '11:00', endTime: '10:00' };
  assert.ok(lessonIssue(draft));
  const event = lessonToEvent({ ...draft, endTime: '12:00' }, 1, { teacher: '', room: '' });
  assert.deepEqual(splitCalendarEvents([{ ...event, time: 'bad' }]), []);
});
