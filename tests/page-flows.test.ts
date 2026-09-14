import test from 'node:test';
import assert from 'node:assert/strict';
import { workspaceReducer, type WorkspaceState } from '../src/app/workspace-reducer.ts';
import { attendanceStats, sessionKey } from '../src/features/calendar/attendance-model.ts';
import {
  financeRecords,
  saleBalance,
  installmentRows,
  validateReceipt,
  dueDates,
} from '../src/features/finance/finance-model.ts';
import type { Student } from '../src/types/index.ts';
import { financeSummary } from '../src/features/insights/report-model.ts';
import { contractSchema, blankContract } from '../src/features/administration/contract-model.ts';
import {
  verificationRequests,
  decisionIssue,
} from '../src/features/administration/verification-model.ts';
const student: Student = {
  id: 1,
  name: 'Deniz',
  email: '',
  phone: '',
  course: 'İngilizce',
  group: 'B1',
  teacher: 'Selin',
  date: '2026-08-01',
  type: 'Bireysel',
  status: 'Aktif',
  payment: 'Bekliyor',
  amount: 100,
  attendance: 92,
  color: '',
};
const initial = (): WorkspaceState => ({
  students: [student],
  events: [],
  meetings: [],
  attendance: {},
  moduleRows: {},
  branch: 'New York',
  privacy: false,
  chat: [],
  settings: {},
});

test('Yoklamalar ders oturumuna ve şubeye göre ayrılır, düzeltme aynı kaydı günceller', () => {
  const session = {
    id: sessionKey('New York', 7),
    branch: 'New York',
    eventId: 7,
    groupId: 'g1',
    groupName: 'B1',
    date: '2026-09-07',
    time: '09:00',
    title: 'İngilizce',
    marks: { 1: 'present' as const },
    updatedAt: '2026-09-07T12:00:00Z',
  };
  let state = workspaceReducer(initial(), { type: 'attendance/save', session });
  state = workspaceReducer(state, {
    type: 'attendance/save',
    session: {
      ...session,
      id: sessionKey('New York', 8),
      eventId: 8,
      date: '2026-09-08',
      marks: { 1: 'absent' },
    },
  });
  assert.equal(state.attendanceSessions?.length, 2);
  assert.equal(attendanceStats(state.attendanceSessions || [], 1).rate, 50);
  state = workspaceReducer(state, {
    type: 'attendance/save',
    session: { ...session, marks: { 1: 'absent' } },
  });
  assert.equal(state.attendanceSessions?.length, 2);
  assert.equal(attendanceStats(state.attendanceSessions || [], 1).rate, 0);
  assert.notEqual(sessionKey('Kadıköy', 7), session.id);
  assert.equal(attendanceStats([], 1).rate, null);
});

test('Tahsilat kaydı gerçek ödeme tarihini taşır; öğrenci düzenlemelerini ezmez', () => {
  let state = initial();
  const sale = financeRecords(state).sales[0];
  const receipt = {
    id: 'r1',
    saleId: sale.id,
    studentId: 1,
    amount: 40,
    method: 'Nakit',
    date: '2026-09-08',
  };
  state = workspaceReducer(
    { ...state, students: [{ ...student, name: 'Deniz Kaya' }] },
    { type: 'receipt/save', receipt },
  );
  assert.equal(state.students[0].name, 'Deniz Kaya');
  assert.equal(financeRecords(state).receipts[0].date, '2026-09-08');
  assert.equal(saleBalance(sale, financeRecords(state).receipts), 60);
  assert.equal(state.students[0].payment, 'Kısmi ödeme');
  const again = workspaceReducer(state, { type: 'receipt/save', receipt });
  assert.equal(financeRecords(again).receipts.length, 1);
  assert.ok(validateReceipt({ ...receipt, id: 'r2', amount: 61 }, financeRecords(state)));
  assert.ok(validateReceipt({ ...receipt, id: 'r2', amount: 0 }, financeRecords(state)));
});

test('Yeni satış önceki satışı ve tahsilatı korur; taksitler kuruş kaybetmez', () => {
  let state = initial();
  const sale = {
    id: 's2',
    studentId: 1,
    course: 'IELTS',
    planId: 'p2',
    amount: 100.01,
    method: 'Nakit',
    installments: 3,
    discount: 0,
    date: '2026-09-08',
    dueDates: dueDates('2026-09-30', 3),
  };
  state = workspaceReducer(state, { type: 'sale/save', sale });
  assert.equal(financeRecords(state).sales.length, 2);
  assert.equal(state.students[0].amount, 200.01);
  const parts = installmentRows(financeRecords(state)).filter((r) => r.saleId === 's2');
  assert.equal(Math.round(parts.reduce((n, r) => n + r.amount, 0) * 100), 10001);
  assert.deepEqual(
    parts.map((r) => r.date),
    ['2026-09-30', '2026-10-30', '2026-11-30'],
  );
  assert.deepEqual(dueDates('2027-01-31', 3), ['2027-01-31', '2027-02-28', '2027-03-31']);
});

test('Tarihi bilinmeyen eski kayıt için kayıt tarihi tahsilat tarihi olarak uydurulmaz', () => {
  const state = { ...initial(), students: [{ ...student, payment: 'Tamamlandı' }] };
  const records = financeRecords(state);
  assert.equal(records.sales[0].date, '');
  assert.equal(records.receipts[0].date, '');
  assert.equal(saleBalance(records.sales[0], records.receipts), 0);
});

