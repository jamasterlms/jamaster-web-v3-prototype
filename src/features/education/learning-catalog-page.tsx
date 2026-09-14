import { useState, type ReactNode } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { PageNavigation } from '@/components/navigation/page-navigation';
import { SearchField } from '@/components/shared/feature-primitives';
import { Icon } from '@/components/shared/icon';
import { PageHeading, StatusBadge } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MultiSelect } from '@/components/ui/multi-select';
import { useQueryFilter } from '@/hooks/use-query-filter';
import { downloadCSV, normalize } from '@/lib/format';
import { useLearningCatalog } from './learning-catalog';
import { CatalogChoice, LearningEditor, type LearningFieldProps } from './learning-form';
import {
  educationTypeOptions,
  learningDeleteReason,
  learningRecords,
  newLearningRecord,
  periodTypeOptions,
  type LearningCatalog,
  type LearningKind,
  type LearningRecord,
  type LearningUsageContext,
} from './learning-model';

const navigation = [
  { to: '/admin/education', label: 'Eğitimler' },
  { to: '/admin/education/period', label: 'Eğitim dönemleri' },
  { to: '/admin/program-terms', label: 'Program dönemleri' },
  { to: '/admin/curriculum-units', label: 'Müfredat' },
];
type Filter = { search: string; types: string[]; active: string; sort: string };
export function LearningCatalogPage<T extends LearningRecord>({
  kind,
  title,
  description,
  createLabel,
  columns,
  fields,
  preview,
  extraFilters,
}: {
  kind: LearningKind;
  title: string;
  description: string;
  createLabel: string;
  columns: (catalog: LearningCatalog, usage: LearningUsageContext) => ColumnDef<T>[];
  fields: (props: LearningFieldProps<T>) => ReactNode;
  preview: (record: T, catalog: LearningCatalog, usage: LearningUsageContext) => [string, string][];
  extraFilters?: ReactNode;
}) {
  const { catalog, usage, saveRecord, removeRecord } = useLearningCatalog();
  const initialSort =
    kind === 'program-terms'
      ? 'startDate:desc'
      : kind === 'curriculum-units'
        ? 'order:asc'
        : 'createdAt:desc';
  const [filter, setFilter] = useQueryFilter<Filter>(
    `${kind}:filters`,
    { search: '', types: [], active: 'all', sort: initialSort },
    {
      keys: ['search', 'type', 'periodType', 'isActive', 'sort', 'order'],
      read: (params) => ({
        search: params.get('search') || '',
        types: (params.get(kind === 'period' ? 'periodType' : 'type') || '')
          .split(',')
          .filter((v) => v && v !== 'all'),
        active: params.get('isActive') || 'all',
        sort: params.has('sort')
          ? `${params.get('sort')}:${params.get('order') || 'asc'}`
          : initialSort,
      }),
      write: (params, value) => {
        params.set('search', value.search);
        params.set('isActive', value.active);
        params.set(kind === 'period' ? 'periodType' : 'type', value.types.join(','));
        const [sort, order] = value.sort.split(':');
        params.set('sort', sort);
        params.set('order', order);
      },
    },
  );
  const [editing, setEditing] = useState<{ value: T; previous?: T } | null>(null),
    [deleting, setDeleting] = useState<T | null>(null);
  const records = learningRecords(catalog, kind) as T[];
  const list = records
    .filter((record) => {
      const type =
        record.kind === 'education'
          ? record.type
          : record.kind === 'period'
            ? record.periodType
            : '';
      return (
        normalize(record.name + ' ' + record.description).includes(normalize(filter.search)) &&
        (filter.active === 'all' || record.isActive === (filter.active === 'true')) &&
        (!filter.types.length || filter.types.includes(type))
      );
    })
    .sort((a, b) => {
      const [field, direction] = filter.sort.split(':');
      const read = (record: LearningRecord) =>
        field === 'order' && record.kind === 'curriculum-units'
          ? record.order
          : field === 'startDate' && record.kind === 'program-terms'
            ? record.startDate
            : field === 'createdAt'
              ? record.createdAt || ''
              : record.name;
      const av = read(a),
        bv = read(b);
      const diff =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv), 'tr');
      return direction === 'desc' ? -diff : diff;
    });
  const actions = (record: T) => (
    <div className="table-actions">
      <Button
        onClick={() => setEditing({ value: record, previous: record })}
        variant="ghost"
        size="icon"
        aria-label="Düzenle"
        title="Düzenle"
      >
        <Icon name="pencil" />
      </Button>
      <Button
        onClick={() => {
          saveRecord({ ...record, isActive: !record.isActive });
          toast.success(record.isActive ? 'Kayıt pasife alındı.' : 'Kayıt aktifleştirildi.');
        }}
        variant="ghost"
        size="icon"
        aria-label={record.isActive ? 'Pasife al' : 'Aktifleştir'}
        title={record.isActive ? 'Pasife al' : 'Aktifleştir'}
      >
        <Icon name={record.isActive ? 'circle-x' : 'circle-check'} />
      </Button>
      <Button
        onClick={() => setDeleting(record)}
        variant="ghost"
        size="icon"
        aria-label="Sil"
        title="Sil"
      >
        <Icon name="trash2" />
      </Button>
    </div>
  );
  const reason = deleting ? learningDeleteReason(deleting, catalog, usage) : null;
  const sortOptions =
    kind === 'program-terms'
      ? [
          { value: 'startDate:desc', label: 'Başlangıç · yeni' },
          { value: 'startDate:asc', label: 'Başlangıç · eski' },
          { value: 'name:asc', label: 'Ad · A–Z' },
        ]
      : kind === 'curriculum-units'
        ? [
            { value: 'order:asc', label: 'Sıra · artan' },
            { value: 'createdAt:desc', label: 'Yeni kayıtlar' },
            { value: 'name:asc', label: 'Başlık · A–Z' },
          ]
        : [
            { value: 'createdAt:desc', label: 'Yeni kayıtlar' },
            { value: 'createdAt:asc', label: 'Eski kayıtlar' },
            { value: 'name:asc', label: 'Ad · A–Z' },
            { value: 'name:desc', label: 'Ad · Z–A' },
          ];
  return (
    <>
      <PageHeading title={title} description={description}>
        <Button
          onClick={() => setEditing({ value: newLearningRecord(kind, crypto.randomUUID()) as T })}
        >
          <Icon name="plus" />
          {createLabel}
        </Button>
      </PageHeading>
      <PageNavigation items={navigation} />
      <div className="module-toolbar">
        <SearchField
          value={filter.search}
          onChange={(search) => setFilter({ ...filter, search })}
          placeholder="Ad veya açıklama ara"
        />
        <Button
          variant="outline"
          onClick={() =>
            downloadCSV(`jamaster-${kind}.csv`, [
              ['Ad', 'Durum', 'Bilgiler'],
              ...list.map((record) => [
                record.name,
                record.isActive ? 'Aktif' : 'Pasif',
                preview(record, catalog, usage)
                  .map(([label, value]) => `${label}: ${value}`)
                  .join(' | '),
              ]),
            ])
          }
        >
          <Icon name="download" />
          CSV indir
        </Button>
      </div>
      <div className="module-toolbar secondary-filters">
        {(kind === 'education' || kind === 'period') && (
          <MultiSelect
            label={kind === 'education' ? 'Eğitim tipi' : 'Dönem tipi'}
            value={filter.types}
            onChange={(types) => setFilter({ ...filter, types })}
            options={kind === 'education' ? educationTypeOptions : periodTypeOptions}
          />
        )}
        <CatalogChoice
          field="filter-active"
          label="Durum"
          value={filter.active}
          onChange={(active) => setFilter({ ...filter, active: active || 'all' })}
          options={[
            { value: 'all', label: 'Tümü' },
            { value: 'true', label: 'Aktif' },
            { value: 'false', label: 'Pasif' },
          ]}
        />
        <CatalogChoice
          field="filter-sort"
          label="Sıralama"
          value={filter.sort}
          onChange={(sort) => setFilter({ ...filter, sort: sort || initialSort })}
          options={sortOptions}
        />
        {extraFilters}
        <Button
          variant="ghost"
          onClick={() => setFilter({ search: '', types: [], active: 'all', sort: initialSort })}
        >
          Filtreleri sıfırla
        </Button>
      </div>
      <DataTable
        name={`learning-${kind}`}
        data={list}
        getRowId={(record) => record.id}
        manualSorting
        columns={[
          ...columns(catalog, usage).map((column) => ({ ...column, enableSorting: false })),
          {
            id: 'isActive',
            header: 'Durum',
            enableSorting: false,
            cell: ({ row }) => (
              <StatusBadge>{row.original.isActive ? 'Aktif' : 'Pasif'}</StatusBadge>
            ),
          },
          {
            id: 'actions',
            header: 'İşlemler',
            enableSorting: false,
            enableHiding: false,
            cell: ({ row }) => actions(row.original),
          },
        ]}
        mobileCard={(record) => (
          <>
            <h3>{record.name}</h3>
            <StatusBadge>{record.isActive ? 'Aktif' : 'Pasif'}</StatusBadge>
            <dl className="mobile-record-meta">
              {[
                ...preview(record, catalog, usage),
                ...(record.description ? [['Açıklama', record.description]] : []),
              ]
                .filter(([label]) => label !== 'Ad')
                .map(([label, value]) => (
                  <div key={label}>
                    <dt className="muted">{label}</dt>
                    <dd>{value || 'Belirtilmedi'}</dd>
                  </div>
                ))}
            </dl>
            {actions(record)}
          </>
        )}
      />
      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        {editing && (
          <LearningEditor
            key={editing.value.id}
            initial={editing.value}
            previous={editing.previous}
            title={editing.previous ? `${editing.value.name} · düzenle` : createLabel}
            catalog={catalog}
            usage={usage}
            fields={fields}
            preview={(record) => preview(record, catalog, usage)}
            onClose={() => setEditing(null)}
            onSave={(record) => {
              saveRecord(record);
              setEditing(null);
              toast.success('Bilgiler kaydedildi.');
            }}
          />
        )}
      </Dialog>
      <Dialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <DialogContent preventOutsideClose className="jam-modal">
          <DialogHeader>
            <DialogTitle>{deleting?.name} kaydını sil</DialogTitle>
            <DialogDescription>
              {reason || 'Bu katalog kaydı kaldırılacak. İşlemi onaylıyor musunuz?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Vazgeç
            </Button>
            {reason && deleting?.isActive && (
              <Button
                onClick={() => {
                  saveRecord({ ...deleting, isActive: false });
                  setDeleting(null);
                  toast.success('Kayıt pasife alındı.');
                }}
              >
                Pasife al
              </Button>
            )}
            <Button
              variant="destructive"
              disabled={!!reason}
              onClick={() => {
                if (deleting && !reason) {
                  removeRecord(deleting);
                  setDeleting(null);
                  toast.success('Kayıt silindi.');
                }
              }}
            >
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
