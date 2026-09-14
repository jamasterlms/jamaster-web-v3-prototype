import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { PricePlan } from '@/features/operations/model';
import { useLearningData } from '@/features/education/learning-catalog';
export const paymentTypes = [
  { id: 1, name: 'Nakit', type: 'CASH' },
  { id: 2, name: 'Havale', type: 'BANK_TRANSFER' },
  { id: 3, name: 'Kredi kartı', type: 'CREDIT_CARD_SINGLE' },
  { id: 4, name: 'Online ödeme', type: 'IYZICO' },
  { id: 5, name: 'Senet', type: 'PROMISSORY_NOTE' },
];
export const defaultDiscounts = paymentTypes.map((p) => ({
  paymentTypeId: p.id,
  paymentType: p.type,
  discount: { type: 'percentage' as const, value: 0 },
}));
export function PricingFields({
  value,
  onChange,
  section,
  contracts = [],
}: {
  section: 'required' | 'optional';
  contracts?: { id: string; name: string }[];
  value: PricePlan;
  onChange: (v: PricePlan) => void;
}) {
  const catalog = useLearningData();
  const discounts = value.paymentDiscounts || defaultDiscounts;
  return (
    <>
      {section === 'required' && (
        <div className="form-grid">
          <div className="form-field">
            <Label htmlFor="pricing-period">Eğitim dönemi *</Label>
            <Select
              required
              value={value.periodId || undefined}
              onValueChange={(periodId) => onChange({ ...value, periodId })}
            >
              <SelectTrigger id="pricing-period">
                <SelectValue placeholder="Dönem seçin" />
              </SelectTrigger>
              <SelectContent>
                {catalog.periods
                  .filter((p) => p.isActive || p.id === value.periodId)
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                {value.periodId && !catalog.periods.some((p) => p.id === value.periodId) && (
                  <SelectItem value={value.periodId}>Kayıtlı eğitim dönemi</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="form-field">
            <Label htmlFor="pricing-contract">Sözleşme *</Label>
            <Select
              required
              value={value.contract || undefined}
              onValueChange={(contract) => onChange({ ...value, contract })}
            >
              <SelectTrigger id="pricing-contract">
                <SelectValue placeholder="Sözleşme seçin" />
              </SelectTrigger>
              <SelectContent>
                {contracts.map((contract) => (
                  <SelectItem key={contract.id} value={contract.id}>
                    {contract.name}
                  </SelectItem>
                ))}
                {value.contract && !contracts.some((c) => c.id === value.contract) && (
                  <SelectItem value={value.contract}>
                    Kayıtlı sözleşme · {value.contract}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      {section === 'optional' && (
        <>
          <div className="flex gap-3 items-center">
            <Switch
              id="pricing-campaign"
              checked={value.hasCampaign || false}
              onCheckedChange={(hasCampaign) => onChange({ ...value, hasCampaign })}
            />
            <Label htmlFor="pricing-campaign">Kampanyalı paket</Label>
          </div>
          {value.hasCampaign && (
            <div className="form-conditional">
              <p className="field-hint">
                Kampanya etkinse adı, fiyatı ve tarih aralığı gereklidir.
              </p>
              <div className="form-grid">
                <div className="form-field">
                  <Label htmlFor="campaign-title">Kampanya adı *</Label>
                  <Input
                    id="campaign-title"
                    required
                    maxLength={160}
                    value={value.campaignTitle || ''}
                    onChange={(e) => onChange({ ...value, campaignTitle: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <Label htmlFor="campaign-price">Kampanya fiyatı (₺) *</Label>
                  <Input
                    id="campaign-price"
                    required
                    type="number"
                    min={0}
                    max={value.price}
                    step="0.01"
                    value={value.campaignPrice ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        campaignPrice: e.target.value === '' ? undefined : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="form-field">
                  <Label htmlFor="campaign-start">Başlangıç *</Label>
                  <Input
                    id="campaign-start"
                    required
                    type="date"
                    max={value.campaignEndDate || undefined}
                    value={value.campaignStartDate || ''}
                    onChange={(e) => onChange({ ...value, campaignStartDate: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <Label htmlFor="campaign-end">Bitiş *</Label>
                  <Input
                    id="campaign-end"
                    required
                    type="date"
                    min={value.campaignStartDate || undefined}
                    value={value.campaignEndDate || ''}
                    onChange={(e) => onChange({ ...value, campaignEndDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
          <div>
            <h3 className="subsection-title">Ödeme yöntemine göre indirim</h3>
            <div className="discount-table">
              {discounts.map((discount, index) => (
                <div className="discount-row" key={discount.paymentTypeId}>
                  <Label htmlFor={`discount-value-${index}`}>
                    {paymentTypes.find((p) => p.id === discount.paymentTypeId)?.name}
                  </Label>
                  <Select
                    value={discount.discount.type}
                    onValueChange={(type) =>
                      onChange({
                        ...value,
                        paymentDiscounts: discounts.map((d, i) =>
                          i === index
                            ? {
                                ...d,
                                discount: { ...d.discount, type: type as 'percentage' | 'amount' },
                              }
                            : d,
                        ),
                      })
                    }
                  >
                    <SelectTrigger aria-label={`${paymentTypes[index].name} indirim türü`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Yüzde (%)</SelectItem>
                      <SelectItem value="amount">Tutar (₺)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id={`discount-value-${index}`}
                    type="number"
                    min={0}
                    max={discount.discount.type === 'percentage' ? 100 : value.price}
                    step="0.01"
                    value={discount.discount.value}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        paymentDiscounts: discounts.map((d, i) =>
                          i === index
                            ? { ...d, discount: { ...d.discount, value: Number(e.target.value) } }
                            : d,
                        ),
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
