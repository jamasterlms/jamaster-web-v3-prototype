import test from 'node:test';
import assert from 'node:assert/strict';
import * as model from '../src/features/calendar/attendance-model.ts';
import type { CalendarEvent, Student } from '../src/types/index.ts';
import * as calendar from '../src/lib/calendar.ts';
import * as lessonModel from '../src/features/calendar/lesson-model.ts';

const lesson: CalendarEvent = {
  id: 7,
  type: 'lesson',
  groupId: 'g1',
  lessonType: 'GROUP',
  day: 9,
  time: '23:30',
  duration: 90,
  title: 'Gece dersi',
  teacher: 'Selin',
  room: '1',
  color: '',
};
const snapshot: model.AttendanceSession = {
  id: '["New York",7]',
  branch: 'New York',
  eventId: 7,
  groupId: 'g1',
  groupName: 'B1',
  date: '2026-09-09',
  time: '23:30',
  duration: 90,
  title: 'Gece dersi',
  marks: { 1: 'present', 2: null, 3: 'absent' },
  updatedAt: '2026-09-10T00:00:00',
};
const now = new Date('2026-09-10T00:15:00').getTime();

test('Gece dersi ertesi gün aktif kalır; iptal ve geçersiz saat önceliklidir', () => {
  assert.equal(typeof model.lessonWindow, 'function');
  assert.equal(model.lessonWindow(lesson, now).status, 'active');
  assert.equal(
    model.lessonWindow(lesson, new Date('2026-09-09T23:29:59').getTime()).status,
    'pending',
  );
  assert.equal(
    model.lessonWindow(lesson, new Date('2026-09-10T01:00:01').getTime()).status,
    'completed',
  );
  assert.equal(model.lessonWindow({ ...lesson, status: 'cancelled' }, now).status, 'cancelled');
  assert.equal(model.lessonWindow({ ...lesson, time: '26:00' }, now).status, 'unknown');
});

test('Şube özeti gece devam eden dersi kaybetmez; yaklaşanları en yakından sıralar', () => {
  assert.equal(typeof model.branchAttendanceOverview, 'function');
  const result = model.branchAttendanceOverview(
    [
      { ...lesson, id: 10, day: 11, time: '10:00' },
      lesson,
      { ...lesson, id: 8, day: 10, time: '14:00' },
      { ...lesson, id: 9, day: 10, time: '09:00', status: 'cancelled' },
      { ...lesson, id: 11, day: 10, type: 'meeting' },
    ],
    now,
  );
  assert.deepEqual(
    result.active.map((e) => e.id),
    [7],
  );
  assert.deepEqual(
    result.today.map((e) => e.id),
    [9, 8],
  );
  assert.deepEqual(
    result.upcoming.map((e) => e.id),
    [10],
  );
});

test('Geçmiş, silinen dersin kaydını ve bekleyen öğrenciyi korur; başka şube karışmaz', () => {
  assert.equal(typeof model.groupAttendanceRecords, 'function');
  const records = model.groupAttendanceRecords(
    [],
    [snapshot, { ...snapshot, id: 'other', branch: 'Kadıköy' }],
    'New York',
    'g1',
    now,
  );
  assert.equal(records.length, 1);
  assert.equal(records[0].session?.marks[2], null);
  assert.equal(records[0].event, undefined);
  assert.equal(records[0].participation, 33);
  assert.equal(records[0].rosterCount, 3);
});

test('Özel ders yalnız atanmış öğrenciyi alır; kayıtlı yoklama güncel üyelerle ezilmez', () => {
  assert.equal(typeof model.attendanceRosterIds, 'function');
  const students = [1, 2, 4].map((id) => ({ id, group: 'B1', status: 'Aktif' }) as Student);
  assert.deepEqual(
    model.attendanceRosterIds(
      { ...lesson, lessonType: 'PRIVATE', studentId: 2 },
      undefined,
      students,
      'B1',
    ),
    [2],
  );
  assert.deepEqual(model.attendanceRosterIds(lesson, snapshot, students, 'B1'), [1, 2, 3]);
  assert.deepEqual(
    model.attendanceRosterIds(
      { ...lesson, lessonType: 'PRIVATE', studentId: undefined },
      undefined,
      students,
      'B1',
    ),
    [],
  );
});

