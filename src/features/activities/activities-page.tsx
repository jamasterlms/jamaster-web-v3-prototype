import { ActivityBatchDialog, type ActivityBatch } from './activity-batch-dialog';
import { ActivityGradingDialog } from './activity-grading-dialog';
import { submissionStatuses } from './submission-model';
import type { Submission } from './activity-model';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useWorkspace } from '@/app/workspace-provider';
import { useOperations } from '@/features/operations/operations-provider';
import { SearchField } from '@/components/shared/feature-primitives';
import { PageHeading, IconButton, StatusBadge } from '@/components/shared/primitives';
import { PageNavigation } from '@/components/navigation/page-navigation';
import { Icon } from '@/components/shared/icon';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useQueryFilter } from '@/hooks/use-query-filter';
import { normalize, fullDateTR } from '@/lib/format';
import {
  activityTypes,
  activityStatuses,
  gradingMethods,
  activitySchema,
  type Activity,
} from './activity-model';

type ActivityDraft = Omit<Activity, 'type' | 'gradingMethod'> & {
  type: Activity['type'] | '';
  gradingMethod: Activity['gradingMethod'] | '';
};
export function ActivitiesPage({
  id,
  submissions = false,
  groupIds,
  embedded = false,
  readOnly = false,
  basePath = '/admin/activities',
}: {
  id?: string;
  submissions?: boolean;
  groupIds?: string[];
  embedded?: boolean;
  readOnly?: boolean;
  basePath?: string;
}) {
  const { state, dispatch } = useWorkspace(),
    { operations } = useOperations();
  const [filter, setFilter] = useQueryFilter(
    'activities',
    { search: '', type: [] as string[], status: [] as string[], groupId: 'all' },
    {
      keys: ['search', 'type', 'status', 'groupId'],
      read: (p) => ({
        search: p.get('search') || '',
        type: p.getAll('type').filter((v) => v !== 'all'),
        status: p.getAll('status').filter((v) => v !== 'all'),
        groupId: p.get('groupId') || 'all',
      }),
      write: (p, v) => {
        p.set('search', v.search);
        p.set('groupId', v.groupId);
        v.type.forEach((x) => p.append('type', x));
        v.status.forEach((x) => p.append('status', x));
      },
    },
  );
  const [batch, setBatch] = useState<ActivityBatch | null>(null);
  const batchSelection = useRef<((ids: string[]) => void) | null>(null);
  const batchFocus = useRef<(() => boolean) | null>(null);
  useEffect(() => {
    setBatch(null);
    batchSelection.current = null;
  }, [state.branch]);
  const [editing, setEditing] = useState<ActivityDraft | null>(null),
    [removing, setRemoving] = useState<Activity | null>(null),
    [discard, setDiscard] = useState(false),
    [error, setError] = useState('');
  const all = (state.activities || []).filter((a) => !groupIds || groupIds.includes(a.groupId));
  const selected = all.find((a) => a.id === id);
  const groups = operations.groups.filter((g) => !groupIds || groupIds.includes(g.id));
  const rows = all.filter(
    (a) =>
      normalize(a.title + ' ' + a.description).includes(normalize(filter.search)) &&
      (!filter.type.length || filter.type.includes(a.type)) &&
      (!filter.status.length || filter.status.includes(a.status)) &&
      (filter.groupId === 'all' || a.groupId === filter.groupId),
  );
  const fresh = () => {
    const now = new Date().toISOString();
    setError('');
    setEditing({
      id: crypto.randomUUID(),
      title: '',
      type: '',
      groupId: groups.length === 1 ? groups[0].id : '',
      gradingMethod: '',
      maxPoints: undefined,
      description: '',
      allowLateSubmission: false,
      requireText: true,
      requireFile: false,
      status: 'DRAFT',
      createdAt: now,
      updatedAt: now,
    });
  };
  const original = all.find((a) => a.id === editing?.id);
  const dirty =
    !!editing &&
    (original
      ? JSON.stringify(original) !== JSON.stringify(editing)
      : !!(editing.title || editing.description));
  const close = () => (dirty ? setDiscard(true) : setEditing(null));
  const actions = (a: Activity) => (
    <div className="table-actions">
      <Button asChild size="icon" variant="ghost" aria-label={`${a.title} detayları`}>
        <Link to={`${basePath}/${a.id}`}>
          <Icon name="arrow-up-right" />
        </Link>
      </Button>
      {!readOnly && (
        <>
          <IconButton
            icon="pencil"
            label="Taslağı düzenle"
            disabled={a.status !== 'DRAFT'}
            onClick={() => {
              setError('');
              setEditing({ ...a });
            }}
          />
          <IconButton
            icon="trash2"
            label="Aktiviteyi sil"
            disabled={a.status !== 'DRAFT'}
            onClick={() => setRemoving(a)}
          />
        </>
      )}
    </div>
  );
  if (id && !selected)
    return (
      <>
        <PageHeading
          title="Aktivite bulunamadı"
          description={
            state.activities === undefined
              ? 'Aktivite bilgileri henüz alınamadı.'
              : 'Kayıt silinmiş veya bu çalışma alanında bulunmuyor.'
          }
        />
        <Button asChild variant="outline">
          <Link to={basePath}>Aktivitelere dön</Link>
        </Button>
      </>
    );
  return (
    <>
      {!embedded && (
        <PageHeading
          title={selected?.title || 'Aktiviteler'}
          description="Ödev, sınav ve değerlendirme çalışmaları."
        >
          {!id && !readOnly && <Button onClick={fresh}>Yeni aktivite</Button>}
        </PageHeading>
      )}
      {selected ? (
        <>
          <PageNavigation
            items={[
              { to: `${basePath}/${selected.id}`, label: 'Detay' },
              { to: `${basePath}/${selected.id}/submissions`, label: 'Teslimler' },
            ]}
          />
          {submissions ? (
            <ActivitySubmissions activity={selected} />
          ) : (
            <Card className="student-profile-card">
              <div className="detail-header">
                <h2>{selected.title}</h2>
                <StatusBadge>{activityStatuses[selected.status]}</StatusBadge>
              </div>
              <dl className="detail-grid">
                <div>
                  <dt>Tür</dt>
                  <dd>{activityTypes[selected.type]}</dd>
                </div>
                <div>
                  <dt>Grup</dt>
                  <dd>
                    {operations.groups.find((g) => g.id === selected.groupId)?.name ||
                      'Grup bulunamadı'}
                  </dd>
                </div>
                <div>
                  <dt>Değerlendirme</dt>
                  <dd>{gradingMethods[selected.gradingMethod]}</dd>
                </div>
                <div>
                  <dt>En yüksek puan</dt>
                  <dd>{selected.maxPoints ?? '—'}</dd>
                </div>
                <div>
                  <dt>Son teslim</dt>
                  <dd>{selected.dueDate ? fullDateTR(selected.dueDate) : 'Belirlenmedi'}</dd>
                </div>
                <div>
                  <dt>Geç teslim</dt>
                  <dd>{selected.allowLateSubmission ? 'İzin veriliyor' : 'Kapalı'}</dd>
                </div>
                <div>
                  <dt>Teslim biçimi</dt>
                  <dd>
                    {[
                      (selected.requireText ?? true) && 'Metin',
                      (selected.requireFile ?? false) && 'Dosya',
                    ]
                      .filter(Boolean)
                      .join(' + ') || 'Belirlenmedi'}
                  </dd>
                </div>
              </dl>
              <p className="whitespace-pre-wrap break-words">
                {selected.description || 'Açıklama eklenmedi.'}
              </p>
              <div className="form-actions">
                {actions(selected)}
                {!readOnly && ['PUBLISHED', 'ACTIVE'].includes(selected.status) && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      dispatch({
                        type: 'activity/status',
                        id: selected.id,
                        expected: selected.status,
                        status: 'CLOSED',
                      })
                    }
                  >
                    Teslimleri kapat
                  </Button>
                )}
                {!readOnly && selected.status === 'CLOSED' && (
                  <Button
                    variant="outline"
                    onClick={() => setBatch({ ids: [selected.id], action: 'publish' })}
                  >
                    Yeniden aç
                  </Button>
                )}
                {!readOnly && ['DRAFT', 'SCHEDULED'].includes(selected.status) && (
                  <Button onClick={() => setBatch({ ids: [selected.id], action: 'publish' })}>
                    Yayımla
                  </Button>
                )}
              </div>
              {!readOnly && ['DRAFT', 'SCHEDULED'].includes(selected.status) && (
                <p className="empty-inline">
                  Yayımladığınız aktivite grubun öğrenci portalında görünür.
                </p>
              )}
            </Card>
          )}
        </>
      ) : (
        <>
          <div className="module-toolbar">
            <SearchField
              value={filter.search}
              onChange={(search) => setFilter({ ...filter, search })}
              placeholder="Aktivite başlığı veya açıklama ara"
            />
            <MultiSelect
              label="Tür"
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
            <Select
              value={filter.groupId}
              onValueChange={(groupId) => setFilter({ ...filter, groupId })}
            >
              <SelectTrigger aria-label="Grup filtresi">
                <SelectValue placeholder="Tüm gruplar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm gruplar</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              onClick={() => setFilter({ search: '', type: [], status: [], groupId: 'all' })}
            >
              Sıfırla
            </Button>
            {embedded && !readOnly && <Button onClick={fresh}>Yeni aktivite</Button>}
          </div>
          <DataTable
            name="activities"
            selectionLabel="Seçili aktiviteler"
            filterKey={JSON.stringify(filter)}
            selectionActions={
              readOnly
                ? undefined
                : (selected, clearSelection, restoreFocus) => (
                    <>
                      {(['publish', 'archive', 'duplicate'] as const).map((action) => (
                        <Button
                          key={action}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            batchSelection.current = clearSelection;
                            batchFocus.current = restoreFocus;
                            setBatch({ ids: selected.map((a) => a.id), action });
                          }}
                        >
                          <Icon
                            name={
                              { publish: 'send', archive: 'archive', duplicate: 'copy' }[action]
                            }
                          />
                          {{ publish: 'Yayımla', archive: 'Arşivle', duplicate: 'Çoğalt' }[action]}
                        </Button>
                      ))}
                    </>
                  )
            }
            data={rows}
            getRowId={(a) => a.id}
            columns={[
              {
                accessorKey: 'title',
                header: 'Başlık',
                cell: ({ row }) => (
                  <Link to={`${basePath}/${row.original.id}`}>{row.original.title}</Link>
                ),
              },
              {
                accessorKey: 'type',
                header: 'Tür',
                cell: ({ row }) => activityTypes[row.original.type],
              },
              {
                accessorKey: 'status',
                header: 'Durum',
                cell: ({ row }) => (
                  <StatusBadge>{activityStatuses[row.original.status]}</StatusBadge>
                ),
              },
              {
                id: 'group',
                header: 'Grup',
                accessorFn: (a) =>
                  operations.groups.find((g) => g.id === a.groupId)?.name || 'Grup bulunamadı',
              },
              {
                accessorKey: 'dueDate',
                header: 'Son teslim',
                cell: ({ row }) =>
                  row.original.dueDate ? fullDateTR(row.original.dueDate) : 'Belirlenmedi',
              },
              { id: 'actions', header: 'İşlemler', cell: ({ row }) => actions(row.original) },
            ]}
            mobileCard={(a) => (
              <>
                <strong>{a.title}</strong>
                <p>
                  {activityTypes[a.type]} · {activityStatuses[a.status]}
                </p>
                {actions(a)}
              </>
            )}
          />
        </>
      )}
      <ActivityBatchDialog
        batch={batch}
        groups={groups}
        onApplied={(ids) => batchSelection.current?.(ids)}
        onRestoreFocus={() => {
          const restored = batchFocus.current?.() || false;
          batchFocus.current = null;
          return restored;
        }}
        onClose={() => {
          setBatch(null);
          batchSelection.current = null;
        }}
      />
      <Dialog
        open={!!editing}
        onOpenChange={(o) => {
          if (!o) close();
        }}
      >
        <DialogContent preventOutsideClose className="jam-modal dialog-wide">
          <DialogHeader>
            <DialogTitle>{original ? 'Aktiviteyi düzenle' : 'Yeni aktivite'}</DialogTitle>
            <DialogDescription>
              Önce çalışma ve değerlendirme bilgilerini tamamlayın.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <form
              className="dialog-form"
              onSubmit={(e) => {
                e.preventDefault();
                const parsed = activitySchema.safeParse(editing);
                if (!parsed.success) {
                  setError(parsed.error.issues[0].message);
                  return;
                }
                if (!groups.some((g) => g.id === editing.groupId)) {
                  setError('Geçerli bir grup seçin.');
                  return;
                }
                dispatch({
                  type: 'activity/save',
                  activity: {
                    ...editing,
                    ...parsed.data,
                    title: editing.title.trim(),
                    updatedAt: new Date().toISOString(),
                  },
                });
                setEditing(null);
                toast.success('Aktivite taslağı kaydedildi.');
              }}
            >
              <div className="dialog-form-body">
                <div className="form-grid">
                  <div className="form-field">
                    <Label htmlFor="activity-title">Başlık *</Label>
                    <Input
                      id="activity-title"
                      required
                      maxLength={255}
                      placeholder="Çalışmanın başlığı"
                      value={editing.title}
                      onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    />
                  </div>
                  {(
                    [
                      ['type', 'Tür', activityTypes],
                      ['groupId', 'Grup', Object.fromEntries(groups.map((g) => [g.id, g.name]))],
                      ['gradingMethod', 'Değerlendirme', gradingMethods],
                    ] as const
                  ).map(([key, label, options]) => (
                    <div className="form-field" key={key}>
                      <Label htmlFor={`activity-${key}`}>{label} *</Label>
                      <Select
                        value={editing[key] || undefined}
                        onValueChange={(value) =>
                          setEditing({
                            ...editing,
                            [key]: value,
                            ...(key === 'gradingMethod' && value === 'PERCENTAGE'
                              ? { maxPoints: 100 }
                              : {}),
                          })
                        }
                      >
                        <SelectTrigger id={`activity-${key}`}>
                          <SelectValue placeholder={`${label} seçin`} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(options).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                <fieldset className="form-section form-section-optional">
                  <legend>
                    Ek bilgiler <span>İsteğe bağlı</span>
                  </legend>
                  {editing.gradingMethod !== 'PASS_FAIL' && (
                    <div className="form-field">
                      <Label htmlFor="activity-points">En yüksek puan</Label>
                      <Input
                        id="activity-points"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        step={1}
                        placeholder="100"
                        value={editing.maxPoints ?? ''}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            maxPoints: e.target.value === '' ? undefined : Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  )}
                  <div className="form-field">
                    <Label htmlFor="activity-due">Son teslim tarihi</Label>
                    <Input
                      id="activity-due"
                      type="datetime-local"
                      value={editing.dueDate || ''}
                      onChange={(e) => setEditing({ ...editing, dueDate: e.target.value })}
                    />
                  </div>
                  <div className="form-field mt-5">
                    <Label htmlFor="activity-description">Açıklama</Label>
                    <Textarea
                      id="activity-description"
                      maxLength={10000}
                      rows={5}
                      placeholder="Çalışmanın kapsamı ve beklentiler"
                      value={editing.description}
                      onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    />
                  </div>
                  <div className="switch-row mt-5">
                    <Label htmlFor="activity-late">Geç teslime izin ver</Label>
                    <Switch
                      id="activity-late"
                      checked={editing.allowLateSubmission}
                      onCheckedChange={(allowLateSubmission) =>
                        setEditing({ ...editing, allowLateSubmission })
                      }
                    />
                  </div>
                  <div className="switch-row mt-5">
                    <Label htmlFor="activity-require-text">Metin teslimi zorunlu</Label>
                    <Switch
                      id="activity-require-text"
                      checked={editing.requireText ?? true}
                      onCheckedChange={(requireText) => setEditing({ ...editing, requireText })}
                    />
                  </div>
                  <div className="switch-row mt-5">
                    <Label htmlFor="activity-require-file">Dosya teslimi zorunlu</Label>
                    <Switch
                      id="activity-require-file"
                      checked={editing.requireFile ?? false}
                      onCheckedChange={(requireFile) => setEditing({ ...editing, requireFile })}
                    />
                  </div>
                </fieldset>
                {error && (
                  <p role="alert" className="field-error">
                    {error}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={close}>
                  Vazgeç
                </Button>
                <Button type="submit">Taslağı kaydet</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!removing || discard}
        onOpenChange={(o) => {
          if (!o) {
            setRemoving(null);
            setDiscard(false);
          }
        }}
      >
        <DialogContent className="jam-modal">
          <DialogHeader>
            <DialogTitle>
              {discard ? 'Kaydetmeden kapatılsın mı?' : 'Aktivite silinsin mi?'}
            </DialogTitle>
            <DialogDescription>
              {discard ? 'Son düzenlemeler kaybolacak.' : `“${removing?.title}” taslağı silinecek.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRemoving(null);
                setDiscard(false);
              }}
            >
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (removing) dispatch({ type: 'activity/delete', id: removing.id });
                if (discard) setEditing(null);
                setRemoving(null);
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
export function ActivitySubmissions({ activity }: { activity: Activity }) {
  const { state } = useWorkspace();
  const [grading, setGrading] = useState<Submission | null>(null);
  const rows = (state.activitySubmissions || []).filter((s) => s.activityId === activity.id);
  return (
    <>
      <DataTable
        name={`submissions-${activity.id}`}
        data={rows}
        getRowId={(s) => s.id}
        columns={[
          { accessorKey: 'studentName', header: 'Öğrenci' },
          {
            accessorKey: 'submittedAt',
            header: 'Teslim tarihi',
            cell: ({ row }) => fullDateTR(row.original.submittedAt),
          },
          {
            accessorKey: 'status',
            header: 'Durum',
            cell: ({ row }) => submissionStatuses[row.original.status],
          },
          {
            accessorKey: 'grade',
            header: 'Not',
            cell: ({ row }) =>
              row.original.grade === undefined
                ? '—'
                : `${row.original.grade} / ${row.original.maxGrade ?? activity.maxPoints ?? '—'}`,
          },
          {
            id: 'actions',
            header: 'İşlemler',
            cell: ({ row }) => (
              <IconButton
                icon="pencil"
                label="Teslimi değerlendir"
                onClick={() => setGrading(row.original)}
              />
            ),
          },
        ]}
        mobileCard={(s) => (
          <>
            <strong>{s.studentName}</strong>
            <p>
              {fullDateTR(s.submittedAt)} · {s.status}
            </p>
            <p>Not: {s.grade ?? s.letterGrade ?? '—'}</p>
            <IconButton icon="pencil" label="Teslimi değerlendir" onClick={() => setGrading(s)} />
          </>
        )}
      />
      <ActivityGradingDialog
        activity={activity}
        submission={grading}
        onClose={() => setGrading(null)}
      />
    </>
  );
}
