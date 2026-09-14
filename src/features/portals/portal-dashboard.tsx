import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/primitives';
import type { Activity, Submission } from '@/features/activities/activity-model';
import type { ProgramTerm } from '@/features/education/learning-model';
import type { LearningGroup } from '@/features/operations/model';
import type { Announcement } from '@/features/administration/content-pages';
import { fullDateTR } from '@/lib/format';
import { pendingSubmissionStatuses } from './portal-model';

function DashboardCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="portal-section">
      <h2>{title}</h2>
      {children}
    </Card>
  );
}

function upcoming(activities: Activity[]) {
  const now = Date.now();
  return activities
    .filter((activity) => activity.dueDate && Date.parse(activity.dueDate) >= now)
    .sort((left, right) => Date.parse(left.dueDate!) - Date.parse(right.dueDate!))
    .slice(0, 5);
}

export function StudentDashboard({
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
  const groupName = (id: string) => groups.find((group) => group.id === id)?.name || 'Grup';
  const linkedTerms = terms.filter((term) =>
    groups.some((group) => group.programTermId === term.id),
  );
  const activeTerm =
    linkedTerms.find((term) => term.isActive) ||
    linkedTerms.find(
      (term) => Date.parse(term.startDate) <= Date.now() && Date.parse(term.endDate) >= Date.now(),
    );
  const recentGrades = submissions
    .filter((submission) => submission.status === 'GRADED')
    .sort(
      (left, right) =>
        Date.parse(right.gradedAt || right.submittedAt) -
        Date.parse(left.gradedAt || left.submittedAt),
    )
    .slice(0, 5);
  return (
    <div className="space-y-5">
      <DashboardCard title="Aktif dönem">
        {activeTerm ? (
          <p>
            <strong>{activeTerm.name}</strong>
            <br />
            {fullDateTR(activeTerm.startDate)} – {fullDateTR(activeTerm.endDate)}
          </p>
        ) : (
          <p>Gruplarınıza bağlı aktif dönem bulunmuyor.</p>
        )}
      </DashboardCard>
      <div className="portal-card-grid">
        <DashboardCard title="Kayıtlı gruplar">
          <ul className="portal-dashboard-list">
            {groups.map((group) => (
              <li key={group.id}>
                <Link to={`/student/courses/${group.id}`}>
                  <strong>{group.name}</strong>
                  <span>{group.teacher}</span>
                </Link>
              </li>
            ))}
          </ul>
          {!groups.length && <p>Kayıtlı grup bulunmuyor.</p>}
        </DashboardCard>
        <DashboardCard title="Yaklaşan aktiviteler">
          <ul className="portal-dashboard-list">
            {upcoming(activities).map((activity) => (
              <li key={activity.id}>
                <Link to={`/student/activities/${activity.id}`}>
                  <strong>{activity.title}</strong>
                  <span>
                    {groupName(activity.groupId)} · {fullDateTR(activity.dueDate)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {!upcoming(activities).length && <p>Yaklaşan aktivite bulunmuyor.</p>}
        </DashboardCard>
      </div>
      <DashboardCard title="Son notlar">
        <ul className="portal-dashboard-list">
          {recentGrades.map((submission) => (
            <li key={submission.id}>
              <Link to={`/student/activities/${submission.activityId}`}>
                <strong>
                  {activities.find((activity) => activity.id === submission.activityId)?.title ||
                    'Çalışma'}
                </strong>
                <StatusBadge>
                  {submission.percentage == null
                    ? submission.letterGrade || 'Notlandırıldı'
                    : `%${submission.percentage.toFixed(1)}`}
                </StatusBadge>
              </Link>
            </li>
          ))}
        </ul>
        {!recentGrades.length && <p>Henüz açıklanan not bulunmuyor.</p>}
      </DashboardCard>
    </div>
  );
}

export function TeacherDashboard({
  groups,
  activities,
  submissions,
  announcements,
}: {
  groups: LearningGroup[];
  activities: Activity[];
  submissions: Submission[];
  announcements: (Announcement & { publishedAt?: string })[];
}) {
  const groupName = (id: string) => groups.find((group) => group.id === id)?.name || 'Grup';
  const queue = submissions
    .filter((submission) => pendingSubmissionStatuses.includes(submission.status))
    .sort((left, right) => Date.parse(right.submittedAt) - Date.parse(left.submittedAt));
  return (
    <div className="space-y-5">
      <DashboardCard title="Bekleyen değerlendirmeler">
        {queue.length > 0 && <StatusBadge>{String(queue.length)}</StatusBadge>}
        <ul className="portal-dashboard-list">
          {queue.slice(0, 5).map((submission) => (
            <li key={submission.id}>
              <Link to={`/teacher/activities/${submission.activityId}/submissions`}>
                <strong>{submission.studentName}</strong>
                <span>
                  {activities.find((activity) => activity.id === submission.activityId)?.title ||
                    'Çalışma'}{' '}
                  · {fullDateTR(submission.submittedAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {!queue.length && <p>Değerlendirme bekleyen teslim bulunmuyor.</p>}
      </DashboardCard>
      <div className="portal-card-grid">
        <DashboardCard title="Gruplarım">
          <ul className="portal-dashboard-list">
            {groups.map((group) => (
              <li key={group.id}>
                <Link to={`/teacher/courses/${group.id}/students`}>
                  <strong>{group.name}</strong>
                  <span>Öğrencileri aç</span>
                </Link>
              </li>
            ))}
          </ul>
          {!groups.length && <p>Atanmış grup bulunmuyor.</p>}
        </DashboardCard>
        <DashboardCard title="Yaklaşan aktiviteler">
          <ul className="portal-dashboard-list">
            {upcoming(activities).map((activity) => (
              <li key={activity.id}>
                <Link to={`/teacher/activities/${activity.id}/submissions`}>
                  <strong>{activity.title}</strong>
                  <span>
                    {groupName(activity.groupId)} · {fullDateTR(activity.dueDate)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {!upcoming(activities).length && <p>Yaklaşan aktivite bulunmuyor.</p>}
        </DashboardCard>
      </div>
      <DashboardCard title="Son duyurular">
        <ul className="portal-dashboard-list">
          {announcements.slice(0, 5).map((announcement) => (
            <li key={announcement.id}>
              <Link to="/teacher/announcements">
                <strong>{announcement.title}</strong>
                <span>
                  {announcement.audience}
                  {announcement.publishedAt ? ` · ${fullDateTR(announcement.publishedAt)}` : ''}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {!announcements.length && <p>Yayımlanmış duyuru bulunmuyor.</p>}
      </DashboardCard>
    </div>
  );
}
