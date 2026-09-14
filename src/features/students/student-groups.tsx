import { Icon } from '@/components/shared/icon';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { useOperations } from '@/features/operations/operations-provider';
import { MembershipDialog } from '@/features/education/membership-dialog';
import { fullDateTR } from '@/lib/format';
import { useMemberships } from '@/features/education/use-memberships';

export function StudentGroups({ studentId }: { studentId: number }) {
  const memberships = useMemberships();
  const { operations } = useOperations();
  const [dialog, setDialog] = useState<{ groupId?: string; remove?: boolean } | null>(null);
  const groups = memberships.groupsFor(studentId);
  const history = memberships.records.history.filter((t) => t.studentId === studentId);
  const unresolved = memberships.records.unresolved.filter((m) => m.studentId === studentId);
  const groupName = (id: string) =>
    operations.groups.find((g) => g.id === id)?.name || `Grup ${id}`;
  const joined = (id: string) => memberships.membershipFor(studentId, id)?.createdAt;
  const actions = (id: string) => (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="ghost" size="icon" aria-label="Grubu aç" title="Grubu aç">
        <Link to={`/admin/groups/${encodeURIComponent(id)}`}>
          <Icon name="arrow-up-right" />
        </Link>
      </Button>
      <Button
        onClick={() => setDialog({ groupId: id, remove: true })}
        variant="ghost"
        size="icon"
        aria-label="Gruptan çıkar"
        title="Gruptan çıkar"
      >
        <Icon name="log-out" />
      </Button>
    </div>
  );
  return (
    <>
      <div className="section-bar">
        <h2>Mevcut gruplar</h2>
        <Button onClick={() => setDialog({})}>Gruba ekle</Button>
      </div>
      {memberships.records.recovery && (
        <p className="pending-banner" role="status">
          Bazı eski üyelik kayıtları doğrulanamadı ve inceleme için korundu. Listede yalnızca
          doğrulanan kayıtlar gösteriliyor.
        </p>
      )}
      {memberships.records.memberships
        .filter(
          (m) =>
            m.studentId === studentId &&
            m.status === 'active' &&
            !operations.groups.some((g) => g.id === m.groupId),
        )
        .map((m) => (
          <p className="pending-banner" key={m.id}>
            Üyelik kaydı korunuyor ancak “{m.groupId}” grubu bulunamadı.
          </p>
        ))}
      {unresolved.map((m) => (
        <p className="pending-banner" role="status" key={m.groupName}>
          Önceki “{m.groupName}” kaydı bir grupla kesin olarak eşleştirilemedi. Üyelik oluşturmadan
          önce öğrenci kaydını kontrol edin.
        </p>
      ))}
      <DataTable
        name="student-groups"
        data={groups}
        getRowId={(g) => g.id}
        columns={[
          { accessorKey: 'name', header: 'Grup' },
          {
            id: 'course',
            header: 'Eğitim',
            accessorFn: (g) => operations.groups.find((r) => r.id === g.id)?.course || '—',
          },
          {
            id: 'joined',
            header: 'Katılma tarihi',
            accessorFn: (g) => joined(g.id) || '',
            cell: ({ row }) => fullDateTR(joined(row.original.id)),
          },
          { id: 'actions', header: 'İşlemler', cell: ({ row }) => actions(row.original.id) },
        ]}
        mobileCard={(g) => (
          <>
            <strong>{g.name}</strong>
            <p className="muted">{fullDateTR(joined(g.id))}</p>
            {actions(g.id)}
          </>
        )}
      />
      <h2 className="subsection-title">Grup işlem geçmişi</h2>
      <DataTable
        name="student-group-history"
        data={history}
        getRowId={(t) => t.id}
        columns={[
          {
            id: 'date',
            header: 'İşlem tarihi',
            accessorFn: (t) => t.transferDate || t.recordedAt,
            cell: ({ row }) => fullDateTR(row.original.transferDate || row.original.recordedAt),
          },
          {
            id: 'type',
            header: 'İşlem',
            accessorFn: (t) => (t.toGroupId ? 'Gruba eklendi' : 'Gruptan çıkarıldı'),
          },
          {
            id: 'group',
            header: 'Grup',
            accessorFn: (t) =>
              [t.toGroupId, ...(t.fromGroupIds || [])]
                .filter((id): id is string => !!id)
                .map(groupName)
                .join(', '),
          },
          {
            accessorKey: 'reason',
            header: 'Neden / açıklama',
            cell: ({ row }) => row.original.reason || 'Belirtilmedi',
          },
        ]}
        mobileCard={(t) => (
          <>
            <strong>{t.toGroupId ? 'Gruba eklendi' : 'Gruptan çıkarıldı'}</strong>
            <p>
              {t.toGroupId ? groupName(t.toGroupId) : t.fromGroupIds?.map(groupName).join(', ')}
            </p>
            <p>{t.reason || 'Açıklama eklenmedi'}</p>
            <small>{fullDateTR(t.transferDate || t.recordedAt)}</small>
          </>
        )}
      />
      {dialog && (
        <MembershipDialog studentId={studentId} {...dialog} onClose={() => setDialog(null)} />
      )}
    </>
  );
}
