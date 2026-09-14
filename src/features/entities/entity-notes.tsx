import { useState } from 'react';
import { toast } from 'sonner';
import { useWorkspace } from '@/app/workspace-provider';
import { IconButton } from '@/components/shared/primitives';
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
import { usePageState } from '@/hooks/use-page-state';
import { noteFieldsIssue } from '@/features/education/group-notes-model';
import { normalize, fullDateTR } from '@/lib/format';

import type { EntityNote } from '@/features/entities/record-model';
export type { EntityNote } from '@/features/entities/record-model';
export function EntityNotes({
  targetType,
  targetId,
}: {
  targetType: EntityNote['targetType'];
  targetId: string;
}) {
  const { state, dispatch } = useWorkspace();
  const [query, setQuery] = usePageState(`notes:${targetType}:${targetId}:search`, '');
  const [editing, setEditing] = useState<EntityNote | null>(null),
    [view, setView] = useState<EntityNote | null>(null),
    [deleting, setDeleting] = useState<EntityNote | null>(null);
  const [error, setError] = useState(''),
    [discard, setDiscard] = useState(false);
  const all = state.entityNotes || [];
  const records = all.filter(
    (n) =>
      n.targetType === targetType &&
      n.targetId === targetId &&
      normalize(n.title + n.content).includes(normalize(query)),
  );
  const original = all.find((n) => n.id === editing?.id);
  const dirty =
    !!editing &&
    (editing.title !== (original?.title || '') || editing.content !== (original?.content || ''));
  const close = () => (dirty ? setDiscard(true) : setEditing(null));
  const actions = (n: EntityNote) => (
    <div className="table-actions">
      <IconButton icon="eye" label="Notu görüntüle" onClick={() => setView(n)} />
      <IconButton
        icon="pencil"
        label="Notu düzenle"
        onClick={() => {
          setError('');
          setEditing({ ...n });
        }}
      />
      <IconButton icon="trash2" label="Notu sil" onClick={() => setDeleting(n)} />
    </div>
  );
  return (
    <section className="entity-notes">
      <div className="module-toolbar">
        <h2 className="subsection-title">Notlar</h2>
        <Button
          onClick={() => {
            const now = new Date().toISOString();
            setError('');
            setEditing({
              id: crypto.randomUUID(),
              targetType,
              targetId,
              title: '',
              content: '',
              createdAt: now,
              updatedAt: now,
            });
          }}
        >
          Yeni not
        </Button>
      </div>
      <div className="module-toolbar">
        <SearchField value={query} onChange={setQuery} placeholder="Not başlığı veya içerik ara" />
      </div>
      <DataTable
        name={`notes:${targetType}:${targetId}`}
        data={records}
        getRowId={(n) => n.id}
        onOpen={(n) => setView(n)}
        columns={[
          { accessorKey: 'title', header: 'Başlık' },
          {
            accessorKey: 'content',
            header: 'İçerik',
            cell: ({ row }) => (
              <p className="line-clamp-2 max-w-md whitespace-pre-line">{row.original.content}</p>
            ),
          },
          {
            accessorKey: 'createdAt',
            header: 'Oluşturulma',
            cell: ({ row }) => fullDateTR(row.original.createdAt),
          },
          {
            accessorKey: 'updatedAt',
            header: 'Son düzenleme',
            cell: ({ row }) => fullDateTR(row.original.updatedAt),
          },
          { id: 'actions', header: 'İşlemler', cell: ({ row }) => actions(row.original) },
        ]}
        mobileCard={(n) => (
          <>
            <h3>{n.title}</h3>
            <p className="line-clamp-3 whitespace-pre-line">{n.content}</p>
            {actions(n)}
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
            <DialogTitle>{original ? 'Notu düzenle' : 'Yeni not'}</DialogTitle>
            <DialogDescription>Başlık ve takip notunu tamamlayın.</DialogDescription>
          </DialogHeader>
          {editing && (
            <form
              className="dialog-form"
              onSubmit={(e) => {
                e.preventDefault();
                const issue = noteFieldsIssue(editing);
                if (issue) {
                  setError(issue);
                  return;
                }
                if (original && original.updatedAt !== editing.updatedAt) {
                  setError('Not değişti. Güncel kaydı yeniden açın.');
                  return;
                }
                dispatch({
                  type: 'entity-note/save',
                  expectedUpdatedAt: original ? editing.updatedAt : undefined,
                  note: {
                    ...editing,
                    title: editing.title.trim(),
                    content: editing.content.trim(),
                    updatedAt: new Date().toISOString(),
                  },
                });
                setEditing(null);
                toast.success('Not kaydedildi.');
              }}
            >
              <div className="dialog-form-body">
                <div className="form-field">
                  <Label htmlFor="entity-note-title">Başlık *</Label>
                  <Input
                    id="entity-note-title"
                    placeholder="Notun konusu"
                    required
                    maxLength={255}
                    value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  />
                </div>
                <div className="form-field mt-5">
                  <Label htmlFor="entity-note-content">İçerik *</Label>
                  <Textarea
                    id="entity-note-content"
                    placeholder="Takip notlarını yazın"
                    required
                    maxLength={10000}
                    rows={8}
                    value={editing.content}
                    onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                  />
                </div>
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
                <Button type="submit">Kaydet</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={discard} onOpenChange={setDiscard}>
        <DialogContent className="jam-modal">
          <DialogHeader>
            <DialogTitle>Değişiklikler kaydedilmedi</DialogTitle>
            <DialogDescription>
              Kaydetmeden kapatırsanız son düzenlemeler kaybolacak.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscard(false)}>
              Düzenlemeye dön
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDiscard(false);
                setEditing(null);
              }}
            >
              Kaydetmeden kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!view}
        onOpenChange={(o) => {
          if (!o) setView(null);
        }}
      >
        <DialogContent className="jam-modal">
          <DialogHeader>
            <DialogTitle>{view?.title}</DialogTitle>
            <DialogDescription>{view && fullDateTR(view.updatedAt)}</DialogDescription>
          </DialogHeader>
          <div className="dialog-form-body whitespace-pre-wrap break-words">{view?.content}</div>
          <DialogFooter>
            <Button onClick={() => setView(null)}>Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!deleting}
        onOpenChange={(o) => {
          if (!o) setDeleting(null);
        }}
      >
        <DialogContent className="jam-modal">
          <DialogHeader>
            <DialogTitle>Notu sil</DialogTitle>
            <DialogDescription>“{deleting?.title}” notu silinecek.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleting)
                  dispatch({
                    type: 'entity-note/delete',
                    expectedUpdatedAt: deleting.updatedAt,
                    id: deleting.id,
                    targetType,
                    targetId,
                  });
                setDeleting(null);
              }}
            >
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
