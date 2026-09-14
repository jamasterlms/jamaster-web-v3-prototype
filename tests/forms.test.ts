import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyRegistration,
  registrationSchema,
} from '../src/features/students/registration-model.ts';
import { validateExpense, validateTeacher } from '../src/features/operations/model.ts';
import { validateGroup } from '../src/features/operations/model.ts';
import { groupDraft } from '../src/features/education/group-model.ts';
import { initialOperations } from '../src/features/operations/model.ts';
import { levelSelectionErrors } from '../src/features/education/level-selection.ts';
import { monthlyExpenses, normalizeExpense } from '../src/features/finance/expense-model.ts';
import { switchRecipientMode } from '../src/features/communications/message-model.ts';
const valid = {
  ...emptyRegistration,
  name: 'Deniz Kaya',
  phone: '05321234567',
  email: 'deniz@example.com',
  studentType: 'INDIVIDUAL',
  courseType: 'GROUP',
  course: 'Genel İngilizce',
  meetingType: 'PHONE',
  meetingResult: 'PENDING',
};
test('New level assignments exclude deleted levels and sublevels while unchanged history survives', () => {
  const value = { level: 'Foundation', subLevel: 'Intro' };
  const active = {
    name: 'Foundation',
    isActive: true,
    subLevels: [{ title: 'Intro', isActive: true }],
  };
  const deleted = { ...active, deletedAt: '2026-09-09' };
  const deletedSub = {
    ...active,
    subLevels: [{ ...active.subLevels[0], deletedAt: '2026-09-09' }],
  };
  assert.deepEqual(levelSelectionErrors(value, [active]), {});
  assert.ok(levelSelectionErrors(value, [deleted]).level);
  assert.ok(levelSelectionErrors(value, [deletedSub]).subLevel);
  assert.deepEqual(levelSelectionErrors(value, [deleted], value), {});
  assert.deepEqual(levelSelectionErrors({}, [active]), {});
  assert.ok(levelSelectionErrors({ subLevel: 'Intro' }, [active]).level);
  const group = { ...groupDraft(initialOperations.groups[0]), ...value };
  assert.match(validateGroup(group, 0, [deleted]) || '', /Aktif bir seviye/);
  assert.equal(validateGroup(group, 0, [deleted], group), null);
});
test('Registration retains corporate and education preferences and enforces scheduled outcomes', () => {
  const corporate = {
    ...valid,
    studentType: 'CORPORATE_EMPLOYEE',
    courseType: 'INDIVIDUAL',
    timePreference: 'LATE_EVENING',
    company: 'Kurum',
    meetingResult: 'CALLBACK',
  };
  assert.equal(registrationSchema.safeParse(corporate).success, false);
  const parsed = registrationSchema.safeParse({ ...corporate, meetingDate: '2026-09-10T14:30' });
  assert.ok(parsed.success);
  assert.equal(parsed.data.company, 'Kurum');
  assert.equal(parsed.data.timePreference, 'LATE_EVENING');
  assert.equal(registrationSchema.safeParse({ ...valid, meetingScore: 6 }).success, false);
  assert.equal(registrationSchema.safeParse({ ...valid, email: 'invalid' }).success, false);
});
test('Recurring expenses require a period and a valid date range; descriptions are not discarded', () => {
  const expense = {
    id: 'e1',
    title: 'Kira',
    category: 'Kira',
    amount: 25000,
    date: '2026-09-07',
    status: 'Bekliyor' as const,
    note: 'Eylül kirası',
    transactionMode: 'RECURRING' as const,
  };
  assert.ok(validateExpense(expense));
  assert.ok(
    validateExpense({
      ...expense,
      recurringPeriod: 'MONTHLY',
      recurringStartDate: '2026-09-10',
      recurringEndDate: '2026-09-01',
    }),
  );
  assert.equal(
    validateExpense({ ...expense, recurringPeriod: 'MONTHLY', recurringStartDate: '2026-09-10' }),
    null,
  );
  assert.ok(validateExpense({ ...expense, transactionMode: 'ONE_TIME', note: '' }));
});
test('Teacher salary validates payment day and phone', () => {
  const teacher = {
    id: 't1',
    name: 'Selin Demir',
    specialty: 'İngilizce',
    email: 'selin@example.com',
    phone: '05325551020',
    weeklyHours: 20,
    status: 'Aktif' as const,
    salary: { amount: 50000, salaryType: 'MONTHLY' as const, paymentDay: 31 },
  };
  assert.equal(validateTeacher(teacher), null);
  assert.ok(validateTeacher({ ...teacher, salary: { ...teacher.salary, paymentDay: 32 } }));
  assert.ok(validateTeacher({ ...teacher, phone: '123' }));
});

