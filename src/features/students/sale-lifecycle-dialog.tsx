import { useState } from 'react';
import { toast } from 'sonner';
import { useWorkspace } from '@/app/workspace-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { localDate } from '@/lib/validation';
import { financeRecords, type Sale } from '@/features/finance/finance-model';
import { useOperations } from '@/features/operations/operations-provider';
import {
  applyLifecycleCommand,
  lifecycleCommandIssue,
  saleLifecycleRevision,
  transferInvariant,
  type LifecycleCommand,
  type TransferMode,
} from '@/features/finance/sale-lifecycle';

type Kind = LifecycleCommand['kind'] | 'history';
const titles: Record<Kind, string> = {
  endDate: 'Bitiş tarihini değiştir',
  freeze: 'Eğitimi dondur',
  unfreeze: 'Dondurmayı sonlandır',
  transfer: 'Satışı transfer et',
  history: 'Eğitim işlem geçmişi',
};

export function SaleLifecycleDialog({
  sale,
  initialKind,
  onClose,
}: {
  sale: Sale;
  initialKind: Kind;
  onClose: () => void;
}) {
  const { state, dispatch } = useWorkspace();
  const { operations } = useOperations();
  const [kind, setKind] = useState<Kind>(initialKind);
  const [effectiveDate, setEffectiveDate] = useState(localDate());
  const [endDate, setEndDate] = useState(sale.endDate || '');
  const [freezeEndDate, setFreezeEndDate] = useState('');
  const [toStudentId, setToStudentId] = useState('');
  const [toPricingId, setToPricingId] = useState('');
  const [transferType, setTransferType] = useState<TransferMode>('STUDENT');
  const records = financeRecords(state);
  const transferAmounts = transferInvariant(sale, records.receipts, 1);
  const [transferredAmount, setTransferredAmount] = useState(String(transferAmounts.outstanding));
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [review, setReview] = useState(false);
  const submit = () => {
    const currentSale = records.sales.find((item) => item.id === sale.id);
    if (!currentSale || saleLifecycleRevision(currentSale) !== saleLifecycleRevision(sale)) {
      setError('Satış bilgileri değişti. İşlemi kapatıp güncel kaydı yeniden açın.');
      return;
    }
    const command: LifecycleCommand =
      kind === 'endDate'
        ? { kind, effectiveDate, endDate, note }
        : kind === 'freeze'
          ? { kind, freezeStartDate: effectiveDate, freezeEndDate, note }
          : kind === 'unfreeze'
            ? { kind, effectiveDate, note }
            : {
                kind: 'transfer',
                transferType,
                toStudentId: toStudentId ? Number(toStudentId) : undefined,
                toPricingId: toPricingId || undefined,
                transferredAmount: Number(transferredAmount),
                reason: note,
              };
    const issue = lifecycleCommandIssue(
      sale,
      command,
      state.students.map((s) => s.id),
      operations.plans.map((p) => p.id),
      records.receipts,
    );
    if (issue) return setError(issue);
    if (!review) {
      setError('');
      setReview(true);
      return;
    }
    const result = applyLifecycleCommand(
      sale,
      command,
      {
        id: crypto.randomUUID(),
        now: new Date().toISOString(),
        branchId: state.branch,
        actor: state.settings.profileName || 'Çalışma alanı',
      },
      records.receipts,
    );
    dispatch({
      type: 'sale/lifecycle',
      sale: result,
      expectedRevision: saleLifecycleRevision(sale),
    });
    toast.success(
      kind === 'transfer'
        ? 'Transfer taslağı yerel geçmişe eklendi.'
        : 'Eğitim işlemi yerel çalışma alanına kaydedildi.',
    );
    onClose();
  };
  const events = [
    ...(sale.lifecycle || []).map((e) => ({
      id: e.id,
      date: e.createdAt,
      label: `Bitiş tarihi: ${e.previousEndDate || '—'} → ${e.endDate || '—'}`,
    })),
    ...(sale.freezes || []).map((f) => ({
      id: f.id,
      date: f.unfrozenAt || `${f.freezeStartDate}T00:00:00`,
      label: `Dondurma: ${f.freezeStartDate} – ${f.freezeEndDate || 'Açık'} · ${f.status}`,
    })),
    ...(sale.transfers || []).map((t) => ({
      id: t.id,
      date: t.createdAt,
      label: `Transfer: #${t.fromStudentId} → ${t.toStudentId ? `#${t.toStudentId}` : t.toPricingId || '—'} · ${t.transferType} · ${t.transferredAmount || '—'} TL · ${t.status}`,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="jam-modal" preventOutsideClose>
        <DialogHeader>
          <DialogTitle>{titles[kind]}</DialogTitle>
          <DialogDescription>
            {sale.course} satışına bağlı eğitim kaydını yönetin.
          </DialogDescription>
        </DialogHeader>
        {kind === 'history' ? (
          <div className="dialog-form">
            {events.length ? (
              <ol className="record-list">
                {events.map((e) => (
                  <li key={e.id}>
                    <strong>{new Date(e.date).toLocaleString('tr-TR')}</strong>
                    <p>{e.label}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="empty-inline">Bu satış için eğitim işlemi yok.</p>
            )}
            <DialogFooter>
              <Button onClick={onClose}>Kapat</Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            className="dialog-form"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            {review ? (
              <div className="pending-banner">
                <strong>Taslak önizleme</strong>
                <p>
                  {kind === 'transfer'
                    ? `${transferType} · ${transferredAmount} TL; satış ve tahsilat tutarları değişmeyecek.`
                    : 'Alanları kontrol edip kaydedin.'}
                </p>
              </div>
            ) : (
              <>
                {kind !== 'transfer' && (
                  <div className="form-field">
                    <Label htmlFor="lifecycle-date">İşlem tarihi *</Label>
                    <Input
                      id="lifecycle-date"
                      type="date"
                      max={localDate()}
                      value={effectiveDate}
                      onChange={(e) => setEffectiveDate(e.target.value)}
                    />
                  </div>
                )}
                {kind === 'endDate' && (
                  <div className="form-field">
                    <Label htmlFor="lifecycle-end">Yeni bitiş tarihi *</Label>
                    <Input
                      id="lifecycle-end"
                      type="date"
                      min={sale.startDate || sale.date}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                )}
                {kind === 'freeze' && (
                  <div className="form-field">
                    <Label htmlFor="freeze-end">Dondurma bitişi *</Label>
                    <Input
                      id="freeze-end"
                      type="date"
                      min={effectiveDate}
                      value={freezeEndDate}
                      onChange={(e) => setFreezeEndDate(e.target.value)}
                    />
                  </div>
                )}
                {kind === 'transfer' && (
                  <>
                    <div className="form-field">
                      <Label>Transfer türü *</Label>
                      <Select
                        value={transferType}
                        onValueChange={(value) => setTransferType(value as TransferMode)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STUDENT">Öğrenci</SelectItem>
                          <SelectItem value="PERIOD">Dönem / paket</SelectItem>
                          <SelectItem value="BOTH">Öğrenci ve dönem / paket</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {(transferType === 'STUDENT' || transferType === 'BOTH') && (
                      <div className="form-field">
                        <Label>Hedef öğrenci *</Label>
                        <Select value={toStudentId} onValueChange={setToStudentId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Öğrenci seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {state.students
                              .filter((s) => s.id !== sale.studentId)
                              .map((s) => (
                                <SelectItem key={s.id} value={String(s.id)}>
                                  {s.name} · #{s.id}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {(transferType === 'PERIOD' || transferType === 'BOTH') && (
                      <div className="form-field">
                        <Label>Hedef dönem / paket *</Label>
                        <Select value={toPricingId} onValueChange={setToPricingId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Dönem veya paket seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {operations.plans
                              .filter((p) => p.active && p.id !== (sale.pricingId || sale.planId))
                              .map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name} · {p.course}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="form-field">
                      <Label htmlFor="transfer-amount">Transfer tutarı *</Label>
                      <Input
                        id="transfer-amount"
                        type="number"
                        min="0.01"
                        max={transferAmounts.outstanding}
                        step="0.01"
                        value={transferredAmount}
                        onChange={(e) => setTransferredAmount(e.target.value)}
                      />
                      <small>
                        Ödenmiş: {transferAmounts.paid.toFixed(2)} TL · Ödenmemiş:{' '}
                        {transferAmounts.outstanding.toFixed(2)} TL
                      </small>
                    </div>
                  </>
                )}
                <div className="form-field">
                  <Label htmlFor="lifecycle-note">Açıklama</Label>
                  <Textarea
                    id="lifecycle-note"
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </>
            )}
            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}
            <p className="field-hint">
              Transferler yerel ve bekleyen taslak olarak kaydedilir; yeni satış, ödeme, iade veya
              mesaj oluşturulmaz.
            </p>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={review ? () => setReview(false) : onClose}
              >
                {review ? 'Düzenle' : 'Vazgeç'}
              </Button>
              <Button type="submit">
                {review ? (kind === 'transfer' ? 'Taslağı kaydet' : 'Onayla ve kaydet') : 'Önizle'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
