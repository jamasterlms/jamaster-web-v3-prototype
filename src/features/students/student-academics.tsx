import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWorkspace } from '@/app/workspace-provider';
import { useOperations } from '@/features/operations/operations-provider';
import { useMemberships } from '@/features/education/use-memberships';
import {
  activityTypes,
  activityStatuses,
  submissionGradeLabel,
} from '@/features/activities/activity-model';
import { StudentDocumentActions, LocalDocumentPreview } from './student-document-actions';
import { SearchField } from '@/components/shared/feature-primitives';
import { IconButton, StatusBadge } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useQueryFilter } from '@/hooks/use-query-filter';
import { normalize, fullDateTR, money } from '@/lib/format';
import type { SignedDocument } from '@/features/entities/record-model';
export type { SignedDocument } from '@/features/entities/record-model';
export function StudentActivities({ id }: { id: number }) {
  const { state } = useWorkspace(),
    { operations } = useOperations(),
    memberships = useMemberships();
  const groups = memberships.groupsFor(id).map((g) => g.id);
  const [filter, setFilter] = useQueryFilter(
    'student-activities',
    { type: [] as string[], status: [] as string[] },
    {
      keys: ['type', 'status'],
      read: (p) => ({
        type: p.getAll('type').filter((v) => v !== 'all'),
        status: p.getAll('status').filter((v) => v !== 'all'),
      }),
      write: (p, v) => {
        v.type.forEach((x) => p.append('type', x));
        v.status.forEach((x) => p.append('status', x));
      },
    },
  );
  const rows = (state.activities || [])
    .filter(
      (a) =>
        groups.includes(a.groupId) &&
        (!filter.type.length || filter.type.includes(a.type)) &&
        (!filter.status.length || filter.status.includes(a.status)),
    )
    .map((a) => ({
      ...a,
      submission: state.activitySubmissions
        ?.filter((s) => s.studentId === id && s.activityId === a.id)
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0],
    }));
  return (
    <>
      <div className="module-toolbar">
        <MultiSelect
          label="Aktivite türü"
          value={filter.type}
          onChange={(type) => setFilter({ ...filter, type })}
          options={Object.entries(activityTypes).map(([value, label]) => ({ value, label }))}
        />
        <MultiSelect
          label="Durum"
          value={filter.status}
          onChange={(status) => setFilter({ ...filter, status })}
          options={Object.entries(activityStatuses).map(([value, label]) => ({ value, label }))}
        />
        <Button variant="ghost" onClick={() => setFilter({ type: [], status: [] })}>
          Sıfırla
        </Button>
      </div>
      <DataTable
        name={`student-activities-${id}`}
        filterKey={JSON.stringify(filter)}
        data={rows}
        getRowId={(a) => a.id}
        unavailable={
          state.activities === undefined ? 'Aktivite bilgileri henüz alınamadı.' : undefined
        }
        columns={[
          {
            accessorKey: 'title',
            header: 'Başlık',
            cell: ({ row }) => (
              <Link to={`/admin/activities/${row.original.id}`}>{row.original.title}</Link>
            ),
          },
          {
            accessorKey: 'type',
            header: 'Tür',
            cell: ({ row }) => activityTypes[row.original.type],
          },
          {
            id: 'group',
            header: 'Grup',
            accessorFn: (a) => operations.groups.find((g) => g.id === a.groupId)?.name || '—',
          },
          {
            accessorKey: 'dueDate',
            header: 'Son teslim',
            cell: ({ row }) => (row.original.dueDate ? fullDateTR(row.original.dueDate) : '—'),
          },
          {
            accessorKey: 'status',
            header: 'Durum',
            cell: ({ row }) => <StatusBadge>{activityStatuses[row.original.status]}</StatusBadge>,
          },
          {
            id: 'submission',
            header: 'Teslim',
            accessorFn: (a) =>
              a.submission?.status ||
              (state.activitySubmissions === undefined ? 'Bilgi alınamadı' : 'Teslim edilmedi'),
          },
          {
            id: 'grade',
            header: 'Not',
            cell: ({ row }) =>
              submissionGradeLabel(row.original.submission, row.original.maxPoints),
          },
        ]}
        mobileCard={(a) => (
          <>
            <Link to={`/admin/activities/${a.id}`}>
              <strong>{a.title}</strong>
            </Link>
            <p>
              {activityTypes[a.type]} · {activityStatuses[a.status]}
            </p>
            <p>{a.dueDate ? fullDateTR(a.dueDate) : 'Son teslim belirlenmedi'}</p>
            <p>Not: {submissionGradeLabel(a.submission, a.maxPoints)}</p>
          </>
        )}
      />
    </>
  );
}
const documentTypes = { BONO: 'Bono', TAHHUTNAME: 'Taahhütname', SALE_CONTRACT: 'Sözleşme' };
export function StudentDocuments({ id }: { id: number }) {
  const { state } = useWorkspace();
  const [view, setView] = useState<SignedDocument | null>(null);
  const [filter, setFilter] = useQueryFilter(
    'signed-documents',
    { search: '', document_type: 'all', sortOrder: 'signedAt:desc' },
    {
      keys: ['search', 'document_type', 'sortOrder'],
      read: (p) => ({
        search: p.get('search') || '',
        document_type: p.get('document_type') || 'all',
        sortOrder: p.get('sortOrder') || 'signedAt:desc',
      }),
      write: (p, v) => Object.entries(v).forEach(([k, v]) => p.set(k, v)),
    },
  );
  const rows = (state.signedDocuments || [])
    .filter(
      (d) =>
        d.studentId === id &&
        (filter.document_type === 'all' || d.documentType === filter.document_type) &&
        normalize(d.courseName + d.signerName + documentTypes[d.documentType]).includes(
          normalize(filter.search),
        ),
    )
    .sort((a, b) => {
      const [k, o] = filter.sortOrder.split(':');
      return (
        (a[k === 'createdAt' ? 'createdAt' : 'signedAt'] || '').localeCompare(
          b[k === 'createdAt' ? 'createdAt' : 'signedAt'] || '',
        ) * (o === 'asc' ? 1 : -1)
      );
    });
  return (
    <>
      <div className="module-toolbar">
        <SearchField
          value={filter.search}
          onChange={(search) => setFilter({ ...filter, search })}
          placeholder="Belge, eğitim veya imzalayan ara"
        />
        <Select
          value={filter.document_type}
          onValueChange={(document_type) => setFilter({ ...filter, document_type })}
        >
          <SelectTrigger aria-label="Belge türü">
            <SelectValue placeholder="Belge türü" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm belgeler</SelectItem>
            {Object.entries(documentTypes).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filter.sortOrder}
          onValueChange={(sortOrder) => setFilter({ ...filter, sortOrder })}
        >
          <SelectTrigger aria-label="Belge sıralaması">
            <SelectValue placeholder="Sıralama" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries({
              'signedAt:desc': 'İmza tarihi: en yeni',
              'signedAt:asc': 'İmza tarihi: en eski',
              'createdAt:desc': 'Oluşturma: en yeni',
              'createdAt:asc': 'Oluşturma: en eski',
            }).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          onClick={() =>
            setFilter({ search: '', document_type: 'all', sortOrder: 'signedAt:desc' })
          }
        >
          Sıfırla
        </Button>
        <StudentDocumentActions studentId={id} sales={state.salesWithoutDocuments?.[id]} />
      </div>
      <DataTable
        name={`documents-${id}`}
        filterKey={JSON.stringify(filter)}
        data={rows}
        manualSorting
        exportConfig={{
          filename: `ogrenci-${id}-belgeler`,
          columns: [
            { key: 'documentType', label: 'Tür', value: (d) => documentTypes[d.documentType] },
            { key: 'courseName', label: 'Eğitim', value: (d) => d.courseName },
            { key: 'paidAmount', label: 'Tutar', value: (d) => d.paidAmount },
            { key: 'signerName', label: 'İmzalayan', value: (d) => d.signerName },
            { key: 'signedAt', label: 'İmza tarihi', value: (d) => d.signedAt },
            { key: 'encryptionStatus', label: 'Belge durumu', value: (d) => d.encryptionStatus },
            { key: 'version', label: 'Sürüm', value: (d) => d.version },
          ],
        }}
        getRowId={(d) => d.id}
        unavailable={
          state.signedDocuments === undefined
            ? 'İmzalı belge bilgileri henüz alınamadı.'
            : undefined
        }
        columns={[
          {
            accessorKey: 'documentType',
            header: 'Belge',
            cell: ({ row }) => documentTypes[row.original.documentType],
          },
          { accessorKey: 'courseName', header: 'Eğitim' },
          {
            accessorKey: 'paidAmount',
            header: 'Tutar',
            cell: ({ row }) => money(row.original.paidAmount),
          },
          { accessorKey: 'signerName', header: 'İmzalayan' },
          {
            accessorKey: 'signedAt',
            header: 'İmza tarihi',
            cell: ({ row }) => fullDateTR(row.original.signedAt),
          },
          {
            accessorKey: 'encryptionStatus',
            header: 'Belge durumu',
            cell: ({ row }) =>
              row.original.localFile
                ? 'Dosya eklendi'
                : { PENDING: 'Hazırlanıyor', ENCRYPTED: 'Hazır', FAILED: 'Hazırlanamadı' }[
                    row.original.encryptionStatus
                  ],
          },
          {
            id: 'actions',
            header: 'İşlemler',
            cell: ({ row }) => (
              <IconButton
                icon="eye"
                label="Belgeyi görüntüle"
                onClick={() => setView(row.original)}
              />
            ),
          },
        ]}
        mobileCard={(d) => (
          <>
            <strong>{documentTypes[d.documentType]}</strong>
            <p>
              {d.courseName} · {money(d.paidAmount)}
            </p>
            <p>
              {d.signerName} · {fullDateTR(d.signedAt)}
            </p>
            <IconButton icon="eye" label="Belgeyi görüntüle" onClick={() => setView(d)} />
          </>
        )}
      />
      <Dialog
        open={!!view}
        onOpenChange={(o) => {
          if (!o) setView(null);
        }}
      >
        <DialogContent className="jam-modal dialog-wide">
          <DialogHeader>
            <DialogTitle>{view && documentTypes[view.documentType]}</DialogTitle>
            <DialogDescription>
              {view?.courseName} · Sürüm {view?.version}
            </DialogDescription>
          </DialogHeader>
          <div className="dialog-form-body">
            <dl className="detail-grid">
              <div>
                <dt>İmzalayan</dt>
                <dd>{view?.signerName}</dd>
              </div>
              <div>
                <dt>Yetkili</dt>
                <dd>{view?.authorityName || '—'}</dd>
              </div>
              <div>
                <dt>Öğrenci imzası</dt>
                <dd>{view?.signedByStudent ? 'İmzalandı' : 'İmza bekleniyor'}</dd>
              </div>
              <div>
                <dt>Yetkili imzası</dt>
                <dd>{view?.signedByAuthority ? 'İmzalandı' : 'İmza bekleniyor'}</dd>
              </div>
              <div>
                <dt>İmza tarihi</dt>
                <dd>{fullDateTR(view?.signedAt)}</dd>
              </div>
              <div>
                <dt>Oluşturulma</dt>
                <dd>{fullDateTR(view?.createdAt)}</dd>
              </div>
              <div>
                <dt>Tutar</dt>
                <dd>{view ? money(view.paidAmount) : '—'}</dd>
              </div>
              <div>
                <dt>Ödeme tipi</dt>
                <dd>{view?.paymentType || '—'}</dd>
              </div>
            </dl>
            {view?.localFile ? (
              <LocalDocumentPreview file={view.localFile} />
            ) : (
              <p className="pending-banner">Bu kayda dosya eklenmemiş.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setView(null)}>
              Kapat
            </Button>
            <Button asChild>
              <Link to={`/admin/students/${id}/payments?tab=saleHistory`}>Satış geçmişini aç</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
