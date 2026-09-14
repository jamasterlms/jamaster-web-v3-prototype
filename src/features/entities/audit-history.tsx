import { useWorkspace } from '@/app/workspace-provider';
import { DataTable } from '@/components/ui/data-table';
import { SearchField } from '@/components/shared/feature-primitives';
import { Button } from '@/components/ui/button';
import { usePageState } from '@/hooks/use-page-state';
import { downloadCSV, normalize, fullDateTR } from '@/lib/format';
import type { AuditLog } from '@/features/entities/record-model';
export type { AuditLog } from '@/features/entities/record-model';
export function AuditHistory({
  targetType,
  targetId,
}: {
  targetType: AuditLog['targetType'];
  targetId: string;
}) {
  const { state } = useWorkspace();
  const [query, setQuery] = usePageState('audit-search', '');
  const data = (state.auditLogs || []).filter(
    (r) =>
      r.targetType === targetType &&
      r.targetId === targetId &&
      normalize(`${r.actorName || ''} ${r.action}`).includes(normalize(query)),
  );
  return (
    <>
      <div className="module-toolbar">
        <SearchField value={query} onChange={setQuery} placeholder="İşlem veya kullanıcı ara" />
        <Button
          variant="outline"
          disabled={!data.length}
          onClick={() =>
            downloadCSV('islem-gecmisi.csv', [
              ['Kullanıcı', 'İşlem', 'Başarılı', 'Başarısız', 'Tarih'],
              ...data.map((r) => [
                r.actorName,
                r.action,
                r.succeededCount,
                r.failedCount,
                r.createdAt,
              ]),
            ])
          }
        >
          Dışa aktar
        </Button>
      </div>
      <DataTable
        name={`audit-${targetType}-${targetId}`}
        data={data}
        getRowId={(r) => r.id}
        unavailable={state.auditLogs === undefined ? 'İşlem geçmişi henüz alınamadı.' : undefined}
        columns={[
          {
            accessorKey: 'actorName',
            header: 'Kullanıcı',
            cell: ({ row }) => row.original.actorName || 'Silinmiş kullanıcı',
          },
          { accessorKey: 'action', header: 'İşlem' },
          { accessorKey: 'succeededCount', header: 'Başarılı' },
          { accessorKey: 'failedCount', header: 'Başarısız' },
          {
            accessorKey: 'createdAt',
            header: 'Tarih',
            cell: ({ row }) => fullDateTR(row.original.createdAt),
          },
        ]}
        mobileCard={(r) => (
          <>
            <strong>{r.action}</strong>
            <p>{r.actorName || 'Silinmiş kullanıcı'}</p>
            <p>{fullDateTR(r.createdAt)}</p>
            <p>
              {r.succeededCount} başarılı · {r.failedCount} başarısız
            </p>
          </>
        )}
      />
    </>
  );
}
