import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useWorkspace } from '@/app/workspace-provider';
import { Person } from '@/components/shared/primitives';
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
import { readBankAccounts } from '@/features/settings/bank-model';
import { dateTR, money } from '@/lib/format';
import { localDate } from '@/lib/validation';
import { financeRecords, installmentRows, saleBalance, validateReceipt } from './finance-model';

export function ReceiptDialog({
  saleId,
  initialAmount,
  installmentId,
  onClose,
}: {
  saleId: string;
  initialAmount?: number;
  installmentId?: string;
  onClose: () => void;
}) {
  const { state, dispatch } = useWorkspace();
  const records = financeRecords(state);
  const sale = records.sales.find((s) => s.id === saleId);
  const student = state.students.find((s) => s.id === sale?.studentId);
  const installment = installmentId
    ? installmentRows(records).find((row) => row.id === installmentId && row.saleId === saleId)
    : undefined;
  const balance = installmentId
    ? installment?.balance || 0
    : sale
      ? saleBalance(sale, records.receipts)
      : 0;
  const accounts = readBankAccounts(state.settings).filter(
    (a) => a.isActive && a.currency === 'TRY',
  );
  const methods = ['Havale / EFT', 'Nakit', 'Kredi kartı'].filter(
    (method) =>
      state.settings[`payment:${method === 'Nakit' ? 'Nakit ödeme' : method}`] !== 'false',
  );
  const [amount, setAmount] = useState(String(Math.min(initialAmount ?? balance, balance)));
  const [date, setDate] = useState(localDate());
  const [method, setMethod] = useState('');
  const [bankAccountId, setBankAccountId] = useState(accounts.find((a) => a.isDefault)?.id || '');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [review, setReview] = useState(false);
  const committed = useRef(false);
  const receiptId = useRef(crypto.randomUUID());
  const bank = accounts.find((a) => a.id === bankAccountId);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="jam-modal" preventOutsideClose>
        <DialogHeader>
          <DialogTitle>{review ? 'Tahsilatı kontrol edin' : 'Tahsilat kaydı'}</DialogTitle>
          <DialogDescription>
            {review
              ? 'Tutar, tarih ve ödeme hesabını onaylayın.'
              : 'Ödenen tutarı kaydedin. Kısmi ödeme ekleyebilirsiniz.'}
          </DialogDescription>
        </DialogHeader>
        {sale && student && (!installmentId || installment) ? (
          <form
            className="dialog-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (committed.current) return;
              const receipt = {
                id: receiptId.current,
                saleId,
                studentId: student.id,
                amount: Number(amount),
                date,
                method,
                installmentId,
                bankAccountId: method === 'Havale / EFT' ? bankAccountId : undefined,
                bankAccountName: method === 'Havale / EFT' ? bank?.bankName : undefined,
                notes: notes.trim() || undefined,
              };
              const issue = validateReceipt(receipt, financeRecords(state), state.settings);
              if (issue) {
                setError(issue);
                setReview(false);
                return;
              }
              if (!review) {
                setError('');
                setReview(true);
                return;
              }
              committed.current = true;
              dispatch({ type: 'receipt/save', receipt });
              toast.success('Tahsilat kaydedildi; kalan bakiye güncellendi.');
              onClose();
            }}
          >
            <div className="dialog-form-body">
              <Person student={student} />
              <div className="detail-grid">
                <div>
                  <small>Eğitim</small>
                  <b>
                    {sale.course}
                    {installment ? ` · ${installment.number}. taksit` : ''}
                  </b>
                </div>
                <div>
                  <small>Kalan bakiye</small>
                  <b data-sensitive>{money(balance)}</b>
                </div>
              </div>
              {review ? (
                <div className="detail-grid">
                  <div>
                    <small>Tahsil edilecek tutar</small>
                    <b data-sensitive>{money(Number(amount))}</b>
                  </div>
                  <div>
                    <small>Tahsilat tarihi</small>
                    <b>
                      {dateTR(date)} {date.slice(0, 4)}
                    </b>
                  </div>
                  <div>
                    <small>Ödeme yöntemi</small>
                    <b>{method}</b>
                  </div>
                  {method === 'Havale / EFT' && (
                    <div>
                      <small>Banka hesabı</small>
                      <b>
                        {bank?.bankName} · {bank?.accountNumber}
                      </b>
                    </div>
                  )}
                  {notes && (
                    <div>
                      <small>Not</small>
                      <p className="whitespace-pre-wrap break-words">{notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {!installmentId && sale.installments > 1 && (
                    <p className="muted">
                      Tahsilat, en eski açık taksitten başlayarak ödeme planına uygulanır.
                    </p>
                  )}
                  <fieldset className="form-section" data-form-section="required">
                    <legend>
                      Ödeme bilgileri <span>Zorunlu</span>
                    </legend>
                    <div className="form-grid two">
                      <div className="form-field">
                        <Label htmlFor="receipt-amount">Tahsil edilen tutar (₺) *</Label>
                        <Input
                          id="receipt-amount"
                          type="number"
                          inputMode="decimal"
                          min="0.01"
                          max={balance}
                          step="0.01"
                          required
                          placeholder="0,00"
                          value={amount}
                          onValueChange={setAmount}
                        />
                      </div>
                      <div className="form-field">
                        <Label htmlFor="receipt-date">Tahsilat tarihi *</Label>
                        <Input
                          id="receipt-date"
                          type="date"
                          min={sale.date || undefined}
                          max={localDate()}
                          required
                          value={date}
                          onValueChange={setDate}
                        />
                      </div>
                    </div>
                    <div className="form-field">
                      <Label htmlFor="receipt-method">Ödeme yöntemi *</Label>
                      <Select value={method} onValueChange={setMethod} required>
                        <SelectTrigger id="receipt-method">
                          <SelectValue placeholder="Ödeme yöntemi seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {methods.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                          <SelectItem value="IYZICO" disabled>
                            iyzico — ödeme bağlantısı gerekli
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {method === 'Havale / EFT' && (
                      <div className="form-field">
                        <Label htmlFor="receipt-bank">Banka hesabı *</Label>
                        <Select value={bankAccountId} onValueChange={setBankAccountId} required>
                          <SelectTrigger id="receipt-bank">
                            <SelectValue placeholder="Tahsilat hesabı seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.bankName} · {a.accountNumber} ({a.accountHolder})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {!accounts.length && (
                          <p className="field-hint">
                            Aktif bir Türk lirası hesabı yok.{' '}
                            <Link to="/admin/settings/bank" onClick={onClose} className="underline">
                              Banka hesaplarını aç
                            </Link>
                          </p>
                        )}
                      </div>
                    )}
                  </fieldset>
                  <fieldset
                    className="form-section form-section-optional"
                    data-form-section="optional"
                  >
                    <legend>
                      Ek bilgiler <span>İsteğe bağlı</span>
                    </legend>
                    <div className="form-field">
                      <Label htmlFor="receipt-notes">Not</Label>
                      <Textarea
                        id="receipt-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Tahsilata ilişkin açıklama"
                        rows={3}
                      />
                    </div>
                  </fieldset>
                </>
              )}
              {error && (
                <p role="alert" className="field-error">
                  {error}
                </p>
              )}
            </div>
            <DialogFooter className="form-actions">
              <Button
                type="button"
                variant="outline"
                onClick={review ? () => setReview(false) : onClose}
              >
                {review ? 'Düzenle' : 'Vazgeç'}
              </Button>
              <Button type="submit" disabled={balance <= 0 || !methods.length}>
                {review ? 'Onayla ve kaydet' : 'Önizle'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <p className="empty-inline">Tahsilata ait satış veya taksit bulunamadı.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
