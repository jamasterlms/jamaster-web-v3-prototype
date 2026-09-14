import { useState } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { useOperations } from '@/features/operations/operations-provider';
import type { Teacher } from '@/features/operations/model';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { IconButton } from '@/components/shared/primitives';
import { EntityNotes } from '@/features/entities/entity-notes';
import { localDate, isDate } from '@/lib/validation';

import type { Certificate, TeacherPersonal } from './teacher-personal-model';
const labels: [keyof TeacherPersonal, string, string][] = [
  ['tcNo', 'TC kimlik numarası', 'text'],
  ['birthDate', 'Doğum tarihi', 'date'],
  ['birthPlace', 'Doğum yeri', 'text'],
  ['gender', 'Cinsiyet', 'select'],
  ['educationStatus', 'Eğitim durumu', 'text'],
  ['graduatedSchool', 'Mezun olduğu okul', 'text'],
  ['department', 'Bölüm', 'text'],
  ['address', 'Ev adresi', 'textarea'],
  ['alternativeEmail', 'Alternatif e-posta', 'email'],
  ['socialMedia', 'Sosyal medya', 'text'],
];
const certificateSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2, 'Sertifika adı en az iki karakter olmalıdır.'),
  institution: z.string().trim().min(2, 'Kurum adı en az iki karakter olmalıdır.'),
  year: z.string().regex(/^\d{4}$/, 'Yılı dört haneli yazın.'),
});
export function TeacherPersonalPanel({ teacher }: { teacher: Teacher }) {
  const { operations, save } = useOperations();
  const personal = teacher.personal || {};
  const [draft, setDraft] = useState<TeacherPersonal | null>(null),
    [certificate, setCertificate] = useState<Certificate | null>(null),
    [deleting, setDeleting] = useState<Certificate | null>(null),
    [discard, setDiscard] = useState(false);
  const persist = (patch: Partial<TeacherPersonal>) => {
    const latest = operations.teachers.find((t) => t.id === teacher.id);
    if (!latest) {
      toast.error('Öğretmen kaydı bulunamadı.');
      return;
    }
    save({
      type: 'save',
      collection: 'teachers',
      record: {
        ...latest,
        personal: { ...latest.personal, ...patch },
        updatedAt: new Date().toISOString(),
      },
    });
  };
  const dirty = !!draft && JSON.stringify(draft) !== JSON.stringify(personal);
  const close = () => (dirty ? setDiscard(true) : setDraft(null));
  return (
    <>
      <Card className="teacher-personal-card">
        <div className="section-bar">
          <h2>Kişisel ve iletişim bilgileri</h2>
          <Button variant="ghost" onClick={() => setDraft({ ...personal })}>
            Düzenle
          </Button>
        </div>
        <dl className="detail-grid">
          {labels.map(([key, label]) => (
            <div key={key}>
              <dt>{label}</dt>
              <dd>
                {key === 'gender'
                  ? { MALE: 'Erkek', FEMALE: 'Kadın', OTHER: 'Diğer' }[personal.gender || ''] ||
                    'Belirtilmedi'
                  : String(personal[key] || 'Belirtilmedi')}
              </dd>
            </div>
          ))}
        </dl>
      </Card>
      <Card className="teacher-personal-card">
        <div className="section-bar">
          <h2>Sertifikalar</h2>
          <Button
            variant="ghost"
            onClick={() =>
              setCertificate({ id: crypto.randomUUID(), name: '', institution: '', year: '' })
            }
          >
            Sertifika ekle
          </Button>
        </div>
        {personal.certificates?.length ? (
          <div className="certificate-list">
            {personal.certificates.map((c) => (
              <div className="certificate-row" key={c.id}>
                <div>
                  <strong>{c.name}</strong>
                  <p>
                    {c.institution} · {c.year}
                  </p>
                </div>
                <div className="table-actions">
                  <IconButton
                    icon="pencil"
                    label="Sertifikayı düzenle"
                    onClick={() => setCertificate({ ...c })}
                  />
                  <IconButton
                    icon="trash2"
                    label="Sertifikayı sil"
                    onClick={() => setDeleting(c)}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-inline">Henüz sertifika eklenmemiş.</p>
        )}
      </Card>
      <EntityNotes targetType="teacher" targetId={teacher.id} />
      <Dialog
        open={!!draft}
        onOpenChange={(o) => {
          if (!o) close();
        }}
      >
        <DialogContent preventOutsideClose className="jam-modal dialog-wide">
          <DialogHeader>
            <DialogTitle>Kişisel bilgileri düzenle</DialogTitle>
            <DialogDescription>
              Bu alanlar isteğe bağlıdır; bilgileri daha sonra tamamlayabilirsiniz.
            </DialogDescription>
          </DialogHeader>
          {draft && (
            <form
              className="dialog-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (
                  draft.birthDate &&
                  (!isDate(draft.birthDate) || draft.birthDate > localDate())
                ) {
                  toast.error('Geçerli bir doğum tarihi girin; tarih gelecekte olamaz.');
                  return;
                }
                persist(draft);
                setDraft(null);
                toast.success('Kişisel bilgiler güncellendi.');
              }}
            >
              <div className="dialog-form-body form-grid">
                {labels.map(([key, label, type]) => (
                  <div className="form-field" key={key}>
                    <Label htmlFor={`teacher-${key}`}>{label}</Label>
                    {type === 'select' ? (
                      <Select
                        value={draft.gender || 'unset'}
                        onValueChange={(v) =>
                          setDraft({ ...draft, gender: v === 'unset' ? '' : v })
                        }
                      >
                        <SelectTrigger id={`teacher-${key}`}>
                          <SelectValue placeholder="Cinsiyet seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            ['unset', 'Belirtilmedi'],
                            ['MALE', 'Erkek'],
                            ['FEMALE', 'Kadın'],
                            ['OTHER', 'Diğer'],
                          ].map(([v, l]) => (
                            <SelectItem value={v} key={v}>
                              {l}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : type === 'textarea' ? (
                      <Textarea
                        id={`teacher-${key}`}
                        placeholder="Adres bilgilerini yazın"
                        value={draft.address || ''}
                        onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                      />
                    ) : (
                      <Input
                        id={`teacher-${key}`}
                        type={type}
                        placeholder={label}
                        value={String(draft[key] || '')}
                        max={type === 'date' ? localDate() : undefined}
                        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                      />
                    )}
                  </div>
                ))}
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
            <DialogDescription>Kaydetmeden çıkmak istediğinize emin misiniz?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscard(false)}>
              Düzenlemeye dön
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDiscard(false);
                setDraft(null);
              }}
            >
              Kaydetmeden kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!certificate}
        onOpenChange={(o) => {
          if (!o) setCertificate(null);
        }}
      >
        <DialogContent className="jam-modal">
          <DialogHeader>
            <DialogTitle>Sertifika bilgileri</DialogTitle>
            <DialogDescription>Sertifika adı, veren kurum ve yılı girin.</DialogDescription>
          </DialogHeader>
          {certificate && (
            <form
              className="dialog-form"
              onSubmit={(e) => {
                e.preventDefault();
                const parsed = certificateSchema.safeParse(certificate);
                if (!parsed.success) {
                  toast.error(parsed.error.issues[0].message);
                  return;
                }
                const list = personal.certificates || [];
                persist({
                  certificates: list.some((c) => c.id === certificate.id)
                    ? list.map((c) => (c.id === certificate.id ? parsed.data : c))
                    : [...list, parsed.data],
                });
                setCertificate(null);
                toast.success('Sertifika kaydedildi.');
              }}
            >
              <div className="dialog-form-body form-grid">
                {(['name', 'institution', 'year'] as const).map((key, i) => (
                  <div key={key} className="form-field">
                    <Label htmlFor={`cert-${key}`}>{['Sertifika adı', 'Kurum', 'Yıl'][i]} *</Label>
                    <Input
                      id={`cert-${key}`}
                      placeholder={['Sertifikanın adı', 'Sertifikayı veren kurum', '2026'][i]}
                      required
                      inputMode={key === 'year' ? 'numeric' : undefined}
                      maxLength={key === 'year' ? 4 : 255}
                      value={certificate[key]}
                      onChange={(e) => setCertificate({ ...certificate, [key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCertificate(null)}>
                  Vazgeç
                </Button>
                <Button type="submit">Kaydet</Button>
              </DialogFooter>
            </form>
          )}
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
            <DialogTitle>Sertifikayı sil</DialogTitle>
            <DialogDescription>{deleting?.name} kaldırılacak.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                persist({
                  certificates: (personal.certificates || []).filter((c) => c.id !== deleting?.id),
                });
                setDeleting(null);
              }}
            >
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
