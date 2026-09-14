import type { Activity, Submission } from '@/features/activities/activity-model';
import type { ProgramTerm } from '@/features/education/learning-model';
import type { LearningGroup } from '@/features/operations/model';
import type { Student } from '@/types';

export const pendingSubmissionStatuses: Submission['status'][] = [
  'SUBMITTED',
  'LATE',
  'RESUBMITTED',
];

export function gradePercentage(submission: Submission, activity?: Activity) {
  if (submission.percentage != null && Number.isFinite(submission.percentage))
    return submission.percentage;
  if (submission.grade == null || !Number.isFinite(submission.grade)) return undefined;
  const maximum = submission.maxGrade ?? activity?.maxPoints;
  return maximum && maximum > 0 ? (submission.grade / maximum) * 100 : undefined;
}

export function averageOf(values: Array<number | undefined>) {
  const available = values.filter(
    (value): value is number => value != null && Number.isFinite(value),
  );
  return available.length
    ? available.reduce((total, value) => total + value, 0) / available.length
    : undefined;
}

export function termForGroup(group: LearningGroup, terms: ProgramTerm[]) {
  return terms.find((term) => term.id === group.programTermId);
}

export function activitiesForTerm(activities: Activity[], groups: LearningGroup[], termId: string) {
  if (termId === 'all') return activities;
  const groupIds = groups
    .filter((group) => group.programTermId === termId)
    .map((group) => group.id);
  return activities.filter((activity) => groupIds.includes(activity.groupId));
}

export type TeacherStudentGradeSummary = {
  studentId: number;
  studentName: string;
  submittedCount: number;
  gradedCount: number;
  pendingCount: number;
  missingCount: number;
  averageGrade?: number;
  averagePercentage?: number;
};

export function teacherGradeSummary(
  students: Student[],
  activities: Activity[],
  submissions: Submission[],
): TeacherStudentGradeSummary[] {
  return students.map((student) => {
    const rows = submissions.filter(
      (submission) =>
        submission.studentId === student.id &&
        activities.some((activity) => activity.id === submission.activityId) &&
        submission.status !== 'NOT_SUBMITTED',
    );
    const graded = rows.filter((submission) => submission.status === 'GRADED');
    return {
      studentId: student.id,
      studentName: student.name,
      submittedCount: rows.length,
      gradedCount: graded.length,
      pendingCount: rows.filter((submission) =>
        pendingSubmissionStatuses.includes(submission.status),
      ).length,
      missingCount: Math.max(activities.length - rows.length, 0),
      averageGrade: averageOf(
        graded.map((submission) =>
          submission.grade == null || !Number.isFinite(submission.grade)
            ? undefined
            : submission.grade,
        ),
      ),
      averagePercentage: averageOf(
        graded.map((submission) =>
          gradePercentage(
            submission,
            activities.find((activity) => activity.id === submission.activityId),
          ),
        ),
      ),
    };
  });
}
