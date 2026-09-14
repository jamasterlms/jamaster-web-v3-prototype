import { useMemberships } from '@/features/education/use-memberships';
import { useOperations } from '@/features/operations/operations-provider';
import { DateRangeFilter } from '@/components/forms/date-range-filter';
import { useEntityNavigation } from '@/features/entities/use-entity-navigation';
import { useWorkspace } from '@/app/workspace-provider';
import { PageNavigation } from '@/components/navigation/page-navigation';
import { SearchField } from '@/components/shared/feature-primitives';
import { Icon } from '@/components/shared/icon';
import { IconButton, PageHeading, Person, StatusBadge } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePageState } from '@/hooks/use-page-state';
import { dateTR, normalize } from '@/lib/format';
import type { Student } from '@/types';
import type { ColumnDef } from '@tanstack/react-table';
import { Link, useLocation } from 'react-router-dom';
export function StudentsPage() {
  const memberships = useMemberships();
  const { operations } = useOperations();
  const openEntity = useEntityNavigation();
  const { pathname } = useLocation();
  const status = pathname.endsWith('/past')
    ? 'Geçmiş'
    : pathname.endsWith('/potential')
      ? 'Potansiyel'
      : 'Aktif';
  const { state, openModal } = useWorkspace();
  const [query, setQuery] = usePageState('search', ''),
    [types, setTypes] = usePageState<string[]>('studentType', []),
    [sort, setSort] = usePageState('sortOrder', 'createdAt:desc');
  const [groups, setGroups] = usePageState<string[]>('groups', []),
    [courses, setCourses] = usePageState<string[]>('courses', []),
    [advisors, setAdvisors] = usePageState<string[]>('advisors', []),
    [payments, setPayments] = usePageState<string[]>('payments', []),
    [range, setRange] = usePageState('dateRange', { from: '', to: '' });
  const selectedGroups = groups.map((value) => {
    if (value === 'Atanmadı') return '_unassigned';
    if (operations.groups.some((g) => g.id === value)) return value;
    const matches = operations.groups.filter((g) => g.name === value);
    return matches.length === 1 ? matches[0].id : value;
  });
  const list = state.students
    .filter(
      (s) =>
        s.status === status &&
        (!groups.length ||
          memberships.groupsFor(s.id).some((g) => selectedGroups.includes(g.id)) ||
          (selectedGroups.includes('_unassigned') && !memberships.labelsFor(s.id).length)) &&
        (!courses.length || courses.includes(s.course)) &&
        (!advisors.length || advisors.includes(s.advisor || 'Atanmadı')) &&
        (!payments.length || payments.includes(s.payment)) &&
        (!range.from || s.date >= range.from) &&
        (!range.to || s.date <= range.to) &&
        (!types.length || types.includes(s.type)) &&
        normalize(s.name + ' ' + s.id + ' ' + s.email + ' ' + s.phone).includes(normalize(query)),
    )
    .sort((a, b) => {
      const field = sort.split(':')[0],
        direction = sort.endsWith('asc') ? 1 : -1;
      return (
        direction *
        (field === 'name'
          ? a.name.localeCompare(b.name, 'tr')
          : field === 'studentNumber'
            ? a.id - b.id
            : a.date.localeCompare(b.date))
      );
    });
  const actions = (s: Student) => (
    <div className="flex gap-1">
      <IconButton
        icon="message-square"
        label={`${s.name} ile görüşme`}
        onClick={() =>
          openModal({
            type: 'meeting',
            id: s.id,
            reportMode: true,
            studentOrder: list.map((student) => student.id),
          })
        }
      />
      <Button variant="ghost" size="icon" asChild>
        <Link to={`/admin/students/${s.id}`} aria-label={`${s.name} detayları`}>
          <Icon name="arrow-up-right" />
        </Link>
      </Button>
    </div>
  );
  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: 'name',
      header: 'Ad Soyad',
      cell: ({ row }) => (
        <Link to={`/admin/students/${row.original.id}`}>
          <Person student={row.original} />
        </Link>
      ),
    },
    { accessorKey: 'id', header: 'No' },
    { accessorKey: 'phone', header: 'Telefon' },
    { accessorKey: 'type', header: 'Öğrenci Tipi' },
    {
      accessorKey: 'status',
      header: 'Durum',
      cell: ({ row }) => <StatusBadge>{row.original.status}</StatusBadge>,
    },
    {
      accessorKey: 'date',
      header: 'Kayıt Tarihi',
      cell: ({ row }) => dateTR(row.original.date) + ' ' + row.original.date.slice(0, 4),
    },
    { id: 'advisor', accessorFn: (s) => s.advisor || 'Atanmadı', header: 'Danışman' },
    {
      id: 'actions',
      header: 'İşlemler',
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => actions(row.original),
    },
  ];
  return (
    <>
      <PageHeading title="Öğrenciler" description="Kayıtlar, eğitimler ve öğrenci bilgileri.">
        <Button asChild>
          <Link to="/admin/students/register">
            <Icon name="plus" />
            Yeni öğrenci
          </Link>
        </Button>
      </PageHeading>
      <PageNavigation
        items={[
          {
            to: '/admin/students',
            label: 'Aktif öğrenciler',
            count: state.students.filter((s) => s.status === 'Aktif').length,
          },
          {
            to: '/admin/students/past',
            label: 'Geçmiş öğrenciler',
            count: state.students.filter((s) => s.status === 'Geçmiş').length,
          },
          {
            to: '/admin/students/potential',
            label: 'Potansiyel',
            count: state.students.filter((s) => s.status === 'Potansiyel').length,
          },
        ]}
      />
      <div className="module-toolbar">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Ad, numara, telefon veya e-posta"
        />
        <MultiSelect
          label="Öğrenci tipi"
          value={types}
          onChange={setTypes}
          options={['Bireysel', 'Kurumsal', 'Kurum çalışanı'].map((value) => ({
            value,
            label: value,
          }))}
        />
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="sort-select" aria-label="Sıralama">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[
              ['createdAt:desc', 'En yeni kayıt'],
              ['createdAt:asc', 'En eski kayıt'],
              ['name:asc', 'Ad A–Z'],
              ['name:desc', 'Ad Z–A'],
              ['studentNumber:asc', 'Numara artan'],
              ['studentNumber:desc', 'Numara azalan'],
            ].map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(query || types.length || sort !== 'createdAt:desc') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery('');
              setTypes([]);
              setSort('createdAt:desc');
            }}
          >
            Sıfırla
          </Button>
        )}
      </div>
      <div className="module-toolbar secondary-filters">
        <MultiSelect
          label="Grup"
          value={selectedGroups}
          onChange={setGroups}
          options={[
            { value: '_unassigned', label: 'Atanmadı' },
            ...operations.groups.map((g) => ({ value: g.id, label: g.name })),
          ]}
        />
        <MultiSelect
          label="Eğitim"
          value={courses}
          onChange={setCourses}
          options={[...new Set(state.students.map((s) => s.course))]
            .filter(Boolean)
            .map((value) => ({ value, label: value }))}
        />
        <MultiSelect
          label="Danışman"
          value={advisors}
          onChange={setAdvisors}
          options={[...new Set(state.students.map((s) => s.advisor || 'Atanmadı'))].map(
            (value) => ({ value, label: value }),
          )}
        />
        <MultiSelect
          label="Ödeme durumu"
          value={payments}
          onChange={setPayments}
          options={[...new Set(state.students.map((s) => s.payment))].map((value) => ({
            value,
            label: value,
          }))}
        />
        <DateRangeFilter {...range} onChange={setRange} />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setGroups([]);
            setCourses([]);
            setAdvisors([]);
            setPayments([]);
            setRange({ from: '', to: '' });
            setQuery('');
            setTypes([]);
            setSort('createdAt:desc');
          }}
        >
          Tüm filtreleri sıfırla
        </Button>
      </div>
      <DataTable
        entityKind="students"
        onOpen={(s, full, ordered) =>
          openEntity(
            { kind: 'students', id: String(s.id) },
            full,
            ordered.map((item) => ({ kind: 'students', id: String(item.id) })),
          )
        }
        manualSorting
        columns={columns}
        data={list}
        filterKey={JSON.stringify([query, types, sort, groups, courses, advisors, payments, range])}
        getRowId={(s) => String(s.id)}
        exportConfig={{
          filename: 'jamaster-ogrenciler',
          columns: [
            { key: 'name', label: 'Ad soyad', value: (s) => s.name },
            { key: 'id', label: 'No', value: (s) => s.id },
            { key: 'phone', label: 'Telefon', value: (s) => s.phone },
            { key: 'email', label: 'E-posta', value: (s) => s.email },
            { key: 'type', label: 'Öğrenci tipi', value: (s) => s.type },
            { key: 'status', label: 'Durum', value: (s) => s.status },
            { key: 'date', label: 'Kayıt tarihi', value: (s) => s.date },
            { key: 'advisor', label: 'Danışman', value: (s) => s.advisor },
          ],
        }}
        mobileCard={(s) => (
          <>
            <Link to={`/admin/students/${s.id}`}>
              <Person student={s} />
            </Link>
            <div className="mobile-record-meta">
              <span>
                #{s.id} · {s.type}
              </span>
              <StatusBadge>{s.status}</StatusBadge>
              <span>{s.phone}</span>
              <span>{dateTR(s.date)}</span>
            </div>
            <div className="mobile-record-actions">{actions(s)}</div>
          </>
        )}
      />
    </>
  );
}
