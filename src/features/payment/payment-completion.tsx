import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/shared/icon';
import { money, type PaymentLink } from './payment-model';

export type PaymentCompletionView =
  | { kind: 'unlocked'; title: string; description: string; panelPath: string }
  | { kind: 'remaining'; title: string; description: string }
  | { kind: 'awaiting-unlock'; title: string; description: string }
  | { kind: 'unknown'; title: string; description: string };

export function paymentCompletionView(link: PaymentLink): PaymentCompletionView {
  const summary = link.completionSummary;
  if (
    !summary ||
    typeof summary.stillBlocked !== 'boolean' ||
    !Number.isFinite(summary.remainingCount) ||
    !Number.isFinite(summary.remainingAmount) ||
    summary.remainingCount < 0 ||
    summary.remainingAmount < 0
  )
    return {
      kind: 'unknown',
      title: 'Ödeme tamamlandı',
      description: 'Erişim durumunuz henüz doğrulanamadı. Ödeme merkezinden durumu yenileyin.',
    };
  if (summary.stillBlocked === false)
    return {
      kind: 'unlocked',
      title: 'Ödeme tamamlandı, erişim açıldı',
      description: 'Kurum paneline güvenle dönebilirsiniz.',
      panelPath: link.panelPath,
    };
  if (summary.remainingCount > 0)
    return {
      kind: 'remaining',
      title: 'Ödeme tamamlandı, kalan faturalar var',
      description: `${summary.remainingCount} kalem için ${money(
        summary.remainingAmount,
        summary.currency,
      )} ödeme bekleniyor. Erişim tüm zorunlu faturalar tamamlandığında açılır.`,
    };
  return {
    kind: 'awaiting-unlock',
    title: 'Ödeme tamamlandı, erişim doğrulanıyor',
    description:
      'Açık fatura görünmüyor. Panel erişimi doğrulanana kadar ödeme durumunu yenileyin.',
  };
}

export function PaymentCompletion({
  link,
  refresh,
  loading,
  error,
}: {
  link: PaymentLink;
  refresh: () => void;
  loading: boolean;
  error?: string;
}) {
  const view = paymentCompletionView(
    error || loading ? { ...link, completionSummary: undefined } : link,
  );
  return (
    <section className="payment-completion" aria-live="polite">
      <h2>{loading ? 'Erişim durumu kontrol ediliyor' : view.title}</h2>
      <p>{loading ? 'Ödeme ve erişim bilgileri yenileniyor.' : view.description}</p>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <strong>{money(link.totalAmount, link.currency)}</strong>
      <div className="flex flex-wrap justify-center gap-2 mt-5">
        {view.kind === 'unlocked' && (
          <Button asChild>
            <Link to={view.panelPath}>
              <Icon name="arrow-right" />
              Panele dön
            </Link>
          </Button>
        )}
        {view.kind === 'remaining' && (
          <Button asChild>
            <Link to="/payment">Kalanları öde</Link>
          </Button>
        )}
        {['awaiting-unlock', 'unknown'].includes(view.kind) && (
          <Button onClick={refresh} disabled={loading}>
            Durumu yenile
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link to="/payment">Ödeme merkezi</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link to="/payment?tab=history">Ödeme geçmişi</Link>
        </Button>
      </div>
    </section>
  );
}
