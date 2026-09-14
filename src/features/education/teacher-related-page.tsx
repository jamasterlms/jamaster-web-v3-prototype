import { Link } from 'react-router-dom';
import { useOperations } from '@/features/operations/operations-provider';
import { useMemberships } from './use-memberships';
import { TeacherDetailNavigation } from './detail-navigation';
import { groupTeacherRows } from './group-teacher-model';
import { PageHeading, StatusBadge } from '@/components/shared/primitives';
import { SearchField } from '@/components/shared/feature-primitives';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { usePageState } from '@/hooks/use-page-state';
import { useEntityNavigation } from '@/features/entities/use-entity-navigation';
import { ActivitiesPage } from '@/features/activities/activities-page';
import { PayrollPage } from '@/features/payroll/payroll-page';
import { normalize } from '@/lib/format';
export function TeacherRelatedPage({
  id,
  section,
}: {
  id: string;
  section: 'students' | 'groups' | 'activities' | 'payments';
}) {
  const { operations } = useOperations(),
    memberships = useMemberships(),
    open = useEntityNavigation();
  const [query, setQuery] = usePageState('teacher-related-search', '');
  const teacher = operations.teachers.find((t) => t.id === id);
  const groups = operations.groups.filter((g) =>
    groupTeacherRows(operations, g.id).some((a) => a.teacherId === id && a.isActive),
  );
  const students = [
    ...new Map(groups.flatMap((g) => memberships.membersOf(g.id)).map((s) => [s.id, s])).values(),
  ].filter((s) => normalize(s.name + s.email + s.phone).includes(normalize(query)));
  const filteredGroups = groups.filter((g) =>
    normalize(g.name + g.course).includes(normalize(query)),
  );
  if (!teacher)
    return (
      <>
        <PageHeading title="Öğretmen bulunamadı" />
        <Button asChild>
          <Link to="/admin/teachers">Öğretmenlere dön</Link>
        </Button>
      </>
    );
  return (
    <>
      <PageHeading title={teacher.name} description={teacher.specialty} />
      <TeacherDetailNavigation id={id} />
      {section === 'activities' ? (
        <ActivitiesPage readOnly groupIds={groups.map((g) => g.id)} embedded />
      ) : section === 'payments' ? (
        <PayrollPage kind="teacher" id={id} embedded />
      ) : (
        <>
          <div className="module-toolbar">
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder={
                section === 'students'
                  ? 'Öğrenci adı, e-posta veya telefon ara'
                  : 'Grup veya eğitim ara'
              }
            />
          </div>
          {section === 'students' ? (
            <DataTable
              name={`teacher-${id}-students`}
              data={students}
              entityKind="students"
              getRowId={(s) => String(s.id)}
              onOpen={(s, full, ordered) =>
                open(
                  { kind: 'students', id: String(s.id) },
                  full,
                  ordered.map((s) => ({ kind: 'students', id: String(s.id) })),
                )
              }
              columns={[
                {
                  accessorKey: 'name',
                  header: 'Öğrenci',
                  cell: ({ row }) => (
                    <Link to={`/admin/students/${row.original.id}`}>{row.original.name}</Link>
                  ),
                },
                { accessorKey: 'id', header: 'Numara' },
                { accessorKey: 'phone', header: 'Telefon' },
                { accessorKey: 'email', header: 'E-posta' },
                { accessorKey: 'date', header: 'Kayıt tarihi' },
                { id: 'groups', header: 'Gruplar', accessorFn: (s) => memberships.labelFor(s.id) },
                {
                  accessorKey: 'status',
                  header: 'Durum',
                  cell: ({ row }) => <StatusBadge>{row.original.status}</StatusBadge>,
                },
              ]}
              mobileCard={(s) => (
                <>
                  <strong>{s.name}</strong>
                  <p>{s.phone}</p>
                  <p>{memberships.labelFor(s.id)}</p>
                </>
              )}
            />
          ) : (
            <DataTable
              name={`teacher-${id}-groups`}
              data={filteredGroups}
              entityKind="groups"
              getRowId={(g) => g.id}
              onOpen={(g, full, ordered) =>
                open(
                  { kind: 'groups', id: g.id },
                  full,
                  ordered.map((g) => ({ kind: 'groups', id: g.id })),
                )
              }
              columns={[
                {
                  accessorKey: 'name',
                  header: 'Grup',
                  cell: ({ row }) => (
                    <Link to={`/admin/groups/${row.original.id}`}>{row.original.name}</Link>
                  ),
                },
                { accessorKey: 'course', header: 'Eğitim' },
                { accessorKey: 'level', header: 'Seviye' },
                {
                  id: 'students',
                  header: 'Öğrenci',
                  accessorFn: (g) => memberships.membersOf(g.id).length,
                },
                { accessorKey: 'capacity', header: 'Kapasite' },
                {
                  accessorKey: 'status',
                  header: 'Durum',
                  cell: ({ row }) => <StatusBadge>{row.original.status}</StatusBadge>,
                },
              ]}
              mobileCard={(g) => (
                <>
                  <strong>{g.name}</strong>
                  <p>{g.course}</p>
                  <p>
                    {memberships.membersOf(g.id).length} / {g.capacity} öğrenci
                  </p>
                </>
              )}
            />
          )}
        </>
      )}
    </>
  );
}
