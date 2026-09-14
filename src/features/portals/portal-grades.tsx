import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/shared/primitives';
import type { Activity, Submission } from '@/features/activities/activity-model';
import { activityTypes, submissionGradeLabel } from '@/features/activities/activity-model';
import { submissionStatuses } from '@/features/activities/submission-model';
import type { ProgramTerm } from '@/features/education/learning-model';
import type { LearningGroup } from '@/features/operations/model';
import type { Student } from '@/types';
import { activitiesForTerm, averageOf, gradePercentage, teacherGradeSummary } from './portal-model';

export function StudentGradeReport({
  groups,
  activities,
  submissions,
  terms,
}: {
  groups: LearningGroup[];
  activities: Activity[];
  submissions: Submission[];
  terms: ProgramTerm[];
}) {
  const availableTerms = terms.filter((term) =>
    groups.some((group) => group.programTermId === term.id),
  );
  const [termId, setTermId] = useState(availableTerms.find((term) => term.isActive)?.id || 'all');
  const scopedActivities = activitiesForTerm(activities, groups, termId);
  const scopedSubmissions = submissions.filter(
    (submission) =>
      submission.status === 'GRADED' &&
      scopedActivities.some((activity) => activity.id === submission.activityId),
  );
  const report = groups
    .filter((group) => termId === 'all' || group.programTermId === termId)
    .map((group) => {
      const groupActivities = scopedActivities.filter((activity) => activity.groupId === group.id);
      const rows = scopedSubmissions.filter((submission) =>
        groupActivities.some((activity) => activity.id === submission.activityId),
      );
      const average = averageOf(
        rows.map((submission) =>
          gradePercentage(
            submission,
            groupActivities.find((activity) => activity.id === submission.activityId),
          ),
        ),
      );
      return { group, activities: groupActivities, rows, average };
    })
    .filter((group) => group.rows.length > 0);
  const average = averageOf(report.map((group) => group.average));

  return (
    <div className="space-y-5">
      <div className="module-toolbar portal-grade-toolbar">
        <Select value={termId} onValueChange={setTermId}>
          <SelectTrigger aria-label="Dönem seçin">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm dönemler</SelectItem>
            {availableTerms.map((term) => (
              <SelectItem key={term.id} value={term.id}>
                {term.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <StatusBadge>{`Dönem ortalaması: ${average == null ? '—' : `%${average.toFixed(1)}`} · Harf: —`}</StatusBadge>
      </div>
      {report.length > 0 && (
        <Card className="portal-section portal-grade-chart" aria-label="Grup başarı ortalamaları">
          {report.map(({ group, average: groupAverage }) => (
            <div className="portal-grade-bar" key={group.id}>
              <span>{group.name}</span>
              <div>
                <i style={{ width: `${Math.max(0, Math.min(100, groupAverage || 0))}%` }} />
              </div>
              <strong>{groupAverage == null ? '—' : `%${groupAverage.toFixed(1)}`}</strong>
            </div>
          ))}
        </Card>
      )}
      <div className="portal-grade-groups">
        {report.map(
          ({ group, activities: groupActivities, rows, average: groupAverage }, index) => (
            <details className="portal-grade-group" key={group.id} open={index === 0}>
              <summary>
                <strong>{group.name}</strong>
                <span>{groupAverage == null ? '—' : `%${groupAverage.toFixed(1)}`} · Harf: —</span>
              </summary>
              <DataTable
                name={`student-grade-${group.id}`}
                data={rows}
                getRowId={(row) => row.id}
                columns={[
                  {
                    id: 'activity',
                    header: 'Çalışma',
                    accessorFn: (row) =>
                      groupActivities.find((a) => a.id === row.activityId)?.title || '—',
                  },
                  {
                    id: 'type',
                    header: 'Tür',
                    accessorFn: (row) =>
                      activityTypes[
                        groupActivities.find((a) => a.id === row.activityId)?.type || 'ASSIGNMENT'
                      ],
                  },
                  {
                    id: 'grade',
                    header: 'Not',
                    accessorFn: (row) =>
                      submissionGradeLabel(
                        row,
                        groupActivities.find((a) => a.id === row.activityId)?.maxPoints,
                      ),
                  },
                  {
                    id: 'percentage',
                    header: 'Yüzde',
                    accessorFn: (row) => {
                      const value = gradePercentage(
                        row,
                        groupActivities.find((a) => a.id === row.activityId),
                      );
                      return value == null ? '—' : `%${value.toFixed(1)}`;
                    },
                  },
                  { id: 'letter', header: 'Harf', accessorFn: (row) => row.letterGrade || '—' },
                ]}
                mobileCard={(row) => (
                  <>
                    <strong>{groupActivities.find((a) => a.id === row.activityId)?.title}</strong>
                    <p>
                      {submissionGradeLabel(row)} · {submissionStatuses[row.status]}
                    </p>
                  </>
                )}
              />
            </details>
          ),
        )}
      </div>
      {!report.length && (
        <p className="empty-inline">Seçilen dönem için değerlendirilmiş çalışma bulunmuyor.</p>
      )}
    </div>
  );
}

export function TeacherGradeOverview({
  group,
  groups,
  students,
  activities,
  submissions,
}: {
  group?: LearningGroup;
  groups: LearningGroup[];
  students: Student[];
  activities: Activity[];
  submissions: Submission[];
}) {
  if (!group)
    return (
      <div className="portal-card-grid">
        {groups.map((item) => (
          <Card className="portal-section" key={item.id}>
            <h2>{item.name}</h2>
            <p>{item.course}</p>
            <Button asChild variant="outline">
              <Link to={`/teacher/grade-overview/${item.id}`}>Not özetini aç</Link>
            </Button>
          </Card>
        ))}
      </div>
    );
  const scopedActivities = activities.filter(
    (activity) =>
      activity.groupId === group.id &&
      !['DRAFT', 'SCHEDULED', 'ARCHIVED'].includes(activity.status),
  );
  const rows = teacherGradeSummary(students, scopedActivities, submissions);
  return (
    <>
      <p className="empty-inline">
        {scopedActivities.length} çalışma için öğrenci bazında teslim ve değerlendirme durumu.
      </p>
      <DataTable
        name={`teacher-grade-overview-${group.id}`}
        data={rows}
        getRowId={(row) => String(row.studentId)}
        columns={[
          { accessorKey: 'studentName', header: 'Öğrenci' },
          { accessorKey: 'submittedCount', header: 'Teslim' },
          { accessorKey: 'gradedCount', header: 'Notlandırıldı' },
          {
            accessorKey: 'pendingCount',
            header: 'Bekliyor',
            cell: ({ row }) =>
              row.original.pendingCount ? (
                <StatusBadge>{String(row.original.pendingCount)}</StatusBadge>
              ) : (
                '0'
              ),
          },
          {
            accessorKey: 'missingCount',
            header: 'Eksik',
            cell: ({ row }) =>
              row.original.missingCount ? (
                <StatusBadge>{String(row.original.missingCount)}</StatusBadge>
              ) : (
                '0'
              ),
          },
          {
            accessorKey: 'averageGrade',
            header: 'Not ortalaması',
            cell: ({ row }) => row.original.averageGrade?.toFixed(1) || '—',
          },
          {
            accessorKey: 'averagePercentage',
            header: 'Yüzde ortalaması',
            cell: ({ row }) =>
              row.original.averagePercentage == null
                ? '—'
                : `%${row.original.averagePercentage.toFixed(1)}`,
          },
        ]}
        mobileCard={(row) => (
          <>
            <strong>{row.studentName}</strong>
            <p>
              {row.submittedCount} teslim · {row.gradedCount} notlandırıldı · {row.pendingCount}{' '}
              bekliyor · {row.missingCount} eksik
            </p>
          </>
        )}
      />
      {!rows.length && <p className="empty-inline">Bu grupta öğrenci bulunmuyor.</p>}
    </>
  );
}
