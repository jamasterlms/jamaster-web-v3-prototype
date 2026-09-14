import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useWorkspace } from '@/app/workspace-provider';
import { useOperations } from '@/features/operations/operations-provider';
import { Icon } from '@/components/shared/icon';
import { IconButton, PageHeading } from '@/components/shared/primitives';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useQueryFilter } from '@/hooks/use-query-filter';
import { GroupDetailNavigation } from './detail-navigation';
import {
  filterGroupNotes,
  noteFieldsIssue,
  noteSortOptions,
  saveGroupNote,
  type GroupNote,
} from './group-notes-model';

const noteDate = (value: string) =>
  new Date(value).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });

function NoteEditor({
  groupId,
  previous,
  onClose,
}: {
  groupId: string;
  previous?: GroupNote;
  onClose: () => void;
}) {
  const { state, dispatch } = useWorkspace();
  const { operations } = useOperations();
  const [draft, setDraft] = useState({
    title: previous?.title || '',
    content: previous?.content || '',
  });
  const [error, setError] = useState(''),
    [discard, setDiscard] = useState(false);
  const dirty =
    draft.title !== (previous?.title || '') || draft.content !== (previous?.content || '');
  const close = () => (dirty ? setDiscard(true) : onClose());
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="jam-modal" preventOutsideClose>
        <DialogHeader>
          <DialogTitle>
            {discard
              ? 'Değişiklikler kaydedilmedi'
              : previous
                ? 'Grup notunu düzenle'
                : 'Yeni grup notu'}
          </DialogTitle>
          <DialogDescription>
            {discard
              ? 'Kapatırsanız bu düzenlemeler kaybolacak.'
              : 'Gruba ait değerlendirmeleri ve takip notlarını kaydedin.'}
          </DialogDescription>
        </DialogHeader>
        {discard ? (
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscard(false)}>
              Düzenlemeye dön
            </Button>
            <Button variant="destructive" onClick={onClose}>
              Kaydetmeden kapat
            </Button>
          </DialogFooter>
        ) : (
          <form
            className="dialog-form"
            onSubmit={(e) => {
              e.preventDefault();
              const issue = noteFieldsIssue(draft);
              if (issue) {
                setError(issue);
                return;
              }
              if (!operations.groups.some((g) => g.id === groupId)) {
                setError('Grup artık mevcut değil.');
                return;
              }
              const now = new Date().toISOString();
              const note: GroupNote = {
                ...previous,
                ...draft,
                id: previous?.id || crypto.randomUUID(),
                targetId: groupId,
                targetType: 'group',
                createdAt: previous?.createdAt || now,
                updatedAt: now,
              };
              const result = saveGroupNote(state.groupNotes || [], note, previous?.updatedAt);
              if (result.error) {
                setError(result.error);
                return;
              }
              dispatch({ type: 'group-note/save', note, expectedUpdatedAt: previous?.updatedAt });
              toast.success(previous ? 'Not güncellendi.' : 'Not kaydedildi.');
              onClose();
            }}
          >
            <div className="dialog-form-body">
              <fieldset className="form-section" data-form-section="required">
                <legend>
                  Not bilgileri <span>Zorunlu</span>
                </legend>
                <div className="form-field">
                  <Label htmlFor="group-note-title">Başlık *</Label>
                  <Input
                    id="group-note-title"
                    placeholder="Notun konusunu yazın"
                    value={draft.title}
                    maxLength={255}
                    required
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <Label htmlFor="group-note-content">İçerik *</Label>
                  <Textarea
                    id="group-note-content"
                    placeholder="Değerlendirmelerinizi ve takip edilecek konuları yazın"
                    value={draft.content}
                    rows={8}
                    maxLength={10000}
                    required
                    onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                    aria-describedby="group-note-count"
                  />
                  <span className="muted text-xs" id="group-note-count">
                    {draft.content.length.toLocaleString('tr-TR')} / 10.000 karakter
                  </span>
                </div>
              </fieldset>
              {error && (
                <p className="field-error mt-3" role="alert">
                  {error}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>
                Vazgeç
              </Button>
              <Button type="submit">{previous ? 'Değişiklikleri kaydet' : 'Notu kaydet'}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function GroupNotesPage({ groupId }: { groupId: string }) {
  const { state, dispatch } = useWorkspace(),
    { operations } = useOperations();
  const group = operations.groups.find((g) => g.id === groupId);
  const [filter, setFilter] = useQueryFilter(
    'group-notes-filter',
    { search: '', sort: 'createdAt:desc' },
    {
      keys: ['search', 'sortOrder'],
      read: (params) => ({
        search: params.get('search') || '',
        sort: params.get('sortOrder') || 'createdAt:desc',
      }),
      write: (params, value) => {
        params.set('search', value.search);
        params.set('sortOrder', value.sort);
      },
    },
  );
  const [editing, setEditing] = useState<{ previous?: GroupNote } | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null),
    [deleting, setDeleting] = useState<GroupNote | null>(null);
  const notes = filterGroupNotes(state.groupNotes || [], groupId, filter.search, filter.sort);
  const preview = (state.groupNotes || []).find(
    (n) => n.id === previewId && n.targetId === groupId,
  );
  const actions = (note: GroupNote) => (
    <div className="table-actions">
      <IconButton
        icon="eye"
        label={`${note.title} notunu görüntüle`}
        onClick={() => setPreviewId(note.id)}
      />
      <IconButton
        icon="pencil"
        label={`${note.title} notunu düzenle`}
        onClick={() => setEditing({ previous: note })}
      />
      <IconButton
        icon="trash2"
        label={`${note.title} notunu sil`}
        onClick={() => setDeleting(note)}
      />
    </div>
  );
  return (
    <>
      <Button variant="ghost" asChild>
        <Link to="/admin/groups">
          <Icon name="arrow-left" />
          Gruplara dön
        </Link>
      </Button>
      <PageHeading
        title={group ? `${group.name} · Notlar` : 'Grup bulunamadı'}
        description="Grubun değerlendirmeleri ve takip notları."
      >
        {group && (
          <Button onClick={() => setEditing({})}>
            <Icon name="plus" />
            Yeni not
          </Button>
        )}
      </PageHeading>
      {group && (
        <>
          <GroupDetailNavigation id={groupId} />
          <div className="module-toolbar">
            <SearchField
              value={filter.search}
              onChange={(search) => setFilter({ ...filter, search })}
              placeholder="Not başlığı veya içerik ara"
            />
            <Select value={filter.sort} onValueChange={(sort) => setFilter({ ...filter, sort })}>
              <SelectTrigger className="filter-select" aria-label="Notları sırala">
                <SelectValue placeholder="Sıralama seçin" />
              </SelectTrigger>
              <SelectContent>
                {noteSortOptions.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DataTable
            name={`group-${groupId}-notes`}
            manualSorting
            data={notes}
            getRowId={(n) => n.id}
            onOpen={(note) => setPreviewId(note.id)}
            columns={[
              { accessorKey: 'title', header: 'Başlık', enableSorting: false },
              {
                accessorKey: 'content',
                header: 'İçerik',
                enableSorting: false,
                cell: ({ row }) => (
                  <p className="line-clamp-2 max-w-md whitespace-pre-line">
                    {row.original.content}
                  </p>
                ),
              },
              {
                accessorKey: 'createdAt',
                header: 'Oluşturulma',
                enableSorting: false,
                cell: ({ row }) => noteDate(row.original.createdAt),
              },
              {
                accessorKey: 'updatedAt',
                header: 'Son düzenleme',
                enableSorting: false,
                cell: ({ row }) =>
                  row.original.createdAt === row.original.updatedAt
                    ? '—'
                    : noteDate(row.original.updatedAt),
              },
              {
                id: 'actions',
                header: 'İşlemler',
                enableSorting: false,
                enableHiding: false,
                cell: ({ row }) => actions(row.original),
              },
            ]}
            mobileCard={(note) => (
              <>
                <h3>{note.title}</h3>
                <p className="line-clamp-3 whitespace-pre-line text-sm muted">{note.content}</p>
                <p className="muted text-xs">{noteDate(note.updatedAt)}</p>
                {actions(note)}
              </>
            )}
          />
        </>
      )}
      {group && editing && (
        <NoteEditor
          groupId={groupId}
          previous={editing.previous}
          onClose={() => setEditing(null)}
        />
      )}
      <Dialog
        open={!!preview}
        onOpenChange={(open) => {
          if (!open) setPreviewId(null);
        }}
      >
        <DialogContent className="jam-modal">
          <DialogHeader>
            <DialogTitle>{preview?.title}</DialogTitle>
            <DialogDescription>
              {preview && noteDate(preview.updatedAt)} · Grup notu
            </DialogDescription>
          </DialogHeader>
          <div className="dialog-form-body">
            <p className="whitespace-pre-wrap break-words leading-relaxed">{preview?.content}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewId(null)}>
              Kapat
            </Button>
            <Button
              onClick={() => {
                if (preview) {
                  setEditing({ previous: preview });
                  setPreviewId(null);
                }
              }}
            >
              <Icon name="pencil" />
              Düzenle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <DialogContent className="jam-modal" preventOutsideClose>
          <DialogHeader>
            <DialogTitle>Grup notunu sil</DialogTitle>
            <DialogDescription>
              “{deleting?.title}” notu silinecek. Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleting) return;
                if (
                  !(state.groupNotes || []).some(
                    (n) =>
                      n.id === deleting.id &&
                      n.updatedAt === deleting.updatedAt &&
                      n.targetId === groupId,
                  )
                ) {
                  toast.error('Not değiştirildi veya silindi. Güncel notu yeniden açın.');
                  setDeleting(null);
                  return;
                }
                dispatch({
                  type: 'group-note/delete',
                  groupId,
                  id: deleting.id,
                  expectedUpdatedAt: deleting.updatedAt,
                });
                setDeleting(null);
                toast.success('Not silindi.');
              }}
            >
              Notu sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
