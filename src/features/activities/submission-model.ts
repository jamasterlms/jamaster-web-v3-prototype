import type { Activity, Submission } from './activity-model.ts';
export const submissionStatuses: Record<Submission['status'], string> = {
  NOT_SUBMITTED: 'Teslim edilmedi',
  SUBMITTED: 'Teslim edildi',
  LATE: 'Geç teslim',
  GRADED: 'Değerlendirildi',
  RETURNED: 'Düzeltme istendi',
  RESUBMITTED: 'Yeniden teslim',
};
export function submissionIssue(
  activity: Activity,
  text: string,
  _previous?: Submission,
  _now = Date.now(),
  files: Array<Pick<File, 'name' | 'size' | 'type'>> = [],
) {
  if (['CLOSED', 'ARCHIVED'].includes(activity.status)) return 'Bu aktivite teslim almıyor.';
  if ((activity.requireText ?? true) && (!text.trim() || text.length > 10000))
    return 'Teslim metni 1–10.000 karakter olmalıdır.';
  if (text.length > 10000) return 'Teslim metni en fazla 10.000 karakter olabilir.';
  if ((activity.requireFile ?? false) && !files.length) return 'En az bir dosya seçin.';
  if (files.some((file) => !file.name)) return 'Geçerli dosyalar seçin.';
  return null;
}
export function gradeIssue(
  activity: Activity,
  grade: number | undefined,
  letter: string,
  feedback: string,
  returned = false,
) {
  if (returned) return feedback.trim() ? null : 'Düzeltme talebinizi açıklayın.';
  if (activity.gradingMethod === 'LETTER')
    return /^[A-F][+-]?$/.test(letter.trim().toUpperCase())
      ? null
      : 'A–F arasında geçerli bir harf notu girin.';
  if (activity.gradingMethod === 'PASS_FAIL')
    return [0, 1].includes(grade ?? -1) ? null : 'Geçti veya kaldı seçin.';
  if (
    grade === undefined ||
    !Number.isFinite(grade) ||
    grade < 0 ||
    grade > (activity.maxPoints || 100)
  )
    return `0–${activity.maxPoints || 100} arasında bir not girin.`;
  return null;
}
