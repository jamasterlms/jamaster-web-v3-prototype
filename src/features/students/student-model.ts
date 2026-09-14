import { z } from 'zod';
import { registrationSchema } from './registration-model.ts';
import type { Student } from '../../types/index.ts';
import { localDate } from '../../lib/validation.ts';
import { emptyRegistration, studentTypes, type RegistrationDraft } from './registration-model.ts';
import { labelFor, scheduledResults } from '../meetings/meeting-options.ts';
export function studentDraft(student?: Student): RegistrationDraft {
  if (!student) return { ...emptyRegistration };
  const profile = Object.fromEntries(
    Object.entries(student.profile || {}).filter(
      ([key, value]) =>
        key in emptyRegistration &&
        typeof value === typeof emptyRegistration[key as keyof RegistrationDraft],
    ),
  );
  return {
    ...emptyRegistration,
    ...profile,
    name: student.name,
    email: student.email,
    phone: student.phone,
    course: student.course,
    studentType: (studentTypes.find(([, text]) => text === student.type)?.[0] ||
      'INDIVIDUAL') as RegistrationDraft['studentType'],
    advisor: student.advisor || String(profile.advisor || ''),
  };
}
export function studentFromDraft(
  draft: RegistrationDraft,
  id: number,
  previous?: Student,
): Student {
  const profile = {
    ...draft,
    meetingDate: scheduledResults.has(draft.meetingResult) ? draft.meetingDate : '',
    negativeReason: draft.meetingResult === 'NEGATIVE' ? draft.negativeReason : '',
    customDays: draft.dayPreference === 'CUSTOM' ? draft.customDays : '',
    customTime: draft.timePreference === 'CUSTOM' ? draft.customTime : '',
  };
  return {
    id,
    date: localDate(),
    group: 'Henüz atanmadı',
    teacher: 'Henüz atanmadı',
    status: draft.meetingResult === 'SALE' ? 'Aktif' : 'Potansiyel',
    payment: 'Bekliyor',
    amount: 0,
    attendance: 0,
    color: '#e6eedb',
    ...previous,
    name: draft.name,
    email: draft.email,
    phone: draft.phone,
    course: draft.course,
    advisor: draft.advisor,
    type: labelFor(studentTypes, draft.studentType),
    profile: { ...previous?.profile, ...profile },
  };
}

export function parseStudentEdit(draft: RegistrationDraft, previous?: Student) {
  const baseline = previous ? studentDraft(previous) : undefined;
  // Editing personal data must not require an unrelated, historic registration to be completed.
  const shape = { ...registrationSchema.shape };
  const independent = [
    'meetingType',
    'meetingResult',
    'meetingDate',
    'meetingNote',
    'negativeReason',
  ] as const;
  const profileSchema = z.object({
    ...shape,
    ...Object.fromEntries(independent.map((key) => [key, z.string()])),
    course: z.string(),
    advisor: z.string(),
  });
  if (!baseline)
    return profileSchema.safeParse(draft) as ReturnType<typeof registrationSchema.safeParse>;
  const unchanged = Object.fromEntries(
    Object.keys(shape)
      .filter(
        (key) => draft[key as keyof RegistrationDraft] === baseline[key as keyof RegistrationDraft],
      )
      .map((key) => [key, z.literal(draft[key as keyof RegistrationDraft])]),
  );
  return profileSchema.extend(unchanged).safeParse(draft) as ReturnType<
    typeof registrationSchema.safeParse
  >;
}
