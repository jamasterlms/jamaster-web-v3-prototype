import { useState } from 'react';
import { useWorkspace } from '@/app/workspace-provider';
import { useOperations } from '@/features/operations/operations-provider';
import { PageHeading, StatusBadge, EmptyState, IconButton } from '@/components/shared/primitives';
import { SearchField } from '@/components/shared/feature-primitives';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Icon } from '@/components/shared/icon';
import { toast } from 'sonner';
import { normalize } from '@/lib/format';
import {
  announcements,
  prepareAnnouncement,
  normalizeAnnouncementTargets,
  type Announcement,
} from './announcement-model';

export function AnnouncementsPage() {
  const { state, dispatch } = useWorkspace();
  const { operations } = useOperations();
  const [filter, setFilter] = useState('all'),
    [query, setQuery] = useState('');
  const [audience, setAudience] = useState('all');
  const [editing, setEditing] = useState<Announcement | null>(null),
    [preview, setPreview] = useState<Announcement | null>(null);
  const [error, setError] = useState('');
  let records = announcements;
  try {
    const saved = JSON.parse(state.settings['announcements-v3'] || 'null');
    if (Array.isArray(saved)) records = saved;
  } catch {
    /* Use initial records. */
  }
  records = normalizeAnnouncementTargets(records, operations.groups);
  const audiences = [
    ...new Set([
      'Tüm öğrenciler',
      'Öğretmenler',
      'Tüm ekip',
      'B1 ve üzeri',
      ...records.map((r) => r.audience),
    ]),
  ];
  const filtered = records.filter(
    (r) =>
      (filter === 'all' || r.status === filter) &&
      (audience === 'all' || r.audience === audience) &&
      normalize(r.title + ' ' + r.body).includes(normalize(query)),
  );
  const edit = (record: Announcement) => {
    setError('');
    setEditing({ ...record });
  };
  const persist = (record: Announcement, status: 'Taslak' | 'Yayında') => {
    try {
      if (
        status === 'Yayında' &&
        record.groupId &&
        !operations.groups.some((g) => g.id === record.groupId)
      )
        throw new Error('Duyurunun grubu bulunamadı. Hedef kitleyi yeniden seçin.');
      const next = prepareAnnouncement(
        { ...record, id: record.id || crypto.randomUUID() },
        status,
        new Date().toISOString(),
      );
      const rows = records.some((r) => r.id === next.id)
        ? records.map((r) => (r.id === next.id ? next : r))
        : [next, ...records];
      dispatch({ type: 'settings/save', values: { 'announcements-v3': JSON.stringify(rows) } });
      setEditing(null);
      setPreview(null);
      setFilter(status);
      toast.success(status === 'Taslak' ? 'Duyuru taslağı kaydedildi.' : 'Duyuru yayımlandı.');
    } catch (failure) {
      setError((failure as Error).message);
    }
  };
  return (
    <>
      <PageHeading
        title="Duyurular"
        description="Şubenizin duyurularını hazırlayın, önizleyin ve yayımlayın."
      >
        <Button
          onClick={() =>
            edit({ id: '', title: '', body: '', audience: 'Tüm öğrenciler', status: 'Taslak' })
          }
        >
          <Icon name="plus" />
          Duyuru oluştur
        </Button>
      </PageHeading>
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="detail-view-tabs" aria-label="Duyuru durumu">
          {[
            ['all', 'Tümü'],
            ['Yayında', 'Yayındakiler'],
            ['Taslak', 'Taslaklar'],
          ].map(([value, label]) => (
            <TabsTrigger key={value} value={value}>
              {label}
              <span className="muted">
                {records.filter((r) => value === 'all' || r.status === value).length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="module-toolbar announcement-filters">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Duyuru başlığı veya içerik ara"
        />
        <Select value={audience} onValueChange={setAudience}>
          <SelectTrigger aria-label="Hedef kitle filtresi">
            <SelectValue placeholder="Hedef kitle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm hedef kitleler</SelectItem>
            {audiences.map((label) => (
              <SelectItem key={label} value={label}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="announcement-grid">
        {filtered.map((record) => (
          <article className="announcement-card" key={record.id}>
            <div className="flex justify-between items-center">
              <span className="course-symbol tone-0">
                <Icon name="megaphone" />
              </span>
              <StatusBadge>{record.status}</StatusBadge>
            </div>
            <span className="eyebrow">{record.audience}</span>
            <h2>{record.title || 'Başlıksız duyuru'}</h2>
            <p>{record.body || 'İçerik henüz eklenmedi.'}</p>
            <div className="table-actions">
              <IconButton
                icon="eye"
                label={`${record.title || 'Duyuru'} önizleme`}
                onClick={() => setPreview(record)}
              />
              <IconButton icon="pencil" label="Duyuruyu düzenle" onClick={() => edit(record)} />
              <IconButton
                icon={record.status === 'Taslak' ? 'send' : 'archive'}
                label={record.status === 'Taslak' ? 'Yayımlamak için düzenle' : 'Taslağa al'}
                onClick={() =>
                  record.status === 'Taslak' ? edit(record) : persist(record, 'Taslak')
                }
              />
            </div>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <EmptyState
          text={filter === 'Taslak' ? 'Duyuru taslağı bulunmuyor' : 'Duyuru bulunamadı'}
        />
      )}
      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="jam-modal dialog-wide">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Duyuruyu düzenle' : 'Yeni duyuru'}</DialogTitle>
            <DialogDescription>
              Taslağınızı hazırlayın; yayımladığınızda hedef kitlenizin duyurularında görünür.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <form
              className="dialog-form"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                persist(
                  editing,
                  (event.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'draft'
                    ? 'Taslak'
                    : editing.status === 'Yayında' ||
                        (event.nativeEvent as SubmitEvent).submitter?.getAttribute('value') ===
                          'publish'
                      ? 'Yayında'
                      : 'Taslak',
                );
              }}
            >
              <button
                type="submit"
                tabIndex={-1}
                aria-hidden="true"
                className="sr-only"
                value={editing.status === 'Yayında' ? 'publish' : 'draft'}
              >
                Kaydet
              </button>
              <div className="dialog-form-body">
                <div className="form-field">
                  <Label htmlFor="announcement-title">Başlık</Label>
                  <Input
                    id="announcement-title"
                    placeholder="Duyuru başlığı"
                    value={editing.title}
                    maxLength={160}
                    onValueChange={(title) => setEditing({ ...editing, title })}
                  />
                </div>
                <div className="form-field">
                  <Label htmlFor="announcement-audience">Hedef kitle</Label>
                  <Select
                    value={editing.groupId ? `group:${editing.groupId}` : editing.audience}
                    onValueChange={(value) => {
                      const group = operations.groups.find((g) => `group:${g.id}` === value);
                      setEditing({
                        ...editing,
                        audience: group?.name || value,
                        groupId: group?.id,
                      });
                    }}
                  >
                    <SelectTrigger id="announcement-audience">
                      <SelectValue placeholder="Hedef kitle seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Tüm öğrenciler', 'Öğretmenler', 'Tüm ekip', 'B1 ve üzeri'].map((label) => (
                        <SelectItem key={label} value={label}>
                          {label}
                        </SelectItem>
                      ))}
                      {operations.groups.map((group) => (
                        <SelectItem key={group.id} value={`group:${group.id}`}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="form-field">
                  <Label htmlFor="announcement-body">Duyuru metni</Label>
                  <Textarea
                    id="announcement-body"
                    placeholder="Paylaşmak istediğiniz gelişmeleri yazın"
                    rows={7}
                    maxLength={5000}
                    value={editing.body}
                    onChange={(event) => setEditing({ ...editing, body: event.target.value })}
                  />
                </div>
                {error && (
                  <p role="alert" className="field-error">
                    {error}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                  Vazgeç
                </Button>
                <Button type="submit" variant="outline" value="draft">
                  Taslak olarak kaydet
                </Button>
                <Button type="submit" value="publish">
                  {editing.status === 'Yayında' ? 'Değişiklikleri yayımla' : 'Yayımla'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!preview}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent className="jam-modal">
          <DialogHeader>
            <DialogTitle>{preview?.title || 'Başlıksız duyuru'}</DialogTitle>
            <DialogDescription>
              {preview?.audience} · {preview?.status}
            </DialogDescription>
          </DialogHeader>
          <div className="dialog-form-body">
            <p className="whitespace-pre-wrap break-words">{preview?.body}</p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (preview) edit(preview);
                setPreview(null);
              }}
            >
              Düzenle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
