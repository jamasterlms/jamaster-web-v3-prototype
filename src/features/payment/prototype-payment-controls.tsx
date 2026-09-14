import { useState, useSyncExternalStore } from 'react';
import { PrototypeToolsSection } from '@/features/prototype/prototype-tools';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { usePaymentService, usePrototypePaymentContext } from './payment-provider';
import { paymentError } from './payment-service';
import type { PaymentDemoContext, PaymentScenario } from './prototype-payment-service';

const noSubscribe = () => () => {};
const successScenario = () => 'success' as const;
export function PrototypePaymentControls({
  fill,
  selectContext = false,
}: {
  fill?: () => void;
  selectContext?: boolean;
}) {
  const tools = usePaymentService().prototype;
  const demo = usePrototypePaymentContext();
  const scenario = useSyncExternalStore(
    tools?.subscribe || noSubscribe,
    tools?.getScenario || successScenario,
    tools?.getScenario || successScenario,
  );
  if (!tools) return null;
  return (
    <PrototypeToolsSection title="Ödeme senaryosu">
      <section className="prototype-payment-controls" aria-label="Ödeme denemesi">
        <div>
          <strong>Ödeme denemesi</strong>
          <p>
            Gerçek tahsilat yapılmaz. Kart bilgisi girmek yerine kayıtlı deneme kartını da
            kullanabilirsiniz.
          </p>
        </div>
        <Select
          value={scenario}
          onValueChange={(value) => {
            tools.setScenario(value as PaymentScenario);
          }}
        >
          <SelectTrigger aria-label="Ödeme senaryosu">
            <SelectValue />
          </SelectTrigger>
          <SelectContent data-prototype-tools-overlay="true">
            <SelectItem value="success">Başarılı ödeme</SelectItem>
            <SelectItem value="decline">Kart reddedildi</SelectItem>
            <SelectItem value="verification">Sonuç bekleniyor</SelectItem>
            {selectContext && <SelectItem value="expired">Süresi dolmuş bağlantı</SelectItem>}
          </SelectContent>
        </Select>
        {selectContext && demo.setContext && (
          <Select
            value={demo.context}
            onValueChange={(value) => demo.setContext?.(value as PaymentDemoContext)}
          >
            <SelectTrigger aria-label="Ödeme bağlamı">
              <SelectValue />
            </SelectTrigger>
            <SelectContent data-prototype-tools-overlay="true">
              <SelectItem value="branch">Şube ödemesi</SelectItem>
              <SelectItem value="tenant">Kurum faturası</SelectItem>
              <SelectItem value="blocked">Erişim kapalı kurum</SelectItem>
              <SelectItem value="missing-scope">Ödeme kapsamı alınamıyor</SelectItem>
            </SelectContent>
          </Select>
        )}
        {fill && (
          <Button variant="outline" onClick={fill}>
            Deneme bilgilerini doldur
          </Button>
        )}
      </section>
    </PrototypeToolsSection>
  );
}

export function PrototypeVerification({
  token,
  onResult,
}: {
  token: string;
  onResult: () => void;
}) {
  const tools = usePaymentService().prototype;
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  if (!tools) return null;
  const verify = async (success: boolean) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await tools.verify(token, success);
      onResult();
    } catch (e) {
      setError(paymentError(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <PrototypeToolsSection title="Banka doğrulaması">
      <section className="prototype-verification">
        <h3>Doğrulama adımını deneyin</h3>
        <p>
          Bu ekran banka bağlantısı kullanmaz. Onaylarsanız seçtiğiniz kalemler ödeme geçmişine
          taşınır; reddederseniz kart adımına dönebilirsiniz.
        </p>
        <div className="payment-heading-actions">
          <Button disabled={busy} onClick={() => void verify(true)}>
            Doğrulamayı onayla
          </Button>
          <Button variant="outline" disabled={busy} onClick={() => void verify(false)}>
            Doğrulamayı reddet
          </Button>
        </div>
        {error && (
          <p role="alert" className="field-error">
            {error}
          </p>
        )}
      </section>
    </PrototypeToolsSection>
  );
}
