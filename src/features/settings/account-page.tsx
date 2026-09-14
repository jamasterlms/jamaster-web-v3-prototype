import { SaveActionBar } from '@/components/shared/save-action-bar';
import { SecuritySettings } from './security-settings';
import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useWorkspace } from '@/app/workspace-provider';
import { displayScales, useDisplay } from '@/app/display-provider';
import { PageHeading, IconButton } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { SettingsPage } from './settings-page';
import { toast } from 'sonner';
export type Shortcut = { id: string; title: string; href: string };
export function readShortcuts(value: string | undefined): Shortcut[] {
  try {
    const items = JSON.parse(value || '[]');
    return Array.isArray(items)
      ? items.filter(
          (v) =>
            v && typeof v.id === 'string' && typeof v.title === 'string' && safeShortcut(v.href),
        )
      : [];
  } catch {
    return [];
  }
}
export function safeShortcut(href: unknown): href is string {
  if (typeof href !== 'string' || /[\\\s\u0000-\u001f]/.test(href)) return false;
  if (/^\/(?!\/)/.test(href)) return true;
  try {
    const url = new URL(href);
    return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password;
  } catch {
    return false;
  }
}
export function AccountPage() {
  const [params] = useSearchParams();
  const tabs = {
    account: 'Hesap',
    preferences: 'Tercihler',
    cards: 'Kartlar',
    notifications: 'Bildirim ayarları',
  };
  const requested = params.get('tab') || 'account';
  const tab = requested in tabs ? requested : 'account';
  return (
    <>
      <PageHeading
        title="Hesap ayarları"
        description="Profilinizi, tercihlerinizi ve bildirimlerinizi yönetin."
      />
      <div className="settings-layout">
        <nav className="settings-menu" aria-label="Hesap ayarları bölümleri">
          {Object.entries(tabs).map(([value, label]) => (
            <Link
              key={value}
              to={`/user/account?tab=${value}`}
              className={tab === value ? 'active' : ''}
              aria-current={tab === value ? 'page' : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="settings-content">
          {tab === 'account' ? (
            <>
              <SettingsPage route="user/account" embedded />
              <SecuritySettings />
            </>
          ) : tab === 'preferences' ? (
            <PreferencesSettings />
          ) : tab === 'notifications' ? (
            <NotificationPreferences />
          ) : (
            <>
              <div className="settings-section-heading">
                <h2>Kayıtlı kartlar</h2>
                <p>Hesabınızla ilişkilendirilmiş ödeme kartları.</p>
              </div>
              <Card className="service-notice">
                <p>Kayıtlı kartlar ve ödeme yöntemleri artık ödeme merkezinde yönetiliyor.</p>
                <Button asChild>
                  <Link to="/payment?tab=cards">Kartlarımı yönet</Link>
                </Button>
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  );
}
function PreferencesSettings() {
  const { state, dispatch } = useWorkspace(),
    display = useDisplay();
  const [editing, setEditing] = useState<Shortcut | null>(null),
    [error, setError] = useState('');
  const [shortcuts, setShortcuts] = useState(() => readShortcuts(state.settings.shortcuts));
  const [prefs, setPrefs] = useState({
    scale: display.scale,
    toolsOpen: display.toolsOpen,
    privacy: state.privacy,
  });
  const persisted = { scale: display.scale, toolsOpen: display.toolsOpen, privacy: state.privacy };
  const dirty =
    JSON.stringify(prefs) !== JSON.stringify(persisted) ||
    JSON.stringify(shortcuts) !== JSON.stringify(readShortcuts(state.settings.shortcuts));
  const write = setShortcuts;
  const move = (index: number, direction: number) => {
    const target = index + direction;
    if (target < 0 || target >= shortcuts.length) return;
    const next = [...shortcuts];
    [next[index], next[target]] = [next[target], next[index]];
    write(next);
  };
  return (
    <>
      <div className="settings-section-heading">
        <h2>Tercihler</h2>
        <p>Görünümünüzü ve kısayollarınızı düzenleyin.</p>
      </div>
      <Card className="portal-section">
        <div className="form-grid">
          <div className="form-field">
            <Label htmlFor="preference-scale">Uygulama ölçeği</Label>
            <Select
              value={String(prefs.scale)}
              onValueChange={(v) => setPrefs({ ...prefs, scale: Number(v) })}
            >
              <SelectTrigger id="preference-scale">
                <SelectValue placeholder="Ölçek seçin" />
              </SelectTrigger>
              <SelectContent>
                {displayScales.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    %{s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="setting-switch">
            <Label htmlFor="preference-tools">Sağ araç paneli</Label>
            <Switch
              id="preference-tools"
              checked={prefs.toolsOpen}
              onCheckedChange={(toolsOpen) => setPrefs({ ...prefs, toolsOpen })}
            />
          </div>
          <div className="setting-switch">
            <Label htmlFor="preference-privacy">Hassas bilgileri gizle</Label>
            <Switch
              id="preference-privacy"
              checked={prefs.privacy}
              onCheckedChange={(v) => {
                setPrefs({ ...prefs, privacy: v });
              }}
            />
          </div>
        </div>
        <p className="field-hint">
          Sağ panel açıkken kayıtlar önce önizlemede açılır. Çift tıklama detay sayfasına gider.
        </p>
      </Card>
      <section className="entity-notes">
        <div className="module-toolbar">
          <h2 className="subsection-title">Kısayollar</h2>
          <Button
            onClick={() => {
              setError('');
              setEditing({ id: crypto.randomUUID(), title: '', href: '' });
            }}
          >
            Kısayol ekle
          </Button>
        </div>
        {shortcuts.map((s, i) => (
          <Card key={s.id} className="shortcut-setting-row">
            <div>
              <strong>{s.title}</strong>
              <p>{s.href}</p>
            </div>
            <div className="table-actions">
              <IconButton
                icon="chevron-up"
                label={`${s.title} yukarı taşı`}
                disabled={i === 0}
                onClick={() => move(i, -1)}
              />
              <IconButton
                icon="chevron-down"
                label={`${s.title} aşağı taşı`}
                disabled={i === shortcuts.length - 1}
                onClick={() => move(i, 1)}
              />
              <IconButton
                icon="pencil"
                label="Kısayolu düzenle"
                onClick={() => {
                  setError('');
                  setEditing({ ...s });
                }}
              />
              <IconButton
                icon="trash2"
                label="Kısayolu kaldır"
                onClick={() => write(shortcuts.filter((v) => v.id !== s.id))}
              />
            </div>
          </Card>
        ))}
        {!shortcuts.length && <p className="empty-inline">Kişisel kısayol eklenmedi.</p>}
      </section>
      <SaveActionBar
        count={dirty ? 1 : 0}
        onDiscard={() => {
          setPrefs(persisted);
          setShortcuts(readShortcuts(state.settings.shortcuts));
        }}
        onSave={() => {
          display.setScale(prefs.scale);
          display.setToolsOpen(prefs.toolsOpen);
          if (prefs.privacy !== state.privacy) dispatch({ type: 'privacy/toggle' });
          dispatch({ type: 'settings/save', values: { shortcuts: JSON.stringify(shortcuts) } });
          toast.success('Tercihler kaydedildi.');
        }}
      />
      <Dialog
        open={!!editing}
        onOpenChange={(o) => {
          if (!o) setEditing(null);
        }}
      >
        <DialogContent className="jam-modal">
          <DialogHeader>
            <DialogTitle>Kısayol</DialogTitle>
            <DialogDescription>Panelde kullanacağınız bağlantıyı kaydedin.</DialogDescription>
          </DialogHeader>
          {editing && (
            <form
              className="dialog-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!editing.title.trim() || !safeShortcut(editing.href.trim())) {
                  setError('Başlık ve / ile başlayan uygulama adresi veya https bağlantısı girin.');
                  return;
                }
                const record = {
                  ...editing,
                  title: editing.title.trim(),
                  href: editing.href.trim(),
                };
                write(
                  shortcuts.some((s) => s.id === record.id)
                    ? shortcuts.map((s) => (s.id === record.id ? record : s))
                    : [...shortcuts, record],
                );
                setEditing(null);
                toast.success('Kısayol hazırlandı. Değişiklikleri kaydederek uygulayın.');
              }}
            >
              <div className="dialog-form-body space-y-5">
                <div className="form-field">
                  <Label htmlFor="shortcut-title">Başlık *</Label>
                  <Input
                    id="shortcut-title"
                    required
                    maxLength={80}
                    placeholder="Örneğin: Haftalık rapor"
                    value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <Label htmlFor="shortcut-url">Bağlantı *</Label>
                  <Input
                    id="shortcut-url"
                    required
                    placeholder="/admin/education-reports"
                    value={editing.href}
                    onChange={(e) => setEditing({ ...editing, href: e.target.value })}
                  />
                </div>
                {error && (
                  <p className="field-error" role="alert">
                    {error}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Vazgeç
                </Button>
                <Button type="submit">Kaydet</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
function NotificationPreferences() {
  const { state, dispatch } = useWorkspace();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const changed = Object.fromEntries(
    Object.entries(draft).filter(([key, value]) => value !== (state.settings[key] || 'true')),
  );
  return (
    <>
      <div className="settings-section-heading">
        <h2>Bildirim ayarları</h2>
        <p>Bildirim kanalları ve ilgilendiğiniz konular.</p>
      </div>
      <p className="service-notice">
        Tercihler bu tarayıcıdaki çalışma alanınız için kaydedilir. Dış kanallara bildirim
        gönderilmez.
      </p>
      {Object.entries({
        email: 'E-posta bildirimleri',
        webPush: 'Tarayıcı bildirimleri',
        allowAll: 'Bildirimlere izin ver',
        students: 'Öğrenciler',
        teachers: 'Öğretmenler',
        groups: 'Gruplar',
        accounting: 'Muhasebe',
        operations: 'Operasyonlar',
        communication: 'İletişim',
        reports: 'Raporlar',
        system: 'Sistem',
      }).map(([key, label]) => (
        <div className="setting-switch" key={key}>
          <Label htmlFor={`notification-setting-${key}`}>{label}</Label>
          <Switch
            id={`notification-setting-${key}`}
            checked={
              (draft[`notification-${key}`] ?? state.settings[`notification-${key}`]) !== 'false'
            }
            onCheckedChange={(checked) =>
              setDraft({ ...draft, [`notification-${key}`]: String(checked) })
            }
          />
        </div>
      ))}
      <SaveActionBar
        count={Object.keys(changed).length}
        onDiscard={() => setDraft({})}
        onSave={() => {
          dispatch({ type: 'settings/save', values: changed });
          setDraft({});
          toast.success('Bildirim tercihleri kaydedildi.');
        }}
      />
    </>
  );
}
export function PersonalShortcuts() {
  const { state } = useWorkspace();
  const shortcuts = readShortcuts(state.settings.shortcuts);
  if (!shortcuts.length) return null;
  return (
    <nav className="quick-actions" aria-label="Kişisel kısayollar">
      {shortcuts.map((s) => (
        <Button asChild key={s.id} variant="outline">
          {s.href.startsWith('/') ? (
            <Link to={s.href}>{s.title}</Link>
          ) : (
            <a href={s.href} target="_blank" rel="noopener noreferrer">
              {s.title}
            </a>
          )}
        </Button>
      ))}
    </nav>
  );
}
