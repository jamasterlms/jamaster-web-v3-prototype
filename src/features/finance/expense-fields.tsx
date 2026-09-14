import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { Expense } from '@/features/operations/model';

export function ExpenseFields({
  value,
  onChange,
}: {
  value: Expense;
  onChange: (v: Expense) => void;
}) {
  const patch = (next: Partial<Expense>) => onChange({ ...value, ...next });
  const choice = (key: keyof Expense, label: string, options: string[][], required = true) => (
    <div className="form-field">
      <Label htmlFor={`expense-${key}`}>
        {label}
        {required && ' *'}
      </Label>
      <Select
        required={required}
        value={String(value[key] || '') || undefined}
        onValueChange={(v) => patch({ [key]: v })}
      >
        <SelectTrigger id={`expense-${key}`} aria-required={required}>
          <SelectValue placeholder="Seçin" />
        </SelectTrigger>
        <SelectContent>
          {options.map(([v, l]) => (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
  const recurring = value.transactionMode === 'RECURRING';
  return (
    <>
      <fieldset className="form-section" data-form-section="required">
        <legend>
          İşlem bilgileri <span>Zorunlu</span>
        </legend>
        <div className="form-grid">
          <div className="form-field">
            <Label htmlFor="expense-title">İşlem adı *</Label>
            <Input
              id="expense-title"
              required
              minLength={2}
              maxLength={160}
              value={value.title}
              onChange={(e) => patch({ title: e.target.value })}
            />
          </div>
          {choice('type', 'İşlem tipi', [
            ['EXPENSE', 'Gider'],
            ['INCOME', 'Gelir'],
          ])}
          <div className="form-field">
            <Label htmlFor="expense-amount">Tutar (₺) *</Label>
            <Input
              id="expense-amount"
              required
              type="number"
              min="0.01"
              step="0.01"
              value={value.amount || ''}
              onChange={(e) => patch({ amount: Number(e.target.value) })}
            />
          </div>
          {choice(
            'category',
            'Kategori',
            [
              ...new Set(
                ['Kira', 'Malzeme', 'Fatura', 'Hizmet', 'Personel', value.category].filter(Boolean),
              ),
            ].map((v) => [v, v]),
          )}
          {choice('transactionMode', 'İşlem sıklığı', [
            ['ONE_TIME', 'Tek seferlik'],
            ['RECURRING', 'Tekrarlayan'],
          ])}
          {!recurring && (
            <div className="form-field">
              <Label htmlFor="expense-date">İşlem tarihi *</Label>
              <Input
                id="expense-date"
                required
                type="date"
                value={value.date}
                onChange={(e) => patch({ date: e.target.value })}
              />
            </div>
          )}
          {recurring && (
            <>
              {choice('recurringPeriod', 'Tekrar dönemi', [
                ['DAILY', 'Günlük'],
                ['WEEKLY', 'Haftalık'],
                ['MONTHLY', 'Aylık'],
                ['YEARLY', 'Yıllık'],
              ])}
              <div className="form-field">
                <Label htmlFor="expense-start">Başlangıç tarihi *</Label>
                <Input
                  id="expense-start"
                  required
                  type="date"
                  value={value.recurringStartDate || ''}
                  onChange={(e) => patch({ recurringStartDate: e.target.value })}
                />
              </div>
            </>
          )}
        </div>
        <div className="form-field">
          <Label htmlFor="expense-note">Açıklama *</Label>
          <Textarea
            id="expense-note"
            required
            maxLength={1500}
            value={value.note}
            onChange={(e) => patch({ note: e.target.value })}
          />
        </div>
      </fieldset>
      <fieldset className="form-section form-section-optional" data-form-section="optional">
        <legend>
          Takip ayarları <span>İsteğe bağlı</span>
        </legend>
        <div className="form-grid">
          {choice(
            'status',
            value.type === 'INCOME' ? 'Tahsilat durumu' : 'Ödeme durumu',
            [
              ['Bekliyor', 'Bekliyor'],
              ['Ödendi', value.type === 'INCOME' ? 'Tahsil edildi' : 'Ödendi'],
            ],
            false,
          )}
          {recurring && (
            <div className="form-field">
              <Label htmlFor="expense-end">Bitiş tarihi</Label>
              <Input
                id="expense-end"
                type="date"
                min={value.recurringStartDate || undefined}
                value={value.recurringEndDate || ''}
                onChange={(e) => patch({ recurringEndDate: e.target.value })}
              />
              <p className="field-hint">Bitiş tarihi yoksa boş bırakın.</p>
            </div>
          )}
        </div>
        {recurring && (
          <div className="field-checkbox">
            <Switch
              id="expense-active"
              checked={value.isRecurringActive ?? true}
              onCheckedChange={(isRecurringActive) => patch({ isRecurringActive })}
            />
            <Label htmlFor="expense-active">Tekrarlayan işlem aktif</Label>
          </div>
        )}
      </fieldset>
    </>
  );
}
