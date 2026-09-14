import { useOperations } from '@/features/operations/operations-provider';
import { toast } from 'sonner';
import { useState } from 'react';
import { useWorkspace } from '@/app/workspace-provider';
import type { LearningGroup } from '@/features/operations/model';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  announcements,
  visibleAnnouncements,
  prepareAnnouncement,
  normalizeAnnouncementTargets,
  type Announcement,
} from '@/features/administration/announcement-model';
export function PortalAnnouncements({
  teacher,
  groups,
  authorId,
}: {
  teacher: boolean;
  groups: LearningGroup[];
  authorId: string;
}) {
  const { state, dispatch } = useWorkspace();
  const { operations } = useOperations();
  const [open, setOpen] = useState(false),
    [title, setTitle] = useState(''),
    [body, setBody] = useState(''),
    [audience, setAudience] = useState(groups[0]?.id || '');
  const [editingId, setEditingId] = useState(''),
    [drafts, setDrafts] = useState(false);
  const all = readPortalAnnouncements(state.settings, operations.groups);
  const ownDrafts = all.filter(
    (a) =>
      a.status === 'Taslak' && a.authorId === authorId && groups.some((g) => g.id === a.groupId),
  );
  const rows =
    teacher && drafts
      ? ownDrafts
      : visibleAnnouncements(all, groups, teacher ? 'teacher' : 'student');
  return (
    <>
      {teacher && (
        <div className="quick-actions mb-5">
          <Button variant={drafts ? 'ghost' : 'secondary'} onClick={() => setDrafts(false)}>
            Yayındakiler
          </Button>
          <Button variant={drafts ? 'secondary' : 'ghost'} onClick={() => setDrafts(true)}>
            Taslaklar {ownDrafts.length}
          </Button>
          <Button
            disabled={!groups.length}
            onClick={() => {
              setEditingId('');
              setTitle('');
              setBody('');
              setAudience(groups[0]?.id || '');
              setOpen(true);
            }}
          >
            Yeni duyuru
          </Button>
        </div>
      )}
      <div className="announcement-grid">
        {rows.map((a) => (
          <Card className="portal-section" key={a.id}>
            <span className="eyebrow">{a.audience}</span>
            <h2>{a.title || 'Başlıksız duyuru'}</h2>
            <p className="whitespace-pre-wrap break-words">{a.body}</p>
            {teacher && drafts && (
              <Button
                variant="ghost"
                onClick={() => {
                  setEditingId(a.id);
                  setTitle(a.title);
                  setBody(a.body);
                  setAudience(a.groupId || '');
                  setOpen(true);
                }}
              >
                Taslağı düzenle
              </Button>
            )}
          </Card>
        ))}
      </div>
      {!rows.length && (
        <p className="empty-inline">
          {teacher && drafts
            ? 'Henüz duyuru taslağınız yok.'
            : 'Bu dersler için yayımlanmış duyuru bulunmuyor.'}
        </p>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="jam-modal">
          <DialogHeader>
            <DialogTitle>Grup duyurusu</DialogTitle>
            <DialogDescription>
              Duyuru seçtiğiniz grubun öğrenci portalında görünür.
            </DialogDescription>
          </DialogHeader>
          <form
            className="dialog-form"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              const group = groups.find((g) => g.id === audience);
              if (!group) {
                toast.error('Grup seçin.');
                return;
              }
              const status =
                (e.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'draft'
                  ? 'Taslak'
                  : 'Yayında';
              let record: Announcement;
              try {
                record = prepareAnnouncement(
                  {
                    id: editingId || crypto.randomUUID(),
                    title,
                    body,
                    audience: group.name,
                    groupId: group.id,
                    authorId,
                    status,
                  },
                  status,
                  new Date().toISOString(),
                );
              } catch (failure) {
                toast.error((failure as Error).message);
                return;
              }
              dispatch({
                type: 'settings/save',
                values: {
                  'announcements-v3': JSON.stringify(
                    editingId
                      ? all.map((a) => (a.id === editingId && a.authorId === authorId ? record : a))
                      : [record, ...all],
                  ),
                },
              });
              setDrafts(status === 'Taslak');
              toast.success(
                status === 'Taslak' ? 'Duyuru taslağı kaydedildi.' : 'Duyuru yayımlandı.',
              );
              setOpen(false);
              setTitle('');
              setBody('');
            }}
          >
            <div className="dialog-form-body">
              <div className="form-field">
                <Label htmlFor="portal-announcement-title">Başlık *</Label>
                <Input
                  id="portal-announcement-title"
                  placeholder="Duyuru başlığı"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={160}
                  required
                />
              </div>
              <div className="form-field">
                <Label htmlFor="portal-announcement-group">Grup *</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger id="portal-announcement-group">
                    <SelectValue placeholder="Grup seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="form-field">
                <Label htmlFor="portal-announcement-body">İçerik *</Label>
                <Textarea
                  id="portal-announcement-body"
                  placeholder="Öğrencilerinize duyurmak istediğiniz konu"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={5000}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                Vazgeç
              </Button>
              <Button type="submit" variant="outline" value="draft">
                Taslak olarak kaydet
              </Button>
              <Button type="submit" value="publish">
                Yayımla
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function readPortalAnnouncements(settings: Record<string, string>, groups: LearningGroup[]) {
  try {
    const saved = JSON.parse(settings['announcements-v3'] || 'null');
    if (Array.isArray(saved)) return normalizeAnnouncementTargets(saved, groups);
  } catch {
    /* Keep the bundled records when local storage is malformed. */
  }
  return announcements;
}
