/** Allocate integer cents so preview installments sum to the agreed amount. */
export function splitInstallments(amount: number, count: number): number[] {
  if (
    !Number.isFinite(amount) ||
    amount < 0 ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > 120
  )
    return [];
  const cents = Math.round(amount * 100),
    base = Math.floor(cents / count),
    remainder = cents % count;
  return Array.from({ length: count }, (_, i) => (base + (i < remainder ? 1 : 0)) / 100);
}

import type { PricePlan } from '../features/operations/model.ts';
export function priceQuote(plan: PricePlan, date: string, method: string, extraDiscount = 0) {
  const campaign =
    plan.hasCampaign &&
    plan.campaignStartDate &&
    plan.campaignEndDate &&
    date >= plan.campaignStartDate &&
    date <= plan.campaignEndDate &&
    Number.isFinite(plan.campaignPrice);
  const base = campaign ? plan.campaignPrice! : plan.price;
  const paymentType = (
    {
      Nakit: 'CASH',
      'Havale / EFT': 'BANK_TRANSFER',
      'Kredi kartı': 'CREDIT_CARD_SINGLE',
    } as Record<string, string>
  )[method];
  const adjustment = plan.paymentDiscounts?.find((d) => d.paymentType === paymentType)?.discount;
  const methodDiscount = adjustment
    ? Math.min(
        base,
        adjustment.type === 'percentage' ? (base * adjustment.value) / 100 : adjustment.value,
      )
    : 0;
  const afterMethod = Math.max(0, base - methodDiscount),
    additionalDiscount = (afterMethod * extraDiscount) / 100;
  return {
    campaign: Boolean(campaign),
    base,
    methodDiscount,
    additionalDiscount,
    amount: Math.round((afterMethod - additionalDiscount) * 100) / 100,
  };
}