test('Geçmiş tarih aralığı dahilidir; durum ve ders tipi filtreleri birlikte uygulanır', () => {
  assert.equal(typeof model.filterAttendanceRecords, 'function');
  const records = model.groupAttendanceRecords(
    [lesson, { ...lesson, id: 8, lessonType: 'PRIVATE' }, { ...lesson, id: 9, day: 8 }],
    [],
    'New York',
    'g1',
    now,
  );
  const result = model.filterAttendanceRecords(records, {
    from: '2026-09-09',
    to: '2026-09-09',
    statuses: ['active'],
    types: ['PRIVATE'],
    sort: 'desc',
  });
  assert.deepEqual(
    result.map((r) => r.eventId),
    [8],
  );
  assert.equal(
    model.filterAttendanceRecords(records, {
      from: '2026-09-10',
      to: '2026-09-01',
      statuses: [],
      types: [],
      sort: 'asc',
    }).length,
    0,
  );
});

test('Oturum seçimi aktif dersi öne alır; yanlış açık kimlik başka derse düşmez', () => {
  assert.equal(typeof model.selectAttendanceRecord, 'function');
  const records = model.groupAttendanceRecords(
    [{ ...lesson, id: 8, day: 8 }, lesson],
    [],
    'New York',
    'g1',
    now,
  );
  assert.equal(model.selectAttendanceRecord(records, '')?.eventId, 7);
  assert.equal(model.selectAttendanceRecord(records, '999'), undefined);
  assert.equal(model.selectAttendanceRecord(records, '8')?.eventId, 8);
});

test('Öğretmen takvimi isim benzerliğiyle başka öğretmenin dersini göstermez', () => {
  assert.equal(typeof calendar.scopedCalendarEvents, 'function');
  const events = [
    { ...lesson, teacherId: 't1' },
    { ...lesson, id: 8, teacherId: 't2' },
    { ...lesson, id: 9 },
    { ...lesson, id: 10, type: 'meeting', teacherId: 't1' },
  ];
  assert.deepEqual(
    calendar
      .scopedCalendarEvents(events, { teacherId: 't1' }, [
        { id: 't1', name: 'Selin' },
        { id: 't2', name: 'Selin' },
      ])
      .map((e) => e.id),
    [7],
  );
  assert.deepEqual(
    calendar
      .scopedCalendarEvents(events, { teacherId: 't1' }, [{ id: 't1', name: 'Selin' }])
      .map((e) => e.id),
    [7, 9],
  );
  assert.deepEqual(
    calendar.scopedCalendarEvents(events, { groupId: 'missing' }, []).map((e) => e.id),
    [],
  );
});

test('Grup ve öğretmen bağlamı yeni derse aktarılır; mevcut ders yeniden atanmaz', () => {
  const context = { fixedGroupId: 'g2', defaultTeacherId: 't2' };
  assert.equal(lessonModel.lessonDraft(undefined, 9, context).groupId, 'g2');
  assert.equal(lessonModel.lessonDraft(undefined, 9, context).teacherId, 't2');
  assert.equal(lessonModel.lessonDraft({ ...lesson, teacherId: 't1' }, 9, context).groupId, 'g1');
  assert.equal(lessonModel.lessonDraft({ ...lesson, teacherId: 't1' }, 9, context).teacherId, 't1');
});

