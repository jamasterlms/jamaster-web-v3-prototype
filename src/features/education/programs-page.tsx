import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useWorkspace } from '@/app/workspace-provider';
import { useLearningData } from './learning-catalog';
import { PageHeading, IconButton, StatusBadge } from '@/components/shared/primitives';
import { SearchField } from '@/components/shared/feature-primitives';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from '@/components/ui/select';
import { useQueryFilter } from '@/hooks/use-query-filter';
import { normalize, downloadCSV } from '@/lib/format';
const schema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, 'Program adı zorunludur.'),
  educationId: z.string().min(1, 'Eğitim seçin.'),
  description: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
});
type Program = z.infer<typeof schema>;
export function ProgramsPage() {
  const { state, dispatch } = useWorkspace(),
    catalog = useLearningData();
  const raw = state.moduleRows.programs || [];
  const all: Program[] = raw.map((r) => {
    try {
      return schema.parse(JSON.parse(r[6]));
    } catch {
      return {
        id: r[5],
        name: r[0],
        educationId: r[1] || '',
        description: r[2] || '',
        isActive: r[4] !== 'Pasif',
        createdAt: r[3] || '',
      };
    }
  });
  const [editing, setEditing] = useState<Program | null>(null),
    [remove, setRemove] = useState<Program | null>(null),
    [error, setError] = useState(''),
    [discard, setDiscard] = useState(false);
  const [filter, setFilter] = useQueryFilter(
    'programs',
    { search: '', isActive: 'all', sortOrder: 'createdAt:desc' },
    {
      keys: ['search', 'isActive', 'sortOrder'],
      read: (p) => ({
        search: p.get('search') || '',
        isActive: p.get('isActive') || 'all',
        sortOrder: p.get('sortOrder') || 'createdAt:desc',
      }),
      write: (p, v) => Object.entries(v).forEach(([k, v]) => p.set(k, v)),
    },
  );
  const rows = all
    .filter(
      (r) =>
        normalize(r.name + r.description).includes(normalize(filter.search)) &&
        (filter.isActive === 'all' || String(r.isActive) === filter.isActive),
    )
    .sort((a, b) => {
      const [key, direction] = filter.sortOrder.split(':');
      const n = String(a[key === 'name' ? 'name' : 'createdAt']).localeCompare(
        String(b[key === 'name' ? 'name' : 'createdAt']),
        'tr',
      );
      return direction === 'asc' ? n : -n;
    });
  const write = (records: Program[]) =>
    dispatch({
      type: 'module/rows',
      key: 'programs',
      rows: records.map((r) => [
        r.name,
        r.educationId,
        r.description,
        r.createdAt,
        r.isActive ? 'Aktif' : 'Pasif',
        r.id,
        JSON.stringify(r),
      ]),
    });
  const previous = all.find((r) => r.id === editing?.id);
  const dirty =
    !!editing &&
    (previous
      ? JSON.stringify(previous) !== JSON.stringify(editing)
      : !!(editing.name || editing.description || editing.educationId));
  const close = () => (dirty ? setDiscard(true) : setEditing(null));
  const actions = (r: Program) => (
    <div className="table-actions">
      <IconButton
        icon="pencil"
        label="Programı düzenle"
        onClick={() => {
          setError('');
          setEditing({ ...r });
        }}
      />
      <IconButton icon="trash2" label="Programı sil" onClick={() => setRemove(r)} />
    </div>
  );
  return (
    <>
      <PageHeading
        title="Programlar"
        description="Eğitimlere bağlı programları ve kullanım durumlarını yönetin."
      >
        <Button
          onClick={() => {
            setError('');
            setEditing({
              id: crypto.randomUUID(),
              name: '',
              educationId: '',
              description: '',
              isActive: true,
              createdAt: new Date().toISOString(),
            });
          }}
        >
          Yeni program
        </Button>
      </PageHeading>
      <div className="module-toolbar">
        <SearchField
          value={filter.search}
          onChange={(search) => setFilter({ ...filter, search })}
          placeholder="Program adı veya açıklama ara"
        />
        {(
          [
            ['isActive', 'Durum', { all: 'Tümü', true: 'Aktif', false: 'Pasif' }],
            [
              'sortOrder',
              'Sıralama',
              {
                'createdAt:desc': 'En yeni',
                'createdAt:asc': 'En eski',
                'name:asc': 'Ad A–Z',
                'name:desc': 'Ad Z–A',
              },
            ],
          ] as const
        ).map(([key, label, options]) => (
          <Select
            key={key}
            value={filter[key]}
            onValueChange={(v) => setFilter({ ...filter, [key]: v })}
          >
            <SelectTrigger aria-label={label}>
              <SelectValue placeholder={label} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(options).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        <Button
          variant="ghost"
          onClick={() => setFilter({ search: '', isActive: 'all', sortOrder: 'createdAt:desc' })}
        >
          Sıfırla
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            downloadCSV('programlar.csv', [
              ['Program', 'Eğitim', 'Açıklama', 'Durum'],
              ...rows.map((r) => [
                r.name,
                catalog.educations.find((e) => e.id === r.educationId)?.name || '',
                r.description,
                r.isActive ? 'Aktif' : 'Pasif',
              ]),
            ])
          }
        >
          Dışa aktar
        </Button>
      </div>
      <DataTable
        name="programs"
        data={rows}
        manualSorting
        getRowId={(r) => r.id}
        columns={[
          { accessorKey: 'name', header: 'Program' },
          {
            id: 'education',
            header: 'Eğitim',
            accessorFn: (r) =>
              catalog.educations.find((e) => e.id === r.educationId)?.name || 'Eşleşme bekliyor',
          },
          {
            accessorKey: 'description',
            header: 'Açıklama',
            cell: ({ row }) => (
              <p className="line-clamp-2 max-w-md">{row.original.description || '—'}</p>
            ),
          },
          {
            accessorKey: 'isActive',
            header: 'Durum',
            cell: ({ row }) => (
              <StatusBadge>{row.original.isActive ? 'Aktif' : 'Pasif'}</StatusBadge>
            ),
          },
          { id: 'actions', header: 'İşlemler', cell: ({ row }) => actions(row.original) },
        ]}
        mobileCard={(r) => (
          <>
            <strong>{r.name}</strong>
            <p>{catalog.educations.find((e) => e.id === r.educationId)?.name}</p>
            <StatusBadge>{r.isActive ? 'Aktif' : 'Pasif'}</StatusBadge>
            {actions(r)}
          </>
        )}
      />
      <Dialog
        open={!!editing}
        onOpenChange={(o) => {
          if (!o) close();
        }}
      >
        <DialogContent preventOutsideClose className="jam-modal">
          <DialogHeader>
            <DialogTitle>{previous ? 'Programı düzenle' : 'Yeni program'}</DialogTitle>
            <DialogDescription>Programı bir eğitim ile ilişkilendirin.</DialogDescription>
          </DialogHeader>
          {editing && (
            <form
              className="dialog-form"
              onSubmit={(e) => {
                e.preventDefault();
                const parsed = schema.safeParse(editing);
                if (!parsed.success) {
                  setError(parsed.error.issues[0].message);
                  return;
                }
                if (!catalog.educations.some((e) => e.id === editing.educationId)) {
                  setError('Geçerli bir eğitim seçin.');
                  return;
                }
                write(
                  previous
                    ? all.map((r) => (r.id === editing.id ? parsed.data : r))
                    : [parsed.data, ...all],
                );
                if (
                  !editing.isActive &&
                  catalog.programTerms.some((t) => t.programId === editing.id && t.isActive)
                )
                  toast.warning(
                    'Bu programa bağlı aktif dönemler bulunuyor. Dönem durumlarını ayrıca kontrol edin.',
                  );
                toast.success('Program kaydedildi.');
                setEditing(null);
              }}
            >
              <div className="dialog-form-body">
                <div className="form-grid">
                  <div className="form-field">
                    <Label htmlFor="program-name">Program adı *</Label>
                    <Input
                      id="program-name"
                      required
                      placeholder="Program adı"
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <Label htmlFor="program-education">Eğitim *</Label>
                    <Select
                      value={editing.educationId || undefined}
                      onValueChange={(educationId) => setEditing({ ...editing, educationId })}
                    >
                      <SelectTrigger id="program-education">
                        <SelectValue placeholder="Eğitim seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {catalog.educations.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.name}
                            {e.isActive ? '' : ' (Pasif)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="switch-row mt-5">
                  <Label htmlFor="program-active">Program aktif</Label>
                  <Switch
                    id="program-active"
                    checked={editing.isActive}
                    onCheckedChange={(isActive) => setEditing({ ...editing, isActive })}
                  />
                </div>
                <fieldset className="form-section form-section-optional">
                  <legend>
                    Ek bilgiler <span>İsteğe bağlı</span>
                  </legend>
                  <Label htmlFor="program-description">Açıklama</Label>
                  <Textarea
                    id="program-description"
                    placeholder="Programın amacı ve kapsamı"
                    value={editing.description}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  />
                </fieldset>
                {error && (
                  <p className="field-error" role="alert">
                    {error}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={close}>
                  Vazgeç
                </Button>
                <Button type="submit">Kaydet</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!remove || discard}
        onOpenChange={(o) => {
          if (!o) {
            setRemove(null);
            setDiscard(false);
          }
        }}
      >
        <DialogContent className="jam-modal">
          <DialogHeader>
            <DialogTitle>
              {discard ? 'Kaydetmeden kapatılsın mı?' : 'Program silinsin mi?'}
            </DialogTitle>
            <DialogDescription>
              {discard ? 'Son değişiklikler kaybolacak.' : `“${remove?.name}” kaydı silinecek.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRemove(null);
                setDiscard(false);
              }}
            >
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (remove) {
                  if (catalog.programTerms.some((t) => t.programId === remove.id)) {
                    toast.error(
                      'Program bir dönemde kullanılıyor. Önce ilişkili dönemleri güncelleyin.',
                    );
                    return;
                  }
                  write(all.filter((r) => r.id !== remove.id));
                }
                if (discard) setEditing(null);
                setRemove(null);
                setDiscard(false);
              }}
            >
              {discard ? 'Kaydetmeden kapat' : 'Sil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
