import { useWorkspace } from '@/app/workspace-provider';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { type HelpRole, roleLabels } from './help-model';
export function SupportRequest({ role, path }: { role: HelpRole; path: string }) {
  const { state, dispatch } = useWorkspace();
  type Draft = {
    id: string;
    title: string;
    body: string;
    category: string;
    role?: HelpRole;
    path?: string;
  };
  let drafts: Draft[] = [];
  let unreadableDrafts = false;
  try {
    const parsed: unknown = JSON.parse(state.settings['support-v3'] || '[]');
    if (!Array.isArray(parsed)) unreadableDrafts = true;
    if (Array.isArray(parsed))
      drafts = parsed.filter(
        (item): item is Draft =>
          item &&
          typeof item.id === 'string' &&
          typeof item.title === 'string' &&
          typeof item.body === 'string',
      );
  } catch {
    unreadableDrafts = true;
  }
  const visibleDrafts = drafts.filter((draft) =>
    draft.role ? draft.role === role : role === 'staff' || role === 'super',
  );
  const download = (title: string, body: string, context: string) => {
    const url = URL.createObjectURL(
      new Blob([`${title}\n${context}\n\n${body}`], { type: 'text/plain;charset=utf-8' }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'jamaster-destek-talebi.txt';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const id = useId(),
    [open, setOpen] = useState(false),
    [subject, setSubject] = useState(''),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  return (
    <>
      <section className="help-contact">
        <div>
          <h2>Başka bir konuda yardıma mı ihtiyacınız var?</h2>
          <p>Kurumunuzla paylaşmak için bulunduğunuz sayfayı içeren bir talep hazırlayın.</p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(value) => {
            setOpen(value);
            if (value) setError('');
          }}
        >
          <DialogTrigger asChild>
            <Button variant="outline">Destek talebi hazırla</Button>
          </DialogTrigger>
          <DialogContent className="jam-modal" preventOutsideClose>
            <DialogHeader>
              <DialogTitle>Destek talebi hazırlayın</DialogTitle>
              <DialogDescription>
                Talep metnini indirip kurumunuza iletebilirsiniz. Otomatik gönderim yapılmaz.
              </DialogDescription>
            </DialogHeader>
            <form
              className="dialog-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (subject.trim().length < 3 || message.trim().length < 10) {
                  setError('Konu en az 3, açıklama en az 10 karakter olmalıdır.');
                  return;
                }
                const draft = {
                  id: crypto.randomUUID(),
                  title: subject.trim(),
                  body: message.trim(),
                  category: 'Destek',
                  role,
                  path,
                };
                if (!unreadableDrafts)
                  dispatch({
                    type: 'settings/save',
                    values: { 'support-v3': JSON.stringify([draft, ...drafts]) },
                  });
                download(draft.title, draft.body, `Rol: ${roleLabels[role]}\nSayfa: ${path}`);
                setSubject('');
                setMessage('');
                setError('');
                setOpen(false);
              }}
            >
              <div className="dialog-form-body">
                <div className="form-field">
                  <Label htmlFor={`${id}-subject`}>Konu *</Label>
                  <Input
                    id={`${id}-subject`}
                    placeholder="Yaşadığınız sorunu kısaca yazın"
                    required
                    minLength={3}
                    maxLength={160}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <Label htmlFor={`${id}-message`}>Açıklama *</Label>
                  <Textarea
                    id={`${id}-message`}
                    placeholder="Hangi adımda ne oldu? Beklediğiniz sonucu açıklayın."
                    required
                    minLength={10}
                    maxLength={5000}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>
                <p className="field-hint" role="status">
                  {unreadableDrafts &&
                    'Önceki taslaklar okunamadı. Mevcut kayıt korunacak; yeni talebinizi dosya olarak indirebilirsiniz.'}
                </p>
                <p className="field-hint">Şifrenizi veya doğrulama kodunuzu eklemeyin.</p>
                {error && <p role="alert">{error}</p>}
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Vazgeç
                </Button>
                <Button type="submit">Talebi indir</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </section>
      {visibleDrafts.length > 0 && (
        <details className="help-saved-drafts">
          <summary>Kaydedilen talep taslakları ({visibleDrafts.length})</summary>
          {visibleDrafts.map((draft) => (
            <div className="support-ticket" key={draft.id}>
              <h3>{draft.title}</h3>
              <p>{draft.body}</p>
              <Button
                variant="ghost"
                onClick={() =>
                  download(draft.title, draft.body, draft.path || draft.category || '')
                }
              >
                Metni indir
              </Button>
            </div>
          ))}
        </details>
      )}
    </>
  );
}
