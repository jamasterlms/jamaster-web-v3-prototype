import { parseStudentEdit } from './student-model';
import { useRef, useState } from 'react';
import { contactMatches } from '@/lib/validation';
import type { Student } from '@/types';
import { registrationSchema, type RegistrationDraft } from './registration-model';
import type { RegistrationErrors } from './registration-fields';
import { useLevelCatalog } from '@/features/education/level-catalog';
import { levelSelectionErrors } from '@/features/education/level-selection';
export function useRegistrationValidation(
  draft: RegistrationDraft,
  students: Student[],
  excludeId?: number,
  edit = false,
) {
  const levels = useLevelCatalog();
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const formRef = useRef<HTMLFormElement>(null);
  const parse = () =>
    edit
      ? parseStudentEdit(
          draft,
          students.find((s) => s.id === excludeId),
        )
      : registrationSchema.safeParse(draft);
  const collect = () => {
    const parsed = parse(),
      found: RegistrationErrors = {};
    if (!parsed.success)
      for (const issue of parsed.error.issues)
        found[issue.path[0] as keyof RegistrationDraft] ||= issue.message;
    const previous = edit
      ? students.find((student) => student.id === excludeId)?.profile
      : undefined;
    Object.assign(
      found,
      levelSelectionErrors(
        draft,
        levels,
        previous
          ? {
              level: String(previous.level || ''),
              subLevel: String(previous.subLevel || ''),
            }
          : undefined,
      ),
    );
    for (const match of contactMatches(students, draft, excludeId))
      found[match.draftField] =
        match.draftField === 'email'
          ? `Bu e-posta ${match.student.name} adına kayıtlı (#${match.student.id}).`
          : `Bu telefon ${match.student.name} adına kayıtlı (#${match.student.id}).`;
    return found;
  };
  const validateField = (key: keyof RegistrationDraft) =>
    setErrors((prev) => ({ ...prev, [key]: collect()[key] }));
  const validate = (keys?: (keyof RegistrationDraft)[]) => {
    const all = collect();
    const found = Object.fromEntries(
      Object.entries(all).filter(([key]) => !keys || keys.includes(key as keyof RegistrationDraft)),
    ) as RegistrationErrors;
    setErrors(found);
    return found;
  };
  const focusError = () =>
    requestAnimationFrame(() =>
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
    );
  const matches = contactMatches(students, draft, excludeId);
  return { errors, setErrors, formRef, validateField, validate, focusError, parse, matches };
}
