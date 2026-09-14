import test from 'node:test';
import assert from 'node:assert/strict';
import { workspaceReducer, type WorkspaceState } from '../src/app/workspace-reducer.ts';
import {
  newMeetingDraft,
  validateMeeting,
  createMeeting,
} from '../src/features/meetings/meeting-model.ts';
import type { Student } from '../src/types/index.ts';
import { lessonToEvent } from '../src/features/calendar/lesson-model.ts';
const student: Student = {
  id: 1,
  name: 'Elif Yılmaz',
  email: 'elif@jamaster.com.tr',
  phone: '05•• ••• 12 40',
  course: 'Genel İngilizce',
  group: 'B1',
  teacher: 'Selin Demir',
  date: '2026-09-07',
  type: 'Bireysel',
  status: 'Aktif',
  payment: 'Bekliyor',
  amount: 18500,
  attendance: 94,
  color: '#eee6f4',
};
function initial(): WorkspaceState {
  return {
    students: [student],
    events: [],
    meetings: [],
    attendance: {},
    moduleRows: {},
    branch: 'New York',
    privacy: false,
    chat: [],
    settings: {},
  };
}
test('new group notes round-trip without replacing legacy workspace collections', () => {
  const state = initial();
  const note = {
    id: 'n1',
    targetId: 'g1',
    targetType: 'group' as const,
    title: 'Takip',
    content: 'Haftalık değerlendirme',
    createdAt: '2026-09-09T10:00:00Z',
    updatedAt: '2026-09-09T10:00:00Z',
  };
  const saved = workspaceReducer(state, { type: 'group-note/save', note });
  const restored: WorkspaceState = JSON.parse(JSON.stringify(saved));
  assert.deepEqual(restored.students, state.students);
  assert.equal(restored.groupNotes?.[0].content, note.content);
  assert.equal(
    workspaceReducer(restored, {
      type: 'group-note/save',
      note: { ...note, content: '' },
      expectedUpdatedAt: note.updatedAt,
    }),
    restored,
  );
  const removed = workspaceReducer(restored, {
    type: 'group-note/delete',
    groupId: 'g1',
    id: 'n1',
    expectedUpdatedAt: note.updatedAt,
  });
  assert.deepEqual(removed.groupNotes, []);
});
test('batch creation is an atomic append and repeated submission is a no-op', () => {
  const state = initial();
  const event = lessonToEvent(
    {
      groupId: 'g1',
      type: 'GROUP',
      title: 'Ders',
      date: '2026-09-21',
      endDate: '2026-09-21',
      startTime: '09:00',
      endTime: '10:00',
      teacherId: '',
      educationId: '',
      status: 'active',
    },
    100,
    { teacher: '', room: '' },
  );
  const events = [event, { ...event, id: 101, day: event.day + 1 }];
  const saved = workspaceReducer(state, { type: 'schedule/batch-create', events });
  assert.equal(saved.events.length, 2);
  assert.equal(workspaceReducer(saved, { type: 'schedule/batch-create', events }), saved);
  assert.equal(
    workspaceReducer(state, {
      type: 'schedule/batch-create',
      events: [event, { ...event, id: 102, duration: 0 }],
    }),
    state,
  );
  assert.deepEqual(saved.students, state.students);
});
test('Görüşme sonucu ve takip tarihi kayıttan önce doğrulanır', () => {
  const draft = newMeetingDraft(1);
  assert.ok(validateMeeting(draft));
  assert.ok(validateMeeting({ ...draft, result: 'CALLBACK' }));
  assert.ok(validateMeeting({ ...draft, result: 'CALLBACK', date: 'geçersiz' }));
  assert.equal(validateMeeting({ ...draft, result: 'CALLBACK', date: '2026-09-08T09:30' }), null);
  assert.equal(validateMeeting({ ...draft, result: 'COMPLETED' }), null);
});
test('Olumsuz görüşme seçilen skoru korur ve takip etkinliği oluşturmaz', () => {
  const saved = createMeeting(
    {
      ...newMeetingDraft(1),
      result: 'NEGATIVE',
      score: 5,
      date: '2026-09-08T09:30',
      reason: 'Fiyat yüksek',
    },
    student.name,
    15,
  );
  assert.equal(saved.meeting.score, 5);
  assert.equal(saved.meeting.date, '');
  assert.equal(saved.meeting.reason, 'PRICE_HIGH');
  assert.equal(saved.event, undefined);
});
test('Takip görüşmesi aynı kayıt işlemiyle geçmişe ve takvime eklenir', () => {
  const saved = createMeeting(
    {
      ...newMeetingDraft(1),
      result: 'APPOINTMENT',
      date: '2026-09-08T09:30',
      note: 'Seviye görüşmesi',
    },
    student.name,
    16,
  );
  assert.equal(saved.event?.day, 8);
  assert.equal(saved.event?.time, '09:30');
  const next = workspaceReducer(initial(), { type: 'meeting/save', ...saved });
  assert.equal(next.meetings.length, 1);
  assert.equal(next.events.length, 1);
  assert.equal(next.events[0].person, student.name);
  assert.equal(next.meetings[0].note, 'Seviye görüşmesi');
});
test('Öğrenci düzenleme yeni satır oluşturmaz ve önceki durumu değiştirmez', () => {
  const previous = initial();
  const next = workspaceReducer(previous, {
    type: 'student/save',
    student: { ...student, name: 'Elif Aksoy' },
  });
  assert.equal(next.students.length, 1);
  assert.equal(next.students[0].name, 'Elif Aksoy');
  assert.equal(previous.students[0].name, 'Elif Yılmaz');
});
test('Yeni kayıt ve yoklama aynı çalışma alanında korunur', () => {
  let state = workspaceReducer(initial(), {
    type: 'student/save',
    student: { ...student, id: 2, name: 'Ada Şahin' },
  });
  state = workspaceReducer(state, { type: 'attendance/set', id: 2, status: 'Katıldı' });
  state = workspaceReducer(state, { type: 'branch/set', branch: 'Kadıköy' });
  assert.equal(state.students.length, 2);
  assert.equal(state.attendance[2], 'Katıldı');
  assert.equal(state.branch, 'Kadıköy');
});
test('Öğretmen adı değişince öğrenci ve ders programı birlikte güncellenir', () => {
  const previous = {
    ...initial(),
    events: [
      {
        id: 2,
        day: 7,
        time: '09:00',
        duration: 90,
        title: 'İngilizce',
        teacher: 'Selin Demir',
        room: '02',
        type: 'lesson',
        color: 'green',
      },
    ],
  };
  const next = workspaceReducer(previous, {
    type: 'teacher/rename',
    previous: 'Selin Demir',
    name: 'Selin Aksoy',
  });
  assert.equal(next.students[0].teacher, 'Selin Aksoy');
  assert.equal(next.events[0].teacher, 'Selin Aksoy');
  assert.equal(previous.students[0].teacher, 'Selin Demir');
  assert.equal(previous.events[0].teacher, 'Selin Demir');
});

test('Öğrenci adı düzenlenince ilişkili görüşmenin takvimdeki adı da güncellenir', () => {
  const saved = createMeeting(
    { ...newMeetingDraft(1), result: 'APPOINTMENT', date: '2026-09-08T09:30' },
    student.name,
    16,
  );
  const previous = workspaceReducer(initial(), { type: 'meeting/save', ...saved });
  const next = workspaceReducer(previous, {
    type: 'student/save',
    student: { ...student, name: 'Elif Aksoy' },
  });
  assert.equal(next.events[0].person, 'Elif Aksoy');
  assert.equal(previous.events[0].person, 'Elif Yılmaz');
});
