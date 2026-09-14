import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearCompletedSelection,
  retainSelection,
  serializeCSV,
  serializeTable,
} from '../src/lib/table-export.ts';
import {
  communicationHistory,
  emptyHistoryFilter,
  readHistoryFilter,
  studentMeetingHistory,
} from '../src/features/students/history-model.ts';
import {
  submissionGradeLabel,
  type Submission,
} from '../src/features/activities/activity-model.ts';
import type { CommunicationLog } from '../src/features/entities/record-model.ts';
import type { Meeting } from '../src/types/index.ts';
import type { Student } from '../src/types/index.ts';
import { prepareInformationEdit } from '../src/features/students/student-information-model.ts';
import { studentDraft } from '../src/features/students/student-model.ts';

test('Selection drops filtered/deleted records and preserves the current reference when unchanged', () => {
  const selected = { a: true, b: true, c: false };
  assert.deepEqual(retainSelection(selected, ['a']), { a: true });
  assert.deepEqual(retainSelection(selected, []), {});
  const unchanged = { a: true };
  assert.equal(retainSelection(unchanged, ['a', 'b']), unchanged);
  assert.deepEqual(retainSelection({ a: true }, ['b', 'c']), {});
});
test('Bulk success clears only completed IDs and never restores selections removed by filtering', () => {
  const latest = { failed: true, completed: true, newlySelected: true };
  assert.deepEqual(clearCompletedSelection(latest, ['completed', 'completed', 'removed']), {
    failed: true,
    newlySelected: true,
  });
  assert.deepEqual(clearCompletedSelection(latest, []), latest);
  assert.deepEqual(clearCompletedSelection(latest), {});
  const filtered = retainSelection(latest, ['failed']);
  assert.deepEqual(clearCompletedSelection(filtered, ['completed']), { failed: true });
  assert.deepEqual(latest, { failed: true, completed: true, newlySelected: true });
});
test('Exports include only declared fields and matching rows; JSON retains numeric zero and null', () => {
  const rows = [
    { name: 'Elif', amount: 0, internal: 'private' },
    { name: 'Ada', amount: 25, internal: 'hidden' },
  ];
  const columns = [
    { key: 'name', label: 'Ad', value: (r: (typeof rows)[number]) => r.name },
    { key: 'amount', label: 'Tutar', value: (r: (typeof rows)[number]) => r.amount },
  ];
  assert.deepEqual(JSON.parse(serializeTable(rows.slice(0, 1), columns, 'json')), [
    { name: 'Elif', amount: 0 },
  ]);
  assert.equal(serializeTable(rows.slice(1), columns, 'csv'), '\uFEFF"Ad";"Tutar"\r\n"Ada";"25"');
});
test('CSV escapes quotes, preserves leading zeroes and neutralizes whitespace-prefixed formulas', () => {
  assert.equal(serializeCSV([[-125.5, 0]]), '\uFEFF"-125.5";"0"');
  const csv = serializeCSV([
    ['05320000000', 'a;"b', '=1+1', '  =1+1', '\n@SUM(A1)', '+90532', 'İstanbul', null],
  ]);
  assert.equal(
    csv,
    '\uFEFF"05320000000";"a;""b";"\'=1+1";"\'  =1+1";"\'\n@SUM(A1)";"\'+90532";"İstanbul";""',
  );
});
const log = (
  id: string,
  studentId: number,
  createdAt: string,
  channel: CommunicationLog['channel'] = 'sms',
): CommunicationLog => ({
  id,
  messageId: id,
  studentId,
  channel,
  createdAt,
  address: '05320000000',
  title: 'Kayıt',
  content: 'İngilizce',
  status: 'SENT',
  senderName: 'İpek',
});
test('Communication filters retain student and channel scope; Turkish search and inclusive dates work', () => {
  const records = [
    log('b', 1, '2026-09-10T18:00:00'),
    log('a', 1, '2026-09-10T09:00:00'),
    log('other-student', 2, '2026-09-10T12:00:00'),
    log('email', 1, '2026-09-10T12:00:00', 'email'),
    log('old', 1, '2026-09-09T23:59:59'),
  ];
  const filter = {
    ...emptyHistoryFilter,
    search: 'İPEK',
    startDate: '2026-09-10',
    endDate: '2026-09-10',
  };
  assert.deepEqual(
    communicationHistory(records, 1, 'sms', filter).map((r) => r.id),
    ['b', 'a'],
  );
  assert.deepEqual(
    communicationHistory(records, 1, 'sms', { ...filter, order: 'asc' }).map((r) => r.id),
    ['a', 'b'],
  );
  assert.equal(records[0].id, 'b');
  assert.equal(
    readHistoryFilter(new URLSearchParams('sort=unknown&order=drop'), ['createdAt', 'status']).sort,
    'createdAt',
  );
});
test('Meeting date sorting leaves unscheduled records last in either direction', () => {
  const meeting = (id: number, date: string): Meeting => ({
    id,
    studentId: 1,
    date,
    type: 'PHONE',
    result: 'CALLBACK',
    score: 3,
    reason: '',
    note: '',
    createdAt: '2026-09-10',
  });
  const records = [meeting(1, ''), meeting(2, '2026-09-11T09:00'), meeting(3, '2026-09-10T15:00')];
  assert.deepEqual(
    studentMeetingHistory(records, 1, {
      ...emptyHistoryFilter,
      sort: 'meetingDate',
      order: 'asc',
    }).map((r) => r.id),
    [3, 2, 1],
  );
  assert.deepEqual(
    studentMeetingHistory(records, 1, { ...emptyHistoryFilter, sort: 'meetingDate' }).map(
      (r) => r.id,
    ),
    [2, 3, 1],
  );
});
test('Student grades preserve letters, percentages, zero and unknown grades', () => {
  const record: Submission = {
    id: 's',
    activityId: 'a',
    studentId: 1,
    studentName: 'Elif',
    submittedAt: '',
    status: 'GRADED',
  };
  assert.equal(submissionGradeLabel(undefined, 100), '—');
  assert.equal(submissionGradeLabel({ ...record, grade: null }), '—');
  assert.equal(submissionGradeLabel({ ...record, grade: 0 }, 100), '0 / 100');
  assert.equal(submissionGradeLabel({ ...record, grade: null, percentage: 0 }), '%0');
  assert.equal(
    submissionGradeLabel({ ...record, grade: 95, letterGrade: 'AA', percentage: 95 }),
    'AA',
  );
});

