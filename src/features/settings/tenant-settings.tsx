import { SaveActionBar } from '@/components/shared/save-action-bar';
import { useWorkspace } from '@/app/workspace-provider';
import { toast } from 'sonner';
import { useState, useId } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
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

const providerPolicies = [
  ['tenant_only', 'Yalnız kurum ayarları'],
  ['branch_then_tenant', 'Önce şube, yoksa kurum ayarları'],
  ['branch_only', 'Yalnız şube ayarları'],
];
const meetingResults = [
  ['APPOINTMENT', 'Randevu'],
  ['CALLBACK', 'Tekrar arama'],
  ['NEGATIVE', 'Olumsuz'],
  ['SALE', 'Satış'],
  ['COMPLETED', 'Tamamlandı'],
  ['SMS_NOTIFICATION', 'SMS bildirimi'],
  ['EMAIL_NOTIFICATION', 'E-posta bildirimi'],
  ['PENDING', 'Beklemede'],
];
const paymentTypes = [
  ['CASH', 'Nakit'],
  ['BANK_TRANSFER', 'Havale / EFT'],
  ['CREDIT_CARD_SINGLE', 'Kredi kartı'],
  ['IYZICO', 'iyzico'],
  ['PROMISSORY_NOTE', 'Senet'],
];

/** Tenant policies are server-owned; editing a draft must never change access locally. */
export function TenantSettings() {
  const { state, dispatch } = useWorkspace();
  let stored: { values?: Record<string, string>; lists?: Record<string, string[]> } = {};
  try {
    stored = JSON.parse(state.settings['tenant-policy-draft'] || '{}');
  } catch {
    /* Start a new draft. */
  }
  const [values, setValues] = useState<Record<string, string>>({
    name: 'Jamaster',
    status: 'active',
    sms: 'branch_then_tenant',
    email: 'branch_then_tenant',
    payment: 'branch_then_tenant',
    meetingMode: 'auto',
    saleMode: 'auto',
    installmentPaymentMode: 'auto',
    ...stored.values,
  });
  const formId = useId();
  const [lists, setLists] = useState<Record<string, string[]>>(stored.lists || {});
  const [baseline, setBaseline] = useState(() => ({ values, lists }));
  const dirty = JSON.stringify({ values, lists }) !== JSON.stringify(baseline);
  const choice = (key: string, label: string, options: string[][]) => (
    <div className="form-field" key={key}>
      <Label htmlFor={`tenant-${key}`}>{label}</Label>
      <Select
        value={values[key]}
        onValueChange={(value) => setValues((previous) => ({ ...previous, [key]: value }))}
      >
        <SelectTrigger id={`tenant-${key}`}>
          <SelectValue placeholder={`${label} seçin`} />
        </SelectTrigger>
        <SelectContent>
          {options.map(([value, title]) => (
            <SelectItem key={value} value={value}>
              {title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
  const toggle = (key: string, label: string, hint: string) => (
    <div className="setting-switch" key={key}>
      <div>
        <Label htmlFor={`tenant-${key}`}>{label}</Label>
        <p className="field-hint">{hint}</p>
      </div>
      <Switch
        id={`tenant-${key}`}
        checked={values[key] === 'true'}
        onCheckedChange={(checked) =>
          setValues((previous) => ({ ...previous, [key]: String(checked) }))
        }
      />
    </div>
  );
  const verification = (mode: string, list: string, label: string, options: string[][]) => (
    <div className="form-section" key={mode}>
      {choice(mode, label, [
        ['auto', 'Otomatik onay'],
        ['manual', 'Manuel onay'],
      ])}
      {values[mode] === 'manual' && (
        <fieldset className="mt-4 space-y-3">
          <legend className="mb-2">Onay gerektiren işlemler</legend>
          <p className="field-hint">Seçim yapılmazsa tümü için onay gerekir.</p>
          <div className="form-grid">
            {options.map(([value, title]) => (
              <div className="field-checkbox" key={value}>
                <Checkbox
                  id={`tenant-${list}-${value}`}
                  checked={(lists[list] || []).includes(value)}
                  onCheckedChange={(checked) =>
                    setLists((previous) => ({
                      ...previous,
                      [list]: checked
                        ? [...new Set([...(previous[list] || []), value])]
                        : (previous[list] || []).filter((item) => item !== value),
                    }))
                  }
                />
                <Label htmlFor={`tenant-${list}-${value}`}>{title}</Label>
              </div>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
  return (
    <form
      id={formId}
      className="settings-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!values.name.trim()) return;
        dispatch({
          type: 'settings/save',
          values: { 'tenant-policy-draft': JSON.stringify({ values, lists }) },
        });
        setBaseline({ values, lists });
        toast.success('Kurum tercihleri taslağı kaydedildi.');
      }}
    >
      <div className="settings-section-heading">
        <h2>Kurum ve işlem tercihleri</h2>
        <p>Şubeler için ortak servis ve doğrulama politikaları.</p>
      </div>
      <p className="pending-banner" role="status">
        Tercihler taslak olarak saklanır. Canlı hesabınızın erişim veya onay kurallarını
        değiştirmez.
      </p>
      <fieldset className="form-section" data-form-section="required">
        <legend>
          Kurum bilgileri <span>Zorunlu</span>
        </legend>
        <div className="form-grid">
          <div className="form-field">
            <Label htmlFor="tenant-name">Kurum adı *</Label>
            <Input
              id="tenant-name"
              name="name"
              placeholder="Kurumun görünen adını girin"
              required
              value={values.name}
              onChange={(event) => setValues({ ...values, name: event.target.value })}
            />
          </div>
          {choice('status', 'Durum *', [
            ['active', 'Aktif'],
            ['inactive', 'Pasif'],
          ])}
        </div>
      </fieldset>
      <fieldset className="form-section form-section-optional" data-form-section="optional">
        <legend>
          Çalışma tercihleri <span>İsteğe bağlı</span>
        </legend>
        {toggle(
          'restrictBranchAccessOnUnpaidInvoices',
          'Ödenmemiş faturada şube erişimini sınırla',
          'Erişim kuralı kurumun fatura durumuna göre uygulanır.',
        )}
        {toggle(
          'aiEnabled',
          'JamAI özelliklerini etkinleştir',
          'Kurum genelinde yapay zekâ özelliklerinin kullanımını yönetir.',
        )}
        <div className="form-grid">
          {choice('sms', 'SMS ayar kaynağı', providerPolicies)}
          {choice('email', 'E-posta ayar kaynağı', providerPolicies)}
          {choice('payment', 'Ödeme ayar kaynağı', providerPolicies)}
        </div>
      </fieldset>
      <section aria-label="İşlem doğrulama tercihleri">
        <h3 className="mb-4">İşlem doğrulama</h3>
        {verification('meetingMode', 'meetingRequiredResults', 'Görüşme onayı', meetingResults)}
        {verification('saleMode', 'saleRequiredPaymentTypes', 'Satış onayı', paymentTypes)}
        {verification(
          'installmentPaymentMode',
          'installmentRequiredPaymentTypes',
          'Taksit ödemesi onayı',
          paymentTypes.filter(([key]) => key !== 'PROMISSORY_NOTE'),
        )}
      </section>
      <SaveActionBar
        count={dirty ? 1 : 0}
        form={formId}
        onDiscard={() => {
          setValues(baseline.values);
          setLists(baseline.lists);
        }}
      />
    </form>
  );
}
