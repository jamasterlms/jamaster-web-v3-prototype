import { z } from 'zod';
import { isDate } from '../../lib/validation.ts';
export const activityTypes = {
  EXAM: 'Sınav',
  QUIZ: 'Kısa sınav',
  ASSIGNMENT: 'Ödev',
  PROJECT: 'Proje',
  PRESENTATION: 'Sunum',
  DISCUSSION: 'Tartışma',
  PRACTICE: 'Uygulama',
  HOMEWORK: 'Ev ödevi',
  LAB: 'Laboratuvar',
  READING: 'Okuma',
  VIDEO: 'Video',
  RESOURCE: 'Kaynak',
};
export const gradingMethods = {
  POINTS: 'Puan',
  PERCENTAGE: 'Yüzde',
  LETTER: 'Harf',
  PASS_FAIL: 'Geçti / kaldı',
  RUBRIC: 'Dereceli puanlama',
  CUSTOM: 'Özel',
};
export const activityStatuses = {
  DRAFT: 'Taslak',
  PUBLISHED: 'Yayımlandı',
  SCHEDULED: 'Planlandı',
  ACTIVE: 'Aktif',
  CLOSED: 'Kapandı',
  ARCHIVED: 'Arşivlendi',
};
export type Activity = {
  id: string;
  title: string;
  type: keyof typeof activityTypes;
  groupId: string;
  gradingMethod: keyof typeof gradingMethods;
  maxPoints?: number;
  dueDate?: string;
  description: string;
  instructions?: string;
  allowLateSubmission: boolean;
  /** Defaults preserve records created before submission requirements existed. */
  requireText?: boolean;
  requireFile?: boolean;
  maxSubmissions?: number;
  status: keyof typeof activityStatuses;
  createdAt: string;
  updatedAt: string;
};
export type Submission = {
  id: string;
  activityId: string;
  studentId: number;
  studentName: string;
  submittedAt: string;
  status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'LATE' | 'GRADED' | 'RETURNED' | 'RESUBMITTED';
  text?: string;
  files?: { storageKey: string; name: string; size: number; type: string }[];
  attemptNumber?: number;
  gradedAt?: string;
  /** Local acknowledgement token; never displayed or treated as a server identifier. */
  saveToken?: string;
  grade?: number | null;
  maxGrade?: number | null;
  percentage?: number | null;
  letterGrade?: string | null;
  feedback?: string;
  privateFeedback?: string;
};
export function submissionGradeLabel(submission?: Submission, maxPoints?: number) {
  if (!submission) return '—';
  if (submission.letterGrade?.trim()) return submission.letterGrade;
  if (
    submission.grade !== undefined &&
    submission.grade !== null &&
    Number.isFinite(submission.grade)
  ) {
    const max = submission.maxGrade ?? maxPoints;
    return max !== undefined && max > 0 ? `${submission.grade} / ${max}` : String(submission.grade);
  }
  return submission.percentage !== undefined &&
    submission.percentage !== null &&
    Number.isFinite(submission.percentage)
    ? `%${submission.percentage}`
    : '—';
}
export const activitySchema = z
  .object({
    id: z.string().min(1),
    title: z.string().trim().min(1, 'Başlık zorunludur.').max(255),
    type: z.enum(
      Object.keys(activityTypes) as [keyof typeof activityTypes, ...(keyof typeof activityTypes)[]],
    ),
    groupId: z.string().min(1, 'Grup seçin.'),
    gradingMethod: z.enum(
      Object.keys(gradingMethods) as [
        keyof typeof gradingMethods,
        ...(keyof typeof gradingMethods)[],
      ],
    ),
    maxPoints: z.number().finite().int().positive().optional(),
    description: z.string().max(10000),
    allowLateSubmission: z.boolean(),
    requireText: z.boolean().optional(),
    requireFile: z.boolean().optional(),
    maxSubmissions: z.number().int().min(1).max(20).optional(),
    status: z.enum(
      Object.keys(activityStatuses) as [
        keyof typeof activityStatuses,
        ...(keyof typeof activityStatuses)[],
      ],
    ),
    dueDate: z
      .string()
      .refine(
        (v) =>
          !v ||
          (isDate(v.slice(0, 10)) &&
            /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d/.test(v) &&
            Number.isFinite(Date.parse(v))),
        'Geçerli tarih girin.',
      )
      .optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .superRefine((v, c) => {
    if (v.gradingMethod === 'PERCENTAGE' && v.maxPoints !== undefined && v.maxPoints !== 100)
      c.addIssue({
        code: 'custom',
        path: ['maxPoints'],
        message: 'Yüzde değerlendirmesinde en yüksek puan 100 olmalıdır.',
      });
  });
