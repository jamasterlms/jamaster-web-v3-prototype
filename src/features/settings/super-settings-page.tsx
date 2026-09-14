import { Link, useSearchParams } from 'react-router-dom';
import { PageHeading } from '@/components/shared/primitives';
import { LevelSettings } from '@/features/education/level-settings';
import { IntegrationSettings } from './integration-settings';
import { TenantSettings } from './tenant-settings';

const sections = [
  ['general', 'Genel ayarlar'],
  ['level', 'Seviye ve alt seviyeler'],
  ['iyzico', 'iyzico'],
  ['mutlucell', 'Mutlucell SMS'],
  ['whatsapp', 'WhatsApp Business'],
  ['email', 'E-posta / SMTP'],
] as const;

export function SuperSettingsPage() {
  const [params] = useSearchParams();
  const requested = params.get('tab') || 'general';
  const section = sections.some(([key]) => key === requested) ? requested : 'general';
  return (
    <>
      <PageHeading
        title="Sistem ayarları"
        description="Kurum genelindeki seviyeler, tercihler ve servis bağlantıları."
      />
      <div className="settings-layout">
        <nav className="settings-menu" aria-label="Sistem ayarları bölümleri">
          {sections.map(([key, title]) => (
            <Link
              key={key}
              to={`/super/settings?tab=${key}`}
              className={section === key ? 'active' : ''}
              aria-current={section === key ? 'page' : undefined}
            >
              {title}
            </Link>
          ))}
        </nav>
        <div className="settings-content">
          {section === 'general' ? (
            <TenantSettings />
          ) : section === 'level' ? (
            <LevelSettings />
          ) : (
            <IntegrationSettings
              key={section}
              section={section === 'mutlucell' ? 'sms' : section}
            />
          )}
        </div>
      </div>
    </>
  );
}
