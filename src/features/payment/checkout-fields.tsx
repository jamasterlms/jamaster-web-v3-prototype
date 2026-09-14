import type { ComponentProps, ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/shared/icon';
import {
  emptyAddress,
  emptyCard,
  type CheckoutDraft,
  type PaymentAddress,
  type CardDraft,
} from './payment-model';
import type { PaymentResources } from './payment-service';
type FieldProps = { name: string; label: string; error?: string; children: ReactNode };
function Field({ name, label, error, children }: FieldProps) {
  return (
    <div className="form-field">
      <Label htmlFor={name}>
        {label} <span aria-hidden="true">*</span>
      </Label>
      {children}
      {error && (
        <p id={name + '-error'} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
function fieldProps(id: string, error?: string) {
  return {
    id,
    required: true,
    'aria-invalid': !!error,
    'aria-describedby': error ? id + '-error' : undefined,
  };
}
type Props = {
  draft: CheckoutDraft;
  onChange: (draft: CheckoutDraft) => void;
  errors: Record<string, string>;
  resources: PaymentResources;
};
export function CheckoutAddressFields({ draft, onChange, errors, resources }: Props) {
  const address = draft.address;
  const update = (key: keyof PaymentAddress, value: string) =>
    onChange({ ...draft, address: { ...address, [key]: value }, consent: false });
  const fields: {
    key: keyof PaymentAddress;
    label: string;
    placeholder: string;
    type?: string;
    autoComplete?: string;
    maxLength?: number;
    inputMode?: ComponentProps<'input'>['inputMode'];
  }[] = [
    { key: 'firstName', label: 'Ad', placeholder: 'Adınız', autoComplete: 'given-name' },
    { key: 'lastName', label: 'Soyad', placeholder: 'Soyadınız', autoComplete: 'family-name' },
    {
      key: 'email',
      label: 'E-posta',
      placeholder: 'ad@kurum.com',
      type: 'email',
      autoComplete: 'email',
    },
    {
      key: 'phone',
      label: 'Telefon',
      placeholder: '+90 5xx xxx xx xx',
      type: 'tel',
      autoComplete: 'tel',
    },
    {
      key: 'identityNumber',
      label: 'T.C. kimlik numarası',
      placeholder: '11 haneli kimlik numarası',
      maxLength: 11,
      inputMode: 'numeric',
    },
    { key: 'city', label: 'İl', placeholder: 'İstanbul', autoComplete: 'address-level1' },
    { key: 'country', label: 'Ülke', placeholder: 'Türkiye', autoComplete: 'country-name' },
    {
      key: 'zipCode',
      label: 'Posta kodu',
      placeholder: '34000',
      maxLength: 5,
      inputMode: 'numeric',
      autoComplete: 'postal-code',
    },
  ];
  return (
    <section className="checkout-fields">
      <div className="checkout-section-heading">
        <div>
          <h2>Fatura adresi</h2>
          <p>Ödemenize ait iletişim ve fatura bilgilerini tamamlayın.</p>
        </div>
      </div>
      {resources.addresses.length > 0 && (
        <div className="checkout-source-switch">
          <Button
            type="button"
            variant={draft.addressSource === 'saved' ? 'secondary' : 'ghost'}
            onClick={() =>
              onChange({ ...draft, addressSource: 'saved', address: emptyAddress, consent: false })
            }
          >
            Kayıtlı adresler
          </Button>
          <Button
            type="button"
            variant={draft.addressSource === 'new' ? 'secondary' : 'ghost'}
            onClick={() =>
              onChange({ ...draft, addressSource: 'new', saveAddress: false, consent: false })
            }
          >
            Yeni adres
          </Button>
        </div>
      )}
      {draft.addressSource === 'saved' ? (
        <div className="checkout-options" role="group" aria-label="Fatura adresi seçin">
          {resources.addresses.map((item) => (
            <Button
              type="button"
              key={item.id}
              variant="outline"
              className="checkout-option"
              aria-pressed={draft.addressId === item.id}
              onClick={() => onChange({ ...draft, addressId: item.id || '', consent: false })}
            >
              <Icon name={draft.addressId === item.id ? 'circle-check' : 'map-pin'} />
              <span>
                <strong>{item.title || item.firstName + ' ' + item.lastName}</strong>
                <small>{item.address}</small>
                <small>
                  {item.city} · {item.zipCode} · {item.country}
                </small>
              </span>
            </Button>
          ))}
          {errors.addressId && (
            <p className="field-error" role="alert">
              {errors.addressId}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="checkout-field-grid">
            {fields.map(({ key, label, ...input }) => {
              const id = 'payment-address-' + key;
              return (
                <Field key={key} name={id} label={label} error={errors[key]}>
                  <Input
                    {...fieldProps(id, errors[key])}
                    {...input}
                    value={address[key] || ''}
                    onValueChange={(value) => update(key, value)}
                  />
                </Field>
              );
            })}
            <div className="checkout-wide-field">
              <Field name="payment-address-address" label="Açık adres" error={errors.address}>
                <Textarea
                  {...fieldProps('payment-address-address', errors.address)}
                  autoComplete="street-address"
                  placeholder="Mahalle, cadde, bina ve daire numarası"
                  rows={3}
                  value={address.address}
                  onChange={(e) => update('address', e.target.value)}
                />
              </Field>
            </div>
          </div>
          <div className="checkout-optional">
            <h3>İsteğe bağlı</h3>
            <Label htmlFor="payment-save-address">
              <Checkbox
                id="payment-save-address"
                checked={draft.saveAddress}
                onCheckedChange={(value) =>
                  onChange({ ...draft, saveAddress: !!value, consent: false })
                }
              />
              Bu adresi sonraki ödemelerim için kaydet
            </Label>
          </div>
        </>
      )}
    </section>
  );
}
export function CheckoutCardFields({ draft, onChange, errors, resources }: Props) {
  const update = (key: keyof CardDraft, value: string) =>
    onChange({ ...draft, card: { ...draft.card, [key]: value }, consent: false });
  const fields: {
    key: keyof CardDraft;
    label: string;
    placeholder: string;
    maxLength?: number;
    inputMode?: ComponentProps<'input'>['inputMode'];
    autoComplete: string;
  }[] = [
    {
      key: 'cardHolderName',
      label: 'Kart üzerindeki ad soyad',
      placeholder: 'AD SOYAD',
      autoComplete: 'cc-name',
    },
    {
      key: 'cardNumber',
      label: 'Kart numarası',
      placeholder: '0000 0000 0000 0000',
      inputMode: 'numeric',
      autoComplete: 'cc-number',
      maxLength: 23,
    },
    {
      key: 'expireMonth',
      label: 'Son kullanma ayı',
      placeholder: 'AA',
      inputMode: 'numeric',
      autoComplete: 'cc-exp-month',
      maxLength: 2,
    },
    {
      key: 'expireYear',
      label: 'Son kullanma yılı',
      placeholder: 'YYYY',
      inputMode: 'numeric',
      autoComplete: 'cc-exp-year',
      maxLength: 4,
    },
    {
      key: 'cvc',
      label: 'Güvenlik kodu',
      placeholder: 'CVC / CVV',
      inputMode: 'numeric',
      autoComplete: 'cc-csc',
      maxLength: 4,
    },
  ];
  return (
    <section className="checkout-fields">
      <div className="checkout-section-heading">
        <div>
          <h2>Ödeme yöntemi</h2>
          <p>Kayıtlı kartınızı seçin veya yeni kart bilgilerini girin.</p>
        </div>
        <Icon name="credit-card" />
      </div>
      {resources.cards.length > 0 && (
        <div className="checkout-source-switch">
          <Button
            type="button"
            variant={draft.cardSource === 'saved' ? 'secondary' : 'ghost'}
            onClick={() =>
              onChange({
                ...draft,
                cardSource: 'saved',
                card: emptyCard,
                saveCard: false,
                consent: false,
              })
            }
          >
            Kayıtlı kartlar
          </Button>
          <Button
            type="button"
            variant={draft.cardSource === 'new' ? 'secondary' : 'ghost'}
            onClick={() => onChange({ ...draft, cardSource: 'new', consent: false })}
          >
            Yeni kart
          </Button>
        </div>
      )}
      {draft.cardSource === 'saved' ? (
        <div className="checkout-options" role="group" aria-label="Ödeme kartı seçin">
          {resources.cards.map((card) => (
            <Button
              type="button"
              key={card.cardId}
              variant="outline"
              className="checkout-option"
              aria-pressed={draft.cardId === card.cardId}
              onClick={() => onChange({ ...draft, cardId: card.cardId, consent: false })}
            >
              <Icon name="credit-card" />
              <span>
                <strong>{card.cardAlias || 'Kayıtlı kart'}</strong>
                <small>
                  •••• {card.lastFourDigits} · {card.cardAssociation || 'Banka kartı'}
                </small>
              </span>
              {draft.cardId === card.cardId && <Icon name="check" />}
            </Button>
          ))}
          {errors.cardId && (
            <p role="alert" className="field-error">
              {errors.cardId}
            </p>
          )}
        </div>
      ) : (
        <>
          <Card className="checkout-card-preview" aria-hidden="true">
            <Icon name="credit-card" />
            <span>
              •••• •••• •••• {draft.card.cardNumber.replace(/\D/g, '').slice(-4) || '••••'}
            </span>
            <small>{draft.card.cardHolderName || 'KART ÜZERİNDEKİ AD SOYAD'}</small>
          </Card>
          <div className="checkout-field-grid">
            {fields.map(({ key, label, ...input }) => {
              const id = 'payment-card-' + key;
              return (
                <Field key={key} name={id} label={label} error={errors[key]}>
                  <Input
                    {...fieldProps(id, errors[key])}
                    {...input}
                    type={key === 'cvc' ? 'password' : 'text'}
                    value={draft.card[key]}
                    onValueChange={(value) =>
                      update(
                        key,
                        key === 'cardNumber'
                          ? value
                              .replace(/\D/g, '')
                              .slice(0, 19)
                              .replace(/(.{4})/g, '$1 ')
                              .trim()
                          : key === 'cardHolderName'
                            ? value
                            : value.replace(/\D/g, ''),
                      )
                    }
                  />
                </Field>
              );
            })}
          </div>
          <div className="checkout-optional">
            <h3>İsteğe bağlı</h3>
            <Label htmlFor="payment-save-card">
              <Checkbox
                id="payment-save-card"
                checked={draft.saveCard}
                onCheckedChange={(value) =>
                  onChange({ ...draft, saveCard: !!value, consent: false })
                }
              />
              Bu kartı sonraki ödemelerim için kaydet
            </Label>
            <p>Güvenlik kodunuz kaydedilmez.</p>
          </div>
        </>
      )}
    </section>
  );
}
