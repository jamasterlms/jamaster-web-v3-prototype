import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeading } from '@/components/shared/primitives';
import { parsePhone } from '@/lib/validation';
export function PollingPage({ pollId }: { pollId: string }) {
  const [phone, setPhone] = useState(''),
    [code, setCode] = useState(''),
    [step, setStep] = useState(0),
    [error, setError] = useState('');
  return (
    <div className="auth-content">
      <PageHeading
        title="Derse katılım"
        description="Telefon ve doğrulama kodu adımlarını tamamlayın."
      />
      {!pollId ? (
        <Card className="service-notice">
          <h2>Yoklama bağlantısı eksik</h2>
          <p>Eğitmeninizden güncel yoklama bağlantısını isteyin.</p>
        </Card>
      ) : (
        <>
          <p className="field-hint mb-5">
            Yoklama arayüzü önizlemesi. SMS gönderilmez ve canlı katılım kaydı oluşturulmaz.
          </p>
          {step === 2 ? (
            <Card className="portal-section">
              <h2>Doğrulama adımı tamamlandı</h2>
              <p>{parsePhone(phone)?.formatInternational()} için deneme tamamlandı.</p>
              <Button
                variant="outline"
                onClick={() => {
                  setStep(0);
                  setCode('');
                }}
              >
                Başa dön
              </Button>
            </Card>
          ) : (
            <form
              className="space-y-5"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                if (!parsePhone(phone)) {
                  setError('Geçerli bir telefon numarası girin.');
                  return;
                }
                if (step === 1 && code !== '112233') {
                  setError('Doğrulama kodunu kontrol edin. Deneme kodu: 112233.');
                  return;
                }
                setError('');
                setStep(step + 1);
              }}
            >
              <div className="form-field">
                <Label htmlFor="polling-phone">Telefon numarası *</Label>
                <Input
                  id="polling-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="Telefon numaranız"
                  value={phone}
                  onValueChange={setPhone}
                  disabled={step === 1}
                />
              </div>
              {step === 1 && (
                <div className="form-field">
                  <Label htmlFor="polling-code">Doğrulama kodu *</Label>
                  <Input
                    id="polling-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="6 haneli kod"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  />
                  <small>Deneme kodu: 112233</small>
                </div>
              )}
              {error && (
                <p className="field-error" role="alert">
                  {error}
                </p>
              )}
              <div className="form-actions">
                {step === 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStep(0);
                      setCode('');
                      setError('');
                    }}
                  >
                    Telefonu değiştir
                  </Button>
                )}
                <Button type="submit">{step === 0 ? 'Kod adımına geç' : 'Doğrula'}</Button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
