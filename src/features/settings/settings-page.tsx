import { SaveActionBar } from '@/components/shared/save-action-bar';
import { useWorkspace } from '@/app/workspace-provider';
import { PageHeading } from '@/components/shared/primitives';
import { Icon } from '@/components/shared/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProfileImageInput } from '@/components/ui/profile-image-input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { navigation, navRoute } from '@/data/navigation';
import { usePageState } from '@/hooks/use-page-state';
import { normalizePhone } from '@/lib/validation';
import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { BankSettings } from './bank-settings';
import { IntegrationSettings } from './integration-settings';
import { settingSections, settingFieldError, type SettingField } from './settings-model';
import { SuperSettingsPage } from './super-settings-page';
export function SettingsPage({ route, embedded = false }: { route: string; embedded?: boolean }) {
  if (route.startsWith('super/')) return <SuperSettingsPage />;
  return <BranchSettingsPage route={route} embedded={embedded} />;
}
function BranchSettingsPage({ route, embedded }: { route: string; embedded: boolean }) {
  const { state, dispatch } = useWorkspace();
  const formId = useId();
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>({});
  const slug = route.split('/').at(-1) || 'general',
    section = slug === 'settings' ? 'general' : slug;
  const config = settingSections[section],
    account = section === 'account';
  const defaults = {
    ...state.settings,
    companyName: state.settings.companyName || state.settings.branchName || '',
    profileName: state.settings.profileName || 'Furkan Çolak',
    defaultInstallments: state.settings.defaultInstallments || '6',
    reminderDays: state.settings.reminderDays ?? '3',
    'payment:Nakit ödeme': state.settings['payment:Nakit ödeme'] ?? 'true',
    'payment:Havale / EFT': state.settings['payment:Havale / EFT'] ?? 'true',
    'payment:Kredi kartı': state.settings['payment:Kredi kartı'] ?? 'true',
  };
  const [values, setValues] = usePageState<Record<string, string>>('values', defaults),
    [errors, setErrors] = useState<Record<string, string>>({});
  const tabs = account
    ? []
    : navigation.flatMap((g) => g.items).find((i) => i.path === '/admin/settings')?.children || [];
  const trackedKeys = [
    ...(config?.fields.map((f) => f.key) || []),
    ...(config?.toggles.map((t) => `${section}:${t}`) || []),
    ...(account ? ['profileImage'] : []),
    ...(section === 'general' ? ['logoBlack', 'logoWhite', 'currency'] : []),
  ];
  const baseline: Record<string, string> = defaults;
  const comparable = (record: Record<string, string>, key: string) =>
    record[key] ||
    (key === 'currency'
      ? 'TRY'
      : config?.toggles.some((t) => key === `${section}:${t}`)
        ? 'false'
        : '');
  const dirtyCount = trackedKeys.filter(
    (key) => comparable(values, key) !== comparable(baseline, key),
  ).length;
  const discard = () => {
    setValues(defaults);
    setErrors({});
    setEditingFields({});
  };
  const field = (f: SettingField) => (
    <div key={f.key} className="form-field">
      <Label htmlFor={`settings-${f.key}`}>
        {f.label}
        {f.required ? ' *' : ''}
      </Label>
      {!editingFields[f.key] && !!values[f.key] && !errors[f.key] ? (
        <Button
          type="button"
          variant="ghost"
          id={`settings-${f.key}`}
          className="editable-setting-value"
          aria-label={`${f.label} düzenle`}
          onClick={() => setEditingFields((fields) => ({ ...fields, [f.key]: true }))}
        >
          <span>{values[f.key]}</span>
          <Icon name="pencil" />
        </Button>
      ) : f.type === 'textarea' ? (
        <Textarea
          autoFocus={!!editingFields[f.key]}
          id={`settings-${f.key}`}
          value={values[f.key] || ''}
          required={f.required}
          placeholder={f.placeholder || `${f.label} yazın…`}
          aria-invalid={!!errors[f.key]}
          aria-describedby={errors[f.key] ? `settings-${f.key}-error` : undefined}
          onChange={(e) => {
            setValues({ ...values, [f.key]: e.target.value });
            setErrors({ ...errors, [f.key]: '' });
          }}
        />
      ) : (
        <Input
          autoFocus={!!editingFields[f.key]}
          id={`settings-${f.key}`}
          name={f.key}
          type={f.type || 'text'}
          min={f.min}
          max={f.max}
          step={f.type === 'number' ? 1 : undefined}
          required={f.required}
          placeholder={f.placeholder || `${f.label} girin`}
          value={values[f.key] || ''}
          aria-invalid={!!errors[f.key]}
          aria-describedby={errors[f.key] ? `settings-${f.key}-error` : undefined}
          onValueChange={(value) => {
            setValues({ ...values, [f.key]: value });
            setErrors({ ...errors, [f.key]: '' });
          }}
        />
      )}
      {errors[f.key] && (
        <p id={`settings-${f.key}-error`} className="field-error">
          {errors[f.key]}
        </p>
      )}
    </div>
  );
  return (
    <>
      {!embedded && (
        <PageHeading
          title={account ? 'Hesabım' : 'Ayarlar'}
          description="Çalışma alanınızı ekibinize göre düzenleyin."
        />
      )}
      <div className={embedded ? 'settings-embedded' : 'settings-layout'}>
        {!embedded && (
          <nav className="settings-menu" aria-label="Ayarlar bölümleri">
            {account && (
              <Link className="active" aria-current="page" to="/user/account">
                Profil bilgileri
              </Link>
            )}
            {tabs.map((t) => (
              <Link
                key={t.path}
                className={
                  navRoute(t.path) === route ||
                  (t.path.endsWith('/general') && section === 'general')
                    ? 'active'
                    : ''
                }
                aria-current={
                  navRoute(t.path) === route ||
                  (t.path.endsWith('/general') && section === 'general')
                    ? 'page'
                    : undefined
                }
                to={`/${navRoute(t.path)}`}
              >
                {t.label}
              </Link>
            ))}
          </nav>
        )}
        <div className="settings-content">
          {section === 'bank' ? (
            <BankSettings />
          ) : config ? (
            <form
              id={formId}
              className="settings-form"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                const changes: Record<string, string> = {},
                  invalid: Record<string, string> = {};
                for (const f of config.fields) {
                  const value = String(values[f.key] ?? '').trim();
                  const error = settingFieldError(f, value, state.settings[f.key]);
                  if (error) invalid[f.key] = error;
                  changes[f.key] =
                    f.type === 'tel'
                      ? normalizePhone(value)
                      : f.type === 'email'
                        ? value.toLowerCase()
                        : f.key === 'iban'
                          ? value.replace(/\s/g, '').toUpperCase()
                          : value;
                }
                if (
                  section === 'payment' &&
                  !['Nakit ödeme', 'Havale / EFT', 'Kredi kartı'].some(
                    (m) => values[`payment:${m}`] === 'true',
                  )
                ) {
                  toast.error('En az bir ödeme yöntemi açık olmalıdır.');
                  return;
                }
                setErrors(invalid);
                if (Object.keys(invalid).length) {
                  setEditingFields((fields) => ({ ...fields, [Object.keys(invalid)[0]]: true }));
                  requestAnimationFrame(() =>
                    document.getElementById(`settings-${Object.keys(invalid)[0]}`)?.focus(),
                  );
                  return;
                }
                for (const toggle of config.toggles) {
                  const key = `${section}:${toggle}`;
                  changes[key] = values[key] || 'false';
                }
                if (section === 'general') {
                  changes.logoWhite = values.logoWhite || '';
                  changes.logoBlack = values.logoBlack || '';
                }
                if (account) {
                  changes.profileImage = values.profileImage || '';
                }
                if (['bank', 'general'].includes(section))
                  changes[section === 'bank' ? 'bankCurrency' : 'currency'] =
                    values.currency || 'TRY';
                dispatch({ type: 'settings/save', values: changes });
                setValues((old) => ({ ...old, ...changes }));
                setEditingFields({});
                toast.success('Ayarlar kaydedildi.');
              }}
            >
              <div className="settings-section-heading">
                <h2>{config.title}</h2>
                <p>{config.description}</p>
              </div>
              <fieldset className="form-section" data-form-section="required">
                <legend>
                  Temel bilgiler <span>Zorunlu</span>
                </legend>
                <div className="form-grid">
                  {config.fields.filter((f) => f.required).map(field)}
                </div>
              </fieldset>
              {(config.fields.some((f) => !f.required) || account || section === 'general') && (
                <fieldset
                  className="form-section form-section-optional"
                  data-form-section="optional"
                >
                  <legend>
                    Ek bilgiler <span>İsteğe bağlı</span>
                  </legend>
                  <div className="form-grid">
                    {config.fields.filter((f) => !f.required).map(field)}
                    {section === 'general' && (
                      <div className="form-field">
                        <Label htmlFor="settings-currency">Para birimi</Label>
                        <Select
                          value={values.currency || 'TRY'}
                          onValueChange={(v) =>
                            setValues({
                              ...values,
                              currency: v,
                            })
                          }
                        >
                          <SelectTrigger id="settings-currency">
                            <SelectValue placeholder="Para birimi seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {['TRY', 'USD', 'EUR', 'GBP'].map((v) => (
                              <SelectItem key={v} value={v}>
                                {v}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {account && (
                      <ProfileImageInput
                        value={values.profileImage || ''}
                        onChange={(profileImage) => setValues({ ...values, profileImage })}
                      />
                    )}{' '}
                    {section === 'general' && (
                      <>
                        <ProfileImageInput
                          label="Açık zemin logosu"
                          value={values.logoBlack || ''}
                          onChange={(logoBlack) => setValues({ ...values, logoBlack })}
                        />
                        <ProfileImageInput
                          label="Koyu zemin logosu"
                          value={values.logoWhite || ''}
                          onChange={(logoWhite) => setValues({ ...values, logoWhite })}
                        />
                      </>
                    )}
                  </div>
                </fieldset>
              )}
              {config.toggles.map((t, i) => {
                const key = `${section}:${t}`;
                return (
                  <div key={key} className="setting-switch">
                    <Label htmlFor={`setting-toggle-${i}`}>{t}</Label>
                    <Switch
                      id={`setting-toggle-${i}`}
                      checked={values[key] === 'true'}
                      onCheckedChange={(v) => setValues({ ...values, [key]: String(v) })}
                    />
                  </div>
                );
              })}
              <SaveActionBar
                count={dirtyCount}
                onDiscard={discard}
                form={formId}
                label={`${config.title} değişiklikleri`}
              />
            </form>
          ) : (
            <IntegrationSettings key={section} section={section} />
          )}{' '}
          {section === 'payment' && <IntegrationSettings section="iyzico" />}
        </div>
      </div>
    </>
  );
}
