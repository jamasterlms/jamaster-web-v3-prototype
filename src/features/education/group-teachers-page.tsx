import { Icon } from '@/components/shared/icon';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useWorkspace } from '@/app/workspace-provider';
import { useOperations } from '@/features/operations/operations-provider';
import { useEntityNavigation } from '@/features/entities/use-entity-navigation';
import { PageHeading, StatusBadge } from '@/components/shared/primitives';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { usePageState } from '@/hooks/use-page-state';
import { normalize, fullDateTR } from '@/lib/format';
import { localDate } from '@/lib/validation';
import { GroupDetailNavigation } from './detail-navigation';
import {
  groupTeacherIssue,
  groupTeacherRows,
  isHeadTeacher,
  type GroupTeacherAssignment,
} from './group-teacher-model';

function AssignmentDialog({
  groupId,
  previous,
  onClose,
}: {
  groupId: string;
  previous?: GroupTeacherAssignment;
  onClose: () => void;
}) {
  const { state } = useWorkspace();
  const { operations, save } = useOperations();
  const [draft, setDraft] = useState<GroupTeacherAssignment>(() =>
    previous
      ? { ...previous }
      : { id: crypto.randomUUID(), groupId, teacherId: '', startDate: localDate(), isActive: true },
  );
  const [error, setError] = useState('');
  const rows = groupTeacherRows(operations, groupId);
  const teacher = operations.teachers.find((t) => t.id === draft.teacherId);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="jam-modal" preventOutsideClose>
        <DialogHeader>
          <DialogTitle>
            {previous ? 'Öğretmen atamasını düzenle' : 'Gruba öğretmen ekle'}
          </DialogTitle>
          <DialogDescription>
            {previous
              ? 'Atamanın unvanını, durumunu ve bitiş tarihini güncelleyin.'
              : 'Öğretmeni ve grupta göreve başlayacağı tarihi seçin.'}
          </DialogDescription>
        </DialogHeader>
        <form
          className="dialog-form"
          onSubmit={(event) => {
            event.preventDefault();
            const issue = !state.branch ? 'Önce şube seçin.' : groupTeacherIssue(operations, draft);
            if (issue) {
              setError(issue);
              return;
            }
            const now = new Date().toISOString();
            save({
              type: 'save',
              collection: 'groupTeacherAssignments',
              record: {
                ...draft,
                title: draft.title?.trim() || undefined,
                endDate: draft.endDate || undefined,
                createdAt: previous?.createdAt || now,
                updatedAt: now,
              },
            });
            toast.success('Öğretmen ataması kaydedildi.');
            onClose();
          }}
        >
          <div className="dialog-form-body">
            {previous ? (
              <div className="form-section">
                <h3 className="font-medium">{teacher?.name || 'Öğretmen bulunamadı'}</h3>
                <p className="muted">Başlangıç: {fullDateTR(previous.startDate)}</p>
              </div>
            ) : (
              <fieldset className="form-section" data-form-section="required">
                <legend>
                  Atama bilgileri <span>Zorunlu</span>
                </legend>
                <div className="form-field">
                  <Label htmlFor="assignment-teacher">Öğretmen *</Label>
                  <Select
                    required
                    value={draft.teacherId || undefined}
                    onValueChange={(teacherId) => setDraft((d) => ({ ...d, teacherId }))}
                  >
                    <SelectTrigger id="assignment-teacher">
                      <SelectValue placeholder="Öğretmen seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {operations.teachers
                        .filter((t) => !rows.some((a) => a.teacherId === t.id))
                        .map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} · {t.email}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="form-field">
                  <Label htmlFor="assignment-start">Başlangıç tarihi *</Label>
                  <Input
                    id="assignment-start"
                    type="date"
                    required
                    placeholder="Gün / ay / yıl"
                    value={draft.startDate || ''}
                    onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))}
                  />
                </div>
              </fieldset>
            )}
            <fieldset className="form-section form-section-optional" data-form-section="optional">
              <legend>
                Görev ayrıntıları <span>İsteğe bağlı</span>
              </legend>
              <div className="form-field">
                <Label htmlFor="assignment-title">Unvan</Label>
                <Input
                  id="assignment-title"
                  value={draft.title || ''}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  placeholder="Konuşma eğitmeni, yardımcı öğretmen…"
                  maxLength={160}
                />
              </div>
              <div className="form-field">
                <Label htmlFor="assignment-end">Bitiş tarihi</Label>
                <Input
                  id="assignment-end"
                  type="date"
                  min={draft.startDate?.slice(0, 10)}
                  placeholder="Gün / ay / yıl"
                  value={draft.endDate?.slice(0, 10) || ''}
                  onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))}
                />
              </div>
              {previous && (
                <div className="flex items-center gap-3">
                  <Switch
                    id="assignment-active"
                    checked={draft.isActive}
                    onCheckedChange={(isActive) => setDraft((d) => ({ ...d, isActive }))}
                  />
                  <Label htmlFor="assignment-active">Aktif atama</Label>
                </div>
              )}
            </fieldset>
            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={!state.branch || !draft.teacherId}>
              Atamayı kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function GroupTeachersPage({ groupId }: { groupId: string }) {
  const { operations } = useOperations();
  const openEntity = useEntityNavigation();
  const [query, setQuery] = usePageState('group-teachers-query', '');
  const [status, setStatus] = usePageState('group-teachers-status', 'all');
  const [editing, setEditing] = useState<{ previous?: GroupTeacherAssignment } | null>(null);
  const group = operations.groups.find((g) => g.id === groupId);
  const identity = (row: GroupTeacherAssignment) =>
    operations.teachers.find((t) => t.id === row.teacherId);
  const rows = groupTeacherRows(operations, groupId).filter(
    (a) =>
      (status === 'all' || (status === 'active') === a.isActive) &&
      normalize(`${identity(a)?.name || ''} ${identity(a)?.email || ''} ${a.title || ''}`).includes(
        normalize(query),
      ),
  );
  const actions = (row: GroupTeacherAssignment) => (
    <div className="flex flex-wrap gap-1">
      <Button
        disabled={!identity(row)}
        onClick={(e) => openEntity({ kind: 'teachers', id: row.teacherId }, e.detail > 1)}
        variant="ghost"
        size="icon"
        aria-label="Profili aç"
        title="Profili aç"
      >
        <Icon name="arrow-up-right" />
      </Button>
      {!isHeadTeacher(row) && (
        <Button
          onClick={() => setEditing({ previous: row })}
          variant="ghost"
          size="icon"
          aria-label="Düzenle"
          title="Düzenle"
        >
          <Icon name="pencil" />
        </Button>
      )}
    </div>
  );
  return (
    <>
      <Button variant="ghost" asChild>
        <Link to="/admin/groups">← Gruplara dön</Link>
      </Button>
      <PageHeading
        title={group?.name || 'Grup bulunamadı'}
        description="Grubun öğretmenleri ve görev tarihleri."
      >
        {group && <Button onClick={() => setEditing({})}>Öğretmen ekle</Button>}
      </PageHeading>
      {group && (
        <>
          <GroupDetailNavigation id={groupId} />
          {!group.headTeacherId && group.teacher && (
            <p className="pending-banner">
              “{group.teacher}” sınıf öğretmeni kaydı eşleştirilemedi. Grup bilgilerini düzenleyerek
              öğretmeni seçin.
            </p>
          )}
          <div className="module-toolbar">
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Öğretmen, e-posta veya unvan ara"
            />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="filter-select" aria-label="Atama durumu">
                <SelectValue placeholder="Atama durumu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm atamalar</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="passive">Pasif</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DataTable
            name={`group-${groupId}-teachers`}
            data={rows}
            getRowId={(a) => a.id}
            onOpen={(a, full) => {
              if (identity(a)) openEntity({ kind: 'teachers', id: a.teacherId }, full);
            }}
            columns={[
              {
                id: 'name',
                header: 'Öğretmen',
                accessorFn: (a) => identity(a)?.name || `Öğretmen ${a.teacherId}`,
              },
              { id: 'email', header: 'E-posta', accessorFn: (a) => identity(a)?.email || '—' },
              {
                id: 'title',
                header: 'Unvan',
                accessorFn: (a) => a.title || 'Belirtilmedi',
                cell: ({ row }) =>
                  isHeadTeacher(row.original) ? (
                    <StatusBadge>Sınıf Öğretmeni</StatusBadge>
                  ) : (
                    row.original.title || 'Belirtilmedi'
                  ),
              },
              {
                accessorKey: 'startDate',
                header: 'Başlangıç',
                cell: ({ row }) => fullDateTR(row.original.startDate),
              },
              {
                accessorKey: 'endDate',
                header: 'Bitiş',
                cell: ({ row }) => fullDateTR(row.original.endDate),
              },
              {
                id: 'status',
                header: 'Durum',
                accessorFn: (a) => (a.isActive ? 'Aktif' : 'Pasif'),
                cell: ({ row }) => (
                  <StatusBadge>{row.original.isActive ? 'Aktif' : 'Pasif'}</StatusBadge>
                ),
              },
              { id: 'actions', header: 'İşlemler', cell: ({ row }) => actions(row.original) },
            ]}
            mobileCard={(a) => (
              <>
                <strong>{identity(a)?.name || 'Öğretmen bulunamadı'}</strong>
                <p className="muted">{a.title || 'Unvan belirtilmedi'}</p>
                <div className="mobile-record-meta">
                  <span>
                    {fullDateTR(a.startDate)} – {fullDateTR(a.endDate)}
                  </span>
                  <StatusBadge>{a.isActive ? 'Aktif' : 'Pasif'}</StatusBadge>
                </div>
                {actions(a)}
              </>
            )}
          />
          <p className="muted text-sm mt-4">
            Sınıf öğretmeni grup bilgileri üzerinden değiştirilir.
          </p>
          {editing && (
            <AssignmentDialog
              groupId={groupId}
              previous={editing.previous}
              onClose={() => setEditing(null)}
            />
          )}
        </>
      )}
    </>
  );
}
