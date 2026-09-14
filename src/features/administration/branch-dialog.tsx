import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { branchDraft, branchSchema, branchStatusLabels, type BranchDraft } from './branch-model';

export function BranchDialog({
  row,
  onSave,
  onClose,
}: {
  row?: string[];
  onSave: (draft: BranchDraft) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(() => branchDraft(row));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const patch = (value: Partial<BranchDraft>) => {
    setDraft((old) => ({ ...old, ...value }));
    setErrors({});
  };
  const field = (
    key:
      | 'name'
      | 'address'
      | 'email'
      | 'phone'
      | 'monthlyPayment'
      | 'paymentDay'
      | 'description'
      | 'website'
      | 'paymentDetails',
    label: string,
    type = 'text',
    required = false,
  ) => {
    const props = {
      id: `branch-${key}`,
      value: Number.isNaN(draft[key]) ? '' : String(draft[key]),
      required,
      placeholder: `${label} girin`,
      'aria-invalid': !!errors[key],
      'aria-describedby': errors[key] ? `branch-${key}-error` : undefined,
    };
    return (
      <div className="form-field" key={key}>
        <Label htmlFor={props.id}>
          {label}
          {required ? ' *' : ''}
        </Label>
        {type === 'textarea' ? (
          <Textarea {...props} onChange={(e) => patch({ [key]: e.target.value })} />
        ) : (
          <Input
            {...props}
            type={type}
            min={key === 'paymentDay' ? 1 : type === 'number' ? 0 : undefined}
            max={key === 'paymentDay' ? 31 : undefined}
            step={key === 'monthlyPayment' ? '0.01' : key === 'paymentDay' ? '1' : undefined}
            onValueChange={(value) =>
              patch({ [key]: type === 'number' ? (value === '' ? NaN : Number(value)) : value })
            }
          />
        )}
        {errors[key] && (
          <p id={`branch-${key}-error`} className="field-error">
            {errors[key]}
          </p>
        )}
      </div>
    );
  };
  const choose = (
    key: string,
    label: string,
    value: string,
    options: [string, string][],
    onChange: (value: string) => void,
    required = false,
  ) => (
    <div className="form-field">
      <Label htmlFor={`branch-${key}`}>
        {label}
        {required ? ' *' : ''}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={`branch-${key}`}>
          <SelectValue placeholder={`${label} seçin`} />
        </SelectTrigger>
        <SelectContent>
          {options.map(([id, name]) => (
            <SelectItem key={id} value={id}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent preventOutsideClose className="jam-modal dialog-wide">
        <DialogHeader>
          <DialogTitle>{draft.id ? 'Şubeyi düzenle' : 'Yeni şube'}</DialogTitle>
          <DialogDescription>Şube, iletişim ve ödeme bilgilerini belirleyin.</DialogDescription>
        </DialogHeader>
        <form
          className="dialog-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const parsed = branchSchema.safeParse(draft);
            if (!parsed.success) {
              const next = Object.fromEntries(
                parsed.error.issues.map((issue) => [issue.path.join('.'), issue.message]),
              );
              setErrors(next);
              document.getElementById(`branch-${Object.keys(next)[0]}`)?.focus();
              return;
            }
            onSave({ ...parsed.data, id: draft.id || crypto.randomUUID() });
          }}
        >
          <div className="dialog-form-body">
            <fieldset className="form-section" data-form-section="required">
              <legend>
                Şube ve ödeme bilgileri <span>Zorunlu</span>
              </legend>
              <div className="form-grid">
                {field('name', 'Şube adı', 'text', true)}
                {field('address', 'Adres', 'textarea', true)}
                {field('email', 'E-posta', 'email', true)}
                {field('phone', 'Telefon', 'tel', true)}
                {field('monthlyPayment', 'Aylık ödeme', 'number', true)}
                {field('paymentDay', 'Ödeme günü', 'number', true)}
                {choose(
                  'status',
                  'Durum',
                  draft.status,
                  Object.entries(branchStatusLabels),
                  (status) => patch({ status: status as BranchDraft['status'] }),
                  true,
                )}
              </div>
            </fieldset>
            <fieldset className="form-section form-section-optional" data-form-section="optional">
              <legend>
                Ek bilgiler ve tercihler <span>İsteğe bağlı</span>
              </legend>
              <div className="form-grid">
                {field('description', 'Açıklama')}
                {field('website', 'Web sitesi', 'url')}
                {choose(
                  'paymentCurrency',
                  'Ödeme para birimi',
                  draft.paymentCurrency,
                  ['TRY', 'USD', 'EUR'].map((v) => [v, v]),
                  (paymentCurrency) =>
                    patch({ paymentCurrency: paymentCurrency as BranchDraft['paymentCurrency'] }),
                )}
                {choose(
                  'currency',
                  'Çalışma alanı para birimi',
                  draft.settings.currency,
                  ['TRY', 'USD', 'EUR', 'GBP'].map((v) => [v, v]),
                  (currency) =>
                    patch({
                      settings: {
                        ...draft.settings,
                        currency: currency as BranchDraft['settings']['currency'],
                      },
                    }),
                )}
                {choose(
                  'language',
                  'Çalışma alanı dili',
                  draft.settings.language,
                  [
                    ['tr', 'Türkçe'],
                    ['en', 'İngilizce'],
                  ],
                  (language) =>
                    patch({ settings: { ...draft.settings, language: language as 'tr' | 'en' } }),
                )}
                {field('paymentDetails', 'Ödeme açıklaması', 'textarea')}
              </div>
            </fieldset>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Vazgeç
            </Button>
            <Button type="submit">Şubeyi kaydet</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
