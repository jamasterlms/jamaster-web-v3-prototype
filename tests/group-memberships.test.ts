import assert from 'node:assert/strict';
import test from 'node:test';
import {
  migrateMemberships,
  transferMembership,
  groupStudentIds,
} from '../src/features/education/membership-model.ts';
import { attendanceRosterIds } from '../src/features/calendar/attendance-model.ts';
import type { CalendarEvent, Student } from '../src/types/index.ts';

const students = [
  { id: 1, group: 'B1' },
  { id: 2, group: 'A2' },
  { id: 3, group: 'Belirsiz' },
];
const groups = [
  { id: 'g1', name: 'B1' },
  { id: 'g2', name: 'A2' },
  { id: 'g3', name: 'Belirsiz' },
  { id: 'g4', name: 'Belirsiz' },
];
const at = '2026-09-09T10:00:00.000Z';
test('legacy migration resolves only unique groups, does not invent enrollment dates, and preserves unresolved labels', () => {
  const records = migrateMemberships({}, students, groups);
  assert.deepEqual(groupStudentIds(records, 'g1'), [1]);
  assert.equal(records.memberships[0].createdAt, undefined);
  assert.deepEqual(records.unresolved, [{ studentId: 3, groupName: 'Belirsiz' }]);
  assert.deepEqual(migrateMemberships(records, students, groups), records);
});
test('adding another group retains existing membership and duplicate submission is rejected', () => {
  const records = migrateMemberships({}, students, groups);
  const input = { id: 't1', studentId: 1, toGroupId: 'g2', reason: 'Ek eğitim', recordedAt: at };
  const result = transferMembership(records, input, students, groups);
  assert.equal(result.error, null);
  assert.deepEqual(groupStudentIds(result.records, 'g1'), [1]);
  assert.deepEqual(groupStudentIds(result.records, 'g2'), [1, 2]);
  assert.ok(transferMembership(result.records, input, students, groups).error);
  assert.equal(result.records.history[0].reason, 'Ek eğitim');
});
test('removal requires a reason and ends only the specified membership, preserving history', () => {
  const first = transferMembership(
    migrateMemberships({}, students, groups),
    { id: 't1', studentId: 1, toGroupId: 'g2', recordedAt: at },
    students,
    groups,
  ).records;
  const input = { id: 't2', studentId: 1, fromGroupIds: ['g1'], recordedAt: at };
  assert.ok(transferMembership(first, input, students, groups).error);
  const result = transferMembership(
    first,
    { ...input, reason: 'Program değişikliği', transferDate: '2026-09-08T00:00:00.000Z' },
    students,
    groups,
  );
  assert.equal(result.error, null);
  assert.deepEqual(groupStudentIds(result.records, 'g1'), []);
  assert.deepEqual(groupStudentIds(result.records, 'g2'), [1, 2]);
  assert.equal(result.records.memberships.find((m) => m.groupId === 'g1')?.status, 'ended');
  assert.equal(result.records.history.length, 2);
});
test('removed legacy membership never reappears after reload; unknown entities and dates cannot mutate', () => {
  const records = migrateMemberships({}, students, groups);
  const result = transferMembership(
    records,
    { id: 't1', studentId: 1, fromGroupIds: ['g1'], reason: 'Ayrıldı', recordedAt: at },
    students,
    groups,
  );
  assert.deepEqual(groupStudentIds(migrateMemberships(result.records, students, groups), 'g1'), []);
  for (const input of [
    { id: 'bad', studentId: 99, toGroupId: 'g2', recordedAt: at },
    { id: 'bad', studentId: 1, toGroupId: 'missing', recordedAt: at },
    { id: 'bad', studentId: 1, toGroupId: 'g2', transferDate: 'invalid', recordedAt: at },
  ]) {
    const invalid = transferMembership(records, input, students, groups);
    assert.ok(invalid.error);
    assert.equal(invalid.records, records);
  }
});
test('corrupt stored rows are preserved for recovery while duplicate memberships cannot double-count', () => {
  const records = migrateMemberships({}, students, groups);
  const broken = {
    ...records,
    memberships: [...records.memberships, { ...records.memberships[0], id: 'duplicate' }, null],
    history: {},
  };
  const restored = migrateMemberships(broken as never, students, groups);
  assert.deepEqual(groupStudentIds(restored, 'g1'), [1]);
  assert.equal(restored.recovery?.memberships.length, 2);
  assert.deepEqual(restored.history, []);
  assert.deepEqual(migrateMemberships(restored, students, groups), restored);
});
test('ambiguous or empty stored transfer operations are quarantined instead of becoming false history', () => {
  const records = migrateMemberships({}, students, groups);
  const history = [
    {
      id: 'mixed',
      studentId: 1,
      toGroupId: 'g2',
      fromGroupIds: ['g1'],
      reason: 'move',
      recordedAt: at,
    },
    { id: 'empty', studentId: 1, recordedAt: at },
    { id: 'empty-array', studentId: 1, fromGroupIds: [], recordedAt: at },
  ];
  const restored = migrateMemberships({ ...records, history }, students, groups);
  assert.deepEqual(restored.history, []);
  assert.deepEqual(restored.recovery?.history, history);
});
test('new attendance follows multiple memberships by ID after rename while saved roster remains unchanged', () => {
  const records = transferMembership(
    migrateMemberships({}, students, groups),
    { id: 't1', studentId: 1, toGroupId: 'g2', recordedAt: at },
    students,
    groups,
  ).records;
  const roster = students.map((s) => ({ ...s, status: 'Aktif' }) as Student);
  const event = { groupId: 'g2', type: 'lesson' } as CalendarEvent;
  assert.deepEqual(attendanceRosterIds(event, undefined, roster, 'Renamed', records), [1, 2]);
  assert.deepEqual(
    attendanceRosterIds(event, { marks: { 9: 'present' } } as never, roster, 'Renamed', records),
    [9],
  );
  assert.ok(
    transferMembership(
      records,
      {
        id: 'bad',
        studentId: 1,
        toGroupId: 'g3',
        fromGroupIds: ['g1'],
        reason: 'move',
        recordedAt: at,
      },
      students,
      groups,
    ).error,
  );
});
