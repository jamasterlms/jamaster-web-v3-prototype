import { PrototypeToolsSection } from '@/features/prototype/prototype-tools';
import { AccessCompanion } from './access-presentation';
import { ArrowRight, ShieldCheck, Info, CircleCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { accessRole, safeReturnTo } from './access-state-model';
import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeading, IconButton } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { passwordIssue } from './authentication-model';
import { emailSchema } from '@/lib/validation';
export function AuthenticationPage({ mode }: { mode: string }) {
  const forgot = mode === 'forgot-password',
    reset = mode === 'reset-password';
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [show, setShow] = useState(false),
    [email, setEmail] = useState(params.get('email') || ''),
    [password, setPassword] = useState(''),
    [confirm, setConfirm] = useState(''),
    [role, setRole] = useState(
      ['student', 'teacher', 'user'].includes(params.get('role') || '')
        ? params.get('role')!
        : 'student',
    ),
    [error, setError] = useState(''),
    [done, setDone] = useState(false),
    [retryAt, setRetryAt] = useState(0),
    [remaining, setRemaining] = useState(0),
    [invalidField, setInvalidField] = useState('');
  const resultRef = useRef<HTMLElement>(null);
  const query = params.toString();
  const queryEmail = params.get('email');
  useEffect(() => setEmail(queryEmail || ''), [queryEmail]);
  useEffect(() => {
    if (done) resultRef.current?.focus();
  }, [done]);
  useEffect(() => {
    setRole(accessRole(params.get('role')));
    setShow(false);
    setPassword('');
    setConfirm('');
    setError('');
    setDone(false);
    setRetryAt(0);
    setInvalidField('');
  }, [query, mode]);
  useEffect(() => {
    if (!retryAt) {
      setRemaining(0);
      return;
    }
    const tick = () => setRemaining(Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [retryAt]);
  const fail = (message: string, field = '') => {
    setError(message);
    setInvalidField(field);
    if (field) document.getElementById(field)?.focus();
  };
  const returnTo = safeReturnTo(params.get('returnTo') || params.get('redirect'), accessRole(role));
  const authLink = (path: string, extras: Record<string, string> = {}) =>
    `${path}?${new URLSearchParams({ role, returnTo, ...extras })}`;
  const scenario = params.get('scenario');
  return (
    <div className="auth-workspace">
      <Card className="auth-form-card">
        <div className="auth-content">
          <div className="auth-eyebrow">
            <ShieldCheck size={17} />{' '}
            {forgot || reset ? 'Hesap kurtarma' : 'Çalışma alanınıza giriş'}
          </div>
          <PageHeading
            title={
              forgot ? 'Şifremi unuttum' : reset ? 'Yeni şifre belirleyin' : 'Tekrar hoş geldiniz'
            }
            description={
              forgot
                ? 'Şifre yenileme bağlantısı için e-posta adresiniz.'
                : reset
                  ? 'Hesabınız için yeni bir şifre belirleyin.'
                  : 'Jamaster çalışma alanınıza giriş yapın.'
            }
          />
          {scenario && (
            <div className="auth-scenario-notice">
              <Info size={16} />
              <span>
                Giriş durumu:{' '}
                {(
                  {
                    'invalid-credentials': 'Hatalı bilgiler',
                    network: 'Bağlantı sorunu',
                    'rate-limited': 'Deneme sınırı',
                    unverified: 'E-posta doğrulama',
                    inactive: 'Aktif olmayan hesap',
                  } as Record<string, string>
                )[scenario] || 'Hesap durumu'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const next = new URLSearchParams(params);
                  next.delete('scenario');
                  setParams(next, { replace: true });
                }}
              >
                Normal giriş
              </Button>
            </div>
          )}
          {reset && (!params.get('token') || params.get('token') !== 'prototype') ? (
            <section className="portal-section auth-result">
              <Info size={26} />
              <h2>
                {params.get('token') ? 'Yenileme bağlantısı geçersiz' : 'Yenileme bağlantısı eksik'}
              </h2>
              <p>Şifre yenileme akışından yeni bir bağlantı oluşturun.</p>
              <Button asChild>
                <Link to={authLink('/forgot-password')}>Şifremi unuttum</Link>
              </Button>
            </section>
          ) : done ? (
            <section
              ref={resultRef}
              tabIndex={-1}
              role="status"
              className="portal-section auth-result"
            >
              <CircleCheck size={26} />
              <h2>{forgot ? 'Yenileme adımını deneyebilirsiniz' : 'Yeni şifre kontrol edildi'}</h2>
              <p>
                {forgot
                  ? `${email} adresi için form kontrolü tamamlandı. Sol alttaki Prototip menüsünden yenileme adımını açabilirsiniz.`
                  : 'Parolalar eşleşiyor. Canlı hesabınızın parolası değiştirilmedi.'}
              </p>
              {forgot ? (
                <PrototypeToolsSection title="Şifre yenileme denemesi">
                  <Button asChild>
                    <Link to={authLink('/reset-password', { token: 'prototype' })}>
                      Yenileme ekranını aç
                    </Link>
                  </Button>
                </PrototypeToolsSection>
              ) : (
                <Button asChild>
                  <Link to={authLink('/login')}>Girişe dön</Link>
                </Button>
              )}
            </section>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError('');
                setInvalidField('');
                if (retryAt > Date.now()) return;
                if (!reset && !emailSchema.safeParse(email).success) {
                  fail('Geçerli bir e-posta adresi girin.', 'auth-email');
                  return;
                }
                const issue = !forgot && passwordIssue(password, reset);
                if (issue) {
                  fail(issue, 'auth-password');
                  return;
                }
                if (reset && password !== confirm) {
                  fail('Şifreler eşleşmiyor.', 'auth-confirm');
                  return;
                }
                if (!forgot && !reset) {
                  const scenario = params.get('scenario');
                  if (scenario === 'invalid-credentials') {
                    fail(
                      'E-posta adresi veya şifre hatalı. Bilgilerinizi kontrol edin.',
                      'auth-password',
                    );
                    return;
                  }
                  if (scenario === 'network') {
                    fail('Bağlantı kurulamadı. Bağlantınızı kontrol edip yeniden deneyin.');
                    return;
                  }
                  if (scenario === 'rate-limited' && !retryAt) {
                    setRetryAt(Date.now() + 30000);
                    fail('Çok fazla deneme yapıldı. Yeniden denemek için 30 saniye bekleyin.');
                    return;
                  }
                  if (
                    ['unverified', 'inactive', 'pending', 'session-expired', 'wrong-role'].includes(
                      scenario || '',
                    )
                  ) {
                    setPassword('');
                    void navigate(authLink(`/access/${scenario}`));
                    return;
                  }
                }
                setPassword('');
                setConfirm('');
                if (forgot || reset) setDone(true);
                else
                  void navigate(
                    safeReturnTo(
                      params.get('returnTo') || params.get('redirect'),
                      accessRole(role),
                    ),
                  );
              }}
              className="space-y-5"
              noValidate
            >
              {!forgot && !reset && (
                <Tabs
                  value={role}
                  onValueChange={(value) => {
                    const next = new URLSearchParams(params);
                    next.set('role', value);
                    if (email) next.set('email', email);
                    setParams(next, { replace: true });
                    setRole(value);
                    setPassword('');
                    setConfirm('');
                    setRetryAt(0);
                    setInvalidField('');
                    setError('');
                  }}
                >
                  <TabsList className="w-full" aria-label="Giriş yapılacak rol">
                    <TabsTrigger value="student">Öğrenci</TabsTrigger>
                    <TabsTrigger value="teacher">Öğretmen</TabsTrigger>
                    <TabsTrigger value="user">Personel</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
              {!reset && (
                <div className="form-field">
                  <Label htmlFor="auth-email">E-posta *</Label>
                  <Input
                    id="auth-email"
                    aria-invalid={invalidField === 'auth-email'}
                    aria-describedby={invalidField === 'auth-email' ? 'auth-error' : undefined}
                    type="email"
                    autoComplete="username"
                    placeholder="ad@kurum.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              )}
              {!forgot && (
                <div className="form-field">
                  <Label htmlFor="auth-password">{reset ? 'Yeni şifre' : 'Şifre'} *</Label>
                  <div className="password-field">
                    <Input
                      id="auth-password"
                      aria-invalid={invalidField === 'auth-password'}
                      aria-describedby={invalidField === 'auth-password' ? 'auth-error' : undefined}
                      type={show ? 'text' : 'password'}
                      autoComplete={reset ? 'new-password' : 'current-password'}
                      placeholder={
                        reset ? 'En az 6 karakter, büyük/küçük harf ve rakam' : 'Şifreniz'
                      }
                      minLength={6}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <IconButton
                      icon={show ? 'eye-off' : 'eye'}
                      label={show ? 'Şifreyi gizle' : 'Şifreyi göster'}
                      onClick={() => setShow(!show)}
                    />
                  </div>
                </div>
              )}
              {reset && (
                <div className="form-field">
                  <Label htmlFor="auth-confirm">Yeni şifre tekrar *</Label>
                  <Input
                    id="auth-confirm"
                    aria-invalid={invalidField === 'auth-confirm'}
                    aria-describedby={invalidField === 'auth-confirm' ? 'auth-error' : undefined}
                    type={show ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Yeni şifrenizi tekrar girin"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
              )}

              {error && (
                <p id="auth-error" className="field-error" role="alert">
                  {error}
                </p>
              )}
              <Button className="w-full" type="submit" disabled={remaining > 0}>
                {remaining > 0
                  ? `${remaining} sn sonra tekrar deneyin`
                  : forgot
                    ? 'Yenileme adımına geç'
                    : reset
                      ? 'Şifreyi kontrol et'
                      : 'Çalışma alanını aç'}
                {remaining === 0 && <ArrowRight size={18} />}
              </Button>
              <Button variant="ghost" asChild className="w-full">
                <Link
                  to={
                    forgot || reset ? authLink('/login') : authLink('/forgot-password', { email })
                  }
                >
                  {forgot || reset ? 'Girişe dön' : 'Şifremi unuttum'}
                </Link>
              </Button>
            </form>
          )}
          {!forgot && !reset && (
            <p className="auth-scenarios-link">
              <Link to={`/access/examples?role=${role}`}>Giriş ve erişim durumlarını incele</Link>
            </p>
          )}
          <p className="auth-preview-note">
            <Info size={14} />
            Arayüz önizlemesi; gerçek hesap doğrulaması ve e-posta gönderimi yapılmaz.
          </p>
        </div>
      </Card>
      <AccessCompanion role={accessRole(role)} recovery={forgot || reset} />
    </div>
  );
}
