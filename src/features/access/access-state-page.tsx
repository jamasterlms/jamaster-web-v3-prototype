import { useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Search,
  ShieldCheck,
  CircleHelp,
  Check,
  LockKeyhole,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeading } from '@/components/shared/primitives';
import { Icon } from '@/components/shared/icon';
import {
  accessRole,
  accessRoleLabels,
  accessStates,
  resolveAccessState,
  roleHome,
  safeReturnTo,
} from './access-state-model';
import { stateGroups, statePresentation } from './access-state-presentation';
import { helpLink } from '@/features/help/help-model';
export function AccessStatePage({ route }: { route: string }) {
  const [params, setParams] = useSearchParams(),
    location = useLocation();
  const role = accessRole(params.get('role'));
  const [group, setGroup] = useState('Tümü'),
    [query, setQuery] = useState('');
  const home = roleHome(role),
    returnTo = safeReturnTo(params.get('returnTo'), role);
  const login = `/login?${new URLSearchParams({ role, returnTo })}`;
  const help = helpLink(role === 'user' ? 'staff' : role, location.pathname);
  if (route === 'access/examples') {
    const visible = Object.entries(accessStates).filter(
      ([key, state]) =>
        (group === 'Tümü' || statePresentation(resolveAccessState(key)).group === group) &&
        `${state.title} ${state.description}`
          .toLocaleLowerCase('tr')
          .includes(query.trim().toLocaleLowerCase('tr')),
    );
    return (
      <div className="access-gallery">
        <PageHeading
          title="Giriş ve erişim durumları"
          description="Hesap türünü seçin; giriş, yetki ve hata ekranlarını inceleyin."
        >
          <Tabs value={role} onValueChange={(value) => setParams({ role: value })}>
            <TabsList aria-label="İncelenecek hesap türü">
              {Object.entries(accessRoleLabels).map(([value, label]) => (
                <TabsTrigger key={value} value={value}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </PageHeading>
        <Card className="access-gallery-feature">
          <div className="gallery-feature-icon">
            <ShieldCheck size={32} strokeWidth={1.3} />
          </div>
          <div>
            <small>{accessRoleLabels[role]} hesabı</small>
            <h2>Her adımın bir devamı var.</h2>
            <p>
              Hata mesajını, yardım seçeneklerini ve çalışma alanına dönüşü birlikte kontrol edin.
            </p>
          </div>
          <Button asChild>
            <Link to={login}>
              Giriş ekranını aç
              <ArrowUpRight size={17} />
            </Link>
          </Button>
        </Card>
        <section className="login-scenario-section">
          <div className="section-caption">
            <h2>Giriş formu durumları</h2>
            <span>Form üzerinde inceleyin</span>
          </div>
          <div className="login-scenario-list">
            {[
              ['invalid-credentials', 'Hatalı bilgiler', 'lock-keyhole'],
              ['network', 'Bağlantı hatası', 'globe'],
              ['rate-limited', 'Deneme sınırı', 'clock'],
              ['unverified', 'Doğrulama gerekli', 'mail-check'],
              ['inactive', 'Pasif hesap', 'user-round'],
            ].map(([scenario, label, icon]) => (
              <Button asChild variant="ghost" key={scenario}>
                <Link to={`/login?role=${role}&scenario=${scenario}`}>
                  <Icon name={icon} />
                  {label}
                  <ArrowUpRight size={15} />
                </Link>
              </Button>
            ))}
          </div>
        </section>
        <div className="access-gallery-toolbar">
          <div className="help-search">
            <Search size={18} />
            <Input
              placeholder="Erişim durumlarında ara…"
              aria-label="Erişim durumlarında ara"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Tabs value={group} onValueChange={setGroup}>
            <TabsList aria-label="Erişim durumu grubu">
              {stateGroups.map((g) => (
                <TabsTrigger key={g} value={g}>
                  {g}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="access-scenario-grid">
          {visible.map(([key, state]) => {
            const p = statePresentation(resolveAccessState(key));
            return (
              <Card key={key} className={`access-scenario-card tone-${p.tone}`}>
                <Link to={`/access/${key}?role=${role}`}>
                  <div className="scenario-top">
                    <span className="scenario-icon">
                      <Icon name={state.icon} />
                    </span>
                    <span className="scenario-code">{p.code || p.group}</span>
                    <ArrowUpRight size={18} />
                  </div>
                  <h3>{state.title}</h3>
                  <p>{state.description}</p>
                  <span className="scenario-open">
                    Ekranı incele
                    <ArrowRight size={15} />
                  </span>
                </Link>
              </Card>
            );
          })}
        </div>
        {!visible.length && (
          <div className="help-empty" role="status">
            Aramanıza uygun durum bulunamadı.
            <Button
              variant="ghost"
              onClick={() => {
                setQuery('');
                setGroup('Tümü');
              }}
            >
              Filtreleri temizle
            </Button>
          </div>
        )}
        <Card className="access-readonly">
          <span className="scenario-icon">
            <LockKeyhole size={22} />
          </span>
          <div>
            <h2>Salt okunur erişim</h2>
            <p id="permission-note">
              Kayıtları görüntüleyebilirsiniz. Düzenleme ve silme için işlem yetkisi gerekir.
            </p>
          </div>
          <div className="access-actions">
            <Button disabled aria-describedby="permission-note">
              Düzenle
            </Button>
            <Button disabled variant="outline" aria-describedby="permission-note">
              Sil
            </Button>
            <Button asChild variant="ghost">
              <Link to={help}>
                Yetki için yardım alın
                <ArrowUpRight size={16} />
              </Link>
            </Button>
          </div>
        </Card>
        <p className="access-gallery-note">
          Bu ekranlar arayüz senaryolarıdır; seçimler gerçek hesap yetkisini değiştirmez.
        </p>
      </div>
    );
  }
  const key = resolveAccessState(route.replace(/^access\//, '')),
    state = accessStates[key],
    presentation = statePresentation(key);
  const retryHasContext = !!params.get('returnTo') && returnTo !== home;
  const primary =
    state.action === 'login'
      ? [login, 'Giriş yap']
      : state.action === 'reset'
        ? [`/forgot-password?${new URLSearchParams({ role, returnTo })}`, 'Yeni bağlantı iste']
        : state.action === 'billing' && role === 'user'
          ? ['/payment', 'Kurum ödemelerini aç']
          : state.action === 'help' || state.action === 'billing'
            ? [help, 'Kurumunuzdan yardım alın']
            : state.action === 'retry' && retryHasContext
              ? [returnTo, 'Sayfayı yeniden aç']
              : [home, 'Çalışma alanına dön'];
  const steps =
    state.action === 'login' || state.action === 'reset'
      ? [
          'Doğru hesap türüyle devam edin.',
          'Kurumunuzda kayıtlı e-posta adresinizi kullanın.',
          'Erişemiyorsanız yardım merkezinden talep hazırlayın.',
        ]
      : state.action === 'retry'
        ? [
            'Bağlantınızı ve açık olan diğer sayfaları kontrol edin.',
            'Son işlemin kaydedilip kaydedilmediğini kontrol edin.',
            'Sorun devam ederse sayfa bilgisini kurumunuzla paylaşın.',
          ]
        : [
            'Kurumunuzun adresini ve hesap türünüzü kontrol edin.',
            'Erişim durumunuzu kurum yöneticinizle paylaşın.',
            'Yetki veya atama tamamlandığında yeniden giriş yapın.',
          ];
  return (
    <div className={`access-recovery tone-${presentation.tone}`}>
      <Card className="access-status">
        <div className="status-topline">
          <span>{accessRoleLabels[role]} hesabı</span>
          <span>{presentation.code || presentation.group}</span>
        </div>
        <div className="status-emblem">
          <span className="status-emblem-ring" />
          <span className="status-emblem-core">
            <Icon name={state.icon} />
          </span>
          <i />
          <i />
          <i />
        </div>
        <PageHeading title={state.title} description={state.description} />
        <div className="access-actions">
          <Button asChild>
            <Link to={primary[0]}>
              {primary[1]}
              <ArrowRight size={18} />
            </Link>
          </Button>
          {primary[0] !== home && (
            <Button asChild variant="ghost">
              <Link to={home}>Çalışma alanına dön</Link>
            </Button>
          )}
        </div>
        <div className="access-secondary">
          <Link to={help}>
            <CircleHelp size={16} />
            Yardım merkezi
          </Link>
          {state.action !== 'login' && (
            <Link to={login}>
              Başka hesapla giriş yap
              <ArrowUpRight size={15} />
            </Link>
          )}
        </div>
      </Card>
      <aside className="access-recovery-aside">
        <Card className="recovery-checklist">
          <small>SONRAKİ ADIM</small>
          <h2>Nasıl devam edebilirsiniz?</h2>
          <ol>
            {steps.map((step, i) => (
              <li key={step}>
                <span>{String(i + 1).padStart(2, '0')}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </Card>
        <Card className="recovery-help">
          <CircleHelp size={25} />
          <h3>Yardımınız burada.</h3>
          <p>Hesabınıza uygun rehberleri inceleyin veya destek talebinizi hazırlayın.</p>
          <Button asChild variant="ghost">
            <Link to={help}>
              Yardım merkezini aç
              <ArrowUpRight size={17} />
            </Link>
          </Button>
        </Card>
        <div className="recovery-role">
          <Check size={16} />
          {accessRoleLabels[role]} alanına uygun seçenekler
        </div>
      </aside>
    </div>
  );
}