import {
  contactConflict,
  displayPhone,
  isDate,
  isDateTime,
  normalizePhone,
  phoneSchema,
  inputValueError,
} from '../src/lib/validation.ts';
import { studentDraft, studentFromDraft } from '../src/features/students/student-model.ts';
test('Phone accepts national/international numbers, normalizes duplicates and rejects invalid or extracted text', () => {
  for (const text of [
    '0532 123 45 67',
    '(532) 123-45-67',
    '+90 532 123 4567',
    '0090 532 123 4567',
  ]) {
    assert.equal(phoneSchema.parse(text), '+905321234567');
  }
  assert.equal(normalizePhone('+1 (213) 373-4253'), '+12133734253');
  assert.ok(displayPhone('05321234567').startsWith('+90'));
  for (const text of [
    '123456',
    '00000000000',
    '053212345678',
    'Call +905321234567',
    '+999123456789',
    '+905321234567 ext 20',
    '',
  ])
    assert.equal(phoneSchema.safeParse(text).success, false, text);
  assert.equal(
    contactConflict([{ id: 1, email: 'OLD@example.com', phone: '05321234567' }], {
      email: 'new@example.com',
      phone: '+90 5321234567',
    })?.id,
    1,
  );
  assert.equal(
    contactConflict([{ id: 1, email: 'OLD@example.com', phone: '05321234567' }], {
      email: ' old@EXAMPLE.com ',
      phone: '',
    })?.id,
    1,
  );
  assert.equal(
    contactConflict([{ id: 1, email: 'a@example.com', phone: '05321234567' }], valid, 1),
    undefined,
  );
});
test('Registration validates optional contact, date, URL, dependent education and negative result fields', () => {
  for (const patch of [
    { secondPhone: '123456' },
    { birthDate: '2025-02-29' },
    { birthDate: '2099-01-01' },
    { image: 'javascript:alert(1)' },
    { meetingNote: 'x'.repeat(1501) },
  ]) {
    assert.equal(
      registrationSchema.safeParse({ ...valid, ...patch }).success,
      false,
      JSON.stringify(patch),
    );
  }
  assert.equal(
    registrationSchema.safeParse({
      ...valid,
      dayPreference: 'CUSTOM',
      customDays: 'Salı ve cuma',
      timePreference: 'CUSTOM',
      customTime: '18:00–20:00',
      birthDate: '2000-02-29',
    }).success,
    true,
  );
  assert.equal(isDate('2026-02-30'), false);
  assert.equal(isDate('2024-02-29'), true);
  assert.equal(isDateTime('2026-09-10T25:00'), false);
  assert.equal(isDateTime('2026-09-10T14:30'), true);
  assert.ok(inputValueError('text', '  ', true));
  assert.equal(inputValueError('tel', '', false), '');
});
test('Registration requires explicit source choices and permits an omitted negative reason', () => {
  for (const field of ['studentType', 'courseType', 'meetingType', 'meetingResult']) {
    assert.equal(registrationSchema.safeParse({ ...valid, [field]: '' }).success, false);
    assert.equal(emptyRegistration[field as keyof typeof emptyRegistration], '');
  }
  assert.equal(
    registrationSchema.safeParse({
      ...valid,
      meetingResult: 'NEGATIVE',
      negativeReason: '',
      meetingScore: 4,
    }).success,
    true,
  );
  assert.equal(
    registrationSchema.safeParse({
      ...valid,
      level: 'Foundation',
      subLevel: 'Intro',
      dayPreference: 'CUSTOM',
      customDays: '',
      course: '',
      advisor: '',
    }).success,
    true,
  );
});
test('Profile correction preserves incomplete legacy registration and separate employment fields', () => {
  const previous = {
    ...studentFromDraft(registrationSchema.parse(valid), 41),
    profile: undefined,
    phone: '05•• ••• 12 40',
    course: '',
  };
  const draft = {
    ...studentDraft(previous),
    name: 'Yeni Ad',
    gender: 'FEMALE' as const,
    personalOccupation: 'Mimar',
    occupation: 'EMPLOYEE' as const,
  };
  const result = parseStudentEdit(draft, previous);
  assert.ok(result.success);
  assert.equal(result.data.personalOccupation, 'Mimar');
  assert.equal(result.data.occupation, 'EMPLOYEE');
  assert.equal(parseStudentEdit({ ...draft, email: 'invalid' }, previous).success, false);
});
test('Student edit updates canonical and profile fields while preserving operational records', () => {
  const original = studentFromDraft(registrationSchema.parse(valid), 17);
  original.amount = 18500;
  original.attendance = 87;
  original.group = 'B1';
  original.profile!.legacy = 'kept';
  const data = registrationSchema.parse({
    ...studentDraft(original),
    name: ' Deniz Yeni ',
    email: ' NEW@EXAMPLE.COM ',
    phone: '+1 213 373 4253',
    address: 'Yeni adres',
    course: 'IELTS Hazırlık',
  });
  const updated = studentFromDraft(data, 17, original);
  assert.equal(updated.name, 'Deniz Yeni');
  assert.equal(updated.email, 'new@example.com');
  assert.equal(updated.profile!.phone, updated.phone);
  assert.equal(updated.profile!.name, updated.name);
  assert.equal(updated.profile!.email, updated.email);
  assert.equal(updated.profile!.course, updated.course);
  assert.equal(updated.amount, 18500);
  assert.equal(updated.group, 'B1');
  assert.equal(updated.attendance, 87);
  assert.equal(updated.profile!.legacy, 'kept');
  assert.equal(updated.date, original.date);
});

