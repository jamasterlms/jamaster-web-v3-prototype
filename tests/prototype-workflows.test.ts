import { test } from 'node:test';
import { passwordIssue } from '../src/features/access/authentication-model.ts';
import assert from 'node:assert/strict';

test('login and reset retain source password constraints', () => {
  assert.equal(passwordIssue('123456', false), null);
  assert.ok(passwordIssue('12345', false));
  assert.ok(passwordIssue('123456', true));
  assert.ok(passwordIssue('abcdef', true));
  assert.equal(passwordIssue('Abc123', true), null);
});
import { gradeIssue, submissionIssue } from '../src/features/activities/submission-model.ts';
import type { Activity, Submission } from '../src/features/activities/activity-model.ts';
import { calendarRange, gridMinute } from '../src/features/calendar/calendar-interaction.ts';
import { documentFileIssue } from '../src/features/students/document-model.ts';
import { tableXlsx } from '../src/lib/table-xlsx.ts';
import { unzipSync, strFromU8 } from 'fflate';
const activity: Activity = {
  id: 'a1',
  groupId: 'g1',
  title: 'Ödev',
  type: 'ASSIGNMENT',
  gradingMethod: 'POINTS',
  maxPoints: 100,
  description: '',
  allowLateSubmission: false,
  dueDate: '2026-09-10T12:00',
  status: 'PUBLISHED',
  createdAt: '',
  updatedAt: '',
};
test('submission fields are conditional and only closed or archived activities block the source form', () => {
  const afterDeadline = Date.parse('2026-09-10T13:00');
  assert.equal(submissionIssue(activity, 'My answer', undefined, afterDeadline), null);
  assert.equal(submissionIssue({ ...activity, status: 'DRAFT' }, 'Answer'), null);
  assert.ok(submissionIssue({ ...activity, status: 'CLOSED' }, 'Answer'));
  assert.ok(submissionIssue(activity, ' '));
  assert.equal(submissionIssue({ ...activity, requireText: false }, ''), null);
  assert.ok(submissionIssue({ ...activity, requireFile: true }, 'Answer'));
  assert.equal(
    submissionIssue(
      { ...activity, requireText: false, requireFile: true },
      '',
      undefined,
      afterDeadline,
      [
        { name: 'work.pdf', size: 42, type: 'application/pdf' },
        { name: 'notes.txt', size: 12, type: 'text/plain' },
      ],
    ),
    null,
  );
  assert.equal(submissionIssue(activity, 'Changed', { status: 'GRADED' } as Submission), null);
});
test('grades reject missing, non-finite, excessive and invalid letter values; return needs feedback', () => {
  for (const value of [undefined, NaN, -1, 101]) assert.ok(gradeIssue(activity, value, '', ''));
  assert.equal(gradeIssue(activity, 0, '', ''), null);
  assert.ok(gradeIssue(activity, undefined, '', '', true));
  assert.equal(gradeIssue(activity, undefined, '', 'Please revise', true), null);
  assert.equal(gradeIssue({ ...activity, gradingMethod: 'LETTER' }, undefined, 'b+', ''), null);
  assert.ok(gradeIssue({ ...activity, gradingMethod: 'LETTER' }, undefined, 'XYZ', ''));
  assert.ok(gradeIssue({ ...activity, gradingMethod: 'PASS_FAIL' }, 2, '', ''));
});
test('calendar coordinates use physical grid bounds and keep midnight rollover', () => {
  assert.equal(gridMinute(200, 100, 880, 8, 10), 540);
  assert.equal(gridMinute(100, 50, 440, 8, 10), 540);
  assert.equal(gridMinute(-10, 100, 880, 8, 10), 480);
  assert.equal(gridMinute(2000, 100, 880, 8, 10), 1065);
  assert.deepEqual(calendarRange(10, 23 * 60 + 30, 90), {
    date: '2026-09-10',
    endDate: '2026-09-11',
    startTime: '23:30',
    endTime: '01:00',
  });
});
test('document upload rejects disguised HTML, SVG, invalid data URLs and oversized payloads', () => {
  assert.equal(
    documentFileIssue({
      name: 'test.pdf',
      type: 'application/pdf',
      dataUrl: 'data:application/pdf;base64,' + btoa('%PDF-1.7\nexample'),
    }),
    null,
  );
  assert.ok(
    documentFileIssue({
      name: 'test.pdf',
      type: 'application/pdf',
      dataUrl: 'data:application/pdf;base64,' + btoa('<html>unsafe</html>'),
    }),
  );
  assert.ok(
    documentFileIssue({
      name: 'test.svg',
      type: 'image/svg+xml',
      dataUrl: 'data:image/svg+xml;base64,PHN2Zz4=',
    }),
  );
  assert.ok(
    documentFileIssue({
      name: 'test.pdf',
      type: 'application/pdf',
      dataUrl: 'javascript:alert(1)',
    }),
  );
});
test('Excel export is a readable ZIP workbook with numeric cells and literal formula-like strings', () => {
  const files = unzipSync(
    tableXlsx(
      [{ title: '=SUM(A1:A2)', amount: -42.8, hidden: 'secret' }],
      [
        { key: 'title', label: 'Ad & başlık', value: (row) => row.title },
        { key: 'amount', label: 'Tutar', value: (row) => row.amount },
      ],
    ),
  );
  const sheet = strFromU8(files['xl/worksheets/sheet1.xml']);
  assert.ok(files['[Content_Types].xml'] && files['_rels/.rels'] && files['xl/workbook.xml']);
  assert.match(sheet, /t="inlineStr"/);
  assert.match(sheet, /=SUM\(A1:A2\)/);
  assert.match(sheet, /<v>-42.8<\/v>/);
  assert.ok(!sheet.includes('<f>') && !sheet.includes('secret'));
  assert.match(sheet, /Ad &amp; başlık/);
});

