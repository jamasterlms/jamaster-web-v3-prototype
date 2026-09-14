import { Icon } from '@/components/shared/icon';
import { useState } from 'react';
import { useEntityNavigation } from '@/features/entities/use-entity-navigation';
import { Person } from '@/components/shared/primitives';
import { SearchField } from '@/components/shared/feature-primitives';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { usePageState } from '@/hooks/use-page-state';
import { normalize, downloadCSV, fullDateTR } from '@/lib/format';
import { MembershipDialog } from './membership-dialog';
import { useMemberships } from './use-memberships';

export function GroupStudents({ groupId }: { groupId: string }) {
  const memberships = useMemberships();
  const openEntity = useEntityNavigation();
  const [query, setQuery] = usePageState('group-students-query', '');
  const [adding, setAdding] = useState(false);
  const members = memberships
    .membersOf(groupId)
    .filter((s) => normalize(`${s.name} ${s.id} ${s.email} ${s.phone}`).includes(normalize(query)));
  const joined = (studentId: number) => memberships.membershipFor(studentId, groupId)?.createdAt;
  const open = (id: number, fullPage = false) =>
    openEntity({ kind: 'students', id: String(id) }, fullPage);
  return (
    <>
      <div className="section-bar">
        <h2>Grup öğrencileri</h2>
        <Button onClick={() => setAdding(true)}>Öğrenci ekle</Button>
      </div>
      <div className="module-toolbar">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Öğrenci, numara, e-posta veya telefon ara"
        />
      </div>
      <DataTable
        name={`group-${groupId}-students`}
        selectionLabel="Seçili grup öğrencileri"
        data={members}
        getRowId={(s) => String(s.id)}
        entityKind="students"
        onOpen={(s, full, ordered) =>
          openEntity(
            { kind: 'students', id: String(s.id) },
            full,
            ordered.map((item) => ({ kind: 'students', id: String(item.id) })),
          )
        }
        columns={[
          { accessorKey: 'id', header: 'Öğrenci no' },
          {
            accessorKey: 'name',
            header: 'Öğrenci',
            cell: ({ row }) => <Person student={row.original} />,
          },
          { accessorKey: 'email', header: 'E-posta' },
          { accessorKey: 'phone', header: 'Telefon' },
          {
            id: 'joined',
            header: 'Gruba katılma tarihi',
            accessorFn: (s) => joined(s.id) || '',
            cell: ({ row }) => fullDateTR(joined(row.original.id)),
          },
          {
            id: 'actions',
            header: 'İşlemler',
            cell: ({ row }) => (
              <Button
                onClick={(e) => open(row.original.id, e.detail > 1)}
                variant="ghost"
                size="icon"
                aria-label="Profili aç"
                title="Profili aç"
              >
                <Icon name="arrow-up-right" />
              </Button>
            ),
          },
        ]}
        mobileCard={(s) => (
          <>
            <Person student={s} />
            <div className="mobile-record-meta">
              <span>#{s.id}</span>
              <span>{s.phone}</span>
              <span>{fullDateTR(joined(s.id))}</span>
            </div>
            <Button variant="outline" onClick={(e) => open(s.id, e.detail > 1)}>
              Profili aç
            </Button>
          </>
        )}
        selectionActions={(rows) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              downloadCSV('grup-ogrencileri.csv', [
                ['No', 'Ad soyad', 'E-posta', 'Telefon', 'Katılma tarihi'],
                ...rows.map((s) => [s.id, s.name, s.email, s.phone, joined(s.id) || '']),
              ])
            }
          >
            <Icon name="download" />
            CSV indir
          </Button>
        )}
      />
      {adding && <MembershipDialog groupId={groupId} onClose={() => setAdding(false)} />}
    </>
  );
}