const student: Student = {
  id: 1,
  name: 'Elif',
  email: 'elif@example.com',
  phone: '+905321234567',
  course: 'İngilizce',
  group: 'g1',
  teacher: 'Selin',
  date: '2026-09-01',
  type: 'Bireysel',
  status: 'Aktif',
  payment: 'Ödendi',
  amount: 10000,
  attendance: 95,
  color: '',
  profile: {
    birthPlace: 'İstanbul',
    occupation: 'STUDENT',
    institution: 'Okul',
    company: '',
    level: 'B1',
    subLevel: 'B1.1',
  },
};
test('Inline edit preserves unrelated financial/education records and normalizes changed contact fields', () => {
  const legacyDuplicate = { ...student, id: 2, email: 'old@example.com' };
  assert.ok(
    prepareInformationEdit(student, { email: 'valid-new@example.com' }, { email: student.email }, [
      student,
      legacyDuplicate,
    ]).student,
    'An unchanged legacy shared phone must not block an unrelated email correction',
  );
  const result = prepareInformationEdit(
    student,
    { email: ' new@example.com ' },
    { email: student.email },
    [student],
  );
  assert.ok(result.student);
  assert.equal(result.student.email, 'new@example.com');
  assert.equal(result.student.amount, 10000);
  assert.equal(result.student.status, 'Aktif');
  assert.equal(result.student.profile?.institution, 'Okul');
  assert.equal(result.student.profile?.level, 'B1');
  assert.equal(student.email, 'elif@example.com');
});
test('Inline edit rejects stale fields, duplicate contacts and invalid birthdates', () => {
  assert.ok(
    prepareInformationEdit(student, { birthPlace: 'Ankara' }, { birthPlace: 'İzmir' }, [student])
      .error,
  );
  assert.ok(
    prepareInformationEdit(student, { birthDate: '2099-01-01' }, { birthDate: '' }, [student])
      .error,
  );
  const other = { ...student, id: 2, email: 'other@example.com', phone: '+905339876543' };
  assert.ok(
    prepareInformationEdit(student, { email: other.email }, { email: student.email }, [
      student,
      other,
    ]).error,
  );
  assert.ok(
    prepareInformationEdit(student, { phone: '05339876543' }, { phone: student.phone }, [
      student,
      other,
    ]).error,
  );
  assert.ok(
    prepareInformationEdit(student, { phone: 'abc' }, { phone: student.phone }, [student]).error,
  );
});
test('Paired education updates preserve levels and clear affiliations explicitly without changing student lifecycle', () => {
  const draft = studentDraft(student);
  const result = prepareInformationEdit(
    student,
    { occupation: 'EMPLOYEE', institution: '', company: '' },
    { occupation: draft.occupation, institution: draft.institution, company: draft.company },
    [student],
  );
  assert.equal(result.student?.profile?.institution, '');
  assert.equal(result.student?.profile?.occupation, 'EMPLOYEE');
  assert.equal(result.student?.status, 'Aktif');
  const levels = prepareInformationEdit(
    student,
    { level: 'B2', subLevel: 'B2.1' },
    { level: 'B1', subLevel: 'B1.1' },
    [student],
  );
  assert.equal(levels.student?.profile?.subLevel, 'B2.1');
});