import { workspaceReducer, type WorkspaceState } from '../src/app/workspace-reducer.ts';
import { workspaceNotifications } from '../src/features/settings/notification-model.ts';
const workspace = (): WorkspaceState => ({
  students: [
    {
      id: 1,
      name: 'Öğrenci',
      email: 'student@example.com',
      phone: '+905321234567',
      course: 'İngilizce',
      group: 'B1',
      teacher: 'Öğretmen',
      date: '2026-09-07',
      type: 'Bireysel',
      status: 'Aktif',
      payment: 'Ödendi',
      amount: 0,
      attendance: 100,
      color: '',
    },
  ],
  events: [],
  meetings: [],
  attendance: {},
  moduleRows: {},
  branch: 'New York',
  privacy: false,
  chat: [],
  settings: {},
  groupMemberships: {
    memberships: [{ id: 'm1', studentId: 1, groupId: 'g1', status: 'active' }],
    history: [],
    unresolved: [],
  },
});
test('full local activity workflow publishes, receives repeated submissions, returns and grades one current submission', () => {
  let state = workspace();
  state = workspaceReducer(state, {
    type: 'activity/save',
    activity: { ...activity, dueDate: undefined, status: 'DRAFT' },
  });
  state = workspaceReducer(state, {
    type: 'activity/status',
    id: 'a1',
    expected: 'DRAFT',
    status: 'PUBLISHED',
  });
  const answer: Submission = {
    id: 's1',
    activityId: 'a1',
    studentId: 1,
    studentName: 'untrusted name',
    submittedAt: '',
    status: 'GRADED',
    grade: 100,
    text: 'First answer',
  };
  state = workspaceReducer(state, { type: 'submission/save', submission: answer });
  assert.equal(state.activitySubmissions![0].studentName, 'Öğrenci');
  assert.equal(state.activitySubmissions![0].grade, undefined);
  assert.equal(state.activitySubmissions![0].status, 'SUBMITTED');
  state = workspaceReducer(state, {
    type: 'submission/save',
    submission: { ...answer, saveToken: 'save-2' },
    expectedActivityUpdatedAt: state.activities![0].updatedAt,
    expectedPreviousSubmittedAt: state.activitySubmissions![0].submittedAt,
  });
  assert.equal(state.activitySubmissions![0].attemptNumber, 2);
  assert.equal(state.activitySubmissions![0].saveToken, 'save-2');
  state = workspaceReducer(state, {
    type: 'submission/grade',
    id: 's1',
    feedback: 'Expand your answer',
    privateFeedback: 'Private note',
    returned: true,
  });
  state = workspaceReducer(state, {
    type: 'submission/save',
    submission: { ...answer, id: 's2', text: 'Expanded answer' },
  });
  assert.equal(state.activitySubmissions!.length, 1);
  assert.equal(state.activitySubmissions![0].id, 's1');
  assert.equal(state.activitySubmissions![0].privateFeedback, undefined);
  state = workspaceReducer(state, {
    type: 'submission/grade',
    id: 's1',
    grade: 82,
    feedback: 'Well done',
    privateFeedback: 'For teacher',
    returned: false,
  });
  assert.equal(state.activitySubmissions![0].percentage, 82);
  assert.equal(state.activitySubmissions![0].status, 'GRADED');
  assert.ok(state.auditLogs!.some((log) => log.action === 'Çalışma değerlendirildi'));
  assert.ok(!workspaceNotifications(state, 10).some((n) => n.type === 'NEW_REQUEST'));
});
test('unassigned student submissions and stale activity changes are rejected', () => {
  const state = { ...workspace(), activities: [{ ...activity, dueDate: undefined }] };
  assert.equal(
    workspaceReducer(state, {
      type: 'submission/save',
      submission: {
        id: 's2',
        activityId: 'a1',
        studentId: 2,
        studentName: 'Other',
        text: 'Answer',
        submittedAt: '',
        status: 'SUBMITTED',
      },
    }),
    state,
  );
  assert.equal(
    workspaceReducer(state, {
      type: 'activity/status',
      id: 'a1',
      status: 'ARCHIVED',
      expected: 'DRAFT',
    }),
    state,
  );
});
test('submission save rejects stale activity and previous-submission revisions', () => {
  const initial = workspaceReducer(
    { ...workspace(), activities: [{ ...activity, dueDate: undefined }] },
    {
      type: 'submission/save',
      submission: {
        id: 's1',
        activityId: 'a1',
        studentId: 1,
        studentName: '',
        text: 'First',
        submittedAt: '',
        status: 'SUBMITTED',
      },
    },
  );
  const next = { ...initial.activitySubmissions![0], text: 'Second', saveToken: 'next' };
  assert.equal(
    workspaceReducer(initial, {
      type: 'submission/save',
      submission: next,
      expectedActivityUpdatedAt: 'stale-activity',
      expectedPreviousSubmittedAt: initial.activitySubmissions![0].submittedAt,
    }),
    initial,
  );
  assert.equal(
    workspaceReducer(initial, {
      type: 'submission/save',
      submission: next,
      expectedActivityUpdatedAt: initial.activities![0].updatedAt,
      expectedPreviousSubmittedAt: 'stale-submission',
    }),
    initial,
  );
});
