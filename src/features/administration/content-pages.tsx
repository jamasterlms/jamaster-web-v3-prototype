import { useMemberships } from '@/features/education/use-memberships';
import { DialogFooter } from '@/components/ui/dialog';
import { useWorkspace } from '@/app/workspace-provider';
import {} from '@/components/shared/feature-primitives';
import { Icon } from '@/components/shared/icon';
import { EmptyState, PageHeading, StatusBadge } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input as UIFieldInput } from '@/components/ui/input';
import { Label, Label as UIFieldLabel } from '@/components/ui/label';
import {
  Select as UISelect,
  SelectContent as UISelectContent,
  SelectItem as UISelectItem,
  SelectTrigger as UISelectTrigger,
  SelectValue as UISelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { eventDate } from '@/lib/calendar';
import { downloadCSV } from '@/lib/format';
import { localDate } from '@/lib/validation';
import { useState } from 'react';
import { toast } from 'sonner';
export function downloadText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function useStoredRecords<T>(key: string, seed: T[]) {
  const { state, dispatch } = useWorkspace();
  let records = seed;
  try {
    if (state.settings[key]) {
      const parsed = JSON.parse(state.settings[key]);
      if (Array.isArray(parsed)) records = parsed;
    }
  } catch {
    /* retain initial records */
  }
  return [
    records,
    (next: T[]) => dispatch({ type: 'settings/save', values: { [key]: JSON.stringify(next) } }),
  ] as const;
}
export { AnnouncementsPage } from './announcements-page';
export { announcements, type Announcement } from './announcement-model';

type StoredFile = { id: string; name: string; data: string; size: number };
export function FilesPage() {
  const memberships = useMemberships();
  const { state } = useWorkspace(),
    [files, setFiles] = useStoredRecords<StoredFile>('files-v3', []),
    [pending, setPending] = useState(false);
  return (
    <>
      <PageHeading
        title="Dosya Yönetimi"
        description="Rapor çıktılarınızı indirin ve çalışma dosyalarınızı düzenleyin."
      />
      <label className="file-drop">
        <Icon name="upload" />
        <b>{pending ? 'Dosya ekleniyor…' : 'Çalışma dosyası ekleyin'}</b>
        <span>Dosya seçmek için tıklayın · en fazla 2 MB</span>
        <input
          type="file"
          disabled={pending}
          aria-label="Dosya ekle"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            if (f.size > 2 * 1024 * 1024) {
              toast.error('En fazla 2 MB boyutunda dosya ekleyin.');
              return;
            }
            setPending(true);
            const reader = new FileReader();
            reader.onload = () => {
              setFiles([
                {
                  id: crypto.randomUUID(),
                  name: f.name,
                  size: f.size,
                  data: String(reader.result),
                },
                ...files,
              ]);
              setPending(false);
              toast.success('Dosya eklendi.');
            };
            reader.onerror = () => {
              setPending(false);
              toast.error('Dosya okunamadı.');
            };
            reader.readAsDataURL(f);
            e.target.value = '';
          }}
        />
      </label>
      <h2 className="subsection-title">Rapor çıktıları</h2>
      <div className="document-grid">
        {[
          ['Öğrenci listesi', 'users'],
          ['Ders programı', 'calendar-days'],
        ].map(([name, icon], i) => (
          <div className="document-card" key={name}>
            <span className="document-symbol">
              <Icon name={icon} />
            </span>
            <h2>{name}</h2>
            <p>Güncel çalışma alanı · CSV</p>
            <Button
              variant="outline"
              onClick={() =>
                i === 0
                  ? downloadCSV('ogrenciler.csv', [
                      ['Ad soyad', 'Eğitim', 'Grup', 'Telefon'],
                      ...state.students.map((s) => [
                        s.name,
                        s.course,
                        memberships.labelFor(s.id),
                        s.phone,
                      ]),
                    ])
                  : downloadCSV('ders-programi.csv', [
                      ['Tarih', 'Saat', 'Ders', 'Öğretmen'],
                      ...state.events.map((e) => [
                        localDate(eventDate(e.day)),
                        e.time,
                        e.title,
                        e.teacher,
                      ]),
                    ])
              }
            >
              <Icon name="download" />
              İndir
            </Button>
          </div>
        ))}
      </div>
      <h2 className="subsection-title mt-6">Çalışma dosyaları</h2>
      <div className="file-list">
        {files.map((f) => (
          <div className="member-row" key={f.id}>
            <Icon name="file-text" />
            <div>
              <strong>{f.name}</strong>
              <small>{Math.ceil(f.size / 1024)} KB</small>
            </div>
            <Button asChild variant="outline" className="ml-auto">
              <a download={f.name} href={f.data}>
                <Icon name="download" />
                İndir
              </a>
            </Button>
          </div>
        ))}
      </div>
      {!files.length && <EmptyState text="Eklediğiniz çalışma dosyaları burada görünür." />}
    </>
  );
}
export function SupportPage() {
  const [records, setRecords] = useStoredRecords<{
    id: string;
    title: string;
    body: string;
    category: string;
  }>('support-v3', []);
  const [open, setOpen] = useState(false),
    [category, setCategory] = useState('Teknik destek');
  return (
    <>
      <PageHeading title="Destek merkezi" description="İhtiyacınız olan yardıma birlikte ulaşalım.">
        <Button onClick={() => setOpen(true)}>
          <Icon name="plus" />
          Destek talebi hazırla
        </Button>
      </PageHeading>
      <div className="support-intro">
        <span className="course-symbol tone-1">
          <Icon name="circle-help" />
        </span>
        <h2>Nasıl yardımcı olabiliriz?</h2>
        <p>Öğrenci yönetimi, takvim ve finans süreçleri için hızlı kılavuzlar.</p>
      </div>
      <div className="help-grid">
        {[
          [
            'Öğrenci kaydı',
            'Yeni kayıt akışında öğrenci bilgilerini, eğitim paketini ve ödeme planını tamamlayın.',
          ],
          [
            'Görüşme takibi',
            'Öğrenci profilinden görüşme açın. Sonucu ve takip tarihini seçerek geçmişe kaydedin.',
          ],
          [
            'Kısayollar',
            '⌘K veya Ctrl+K ile sayfa ve öğrenci arayabilirsiniz. Esc açık pencereyi kapatır.',
          ],
        ].map(([title, body]) => (
          <details className="help-item" key={title}>
            <summary>
              {title}
              <Icon name="chevron-down" />
            </summary>
            <p>{body}</p>
          </details>
        ))}
      </div>
      <h2 className="subsection-title mt-6">Talep taslakları</h2>
      {records.map((r) => (
        <div className="support-ticket" key={r.id}>
          <h3>{r.title}</h3>
          <span className="badge">{r.category}</span>
          <p>{r.body}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              downloadText(`destek-${r.id}.txt`, `${r.title}\n${r.category}\n\n${r.body}`)
            }
          >
            <Icon name="download" />
            Metni indir
          </Button>
        </div>
      ))}
      {!records.length && <EmptyState text="Hazırladığınız destek talepleri burada saklanır." />}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={'jam-modal'}>
          <DialogHeader>
            <DialogTitle>{'Destek talebi hazırlayın'}</DialogTitle>
            <DialogDescription className="sr-only">{'Destek talebi hazırlayın'}</DialogDescription>
          </DialogHeader>
          <form
            className="dialog-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              setRecords([
                {
                  id: crypto.randomUUID(),
                  title: String(f.get('title')),
                  body: String(f.get('body')),
                  category,
                },
                ...records,
              ]);
              setOpen(false);
              toast.success('Destek talebi taslağı kaydedildi.');
            }}
          >
            <div className="dialog-form-body">
              <div className="form-field">
                <UIFieldLabel htmlFor={'title'}>{'Konu'}</UIFieldLabel>
                <UIFieldInput id={'title'} name="title" required />
              </div>
              <div className="form-field choice-field">
                <UIFieldLabel htmlFor="content-pages-select-4">{'Kategori'}</UIFieldLabel>
                <UISelect
                  name={undefined}
                  value={category || undefined}
                  onValueChange={setCategory}
                >
                  <UISelectTrigger
                    id="content-pages-select-4"
                    className="filter-select"
                    aria-label={'Kategori'}
                  >
                    <UISelectValue placeholder={'Seçin'} />
                  </UISelectTrigger>
                  <UISelectContent position="popper">
                    {(
                      ['Teknik destek', 'Eğitim yönetimi', 'Finans', 'Hesap ve erişim'] as (
                        | string
                        | { value: string; label: string }
                      )[]
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
              <div className="form-field">
                <Label htmlFor="support-body">Açıklama</Label>
                <Textarea id="support-body" name="body" required minLength={10} />
              </div>
            </div>
            <DialogFooter className="form-actions">
              <Button type="submit">Taslağı kaydet</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