test('Ders yeniden planlandığında eski yoklama yeni tarihte düzenlenemez', () => {
  const moved = { ...lesson, day: 15 };
  const records = model.groupAttendanceRecords(
    [moved],
    [snapshot],
    'New York',
    'g1',
    new Date('2026-09-15T23:45:00').getTime(),
  );
  assert.equal(records[0].date, '2026-09-09');
  assert.equal(records[0].event, undefined);
  assert.equal(records[0].archiveReason, 'rescheduled');
  assert.equal(records[0].present, 1);
});

test('Özel derse atanan öğrenci oluşturma ve düzenleme boyunca korunur', () => {
  const draft = {
    ...lessonModel.lessonDraft(undefined, 9),
    groupId: 'g1',
    type: 'PRIVATE' as const,
    studentId: '2',
  };
  const event = lessonModel.lessonToEvent(draft, 20, { teacher: 'Selin', room: '1' });
  assert.equal(event.studentId, 2);
  assert.equal(lessonModel.lessonDraft(event).studentId, '2');
  assert.equal(
    lessonModel.lessonToEvent(
      { ...draft, studentId: '' },
      20,
      { teacher: 'Selin', room: '1' },
      event,
    ).studentId,
    undefined,
  );
});

test('Kaydedilmiş yoklamanın saatini veya katılımcısını değiştiren düzenleme engellenir', () => {
  assert.equal(typeof lessonModel.attendedLessonIssue, 'function');
  const existing = { ...lesson, lessonType: 'PRIVATE' as const, studentId: 1 };
  const draft = lessonModel.lessonDraft(existing);
  assert.ok(lessonModel.attendedLessonIssue({ ...draft, studentId: '2' }, existing, true));
  assert.ok(lessonModel.attendedLessonIssue({ ...draft, date: '2026-09-15' }, existing, true));
  assert.equal(
    lessonModel.attendedLessonIssue({ ...draft, title: 'Düzeltilmiş başlık' }, existing, true),
    null,
  );
  assert.equal(
    lessonModel.attendedLessonIssue({ ...draft, studentId: '2' }, existing, false),
    null,
  );
});

test('Başka şubede kaydedilmiş aynı ders ikinci şubede yeniden işaretlenmez', () => {
  assert.equal(typeof model.attendanceBranchConflict, 'function');
  assert.equal(model.attendanceBranchConflict([snapshot], 7, 'Kadıköy'), true);
  assert.equal(model.attendanceBranchConflict([snapshot], 7, 'New York'), false);
  assert.equal(model.attendanceBranchConflict([snapshot], 8, 'Kadıköy'), false);
});

test('Yeniden planlanan dersin bütün yoklama girişleri arşivdeki doğru tarihi açar', () => {
  assert.equal(typeof model.attendanceRoute, 'function');
  assert.equal(
    model.attendanceRoute({ ...lesson, day: 15 }, [snapshot], 'New York'),
    '/admin/groups/g1/polling?tab=past&date=2026-09-09&eventId=7',
  );
  assert.equal(
    model.attendanceRoute({ ...lesson, day: 15 }, [], 'New York'),
    '/admin/groups/g1/polling?tab=current&date=2026-09-15&eventId=7',
  );
});

test('attendance period summaries use local Monday/month boundaries and exclude future sessions', () => {
  const at = new Date('2026-09-14T12:00:00');
  const sessions = [
    { ...snapshot, id: 'old', date: '2026-08-31', marks: { 1: 'absent' as const } },
    { ...snapshot, id: 'sun', date: '2026-09-13', marks: { 1: 'present' as const } },
    { ...snapshot, id: 'mon', date: '2026-09-14', marks: { 1: 'present' as const } },
    { ...snapshot, id: 'future', date: '2026-09-15', marks: { 1: 'absent' as const } },
    { ...snapshot, id: 'unmarked', date: '2026-09-14', marks: { 1: null } },
  ];
  const result = model.attendancePeriodStats(sessions, 1, at);
  assert.equal(result.week.total, 1);
  assert.equal(result.month.total, 2);
  assert.equal(result.all.total, 3);
  assert.equal(result.week.rate, 100);
});