test('Raporlar satış ve tahsilatı kendi tarihine göre ayırır, açık bakiye döneme göre kaybolmaz', () => {
  const state: WorkspaceState = {
    ...initial(),
    sales: [
      {
        id: 's1',
        studentId: 1,
        course: 'İngilizce',
        amount: 100,
        method: 'Nakit',
        installments: 1,
        discount: 0,
        date: '2026-08-01',
        dueDates: ['2026-09-01'],
      },
    ],
    receipts: [
      { id: 'r1', saleId: 's1', studentId: 1, amount: 40, method: 'Nakit', date: '2026-09-08' },
    ],
  };
  assert.equal(financeSummary(state, '2026-08').sold, 100);
  assert.equal(financeSummary(state, '2026-08').collected, 0);
  assert.equal(financeSummary(state, '2026-09').sold, 0);
  assert.equal(financeSummary(state, '2026-09').collected, 40);
  assert.equal(financeSummary(state, '2026-09').balance, 0);
  assert.equal(financeSummary(state, '2026-08').balance, 60);
  assert.equal(financeSummary(state, '2026-09').allTimeBalance, 60);
  assert.deepEqual(financeSummary(state, '2026-09').methods, [['Nakit', 40]]);
});

test('Grup düzenleme takvimi günceller, öğrencinin satın aldığı eğitimi ezmez', () => {
  const previous = {
    ...initial(),
    events: [
      {
        id: 7,
        groupId: 'g1',
        day: 7,
        time: '09:00',
        duration: 60,
        title: 'İngilizce',
        teacher: 'Selin',
        room: '01',
        type: 'lesson',
        color: '',
      },
    ],
  };
  const state = workspaceReducer(previous, {
    type: 'group/update',
    id: 'g1',
    previousName: 'B1',
    name: 'B1 Sabah',
    course: 'İngilizce',
    teacher: 'Ece',
    room: '02',
  });
  assert.deepEqual(state.students, previous.students);
  assert.equal(state.events[0].teacher, 'Ece');
  assert.equal(state.events[0].room, '02');
  assert.equal(previous.events[0].teacher, 'Selin');
  const explicitlyAssigned = workspaceReducer(
    {
      ...previous,
      events: [{ ...previous.events[0], teacherId: 'teacher-other', teacher: 'Deniz' }],
    },
    {
      type: 'group/update',
      id: 'g1',
      previousName: 'B1',
      name: 'B1 Sabah',
      course: 'İngilizce',
      teacher: 'Ece',
      room: '02',
    },
  );
  assert.equal(explicitlyAssigned.events[0].teacher, 'Deniz');
  assert.equal(explicitlyAssigned.events[0].teacherId, 'teacher-other');
});

test('Planlanan görüşme tamamlanır, yeni takip tarihi ayrı etkinlik olarak korunur', () => {
  const initialState = {
    ...initial(),
    events: [
      {
        id: 7,
        studentId: 1,
        day: 7,
        time: '09:00',
        duration: 30,
        title: 'Takip',
        teacher: 'Selin',
        room: '01',
        type: 'meeting',
        color: '',
      },
    ],
  };
  const meeting = {
    id: 99,
    studentId: 1,
    type: 'PHONE',
    score: 3,
    result: 'COMPLETED',
    date: '',
    reason: '',
    note: 'Tamamlandı',
    createdAt: '2026-09-08T10:00:00Z',
  };
  const state = workspaceReducer(initialState, {
    type: 'meeting/save',
    meeting,
    completedEventId: 7,
  });
  assert.equal(state.events[0].completedAt, meeting.createdAt);
  assert.equal(
    workspaceReducer(state, { type: 'meeting/save', meeting, completedEventId: 7 }).meetings.length,
    1,
  );
});

test('Kaynak sözleşme şemasında ad, açıklama, metin zorunlu; görünüm tercihleri korunur', () => {
  assert.equal(contractSchema.safeParse(blankContract).success, false);
  assert.equal(
    contractSchema.safeParse({
      ...blankContract,
      name: 'Kurs sözleşmesi',
      description: 'Dönem açıklaması',
      content: 'Kayıt için sözleşme metni.',
      showUserInfo: false,
    }).success,
    true,
  );
  assert.equal(
    contractSchema.safeParse({
      ...blankContract,
      name: '   ',
      description: 'Açıklama',
      content: 'Sözleşme metni',
    }).success,
    false,
  );
});

test('Doğrulama talepleri öğrencilerden türetilmez; ret gerekçesi ve tek karar kontrol edilir', () => {
  assert.deepEqual(verificationRequests({}), []);
  const request = {
    id: 'r1',
    type: 'SALE_CREATE' as const,
    status: 'PENDING' as const,
    requester: 'Danışman',
    createdAt: '2026-09-08',
    description: 'Satış talebi',
  };
  assert.ok(decisionIssue(request, 'REJECTED', '   '));
  assert.equal(decisionIssue(request, 'REJECTED', 'Belge eksik'), null);
  assert.ok(decisionIssue({ ...request, status: 'APPROVED' }, 'REJECTED', 'Belge eksik'));
});
