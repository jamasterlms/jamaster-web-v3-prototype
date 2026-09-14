import { useState } from 'react';
import { toast } from 'sonner';
import { useWorkspace } from '@/app/workspace-provider';
import { financeRecords } from '@/features/finance/finance-model';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { money } from '@/lib/format';
import { localDate, isDate } from '@/lib/validation';
import type { SaleWithoutDocument, SignedDocument } from '@/features/entities/record-model';
import { documentFileIssue, type LocalDocumentFile } from './document-model';
export function StudentDocumentActions({
  studentId,
}: {
  studentId: number;
  sales?: SaleWithoutDocument[];
}) {
  const { state, dispatch } = useWorkspace();
  const sales = financeRecords(state).sales.filter((s) => s.studentId === studentId),
    student = state.students.find((s) => s.id === studentId);
  const [open, setOpen] = useState(false),
    [saleId, setSaleId] = useState(''),
    [type, setType] = useState<SignedDocument['documentType']>('SALE_CONTRACT'),
    [file, setFile] = useState<LocalDocumentFile | null>(null),
    [signed, setSigned] = useState(false),
    [date, setDate] = useState(localDate()),
    [review, setReview] = useState(false),
    [error, setError] = useState(''),
    [reading, setReading] = useState(false);
  const sale = sales.find((s) => s.id === saleId);
  const close = () => {
    if (reading) return;
    setOpen(false);
    setFile(null);
    setReview(false);
    setError('');
  };
  return (
    <>
      <Button
        variant="outline"
        disabled={!sales.length}
        onClick={() => {
          setSaleId(sales[0]?.id || '');
          setType('SALE_CONTRACT');
          setSigned(false);
          setDate(localDate());
          setOpen(true);
        }}
      >
        <Icon name="file-text" />
        Belge ekle
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!value) close();
        }}
      >
        <DialogContent className="jam-modal dialog-wide">
          <DialogHeader>
            <DialogTitle>{review ? 'Belgeyi kontrol edin' : 'Öğrenci belgesi'}</DialogTitle>
            <DialogDescription>
              {student?.name} · Satışa bağlı belge yükleyin ve önizleyin.
            </DialogDescription>
          </DialogHeader>
          <form
            className="dialog-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!sale || !file) {
                setError('Satış ve belge dosyasını seçin.');
                return;
              }
              const issue =
                signed && (!isDate(date) || date > localDate())
                  ? 'Geçerli bir imza tarihi seçin.'
                  : documentFileIssue(file);
              if (issue) {
                setError(issue);
                return;
              }
              if (!review) {
                setReview(true);
                setError('');
                return;
              }
              const createdAt = new Date().toISOString();
              dispatch({
                type: 'document/save',
                document: {
                  id: crypto.randomUUID(),
                  studentId,
                  saleId,
                  documentType: type,
                  version: 1,
                  encryptionStatus: 'PENDING',
                  signedByStudent: signed,
                  signedByAuthority: false,
                  signerName: signed ? student!.name : '',
                  signedAt: signed ? date : '',
                  createdAt,
                  courseName: sale.course,
                  paidAmount: sale.amount,
                  paymentType: sale.method,
                  localFile: file,
                },
              });
              toast.success('Belge çalışma alanına eklendi.');
              close();
            }}
          >
            <div className="dialog-form-body">
              {review && sale && file ? (
                <>
                  <dl className="detail-grid">
                    <div>
                      <dt>Eğitim</dt>
                      <dd>{sale.course}</dd>
                    </div>
                    <div>
                      <dt>Satış tutarı</dt>
                      <dd>{money(sale.amount)}</dd>
                    </div>
                    <div>
                      <dt>Dosya</dt>
                      <dd>{file.name}</dd>
                    </div>
                    <div>
                      <dt>İmza</dt>
                      <dd>{signed ? 'Öğrenci imzalı olarak işaretlendi' : 'İmza bekliyor'}</dd>
                    </div>
                  </dl>
                  <LocalDocumentPreview file={file} />
                </>
              ) : (
                <>
                  <fieldset className="form-section" data-form-section="required">
                    <legend>
                      Belge bilgileri <span>Zorunlu</span>
                    </legend>
                    <div className="form-field">
                      <Label htmlFor="document-sale">Satış *</Label>
                      <Select value={saleId} onValueChange={setSaleId}>
                        <SelectTrigger id="document-sale">
                          <SelectValue placeholder="Satış seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {sales.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.course} · {money(s.amount)} · {s.date}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="form-field">
                      <Label htmlFor="document-type">Belge türü *</Label>
                      <Select
                        value={type}
                        onValueChange={(value) => setType(value as SignedDocument['documentType'])}
                      >
                        <SelectTrigger id="document-type">
                          <SelectValue placeholder="Belge türü seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SALE_CONTRACT">Satış sözleşmesi</SelectItem>
                          <SelectItem value="BONO">Bono / senet</SelectItem>
                          <SelectItem value="TAHHUTNAME">Taahhütname</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="form-field">
                      <Label htmlFor="document-file">Belge dosyası *</Label>
                      <Input
                        id="document-file"
                        type="file"
                        accept="application/pdf,image/png,image/jpeg,image/webp"
                        disabled={reading}
                        onChange={async (event) => {
                          const selected = event.target.files?.[0];
                          event.target.value = '';
                          setFile(null);
                          setError('');
                          if (!selected) return;
                          if (selected.size > 1024 * 1024) {
                            setError('En fazla 1 MB boyutunda dosya seçin.');
                            return;
                          }
                          setReading(true);
                          try {
                            const dataUrl = await new Promise<string>((resolve, reject) => {
                              const reader = new FileReader();
                              reader.onload = () => resolve(String(reader.result));
                              reader.onerror = reject;
                              reader.readAsDataURL(selected);
                            });
                            const next = { name: selected.name, type: selected.type, dataUrl };
                            const issue = documentFileIssue(next);
                            if (issue) setError(issue);
                            else setFile(next);
                          } catch {
                            setError('Dosya okunamadı. Yeniden seçin.');
                          } finally {
                            setReading(false);
                          }
                        }}
                      />
                      <small>
                        {reading
                          ? 'Dosya okunuyor…'
                          : file?.name || 'PDF, PNG, JPEG veya WebP · En fazla 1 MB'}
                      </small>
                    </div>
                  </fieldset>
                  <fieldset className="form-section" data-form-section="optional">
                    <legend>
                      İmza bilgisi <span>İsteğe bağlı</span>
                    </legend>
                    <Label className="field-checkbox">
                      <Checkbox
                        checked={signed}
                        onCheckedChange={(value) => setSigned(value === true)}
                      />
                      Yüklediğim dosyada öğrenci imzası var
                    </Label>
                    {signed && (
                      <div className="form-field">
                        <Label htmlFor="document-signed-date">İmza tarihi *</Label>
                        <Input
                          id="document-signed-date"
                          type="date"
                          value={date}
                          placeholder="İmza tarihi seçin"
                          max={localDate()}
                          required
                          onChange={(e) => setDate(e.target.value)}
                        />
                      </div>
                    )}
                    <p className="field-hint">
                      Bu işlem dijital imza oluşturmaz. Belge bu tarayıcıdaki çalışma alanında
                      tutulur.
                    </p>
                  </fieldset>
                </>
              )}
              {error && (
                <p className="field-error" role="alert">
                  {error}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => (review ? setReview(false) : close())}
              >
                {review ? 'Düzenle' : 'Vazgeç'}
              </Button>
              <Button type="submit" disabled={reading || !file}>
                {review ? 'Belgeyi kaydet' : 'Önizle'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
export function LocalDocumentPreview({ file }: { file: LocalDocumentFile }) {
  if (documentFileIssue(file)) return <p className="field-error">Dosya görüntülenemiyor.</p>;
  return (
    <section className="local-document-preview">
      {file.type.startsWith('image/') ? (
        <img src={file.dataUrl} alt={file.name} />
      ) : (
        <object type="application/pdf" data={file.dataUrl} aria-label={file.name}>
          <p>PDF önizlemesi bu tarayıcıda desteklenmiyor. Dosyayı indirerek açabilirsiniz.</p>
        </object>
      )}
      <Button asChild variant="outline">
        <a href={file.dataUrl} download={file.name}>
          <Icon name="download" />
          Dosyayı indir
        </a>
      </Button>
    </section>
  );
}
