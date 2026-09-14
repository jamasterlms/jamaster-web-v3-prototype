import { visibleAnnouncements } from '@/features/administration/announcement-model';
import { Link, useSearchParams } from 'react-router-dom';
import { useWorkspace } from '@/app/workspace-provider';
import { useOperations } from '@/features/operations/operations-provider';
import { useMemberships } from '@/features/education/use-memberships';
import { useLearningData } from '@/features/education/learning-catalog';
import { PageHeading, StatusBadge } from '@/components/shared/primitives';
import { Icon } from '@/components/shared/icon';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { ActivitiesPage } from '@/features/activities/activities-page';
import {
  activityTypes,
  activityStatuses,
  submissionGradeLabel,
  type Activity,
} from '@/features/activities/activity-model';
import { fullDateTR } from '@/lib/format';
import { PortalAnnouncements, readPortalAnnouncements } from './portal-announcements';
import { StudentDashboard, TeacherDashboard } from './portal-dashboard';
import { StudentGradeReport, TeacherGradeOverview } from './portal-grades';
import { StudentSubmission } from './student-submission';
import { PrototypeToolsSection } from '@/features/prototype/prototype-tools';
const titles: Record<string, string> = {
  dashboard: 'Genel bakış',
  courses: 'Derslerim',
  activities: 'Aktiviteler',
  grades: 'Notlarım',
  announcements: 'Duyurular',
  'grade-overview': 'Not özeti',
};
export function PortalPage({ route }: { route: string }) {
  const [role, section, id, child] = route.split('/'),
    teacher = role === 'teacher';
  const { state, dispatch } = useWorkspace(),
    { operations } = useOperations(),
    memberships = useMemberships(),
    learning = useLearningData();
  const [params, setParams] = useSearchParams();
  const options = teacher ? operations.teachers : state.students;
  const persona =
    options.find((p) => String(p.id) === state.settings[`portal-${role}`]) || options[0];
  const groups = teacher
    ? operations.groups.filter(
        (g) =>
          (g.headTeacherId ? g.headTeacherId === persona?.id : g.teacher === persona?.name) ||
          operations.groupTeacherAssignments.some(
            (a) => a.groupId === g.id && a.teacherId === persona?.id && a.isActive,
          ),
      )
    : memberships.groupsFor(Number(persona?.id));
  const groupIds = groups.map((g) => g.id),
    group = groups.find((g) => g.id === id);
  const allActivities = (state.activities || []).filter(
    (a) =>
      groupIds.includes(a.groupId) &&
      (teacher || !['DRAFT', 'SCHEDULED', 'ARCHIVED'].includes(a.status)),
  );
  const activity = allActivities.find((a) => a.id === id);
  const submissions = (state.activitySubmissions || []).filter(
    (s) =>
      allActivities.some((a) => a.id === s.activityId) && (teacher || s.studentId === persona?.id),
  );
  const grades = submissions.filter((s) => s.status === 'GRADED');
  const type = params.get('type') || 'all',
    status = params.get('status') || 'all';
  const filteredActivities = allActivities.filter(
    (a) => (type === 'all' || a.type === type) && (status === 'all' || a.status === status),
  );
  const activityTable = (rows: Activity[]) => (
    <DataTable
      name={`portal-${role}-activities`}
      data={rows}
      getRowId={(a) => a.id}
      columns={[
        { accessorKey: 'title', header: 'Başlık' },
        { accessorKey: 'type', header: 'Tür', cell: ({ row }) => activityTypes[row.original.type] },
        {
          accessorKey: 'groupId',
          header: 'Grup',
          cell: ({ row }) => groups.find((g) => g.id === row.original.groupId)?.name || '—',
        },
        {
          accessorKey: 'dueDate',
          header: 'Son teslim',
          cell: ({ row }) =>
            row.original.dueDate ? fullDateTR(row.original.dueDate) : 'Süre sınırı yok',
        },
        {
          accessorKey: 'status',
          header: 'Durum',
          cell: ({ row }) => <StatusBadge>{activityStatuses[row.original.status]}</StatusBadge>,
        },
        {
          id: 'actions',
          header: 'İşlemler',
          cell: ({ row }) => (
            <Button variant="ghost" size="icon" asChild aria-label="Aktiviteyi aç">
              <Link to={`/${role}/activities/${row.original.id}`}>
                <Icon name="arrow-up-right" />
              </Link>
            </Button>
          ),
        },
      ]}
      mobileCard={(a) => (
        <>
          <strong>{a.title}</strong>
          <p>
            {activityTypes[a.type]} · {activityStatuses[a.status]}
          </p>
          <Button asChild variant="outline">
            <Link to={`/${role}/activities/${a.id}`}>Aktiviteyi aç</Link>
          </Button>
        </>
      )}
    />
  );
  return (
    <>
      <PageHeading
        title={
          id
            ? section === 'courses'
              ? group?.name || 'Ders bulunamadı'
              : section === 'grade-overview'
                ? group
                  ? `${group.name} · Not özeti`
                  : 'Not özeti bulunamadı'
                : activity?.title || 'Aktivite bulunamadı'
            : titles[section] || 'Çalışma alanı'
        }
        description={
          teacher
            ? 'Dersler, öğrenci teslimleri ve değerlendirmeler.'
            : 'Dersleriniz, çalışmalarınız ve sonuçlarınız.'
        }
      />
      <PrototypeToolsSection title="Profil görünümü">
        <Select
          value={String(persona?.id || '')}
          onValueChange={(value) =>
            dispatch({ type: 'settings/save', values: { [`portal-${role}`]: value } })
          }
        >
          <SelectTrigger
            className="portal-persona"
            aria-label={teacher ? 'Öğretmen görünümü' : 'Öğrenci görünümü'}
          >
            <SelectValue placeholder="Profil seçin" />
          </SelectTrigger>
          <SelectContent data-prototype-tools-overlay="true">
            {options.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PrototypeToolsSection>

      {!persona ? (
        <p className="empty-inline">Görüntülenecek profil bulunmuyor.</p>
      ) : section === 'dashboard' ? (
        teacher ? (
          <TeacherDashboard
            groups={groups}
            activities={allActivities}
            submissions={submissions}
            announcements={visibleAnnouncements(
              readPortalAnnouncements(state.settings, operations.groups),
              groups,
              'teacher',
            )}
          />
        ) : (
          <StudentDashboard
            groups={groups}
            activities={allActivities}
            submissions={submissions}
            terms={learning.programTerms}
          />
        )
      ) : section === 'courses' && !id ? (
        <div className="portal-card-grid">
          {groups.map((g) => (
            <Card key={g.id} className="portal-section">
              <StatusBadge>{g.status}</StatusBadge>
              <h2>{g.name}</h2>
              <p>
                {g.course} · {g.teacher}
              </p>
              <p>{g.schedule}</p>
              <p>{g.room}</p>
              <Button asChild variant="outline">
                <Link to={`/${role}/courses/${g.id}`}>Dersi aç</Link>
              </Button>
            </Card>
          ))}
          {!groups.length && <p className="empty-inline">Atanmış ders bulunmuyor.</p>}
        </div>
      ) : section === 'courses' ? (
        !group ? (
          <p className="empty-inline">Bu ders seçili profile atanmamış.</p>
        ) : (
          <>
            <Card className="portal-section">
              <dl className="detail-grid">
                <div>
                  <dt>Öğretmen</dt>
                  <dd>{group.teacher}</dd>
                </div>
                <div>
                  <dt>Derslik</dt>
                  <dd>{group.room || 'Belirlenmedi'}</dd>
                </div>
                <div>
                  <dt>Program</dt>
                  <dd>{group.schedule}</dd>
                </div>
                <div>
                  <dt>Öğrenci</dt>
                  <dd>
                    {memberships.membersOf(group.id).length} / {group.capacity}
                  </dd>
                </div>
              </dl>
            </Card>
            {teacher && (
              <DataTable
                name={`portal-members-${group.id}`}
                data={memberships.membersOf(group.id)}
                getRowId={(s) => String(s.id)}
                columns={[
                  { accessorKey: 'name', header: 'Öğrenci' },
                  { accessorKey: 'id', header: 'Numara' },
                  { accessorKey: 'email', header: 'E-posta' },
                ]}
                mobileCard={(s) => (
                  <>
                    <strong>{s.name}</strong>
                    <p>{s.email}</p>
                  </>
                )}
              />
            )}
            {child !== 'students' &&
              activityTable(allActivities.filter((a) => a.groupId === group.id))}
          </>
        )
      ) : section === 'activities' && teacher ? (
        <ActivitiesPage
          id={id}
          submissions={child === 'submissions'}
          groupIds={groupIds}
          embedded
          basePath="/teacher/activities"
        />
      ) : section === 'activities' && id ? (
        activity ? (
          <StudentSubmission
            key={`${activity.id}-${persona.id}`}
            activity={activity}
            studentId={Number(persona.id)}
            submission={submissions.find((s) => s.activityId === activity.id)}
          />
        ) : (
          <p className="empty-inline">Aktivite bulunamadı veya bu profile açık değil.</p>
        )
      ) : section === 'activities' ? (
        <>
          <div className="module-toolbar">
            {[
              { key: 'type', value: type, placeholder: 'Tüm türler', values: activityTypes },
              {
                key: 'status',
                value: status,
                placeholder: 'Tüm durumlar',
                values: { PUBLISHED: 'Yayımlandı', ACTIVE: 'Aktif', CLOSED: 'Kapandı' },
              },
            ].map((filter) => (
              <Select
                key={filter.key}
                value={filter.value}
                onValueChange={(value) =>
                  setParams(
                    (p) => {
                      const next = new URLSearchParams(p);
                      next.set(filter.key, value);
                      return next;
                    },
                    { replace: true },
                  )
                }
              >
                <SelectTrigger aria-label={filter.placeholder}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{filter.placeholder}</SelectItem>
                  {Object.entries(filter.values).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>
          {activityTable(filteredActivities)}
        </>
      ) : section === 'announcements' ? (
        <PortalAnnouncements teacher={teacher} groups={groups} authorId={String(persona.id)} />
      ) : teacher && section === 'grade-overview' ? (
        id && !group ? (
          <p className="empty-inline">Bu grup seçili öğretmene atanmamış veya artık bulunmuyor.</p>
        ) : (
          <TeacherGradeOverview
            group={group}
            groups={groups}
            students={group ? memberships.membersOf(group.id) : []}
            activities={allActivities}
            submissions={submissions}
          />
        )
      ) : !teacher && section === 'grades' ? (
        <StudentGradeReport
          groups={groups}
          activities={allActivities}
          submissions={grades}
          terms={learning.programTerms}
        />
      ) : (
        <p className="empty-inline">Bu portal sayfası bulunamadı.</p>
      )}
    </>
  );
}
