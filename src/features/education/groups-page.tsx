import { GroupStudents } from './group-students';
import { useMemberships } from './use-memberships';
import { BreakdownChart } from '@/components/shared/breakdown-chart';
import { GroupDetailNavigation } from './detail-navigation';
import { formRouteRecord } from './form-route-model';
import { DialogFooter } from '@/components/ui/dialog';
import { useEntityNavigation } from '@/features/entities/use-entity-navigation';
import { Link, useSearchParams } from 'react-router-dom';
import { useWorkspace } from '@/app/workspace-provider';
import { DateRangeFilter } from '@/components/forms/date-range-filter';
import { Metrics, SearchField } from '@/components/shared/feature-primitives';
import { Icon } from '@/components/shared/icon';
import { PageHeading, StatusBadge } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { localDate } from '@/lib/validation';
import { groupDraft } from './group-model';

import { Label as UIFieldLabel } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Select as UISelect,
  SelectContent as UISelectContent,
  SelectItem as UISelectItem,
  SelectTrigger as UISelectTrigger,
  SelectValue as UISelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { labelFor } from '@/features/meetings/meeting-options';
import { validateGroup, type LearningGroup } from '@/features/operations/model';
import { useOperations } from '@/features/operations/operations-provider';
import { usePageState } from '@/hooks/use-page-state';
import { useQueryFilter } from '@/hooks/use-query-filter';
import { navigate } from '@/hooks/use-route';
import { normalize } from '@/lib/format';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { educationTypes, GroupFields, groupTypes } from './group-fields';
import { useLevelCatalog } from './level-catalog';
const blank: LearningGroup = {
  id: '',
  name: '',
  course: '',
  level: '',
  teacher: '',
  capacity: 16,
  schedule: '',
  room: '',
  status: 'Planlandı',
  groupType: 'IN_PERSON',
  educationType: 'GROUPS',
  subLevel: '',
  dayPeriod: 'WEEKDAY',
  timePeriod: 'MORNING',
  programTermId: undefined,
  createdAt: localDate(),
};
export function GroupsPage({ create = false, detailId }: { create?: boolean; detailId?: string }) {
  const openEntity = useEntityNavigation();
  const memberships = useMemberships();
  const levelCatalog = useLevelCatalog();
  const [params, setParams] = useSearchParams();
  const { operations, save } = useOperations(),
    { state, dispatch } = useWorkspace();
  const formRequest = formRouteRecord(operations.groups, params, 'id');
  const [query, setQuery] = usePageState('query', ''),
    [status, setStatus] = usePageState('status', 'Tümü'),
    [editing, setEditing] = useState<LearningGroup | null>(
      create
        ? formRequest.requested
          ? formRequest.record
            ? groupDraft(formRequest.record)
            : null
          : groupDraft(blank)
        : params.has('edit')
          ? operations.groups.find((g) => g.id === detailId) || null
          : null,
    );
  const [groupType, setGroupType] = usePageState<string[]>('groupType', []),
    [educationType, setEducationType] = usePageState<string[]>('educationType', []),
    [dateRange, setDateRange] = usePageState('dateRange', { from: '', to: '' }),
    [privateGroup, setPrivateGroup] = usePageState('isPrivateGroup', 'all');
  const [teachers, setTeachers] = useQueryFilter<string[]>('teachers', [], {
      keys: ['teacher'],
      read: (query) =>
        query.getAll('teacher').flatMap((id) => {
          if (id === 'all') return [];
          return [
            id === 'unassigned'
              ? 'Atanmadı'
              : operations.teachers.find((t) => t.id === id)?.name || id,
          ];
        }),
      write: (query, values) => {
        if (!values.length) query.set('teacher', 'all');
        values.forEach((name) =>
          query.append(
            'teacher',
            name === 'Atanmadı'
              ? 'unassigned'
              : operations.teachers.find((t) => t.name === name)?.id || name,
          ),
        );
      },
    }),
    [levels, setLevels] = usePageState<string[]>('levels', []);
  const selected = operations.groups.find((g) => g.id === detailId),
    members = memberships.membersOf(selected?.id || '');
  const list = operations.groups.filter(
    (g) =>
      (status === 'Tümü' || g.status === status) &&
      (!teachers.length || teachers.includes(g.teacher || 'Atanmadı')) &&
      (!levels.length || levels.includes(g.level)) &&
      (!groupType.length || groupType.includes(g.groupType || 'IN_PERSON')) &&
      (!educationType.length || educationType.includes(g.educationType || 'GROUPS')) &&
      (!dateRange.from || (g.createdAt || '2026-09-01') >= dateRange.from) &&
      (!dateRange.to || (g.createdAt || '2026-09-01') <= dateRange.to) &&
      (privateGroup === 'all' ||
        (g.educationType === 'PRIVATE') === (privateGroup === 'private')) &&
      normalize(g.name + g.course + g.teacher).includes(normalize(query)),
  );
  const editRequest = params.get('edit') === '1';
  useEffect(() => {
    if (create) {
      setEditing(
        formRequest.requested
          ? formRequest.record
            ? groupDraft(formRequest.record)
            : null
          : groupDraft(blank),
      );
    } else if (editRequest && detailId) {
      const record = operations.groups.find((item) => item.id === detailId);
      if (record) setEditing(groupDraft(record));
    } else if (!create) setEditing(null);
  }, [editRequest, detailId, create, params.get('id')]);
  const closeEditor = () => {
    setEditing(null);
    if (params.has('edit'))
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          next.delete('edit');
          return next;
        },
        { replace: true },
      );
    if (create)
      navigate(
        formRequest.record
          ? `admin/groups/${encodeURIComponent(formRequest.record.id)}`
          : 'admin/groups',
      );
  };
  return (
    <>
      {create && formRequest.requested && !formRequest.record && (
        <p role="alert" className="field-error">
          Düzenlenecek grup bulunamadı. Listeye dönerek kayıt seçin.
        </p>
      )}
      {!detailId && (
        <>
          <PageHeading
            title="Gruplar"
            description="Doğru öğrenci, doğru grup. Eğitim sürecini birlikte planlayın."
          >
            <Button onClick={() => setEditing(groupDraft(blank))}>
              <Icon name="plus" />
              Yeni grup
            </Button>
          </PageHeading>
          <Metrics
            items={[
              {
                label: 'Aktif gruplar',
                value: operations.groups.filter((g) => g.status === 'Aktif').length,
              },
              {
                label: 'Gruba atanmış öğrenciler',
                value: state.students.filter((s) => memberships.groupsFor(s.id).length > 0).length,
                highlight: true,
              },
              {
                label: 'Planlanan gruplar',
                value: operations.groups.filter((g) => g.status === 'Planlandı').length,
              },
            ]}
          />
          <div className="module-toolbar">
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Grup, eğitim veya öğretmen ara"
            />
            <Tabs value={status} onValueChange={setStatus}>
              <TabsList>
                {['Tümü', 'Aktif', 'Planlandı', 'Tamamlandı', 'Pasif'].map((v) => (
                  <TabsTrigger key={v} value={v}>
                    {v}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <div className="module-toolbar secondary-filters">
            <MultiSelect
              label="Grup tipi"
              value={groupType}
              onChange={setGroupType}
              options={groupTypes.map(([value, label]) => ({ value, label }))}
            />
            <MultiSelect
              label="Eğitim tipi"
              value={educationType}
              onChange={setEducationType}
              options={educationTypes.map(([value, label]) => ({ value, label }))}
            />
            <div className="form-field choice-field">
              <UIFieldLabel htmlFor="groups-page-select-1">{'Özel ders grubu'}</UIFieldLabel>
              <UISelect
                name={undefined}
                value={privateGroup || undefined}
                onValueChange={setPrivateGroup}
              >
                <UISelectTrigger
                  id="groups-page-select-1"
                  className="filter-select"
                  aria-label={'Özel ders grubu'}
                >
                  <UISelectValue placeholder={'Seçin'} />
                </UISelectTrigger>
                <UISelectContent position="popper">
                  {(
                    [
                      { value: 'all', label: 'Tümü' },
                      { value: 'private', label: 'Özel ders' },
                      { value: 'nonPrivate', label: 'Diğer gruplar' },
                    ] as (string | { value: string; label: string })[]
                  ).map((option) => (
                    <UISelectItem
                      key={typeof option === 'string' ? option : option.value}
                      value={typeof option === 'string' ? option : option.value}
                    >
                      {typeof option === 'string' ? option : option.label}
                    </UISelectItem>
                  ))}
                </UISelectContent>
              </UISelect>
            </div>
            <DateRangeFilter {...dateRange} onChange={setDateRange} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery('');
                setStatus('Tümü');
                setTeachers([]);
                setLevels([]);
                setGroupType([]);
                setEducationType([]);
                setPrivateGroup('all');
                setDateRange({ from: '', to: '' });
              }}
            >
              Filtreleri sıfırla
            </Button>
          </div>
          <div className="module-toolbar secondary-filters">
            <MultiSelect
              label="Öğretmen"
              value={teachers}
              onChange={setTeachers}
              options={['Atanmadı', ...new Set(operations.teachers.map((t) => t.name))].map(
                (value) => ({ value, label: value }),
              )}
            />
            <MultiSelect
              label="Seviye"
              value={levels}
              onChange={setLevels}
              options={[
                ...new Set([
                  ...levelCatalog.map((level) => level.name),
                  ...operations.groups.map((group) => group.level),
                ]),
              ]
                .filter(Boolean)
                .map((value) => ({
                  value,
                  label: value,
                }))}
            />
          </div>
          <BreakdownChart
            title="Grup dolulukları"
            unit="öğrenci"
            items={list.map((g) => ({
              label: g.name,
              value: memberships.membersOf(g.id).length,
              max: g.capacity,
            }))}
          />
          <DataTable
            entityKind="groups"
            onOpen={(row, full, ordered) =>
              openEntity(
                { kind: 'groups', id: row.id },
                full,
                ordered.map((item) => ({ kind: 'groups', id: item.id })),
              )
            }
            data={list}
            getRowId={(g) => g.id}
            columns={[
              { accessorKey: 'name', header: 'Grup adı' },
              { accessorKey: 'teacher', header: 'Öğretmen' },
              {
                id: 'groupType',
                header: 'Grup tipi',
                accessorFn: (g) => labelFor(groupTypes, g.groupType || 'IN_PERSON'),
              },
              {
                id: 'educationType',
                header: 'Eğitim tipi',
                accessorFn: (g) => labelFor(educationTypes, g.educationType || 'GROUPS'),
              },
              { accessorKey: 'level', header: 'Seviye' },
              { accessorKey: 'room', header: 'Derslik' },
              {
                id: 'capacity',
                header: 'Doluluk',
                accessorFn: (g) => `${memberships.membersOf(g.id).length} / ${g.capacity}`,
              },
              {
                accessorKey: 'status',
                header: 'Durum',
                cell: ({ row }) => <StatusBadge>{row.original.status}</StatusBadge>,
              },
              {
                id: 'actions',
                header: 'İşlemler',
                cell: ({ row }) => (
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Grubu düzenle"
                      onClick={() => setEditing(groupDraft(row.original))}
                    >
                      <Icon name="pencil" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Grup detayları"
                      onClick={(e) =>
                        openEntity({ kind: 'groups', id: row.original.id }, e.detail > 1)
                      }
                    >
                      <Icon name="arrow-up-right" />
                    </Button>
                  </div>
                ),
              },
            ]}
            mobileCard={(g) => (
              <>
                <div className="flex justify-between">
                  <strong>{g.name}</strong>
                  <StatusBadge>{g.status}</StatusBadge>
                </div>
                <p>
                  {g.teacher} · {g.course}
                </p>
                <div className="mobile-record-meta">
                  <span>{g.room}</span>
                  <span>{g.level}</span>
                  <span>{g.schedule}</span>
                </div>
                <Button
                  variant="outline"
                  onClick={(e) => openEntity({ kind: 'groups', id: g.id }, e.detail > 1)}
                >
                  Grubu aç
                </Button>
              </>
            )}
          />
        </>
      )}
      {detailId && (
        <section className="entity-detail-page">
          <Button variant="ghost" asChild>
            <Link to="/admin/groups">← Listeye dön</Link>
          </Button>
          <PageHeading
            title={selected?.name || 'Kayıt bulunamadı'}
            description="Bilgiler, ilişkili kayıtlar ve işlemler."
          />
          {selected && (
            <>
              <GroupDetailNavigation id={selected.id} />
              <div className="group-detail-summary">
                <div>
                  <Icon name="calendar-days" />
                  <span>{selected.schedule || 'Program bekliyor'}</span>
                </div>
                <div>
                  <Icon name="map-pin" />
                  {selected.room}
                </div>
                <div>
                  <Icon name="users" />
                  {members.length} / {selected.capacity} öğrenci
                </div>
              </div>
              <GroupStudents groupId={selected.id} />
              <div className="form-actions">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigate(`admin/groups/${encodeURIComponent(selected.id)}/schedule`);
                  }}
                >
                  <Icon name="calendar-days" />
                  Ders programı
                </Button>
                <Button
                  onClick={() => {
                    setEditing(groupDraft(selected));
                  }}
                >
                  <Icon name="pencil" />
                  Grubu düzenle
                </Button>
              </div>
            </>
          )}
        </section>
      )}
      <Dialog
        open={!!editing}
        onOpenChange={(v) => {
          if (!v) closeEditor();
        }}
      >
        <DialogContent className={'jam-modal dialog-wide'}>
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Grubu düzenle' : 'Yeni grup'}</DialogTitle>
            <DialogDescription>
              {'Eğitim, öğretmen ve kapasite bilgilerini belirleyin.'}
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <form
              className="dialog-form"
              onSubmit={(e) => {
                e.preventDefault();
                const error = validateGroup(
                  editing,
                  memberships.membersOf(editing.id).length,
                  levelCatalog,
                  operations.groups.find((g) => g.id === editing.id),
                );
                if (error) {
                  toast.error(error);
                  return;
                }
                if (!operations.teachers.some((t) => t.id === editing.headTeacherId)) {
                  toast.error('Geçerli bir öğretmen seçin.');
                  return;
                }
                if (
                  operations.groups.some(
                    (g) =>
                      g.id !== editing.id &&
                      normalize(g.name.trim()) === normalize(editing.name.trim()),
                  )
                ) {
                  toast.error('Bu adla bir grup zaten var. Farklı bir grup adı girin.');
                  return;
                }
                const previous = operations.groups.find((g) => g.id === editing.id);
                const savedId = editing.id || crypto.randomUUID();
                save({
                  type: 'save',
                  collection: 'groups',
                  record: {
                    ...editing,
                    name: editing.name.trim(),
                    createdAt: editing.id ? editing.createdAt : localDate(),
                    id: savedId,
                  },
                });
                if (previous)
                  dispatch({
                    type: 'group/update',
                    id: previous.id,
                    previousName: previous.name,
                    name: editing.name.trim(),
                    course: editing.course,
                    teacher: editing.teacher,
                    room: editing.room,
                  });
                toast.success('Grup kaydedildi.');
                closeEditor();
                navigate(`admin/groups/${encodeURIComponent(savedId)}`);
              }}
            >
              <div className="dialog-form-body">
                <GroupFields value={editing} onChange={setEditing} teachers={operations.teachers} />
              </div>
              <DialogFooter className="form-actions">
                <Button type="button" variant="outline" onClick={closeEditor}>
                  Vazgeç
                </Button>
                <Button type="submit">
                  <Icon name="check" />
                  Grubu kaydet
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
