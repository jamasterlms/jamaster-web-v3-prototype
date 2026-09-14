import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PageHeading } from '@/components/shared/primitives';
import { Icon } from '@/components/shared/icon';
import { PaymentNotice, PaymentItems, PaymentConfirm, PaymentStatusBadge } from './payment-ui';
import { CheckoutAddressFields, CheckoutCardFields } from './checkout-fields';
import { usePaymentResource, usePaymentService } from './payment-provider';
import {
  emptyCheckout,
  emptyCard,
  addressErrors,
  cardErrors,
  checkoutPayload,
  paymentView,
  money,
  sourceLabels,
  type CheckoutDraft,
  type PaymentLink,
} from './payment-model';
import { paymentError, paymentMutationFailure, type PaymentResources } from './payment-service';
import { PrototypePaymentControls, PrototypeVerification } from './prototype-payment-controls';
import { prototypeBillingAddress } from './prototype-payment-service';
import { PaymentCompletion } from './payment-completion';
const steps = ['Özet', 'Fatura adresi', 'Ödeme yöntemi', 'Kontrol'];
const noResources: PaymentResources = { addresses: [], cards: [] };
export function PaymentCheckout({ token }: { token: string }) {
  const service = usePaymentService(),
    navigate = useNavigate();
  const detail = usePaymentResource('payment-link:' + token, () => service.link(token), !!token);
  const link = detail.data;
  const resources = usePaymentResource(
    'checkout-resources:' + link?.sourceType,
    () => service.resources(link!.sourceType),
    !!link && link.sourceType !== 'STUDENT_INSTALLMENT' && link.status === 'OPEN',
  );
  const [draft, setDraft] = useState<CheckoutDraft>(emptyCheckout),
    [step, setStep] = useState(0),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [uncertain, setUncertain] = useState(false),
    [bankHtml, setBankHtml] = useState(''),
    [confirmCancel, setConfirmCancel] = useState(false);
  const initialized = useRef(false),
    inFlight = useRef(false),
    heading = useRef<HTMLHeadingElement>(null);
  const view = link ? paymentView(link.status, uncertain) : 'unavailable';
  useEffect(() => {
    if (link && link.token !== token)
      void navigate('/payment/' + encodeURIComponent(link.token), { replace: true });
  }, [link, token, navigate]);
  useEffect(() => {
    if (!initialized.current && resources.data) {
      initialized.current = true;
      const card = resources.data.cards.find((card) => card.isDefault) || resources.data.cards[0],
        address = resources.data.addresses[0];
      setDraft((old) => ({
        ...old,
        cardSource: card ? 'saved' : 'new',
        cardId: card?.cardId || '',
        addressSource: address ? 'saved' : 'new',
        addressId: address?.id || '',
      }));
    }
  }, [resources.data]);
  useEffect(() => {
    if (detail.loading || (!uncertain && link?.status !== 'PROCESSING')) return;
    const timer = window.setTimeout(() => {
      if (document.visibilityState === 'visible') detail.refresh();
    }, 5000);
    const visible = () => {
      if (document.visibilityState === 'visible') detail.refresh();
    };
    document.addEventListener('visibilitychange', visible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [uncertain, link, detail.loading]);
  useEffect(() => {
    if (link && link.status !== 'OPEN' && link.status !== 'PROCESSING') {
      setBankHtml('');
      setError('');
      setUncertain(false);
      setDraft(emptyCheckout);
    }
  }, [link?.status]);
  // Never carry a review acknowledgement across a changed amount or list of obligations.
  const summaryKey = link
    ? `${link.totalAmount}:${link.currency}:${link.items.map((i) => i.sourceId).join(',')}`
    : '';
  useEffect(() => {
    setDraft((old) => ({ ...old, consent: false }));
    setStep(0);
  }, [summaryKey]);
  const move = (next: number) => {
    setStep(next);
    setErrors({});
    setError('');
    requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ block: 'nearest' });
    });
  };
  const validate = (current: number) => {
    let next: Record<string, string> = {};
    if (current === 1)
      next =
        draft.addressSource === 'new'
          ? addressErrors(draft.address)
          : resources.data?.addresses.some((a) => a.id === draft.addressId)
            ? {}
            : { addressId: 'Fatura adresi seçin.' };
    if (current === 2)
      next =
        draft.cardSource === 'new'
          ? cardErrors(draft.card)
          : resources.data?.cards.some((c) => c.cardId === draft.cardId)
            ? {}
            : { cardId: 'Ödeme kartı seçin.' };
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>('.payment-checkout [aria-invalid="true"]')?.focus(),
      );
      return false;
    }
    return true;
  };
  const submit = async () => {
    if (
      inFlight.current ||
      !link ||
      view !== 'checkout' ||
      detail.loading ||
      detail.error ||
      !draft.consent ||
      !resources.data ||
      resources.error
    )
      return;
    if (!validate(1)) {
      setStep(1);
      return;
    }
    if (!validate(2)) {
      setStep(2);
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await service.checkout(token, checkoutPayload(draft));
      setUncertain(true);
      setBankHtml(result.threeDSHtmlContent || result.htmlContent || '');
      detail.refresh();
    } catch (e) {
      if (paymentMutationFailure(e) === 'rejected') {
        setError(paymentError(e));
        setStep(2);
      } else {
        setUncertain(true);
        setError(
          'Ödeme sonucu henüz doğrulanamadı. Tekrar ödeme başlatmadan önce durumu kontrol edin.',
        );
        detail.refresh();
      }
    } finally {
      setDraft((old) => ({ ...old, card: emptyCard, consent: false }));
      inFlight.current = false;
      setBusy(false);
    }
  };
  const cancel = async () => {
    if (inFlight.current || view !== 'checkout' || detail.error || detail.loading) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      await service.cancel(token);
      setConfirmCancel(false);
      detail.refresh();
    } catch (e) {
      setError(paymentError(e));
      if (paymentMutationFailure(e) === 'verify') setUncertain(true);
      setConfirmCancel(false);
      detail.refresh();
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const refresh = async () => {
    // Only this fresh response can release an indeterminate/409 retry lock.
    const result = await detail.refresh();
    if (result.kind === 'success' && result.data.status === 'OPEN') {
      setUncertain(false);
      setBankHtml('');
      setError('');
      setStep(2);
      setDraft((old) => ({ ...old, consent: false }));
    }
  };
  const savedAddress = resources.data?.addresses.find((a) => a.id === draft.addressId),
    savedCard = resources.data?.cards.find((c) => c.cardId === draft.cardId);
  const address = draft.addressSource === 'new' ? draft.address : savedAddress;
  return (
    <div className="payment-page payment-checkout">
      <PageHeading
        title="Güvenli ödeme"
        description={link ? sourceLabels[link.sourceType] : 'Ödeme bağlantınız ve işlem durumu.'}
      >
        <Button variant="outline" asChild>
          <Link to="/payment">
            <Icon name="arrow-left" />
            Ödemelerime dön
          </Link>
        </Button>
      </PageHeading>
      <PrototypePaymentControls
        fill={
          view === 'checkout'
            ? () => {
                setDraft((old) => ({
                  ...old,
                  addressSource: 'new',
                  cardSource: 'new',
                  address: { ...prototypeBillingAddress, id: undefined, title: undefined },
                  card: {
                    cardHolderName: 'DENIZ YILMAZ',
                    cardNumber: '4111111111111111',
                    expireMonth: '12',
                    expireYear: String(new Date().getFullYear() + 2),
                    cvc: '123',
                  },
                  consent: false,
                }));
                setErrors({});
                setError('');
              }
            : undefined
        }
      />
      {!link ? (
        <PaymentNotice
          title={
            !token
              ? 'Ödeme bağlantısı geçersiz'
              : detail.loading
                ? 'Ödeme bağlantısı kontrol ediliyor'
                : 'Ödeme bağlantısı doğrulanamıyor'
          }
          retry={token ? detail.refresh : undefined}
          loading={detail.loading}
        >
          {!token
            ? 'Bağlantıyı kontrol edin veya ödeme merkezinden güncel işleminizi açın.'
            : detail.error || 'Bağlantı bilgileri alındığında ödeme detaylarınız burada görünür.'}
        </PaymentNotice>
      ) : link.sourceType === 'STUDENT_INSTALLMENT' ? (
        <PaymentNotice title="Bu ödeme türü henüz desteklenmiyor">
          Öğrenci taksitlerinin çevrim içi ödemesi için kurumunuzla iletişime geçin.
        </PaymentNotice>
      ) : view !== 'checkout' ? (
        <PaymentResult
          link={link}
          view={view}
          loading={detail.loading}
          error={detail.error || error}
          refresh={refresh}
          bankHtml={bankHtml}
        />
      ) : (
        <>
          {detail.error && (
            <PaymentNotice retry={detail.refresh} loading={detail.loading}>
              {detail.error} Ödeme bilgilerini yeniden doğrulamadan devam edemezsiniz.
            </PaymentNotice>
          )}
          <ol className="checkout-steps" aria-label="Ödeme adımları">
            {steps.map((label, index) => (
              <li
                key={label}
                aria-current={step === index ? 'step' : undefined}
                data-completed={index < step}
              >
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy || index > step}
                  onClick={() => move(index)}
                >
                  <span>{index < step ? <Icon name="check" /> : index + 1}</span>
                  <strong>{label}</strong>
                </Button>
              </li>
            ))}
          </ol>
          <div className="checkout-layout">
            <form
              className="checkout-main"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                if (
                  busy ||
                  detail.loading ||
                  detail.error ||
                  !resources.data ||
                  resources.loading ||
                  resources.error
                )
                  return;
                if (step === 3) void submit();
                else if (validate(step)) move(step + 1);
              }}
            >
              <h2 ref={heading} tabIndex={-1} className="sr-only">
                {steps[step]}
              </h2>
              <fieldset disabled={busy}>
                {step === 0 && (
                  <section className="checkout-fields">
                    <div className="checkout-section-heading">
                      <div>
                        <h2>Ödeme özeti</h2>
                        <p>Seçilen kalemleri kontrol ederek devam edin.</p>
                      </div>
                      <Icon name="receipt-text" />
                    </div>
                    <PaymentItems items={link.items} />
                    <p className="payment-section-intro">
                      Fatura adresinizi ve ödeme yönteminizi sonraki adımlarda belirleyebilirsiniz.
                    </p>
                  </section>
                )}
                {step === 1 && (
                  <CheckoutAddressFields
                    draft={draft}
                    onChange={setDraft}
                    errors={errors}
                    resources={resources.data || noResources}
                  />
                )}
                {step === 2 && (
                  <CheckoutCardFields
                    draft={draft}
                    onChange={setDraft}
                    errors={errors}
                    resources={resources.data || noResources}
                  />
                )}
                {step === 3 && (
                  <section className="checkout-fields">
                    <div className="checkout-section-heading">
                      <div>
                        <h2>Kontrol ve onay</h2>
                        <p>Ödemeyi tamamlamadan önce bilgilerinizi kontrol edin.</p>
                      </div>
                      <Icon name="shield-check" />
                    </div>
                    <Card className="checkout-review-block">
                      <header>
                        <h3>Fatura adresi</h3>
                        <Button type="button" variant="ghost" onClick={() => move(1)}>
                          Düzenle
                        </Button>
                      </header>
                      <strong>
                        {address?.firstName} {address?.lastName}
                      </strong>
                      <p>{address?.address}</p>
                      <p>
                        {address?.city} · {address?.country} · {address?.zipCode}
                      </p>
                      <p>
                        {address?.email} · {address?.phone}
                      </p>
                    </Card>
                    <Card className="checkout-review-block">
                      <header>
                        <h3>Ödeme yöntemi</h3>
                        <Button type="button" variant="ghost" onClick={() => move(2)}>
                          Düzenle
                        </Button>
                      </header>
                      <p>
                        <Icon name="credit-card" />{' '}
                        {draft.cardSource === 'saved'
                          ? savedCard?.cardAlias || 'Kayıtlı kart'
                          : draft.card.cardHolderName}{' '}
                        · ••••{' '}
                        {draft.cardSource === 'saved'
                          ? savedCard?.lastFourDigits
                          : draft.card.cardNumber.replace(/\D/g, '').slice(-4)}
                      </p>
                      <small>Tek çekim</small>
                    </Card>
                    <Label className="checkout-consent" htmlFor="payment-consent">
                      <Checkbox
                        id="payment-consent"
                        checked={draft.consent}
                        onCheckedChange={(value) =>
                          setDraft((old) => ({ ...old, consent: !!value }))
                        }
                      />
                      <span>
                        Bilgilerimin doğruluğunu ve toplam{' '}
                        <b>{money(link.totalAmount, link.currency)}</b> tutarındaki ödemenin
                        seçtiğim karttan alınmasını onaylıyorum.
                      </span>
                    </Label>
                  </section>
                )}
              </fieldset>
              {resources.error && (
                <PaymentNotice retry={resources.refresh} loading={resources.loading}>
                  {resources.error} Kayıtlı adres ve kart bilgileri kontrol edilmeden ödeme
                  başlatılmaz.
                </PaymentNotice>
              )}
              {error && (
                <p className="field-error" role="alert">
                  {error}
                </p>
              )}
              <footer className="checkout-actions">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => (step > 0 ? move(step - 1) : setConfirmCancel(true))}
                >
                  {step > 0 ? 'Geri' : 'Ödemeyi iptal et'}
                </Button>
                <Button
                  type="submit"
                  disabled={
                    busy ||
                    !!detail.error ||
                    detail.loading ||
                    !resources.data ||
                    resources.loading ||
                    !!resources.error ||
                    (step === 3 && !draft.consent)
                  }
                >
                  {busy ? 'Ödeme işleniyor' : step === 3 ? 'Ödemeyi tamamla' : 'Devam et'}
                  <Icon name={step === 3 ? 'lock-keyhole' : 'arrow-right'} />
                </Button>
              </footer>
            </form>
            <aside className="checkout-summary">
              <Card>
                <span className="eyebrow">ÖDEME TOPLAMI</span>
                <strong>{money(link.totalAmount, link.currency)}</strong>
                <small>{link.items.length} ödeme kalemi · Tek çekim</small>
                <PaymentItems items={link.items} />
                <p>
                  <Icon name="shield-check" />
                  Banka doğrulaması gerekebilir. Sonuç bu ekranda takip edilir.
                </p>
              </Card>
            </aside>
          </div>
          <PaymentConfirm
            title="Ödeme bağlantısı iptal edilsin mi?"
            description="Bu bağlantı üzerinden ödeme yapılamaz. Borçlarınız silinmez; ödeme merkezinden yeni bir işlem başlatabilirsiniz."
            open={confirmCancel}
            busy={busy}
            onClose={() => setConfirmCancel(false)}
            onConfirm={() => void cancel()}
          />
        </>
      )}
    </div>
  );
}
export function PaymentResult({
  link,
  view,
  refresh,
  loading,
  error,
  bankHtml,
}: {
  link: PaymentLink;
  view: string;
  refresh: () => void;
  loading: boolean;
  error?: string;
  bankHtml: string;
}) {
  const service = usePaymentService();
  const copy: Record<string, [string, string, string]> = {
    completed: [
      'circle-check',
      'Ödemeniz tamamlandı',
      'Ödeme sonucu doğrulandı. İşlem detaylarınızı ödeme geçmişinden inceleyebilirsiniz.',
    ],
    cancelled: [
      'circle-x',
      'Ödeme iptal edildi',
      'Bu bağlantı kapatıldı. Bekleyen ödemelerinizi ödeme merkezinden inceleyebilirsiniz.',
    ],
    superseded: [
      'refresh-cw',
      'Ödeme bağlantısı yenilendi',
      'Bu bağlantı artık kullanılamıyor. Güncel işleminize ödeme merkezinden ulaşabilirsiniz.',
    ],
    processing: [
      'shield-check',
      'Ödemeniz işleniyor',
      'Banka yanıtı bekleniyor. Yeni bir ödeme başlatmadan bu işlemin sonucunu kontrol edin.',
    ],
    verification: [
      'shield-check',
      'Ödeme sonucu kontrol ediliyor',
      'Ödemenin sonucu henüz doğrulanmadı. Tekrar ödeme başlatmayın; işlem durumu burada güncellenecek.',
    ],
  };
  const [icon, title, description] =
    link.prototypeClosure === 'expired'
      ? [
          'clock',
          'Ödeme bağlantısının süresi doldu',
          'Bu bağlantıyla ödeme başlatılamaz. Ödeme merkezinden güncel bir bağlantı oluşturabilirsiniz.',
        ]
      : copy[view] || copy.verification;
  let html = bankHtml;
  try {
    const decoded = atob(bankHtml);
    if (/<(html|form|body)/i.test(decoded)) html = decoded;
  } catch {
    /* Gateway may return plain HTML. */
  }
  return (
    <section className="payment-result">
      <Card>
        {view === 'completed' ? (
          <PaymentCompletion link={link} refresh={refresh} loading={loading} error={error} />
        ) : (
          <>
            <span className="payment-result-icon">
              <Icon name={icon} />
            </span>
            <PaymentStatusBadge status={link.status} />
            <h2>{title}</h2>
            <p>
              {service.prototype && link.status === 'PROCESSING'
                ? 'Deneme işleminiz doğrulama adımına ulaştı. Sonucu aşağıdan seçebilirsiniz.'
                : description}
            </p>
            <strong>{money(link.totalAmount, link.currency)}</strong>
            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}
            <div>
              <Button variant="outline" asChild>
                <Link to="/payment">Ödeme merkezi</Link>
              </Button>
              {['verification', 'processing'].includes(view) && (
                <Button onClick={refresh} disabled={loading}>
                  {loading ? 'Kontrol ediliyor' : 'Durumu kontrol et'}
                </Button>
              )}
              {view === 'completed' && (
                <Button asChild>
                  <Link to="/payment?tab=history">Ödeme geçmişi</Link>
                </Button>
              )}
            </div>
          </>
        )}
      </Card>
      {service.prototype && link.status === 'PROCESSING' && (
        <PrototypeVerification token={link.token} onResult={refresh} />
      )}
      {html && (
        <section className="payment-bank">
          <h2>Banka doğrulaması</h2>
          <p>
            Doğrulamayı bankanızın ekranında tamamlayın. Sonuç ödeme hizmetinden kontrol edilir.
          </p>
          <iframe
            title="Banka 3D Secure doğrulaması"
            sandbox="allow-forms allow-scripts"
            referrerPolicy="no-referrer"
            srcDoc={html}
          />
        </section>
      )}
    </section>
  );
}
