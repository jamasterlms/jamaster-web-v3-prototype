import { SaveActionBar } from '@/components/shared/save-action-bar';
import { useState, useId } from 'react';
import { useWorkspace } from '@/app/workspace-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  bankCurrencies,
  bankErrors,
  blankBankAccount,
  readBankAccounts,
  saveBankAccount,
  type BankAccount,
} from './bank-model';
import { toast } from 'sonner';

export function BankSettings() {
  const { state, dispatch } = useWorkspace();
  const formId = useId();
  const accounts = readBankAccounts(state.settings);
  const [draft, setDraft] = useState<BankAccount>(() => accounts[0] || blankBankAccount());
  const [errors, setErrors] = useState<ReturnType<typeof bankErrors>>({});
  const [remove, setRemove] = useState(false);
  const [switchTo, setSwitchTo] = useState<string | null>(null);
  const original = accounts.find((a) => a.id === draft.id) || blankBankAccount();
  const dirty = JSON.stringify(draft) !== JSON.stringify(original);
  const select = (id: string) => {
    setDraft(accounts.find((a) => a.id === id) || blankBankAccount());
    setErrors({});
    setSwitchTo(null);
  };
  const patch = (value: Partial<BankAccount>) => {
    setDraft((old) => ({ ...old, ...value }));
    setErrors({});
  };
  const persist = (next: BankAccount[]) =>
    dispatch({ type: 'settings/save', values: { bankAccounts: JSON.stringify(next) } });
  const fields = (keys: ('bankName' | 'accountHolder' | 'accountNumber' | 'iban')[]) =>
    keys.map((key) => {
      const label = {
        bankName: 'Banka adı',
        accountHolder: 'Hesap sahibi',
        accountNumber: 'Hesap numarası',
        iban: 'IBAN',
      }[key];
      return (
        <div className="form-field" key={key}>
          <Label htmlFor={`bank-${key}`}>
            {label}
            {key !== 'iban' ? ' *' : ''}
          </Label>
          <Input
            id={`bank-${key}`}
            value={draft[key]}
            required={key !== 'iban'}
            placeholder={key === 'iban' ? 'TR00 0000 0000 0000 0000 0000 00' : `${label} girin`}
            aria-invalid={!!errors[key]}
            aria-describedby={errors[key] ? `bank-${key}-error` : undefined}
            onValueChange={(value) => patch({ [key]: value })}
          />
          {errors[key] && (
            <p className="field-error" id={`bank-${key}-error`}>
              {errors[key]}
            </p>
          )}
        </div>
      );
    });
  return (
    <section className="settings-form">
      <div className="settings-section-heading">
        <h2>Banka hesapları</h2>
        <p>Tahsilat hesaplarını ve varsayılan hesabınızı yönetin.</p>
      </div>
      <Tabs
        value={draft.id || 'new'}
        onValueChange={(id) => (dirty ? setSwitchTo(id) : select(id))}
      >
        <TabsList className="bank-account-tabs">
          {accounts.map((a) => (
            <TabsTrigger value={a.id} key={a.id}>
              {a.bankName} · {a.currency}
              {a.isDefault ? ' · Varsayılan' : ''}
            </TabsTrigger>
          ))}
          <TabsTrigger value="new">+ Yeni hesap</TabsTrigger>
        </TabsList>
      </Tabs>
      <form
        id={formId}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const invalid = bankErrors(draft, original);
          setErrors(invalid);
          if (Object.keys(invalid).length) {
            document.getElementById(`bank-${Object.keys(invalid)[0]}`)?.focus();
            return;
          }
          const account = { ...draft, id: draft.id || crypto.randomUUID() };
          const next = saveBankAccount(accounts, account);
          persist(next);
          setDraft(next.find((a) => a.id === account.id)!);
          toast.success('Banka hesabı kaydedildi.');
        }}
      >
        <fieldset className="form-section" data-form-section="required">
          <legend>
            Hesap bilgileri <span>Zorunlu</span>
          </legend>
          <div className="form-grid">
            {fields(['bankName', 'accountHolder', 'accountNumber'])}
            <div className="form-field">
              <Label htmlFor="bank-currency">Para birimi *</Label>
              <Select value={draft.currency} onValueChange={(currency) => patch({ currency })}>
                <SelectTrigger
                  id="bank-currency"
                  aria-invalid={!!errors.currency}
                  aria-describedby={errors.currency ? 'bank-currency-error' : undefined}
                >
                  <SelectValue placeholder="Para birimi seçin" />
                </SelectTrigger>
                <SelectContent>
                  {bankCurrencies.map((currency) => (
                    <SelectItem value={currency} key={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.currency && (
                <p id="bank-currency-error" className="field-error">
                  {errors.currency}
                </p>
              )}
            </div>
          </div>
        </fieldset>
        <fieldset className="form-section form-section-optional" data-form-section="optional">
          <legend>
            Ek bilgiler <span>İsteğe bağlı</span>
          </legend>
          <div className="form-grid">{fields(['iban'])}</div>
        </fieldset>
        <div className="setting-switch">
          <Label htmlFor="bank-default">Varsayılan hesap</Label>
          <Switch
            id="bank-default"
            checked={draft.isDefault}
            onCheckedChange={(isDefault) => patch({ isDefault })}
          />
        </div>
        <div className="setting-switch">
          <Label htmlFor="bank-active">Hesap aktif</Label>
          <Switch
            id="bank-active"
            checked={draft.isActive}
            onCheckedChange={(isActive) => patch({ isActive })}
          />
        </div>
        <div className="form-actions">
          {draft.id && (
            <Button type="button" variant="ghost" onClick={() => setRemove(true)}>
              Hesabı sil
            </Button>
          )}
          <SaveActionBar
            count={dirty ? 1 : 0}
            form={formId}
            onDiscard={() => {
              setDraft(original);
              setErrors({});
            }}
          />
        </div>
      </form>
      <Dialog
        open={remove || switchTo !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRemove(false);
            setSwitchTo(null);
          }
        }}
      >
        <DialogContent className="jam-modal">
          <DialogHeader>
            <DialogTitle>
              {remove ? 'Banka hesabı silinsin mi?' : 'Değişikliklerden vazgeçilsin mi?'}
            </DialogTitle>
            <DialogDescription>
              {remove
                ? `${draft.bankName} hesabı yeni tahsilat seçimlerinden kaldırılacak.`
                : 'Bu hesaptaki kaydedilmemiş değişiklikler korunmayacak.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRemove(false);
                setSwitchTo(null);
              }}
            >
              Geri dön
            </Button>
            <Button
              variant={remove ? 'destructive' : 'default'}
              onClick={() => {
                if (remove) {
                  const next = accounts.filter((a) => a.id !== draft.id);
                  persist(next);
                  setDraft(next[0] || blankBankAccount());
                  setRemove(false);
                  toast.success('Banka hesabı silindi.');
                } else if (switchTo !== null) select(switchTo);
              }}
            >
              {remove ? 'Hesabı sil' : 'Vazgeç ve geç'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
