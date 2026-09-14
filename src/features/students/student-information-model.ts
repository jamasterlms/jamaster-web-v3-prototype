import type { Student } from '../../types/index.ts';
import { contactConflict } from '../../lib/validation.ts';
import { parseStudentEdit, studentDraft } from './student-model.ts';
import type { RegistrationDraft } from './registration-model.ts';

export const informationKeys = [
  'identityNumber',
  'birthDate',
  'birthPlace',
  'gender',
  'bloodType',
  'maritalStatus',
  'personalOccupation',
  'phone',
  'secondPhone',
  'email',
  'address',
  'courseType',
  'level',
  'subLevel',
  'dayPreference',
  'timePreference',
  'customDays',
  'customTime',
  'source',
  'occupation',
  'institution',
  'company',
] as const;
export type InformationKey = (typeof informationKeys)[number];
export type InformationPatch = Partial<Pick<RegistrationDraft, InformationKey>>;

/** Update only edited information, with optimistic conflict checks; leave sales/status untouched. */
export function prepareInformationEdit(
  student: Student,
  patch: InformationPatch,
  expected: InformationPatch,
  students: Student[],
): { student: Student; error?: never } | { error: string; student?: never } {
  const current = studentDraft(student);
  const keys = Object.keys(patch) as InformationKey[];
  if (!keys.length || keys.some((key) => !informationKeys.includes(key)))
    return { error: 'Düzenlenecek alan bulunamadı.' };
  if (keys.some((key) => !Object.hasOwn(expected, key) || expected[key] !== current[key]))
    return {
      error: 'Bu bilgi başka bir işlemde değişti. Düzenlemeyi kapatıp güncel değeri tekrar açın.',
    };
  const merged = { ...current, ...patch };
  const result = parseStudentEdit(merged, student);
  if (!result.success) return { error: result.error.issues[0].message };
  if (
    (patch.phone !== undefined || patch.email !== undefined) &&
    contactConflict(
      students,
      {
        email: patch.email !== undefined && patch.email !== current.email ? result.data.email : '',
        phone: patch.phone !== undefined && patch.phone !== current.phone ? result.data.phone : '',
      },
      student.id,
    )
  )
    return { error: 'Bu telefon veya e-posta başka bir öğrenciye kayıtlı.' };
  const values = Object.fromEntries(keys.map((key) => [key, result.data[key]]));
  return {
    student: {
      ...student,
      ...(keys.includes('phone') ? { phone: result.data.phone } : {}),
      ...(keys.includes('email') ? { email: result.data.email } : {}),
      profile: { ...student.profile, ...values },
    },
  };
}
