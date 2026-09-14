import assert from 'node:assert/strict';
import test from 'node:test';
import { initialOperations, operationsReducer } from '../src/features/operations/model.ts';
import {
  restoreOperations,
  groupTeacherRows,
} from '../src/features/education/group-teacher-model.ts';

test('operations migration retains legacy collections and resolves the head teacher once', () => {
  const { groupTeacherAssignments: _, ...legacy } = initialOperations;
  const state = restoreOperations({ ...legacy, expenses: [] }, initialOperations);
  assert.deepEqual(state.expenses, []);
  assert.deepEqual(state.groupTeacherAssignments, []);
  const group = state.groups[0];
  assert.ok(group.headTeacherId);
  const rows = groupTeacherRows(state, group.id);
  assert.equal(rows[0].teacherId, group.headTeacherId);
  assert.equal(rows[0].startDate, undefined);
  assert.ok(rows[0].id.startsWith('head_teacher_'));
});
test('teacher assignment add prevents duplicate head/secondary assignments; editing cannot change identity or start date', () => {
  const state = restoreOperations(initialOperations, initialOperations);
  const group = state.groups[0];
  const teacher = state.teachers.find((t) => t.id !== group.headTeacherId)!;
  const record = {
    id: 'assignment1',
    groupId: group.id,
    teacherId: teacher.id,
    title: 'Konuşma eğitmeni',
    startDate: '2026-09-09',
    isActive: true,
    createdAt: '2026-09-09T10:00:00Z',
    updatedAt: '2026-09-09T10:00:00Z',
  };
  const added = operationsReducer(state, {
    type: 'save',
    collection: 'groupTeacherAssignments',
    record,
  });
  assert.equal(added.groupTeacherAssignments.length, 1);
  assert.equal(
    operationsReducer(added, {
      type: 'save',
      collection: 'groupTeacherAssignments',
      record: { ...record, id: 'duplicate' },
    }),
    added,
  );
  assert.equal(
    operationsReducer(state, {
      type: 'save',
      collection: 'groupTeacherAssignments',
      record: { ...record, teacherId: group.headTeacherId! },
    }),
    state,
  );
  assert.equal(
    operationsReducer(added, {
      type: 'save',
      collection: 'groupTeacherAssignments',
      record: { ...record, startDate: '2026-09-10' },
    }),
    added,
  );
  const edited = operationsReducer(added, {
    type: 'save',
    collection: 'groupTeacherAssignments',
    record: { ...record, isActive: false, endDate: '2026-09-20' },
  });
  assert.equal(edited.groupTeacherAssignments[0].isActive, false);
  assert.equal(edited.groupTeacherAssignments[0].endDate, '2026-09-20');
});
test('promoting an additional teacher cannot later resurrect their former active assignment', () => {
  const state = restoreOperations(initialOperations, initialOperations);
  const group = state.groups[0];
  const teacher = state.teachers.find((t) => t.id !== group.headTeacherId)!;
  const assigned = operationsReducer(state, {
    type: 'save',
    collection: 'groupTeacherAssignments',
    record: {
      id: 'a1',
      groupId: group.id,
      teacherId: teacher.id,
      isActive: true,
      startDate: '2026-09-01',
    },
  });
  const promoted = operationsReducer(assigned, {
    type: 'save',
    collection: 'groups',
    record: { ...group, headTeacherId: teacher.id, teacher: teacher.name },
  });
  assert.equal(promoted.groupTeacherAssignments[0].isActive, false);
  assert.equal(
    groupTeacherRows(promoted, group.id).filter((a) => a.teacherId === teacher.id).length,
    1,
  );
  const changedAgain = operationsReducer(promoted, {
    type: 'save',
    collection: 'groups',
    record: group,
  });
  assert.equal(
    groupTeacherRows(changedAgain, group.id).find((a) => a.teacherId === teacher.id)?.isActive,
    false,
  );
});
