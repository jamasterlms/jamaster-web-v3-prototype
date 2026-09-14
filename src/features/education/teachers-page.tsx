import { BreakdownChart } from '@/components/shared/breakdown-chart';
import { TeacherPersonalPanel } from './teacher-personal';
import { TeacherDetailNavigation } from './detail-navigation';
import { formRouteRecord } from './form-route-model';
import { DialogFooter } from '@/components/ui/dialog';
import { useEntityNavigation } from '@/features/entities/use-entity-navigation';
import { Link, useSearchParams } from 'react-router-dom';
import { TeacherFields } from './teacher-fields';
import { eventDate, startOfWeek } from '@/lib/calendar';
import { normalizePhone, contactConflict } from '@/lib/validation';
import { useWorkspace } from '@/app/workspace-provider';
import { Metrics, SearchField } from '@/components/shared/feature-primitives';
import { Icon } from '@/components/shared/icon';
import { Avatar, EmptyState, PageHeading, StatusBadge } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { MultiSelect } from '@/components/ui/multi-select';

import type { Teacher } from '@/features/operations/model';
import { validateTeacher } from '@/features/operations/model';
import { useOperations } from '@/features/operations/operations-provider';
import { usePageState } from '@/hooks/use-page-state';
import { navigate } from '@/hooks/use-route';
import { normalize } from '@/lib/format';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
const blank: Teacher = {
  id: '',
  name: '',
  specialty: '',
  email: '',
  phone: '',
  weeklyHours: 0,
  status: 'Aktif',
};
export function TeachersPage({
  create = false,
  detailId,
}: {
  create?: boolean;
  detailId?: string;
}) {
  const openEntity = useEntityNavigation();
  const [params, setParams] = useSearchParams();
  const { operations, save } = useOperations(),
    { state, dispatch, openModal } = useWorkspace();
  const formRequest = formRouteRecord(operations.teachers, params, 'teacherId');
  const [query, setQuery] = usePageState('query', ''),
    [editing, setEditing] = useState<Teacher | null>(
      create
        ? formRequest.requested
          ? formRequest.record || null
          : { ...blank, phone: params.get('phoneNumber') || '' }
        : params.has('edit')
          ? operations.teachers.find((t) => t.id === detailId) || null
          : null,
    );
  const selected = operations.teachers.find((t) => t.id === detailId);
  const [statuses, setStatuses] = usePageState<string[]>('statuses', []);
  const [specialties, setSpecialties] = usePageState<string[]>('specialties', []);
  const week = startOfWeek();
  const workload = operations.teachers.map((t) => ({
    label: t.name,
    value: state.events
      .filter(
        (e) => e.type !== 'meeting' && e.teacher === t.name && e.day >= week && e.day < week + 7,
      )
      .reduce((sum, e) => sum + e.duration / 60, 0),
  }));
  const editRequest = params.get('edit') === '1';
  useEffect(() => {
    if (create) {
      setEditing(
        formRequest.requested
          ? formRequest.record || null
          : { ...blank, phone: params.get('phoneNumber') || '' },
      );
    } else if (editRequest && detailId) {
      const record = operations.teachers.find((item) => item.id === detailId);
      if (record) setEditing({ ...record });
    } else if (!create) setEditing(null);
  }, [editRequest, detailId, create, params.get('teacherId'), params.get('phoneNumber')]);
  const close = () => {
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
          ? `admin/teachers/${encodeURIComponent(formRequest.record.id)}`
          : 'admin/teachers',
      );
  };
  return (
    <>
      {create && formRequest.requested && !formRequest.record && (
        <p role="alert" className="field-error">
          Düzenlenecek öğretmen bulunamadı. Listeye dönerek kayıt seçin.
        </p>
      )}
      {!detailId && (
        <>
          <PageHeading
            title="Öğretmenler"
            description="Eğitmen kadronuz, uzmanlıkları ve ders yükleri."
          >
            <Button onClick={() => setEditing({ ...blank })}>
              <Icon name="plus" />
              Öğretmen ekle
            </Button>
          </PageHeading>
          <Metrics
            items={[
              { label: 'Eğitmen kadrosu', value: operations.teachers.length },
              {
                label: 'Aktif öğretmen',
                value: operations.teachers.filter((t) => t.status === 'Aktif').length,
                highlight: true,
              },
              {
                label: 'Haftalık ders',
                value: `${workload.reduce((n, t) => n + t.value, 0).toLocaleString('tr-TR')} saat`,
              },
            ]}
          />
          <div className="module-toolbar">
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Öğretmen adı veya uzmanlık ara"
            />
          </div>
          <div className="module-toolbar">
            <MultiSelect
              label="Durum"
              value={statuses}
              onChange={setStatuses}
              options={['Aktif', 'Pasif', 'İzinli'].map((value) => ({ value, label: value }))}
            />
            {(query || statuses.length > 0 || specialties.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery('');
                  setStatuses([]);
                  setSpecialties([]);
                }}
              >
                Sıfırla
              </Button>
            )}
          </div>
          <div className="module-toolbar secondary-filters">
            <MultiSelect
              label="Uzmanlık"
              value={specialties}
              onChange={setSpecialties}
              options={[
                ...new Set(operations.teachers.map((t) => t.specialty || 'Belirtilmedi')),
              ].map((value) => ({ value, label: value }))}
            />
          </div>
          <BreakdownChart title="Bu haftanın planlanan ders yükü" unit="saat" items={workload} />
          <DataTable
            entityKind="teachers"
            onOpen={(row, full, ordered) =>
              openEntity(
                { kind: 'teachers', id: row.id },
                full,
                ordered.map((item) => ({ kind: 'teachers', id: item.id })),
              )
            }
            data={operations.teachers.filter(
              (t) =>
                normalize(t.name + t.specialty + t.email + t.phone).includes(normalize(query)) &&
                (!statuses.length || statuses.includes(t.status)) &&
                (!specialties.length || specialties.includes(t.specialty || 'Belirtilmedi')),
            )}
            getRowId={(t) => t.id}
            columns={[
              {
                accessorKey: 'name',
                header: 'Öğretmen',
                cell: ({ row }) => (
                  <div className="card-person">
                    <Avatar name={row.original.name} src={row.original.image} />
                    <strong>{row.original.name}</strong>
                  </div>
                ),
              },
              { accessorKey: 'email', header: 'E-posta' },
              { accessorKey: 'phone', header: 'Telefon' },
              { accessorKey: 'specialty', header: 'Uzmanlık' },
              { accessorKey: 'weeklyHours', header: 'Haftalık ders' },
              {
                accessorKey: 'status',
                header: 'Durum',
                cell: ({ row }) => <StatusBadge>{row.original.status}</StatusBadge>,
              },
              {
                id: 'actions',
                header: 'İşlemler',
                cell: ({ row }) => (
                  <Button
                    onClick={(e) =>
                      openEntity({ kind: 'teachers', id: row.original.id }, e.detail > 1)
                    }
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
            mobileCard={(t) => (
              <>
                <div className="card-person">
                  <Avatar name={t.name} src={t.image} />
                  <div>
                    <strong>{t.name}</strong>
                    <p>{t.specialty}</p>
                  </div>
                </div>
                <div className="mobile-record-meta">
                  <span>{t.phone}</span>
                  <StatusBadge>{t.status}</StatusBadge>
                </div>
                <Button
                  variant="outline"
                  onClick={(e) => openEntity({ kind: 'teachers', id: t.id }, e.detail > 1)}
                >
                  Profili aç
                </Button>
              </>
            )}
          />
        </>
      )}
      {detailId && (
        <section className="entity-detail-page">
          <Button variant="ghost" asChild>
            <Link to="/admin/teachers">← Listeye dön</Link>
          </Button>
          <PageHeading
            title={selected?.name || 'Kayıt bulunamadı'}
            description="Bilgiler, ilişkili kayıtlar ve işlemler."
          />
          {selected && (
            <>
              <TeacherDetailNavigation id={selected.id} />
              <TeacherPersonalPanel teacher={selected} />
              <div className="detail-grid">
                <div>
                  <small>E-posta</small>
                  <a href={`mailto:${selected.email}`}>{selected.email}</a>
                </div>
                <div>
                  <small>Telefon</small>
                  <a href={`tel:${selected.phone}`}>{selected.phone}</a>
                </div>
              </div>
              <h3 className="subsection-title">Ders programı</h3>
              <div className="member-list">
                {state.events
                  .filter((e) => e.teacher === selected.name)
                  .slice(0, 6)
                  .map((e) => (
                    <button
                      className="member-row"
                      key={e.id}
                      onClick={() => {
                        openModal({ type: 'event', id: e.id });
                      }}
                    >
                      <span className="lesson-date">
                        <b>{eventDate(e.day).getDate()}</b>
                        {eventDate(e.day).toLocaleDateString('tr-TR', { month: 'short' })}
                      </span>
                      <div>
                        <strong>{e.title}</strong>
                        <small>
                          {e.room} · {e.duration} dakika
                        </small>
                      </div>
                      <span className="ml-auto">{e.time}</span>
                      <Icon name="arrow-up-right" />
                    </button>
                  ))}
                {!state.events.some((e) => e.teacher === selected.name) && (
                  <EmptyState text="Planlanmış ders bulunmuyor." />
                )}
              </div>
              <div className="form-actions">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigate(
                      `admin/teachers/${encodeURIComponent(selected.id)}/history?tab=schedule`,
                    );
                  }}
                >
                  Takvimi aç
                </Button>
                <Button
                  onClick={() => {
                    setEditing({ ...selected });
                  }}
                >
                  <Icon name="pencil" />
                  Bilgileri düzenle
                </Button>
              </div>
            </>
          )}
        </section>
      )}
      <Dialog
        open={!!editing}
        onOpenChange={(v) => {
          if (!v) close();
        }}
      >
        <DialogContent preventOutsideClose className={'jam-modal dialog-wide'}>
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Öğretmeni düzenle' : 'Öğretmen ekle'}</DialogTitle>
            <DialogDescription className="sr-only">
              {editing?.id ? 'Öğretmeni düzenle' : 'Öğretmen ekle'}
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <form
              className="dialog-form"
              onSubmit={(e) => {
                e.preventDefault();
                const normalized = {
                  ...editing,
                  name: editing.name.trim(),
                  email: editing.email.trim().toLowerCase(),
                  phone: normalizePhone(editing.phone),
                };
                const error =
                  validateTeacher(normalized) ||
                  (contactConflict(operations.teachers, normalized, editing.id)
                    ? 'Bu telefon veya e-posta ile bir öğretmen zaten kayıtlı.'
                    : null);
                if (error) {
                  toast.error(error);
                  return;
                }
                const savedId = editing.id || crypto.randomUUID();
                save({
                  type: 'save',
                  collection: 'teachers',
                  record: { ...normalized, id: savedId },
                });
                const old = operations.teachers.find((t) => t.id === editing.id);
                if (old && old.name !== normalized.name)
                  dispatch({ type: 'teacher/rename', previous: old.name, name: normalized.name });
                if (old && old.name !== normalized.name)
                  operations.groups
                    .filter((g) => g.headTeacherId === old.id)
                    .forEach((g) =>
                      save({
                        type: 'save',
                        collection: 'groups',
                        record: { ...g, teacher: normalized.name },
                      }),
                    );
                toast.success('Öğretmen bilgileri kaydedildi.');
                close();
                navigate(`admin/teachers/${encodeURIComponent(savedId)}`);
              }}
            >
              <div className="dialog-form-body">
                <TeacherFields value={editing} onChange={setEditing} />
              </div>
              <DialogFooter className="form-actions">
                <Button type="button" variant="outline" onClick={close}>
                  Vazgeç
                </Button>
                <Button type="submit">Kaydet</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
