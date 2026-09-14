import { SaveActionBar } from '@/components/shared/save-action-bar';
import { useWorkspace } from '@/app/workspace-provider';
import { toast } from 'sonner';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Icon } from '@/components/shared/icon';
import { Link } from 'react-router-dom';
const integrations: Record<string, { title: string; fields: [string, string, string?][] }> = {
  sms: {
    title: 'Mutlucell SMS',
    fields: [
      ['username', 'Kullanıcı adı'],
      ['password', 'Şifre', 'password'],
      ['originator', 'Gönderici başlığı'],
    ],
  },
  email: {
    title: 'E-posta / SMTP',
    fields: [
      ['smtpHost', 'SMTP sunucusu'],
      ['smtpPort', 'SMTP portu', 'number'],
      ['smtpUser', 'Kullanıcı e-postası', 'email'],
      ['smtpPass', 'SMTP şifresi', 'password'],
      ['mailerSender', 'Gönderici adı'],
      ['mailerSenderEmail', 'Gönderici e-postası', 'email'],
    ],
  },
  whatsapp: {
    title: 'WhatsApp Business',
    fields: [
      ['phoneNumberId', 'Telefon numarası kimliği'],
      ['businessAccountId', 'İşletme hesabı kimliği'],
      ['apiVersion', 'API sürümü'],
      ['accessToken', 'Erişim anahtarı', 'password'],
      ['webhookVerifyToken', 'Webhook doğrulama anahtarı', 'password'],
      ['appSecret', 'Uygulama gizli anahtarı', 'password'],
    ],
  },
  iyzico: {
    title: 'iyzico ödeme bağlantısı',
    fields: [
      ['clientKey', 'API anahtarı', 'password'],
      ['secretKey', 'Gizli anahtar', 'password'],
    ],
  },
};
export function IntegrationSettings({ section }: { section: string }) {
  const { state, dispatch } = useWorkspace();
  let stored: Record<string, string> = {};
  try {
    stored = JSON.parse(state.settings[`integration-draft-${section}`] || '{}');
  } catch {
    /* Start a fresh draft. */
  }
  const [validation, setValidation] = useState('');
  // Connection secrets never enter page-state or browser storage.
  const [values, setValues] = useState<Record<string, string>>({
      ...(section === 'whatsapp' ? { apiVersion: 'v23.0' } : {}),
      ...stored,
    }),
    [visible, setVisible] = useState(false);
  const config = integrations[section];
  const [baseline, setBaseline] = useState(values);
  const dirty = JSON.stringify(values) !== JSON.stringify(baseline);
  if (!config)
    return (
      <section className="settings-form">
        <h2>Entegrasyonlar</h2>
        <p className="field-hint">Bağlantıların yapılandırma alanlarını açın.</p>
        <div className="integration-links">
          {Object.entries(integrations).map(([key, c]) => (
            <Button variant="outline" asChild key={key}>
              <Link to={`/admin/settings/${key === 'iyzico' ? 'payment' : key}`}>
                {c.title}
                <Icon name="arrow-up-right" />
              </Link>
            </Button>
          ))}
        </div>
      </section>
    );
  return (
    <section className="settings-form">
      <div className="settings-section-heading">
        <h2>{config.title}</h2>
        <p>Gönderici ve servis bağlantı bilgileri.</p>
      </div>

      <fieldset className="form-section" data-form-section="required">
        <legend>
          Bağlantı bilgileri <span>Zorunlu</span>
        </legend>
        <div className="form-grid">
          {section === 'iyzico' && (
            <div className="setting-switch">
              <div>
                <Label htmlFor="iyzico-mode">Canlı ortam</Label>
                <p className="field-hint">
                  {values.mode === 'true'
                    ? 'Canlı ödeme ortamı seçili.'
                    : 'Sandbox: test ortamı seçili.'}
                </p>
              </div>
              <Switch
                id="iyzico-mode"
                checked={values.mode === 'true'}
                onCheckedChange={(mode) => setValues({ ...values, mode: String(mode) })}
              />
            </div>
          )}
          {config.fields.map(([key, label, type]) => (
            <div className="form-field" key={key}>
              <Label htmlFor={`integration-${key}`}>{label} *</Label>
              <Input
                id={`integration-${key}`}
                name={key}
                required
                type={type === 'password' && visible ? 'text' : type || 'text'}
                placeholder={
                  key === 'smtpPort' ? '587' : key === 'apiVersion' ? 'v23.0' : `${label} girin`
                }
                autoComplete="off"
                min={key === 'smtpPort' ? 1 : undefined}
                max={key === 'smtpPort' ? 65535 : undefined}
                value={values[key] || ''}
                onChange={(e) => setValues({ ...values, [key]: e.target.value })}
              />
            </div>
          ))}
        </div>
        {section === 'email' && (
          <div className="form-field mt-4">
            <Label htmlFor="smtp-secure">Bağlantı güvenliği *</Label>
            <Select
              required
              value={values.smtpSecure || ''}
              onValueChange={(smtpSecure) => setValues({ ...values, smtpSecure })}
            >
              <SelectTrigger id="smtp-secure">
                <SelectValue placeholder="Güvenlik türünü seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ssl">SSL</SelectItem>
                <SelectItem value="tls">TLS</SelectItem>
                <SelectItem value="none">Şifreleme yok</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </fieldset>
      {section === 'whatsapp' && (
        <fieldset className="form-section form-section-optional" data-form-section="optional">
          <legend>
            Meta ile hızlı kurulum <span>İsteğe bağlı</span>
          </legend>
          <div className="form-field">
            <Label htmlFor="meta-app-id">Meta uygulama kimliği</Label>
            <Input
              id="meta-app-id"
              placeholder="Meta uygulama kimliğini girin"
              value={values.metaAppId || ''}
              onChange={(event) => setValues({ ...values, metaAppId: event.target.value })}
            />
          </div>
          <div className="form-actions">
            <Button variant="outline" disabled>
              Meta ile giriş yap
            </Button>
            <Button variant="outline" disabled>
              Kodu erişim anahtarına dönüştür
            </Button>
          </div>
        </fieldset>
      )}
      <Button variant="ghost" size="sm" onClick={() => setVisible(!visible)} aria-pressed={visible}>
        <Icon name={visible ? 'eye-off' : 'eye'} />
        {visible ? 'Anahtarları gizle' : 'Anahtarları göster'}
      </Button>
      {validation && (
        <p className="field-hint" role="status">
          {validation}
        </p>
      )}
      <div className="form-actions">
        <Button
          variant="outline"
          onClick={() => {
            const missing = config.fields
              .filter(([key]) => !values[key]?.trim())
              .map(([, label]) => label);
            if (missing.length) {
              setValidation(`Tamamlanması gereken alanlar: ${missing.join(', ')}`);
              return;
            }
            if (
              section === 'email' &&
              (!/^\S+@\S+\.\S+$/.test(values.smtpUser || '') ||
                !/^\S+@\S+\.\S+$/.test(values.mailerSenderEmail || '') ||
                !Number.isInteger(Number(values.smtpPort)) ||
                Number(values.smtpPort) < 1 ||
                Number(values.smtpPort) > 65535 ||
                !values.smtpSecure)
            ) {
              setValidation(
                'E-posta adreslerini, portu (1–65535) ve güvenlik türünü kontrol edin.',
              );
              return;
            }
            setValidation('Alan kontrolü tamamlandı. Servis bağlantısı test edilmedi.');
          }}
        >
          Alanları kontrol et
        </Button>
        <SaveActionBar
          count={dirty ? 1 : 0}
          onDiscard={() => {
            setValues(baseline);
            setValidation('');
          }}
          onSave={() => {
            const secrets = new Set(
              config.fields.filter(([, , type]) => type === 'password').map(([key]) => key),
            );
            const draft = Object.fromEntries(
              Object.entries(values).filter(([key]) => !secrets.has(key)),
            );
            dispatch({
              type: 'settings/save',
              values: { [`integration-draft-${section}`]: JSON.stringify(draft) },
            });
            setValues(draft);
            setBaseline(draft);
            setValidation('');
            toast.success('Gizli anahtarlar hariç ayar taslağı kaydedildi.');
          }}
        />
      </div>
    </section>
  );
}