import { parseStudentEdit } from '../src/features/students/student-model.ts';
test('An unchanged masked legacy phone can be retained on edit, but never registered or replaced by another mask', () => {
  const previous = {
    ...studentFromDraft(registrationSchema.parse(valid), 1),
    phone: '05•• ••• 12 40',
  };
  const draft = { ...studentDraft(previous), name: 'Deniz Yeni' };
  assert.equal(parseStudentEdit(draft, previous).success, true);
  assert.equal(parseStudentEdit({ ...draft, phone: '05•• ••• 00 00' }, previous).success, false);
  assert.equal(registrationSchema.safeParse(draft).success, false);
  assert.equal(parseStudentEdit({ ...draft, phone: '05321234567' }, previous).success, true);
});

test('Source parity: company and occupation are optional for every student type', () => {
  for (const studentType of ['INDIVIDUAL', 'CORPORATE', 'CORPORATE_EMPLOYEE']) {
    assert.equal(
      registrationSchema.safeParse({ ...valid, studentType, company: '', occupation: '' }).success,
      true,
    );
  }
});

test('Groups require a matching level/sublevel but allow unknown room, schedule and term', () => {
  const group = {
    ...groupDraft(initialOperations.groups[0]),
    subLevel: 'B1.1',
    room: '',
    schedule: '',
    programTermId: undefined,
  };
  assert.equal(groupDraft(initialOperations.groups[0]).subLevel, '');
  assert.equal(validateGroup(group), null);
  assert.ok(validateGroup({ ...group, subLevel: '' }));
  assert.ok(
    validateGroup({ ...group, level: 'A2', subLevel: 'B1.1' }, 0, [
      { name: 'A2', isActive: true, subLevels: [{ title: 'A2.1', isActive: true }] },
    ]),
  );
  assert.equal(
    validateGroup({ ...group, level: 'Foundation', subLevel: 'Intro' }, 0, [
      { name: 'Foundation', isActive: true, subLevels: [{ title: 'Intro', isActive: true }] },
    ]),
    null,
  );
  assert.ok(validateGroup({ ...group, teacher: '' }));
  assert.ok(validateGroup({ ...group, name: 'A' }));
});

test('Recurring expense saves its visible start date and one-time mode drops hidden recurrence settings', () => {
  const recurring = normalizeExpense({
    ...initialOperations.expenses[0],
    transactionMode: 'RECURRING',
    recurringPeriod: 'MONTHLY',
    recurringStartDate: '2026-10-15',
    recurringEndDate: '2026-12-15',
  });
  assert.equal(recurring.date, '2026-10-15');
  const once = normalizeExpense({ ...recurring, transactionMode: 'ONE_TIME', date: '2026-11-01' });
  assert.equal(once.date, '2026-11-01');
  assert.equal(once.recurringStartDate, undefined);
  assert.equal(once.recurringPeriod, undefined);
  assert.equal(once.recurringEndDate, undefined);
});

test('Expense dashboard excludes income, other months and unexecuted recurrence plans', () => {
  const base = { ...initialOperations.expenses[0], date: '2026-09-03' };
  const result = monthlyExpenses(
    [
      base,
      { ...base, type: 'INCOME' },
      { ...base, date: '2026-08-31' },
      { ...base, transactionMode: 'RECURRING' },
    ],
    '2026-09',
  );
  assert.deepEqual(result, [base]);
});

test('Teacher core record does not require salary or specialty; enabled salary remains validated', () => {
  const teacher = {
    ...initialOperations.teachers[0],
    specialty: '',
    weeklyHours: 0,
    salary: undefined,
  };
  assert.equal(validateTeacher(teacher), null);
  assert.ok(
    validateTeacher({ ...teacher, salary: { amount: NaN, salaryType: 'MONTHLY', paymentDay: 1 } }),
  );
  assert.ok(
    validateTeacher({ ...teacher, salary: { amount: 0, salaryType: 'MONTHLY', paymentDay: 0 } }),
  );
});

test('Switching recipient modes is atomic, chooses a valid group and preserves the typed address', () => {
  const single = {
    ...initialOperations.messages[0],
    recipientMode: 'single' as const,
    recipient: 'Deniz Kaya',
    recipientAddress: '+905321234567',
  };
  const bulk = switchRecipientMode(single, 'bulk', ['Tüm aktif öğrenciler']);
  assert.equal(bulk.recipientMode, 'bulk');
  assert.equal(bulk.recipient, 'Tüm aktif öğrenciler');
  const restored = switchRecipientMode(bulk, 'single', ['Tüm aktif öğrenciler']);
  assert.equal(restored.recipientMode, 'single');
  assert.equal(restored.recipientAddress, single.recipientAddress);
  assert.equal(restored.body, single.body);
});
