import { parsePhoneNumberFromString } from 'libphonenumber-js/max';

export type PaymentSource = 'TENANT_INVOICE' | 'BRANCH_PAYMENT' | 'STUDENT_INSTALLMENT';
export type PaymentStatus = 'OPEN' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'SUPERSEDED';
export type Obligation = {
  sourceId: string;
  title: string;
  description: string;
  dueDate: string;
  amount: number;
  currency: string;
  status: string;
};
export type PaymentScope = {
  sourceType: PaymentSource;
  scope: { type: string; tenantId: string; branchId?: string; studentId?: string };
  returnPath: string;
  panelPath: string;
};
export type PaymentLink = PaymentScope & {
  id: string;
  token: string;
  status: PaymentStatus;
  items: Obligation[];
  totalAmount: number;
  currency: string;
  replacedByPaymentLinkId?: string | null;
  /** Local scenario metadata; never interpreted as a bank/provider response. */
  prototypeClosure?: 'expired';
  completionSummary?: {
    stillBlocked: boolean;
    remainingCount: number;
    remainingAmount: number;
    currency: string;
  } | null;
};
export type PaymentAccess = { blocked: boolean; action: string; panelPath: string };
export type PaymentCard = {
  id: string;
  cardId: string;
  lastFourDigits: string;
  cardAlias: string | null;
  cardAssociation: string | null;
  isDefault: boolean;
  isActive: boolean;
};
export type PaymentAddress = {
  id?: string;
  title?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  zipCode: string;
  identityNumber: string;
};
export type CardDraft = {
  cardHolderName: string;
  cardNumber: string;
  expireMonth: string;
  expireYear: string;
  cvc: string;
};
export type CheckoutDraft = {
  addressSource: 'saved' | 'new';
  cardSource: 'saved' | 'new';
  addressId: string;
  cardId: string;
  address: PaymentAddress;
  card: CardDraft;
  saveAddress: boolean;
  saveCard: boolean;
  consent: boolean;
};
export type CheckoutRequest = {
  addressId?: string;
  addressData?: PaymentAddress;
  userCardId?: string;
  cardData?: CardDraft;
  saveAddress?: boolean;
  saveCard?: boolean;
  installments: number;
  locale: 'tr';
};
export const emptyAddress: PaymentAddress = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  identityNumber: '',
  address: '',
  city: '',
  country: 'Türkiye',
  zipCode: '',
};
export const emptyCard: CardDraft = {
  cardHolderName: '',
  cardNumber: '',
  expireMonth: '',
  expireYear: '',
  cvc: '',
};
export const emptyCheckout: CheckoutDraft = {
  addressSource: 'new',
  cardSource: 'new',
  addressId: '',
  cardId: '',
  address: emptyAddress,
  card: emptyCard,
  saveAddress: false,
  saveCard: false,
  consent: false,
};
export const sourceLabels: Record<PaymentSource, string> = {
  TENANT_INVOICE: 'Kurum faturaları',
  BRANCH_PAYMENT: 'Şube ödemeleri',
  STUDENT_INSTALLMENT: 'Öğrenci taksitleri',
};
export const statusLabels: Record<string, string> = {
  OPEN: 'Devam ediyor',
  PROCESSING: 'İşleniyor',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal edildi',
  SUPERSEDED: 'Yenilendi',
  PENDING: 'Bekliyor',
  PAID: 'Ödendi',
  OVERDUE: 'Gecikmiş',
  FAILED: 'Başarısız',
  UNPAID: 'Ödenmedi',
};
export function money(amount: number, currency = 'TRY') {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}
export function paymentDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Belirtilmedi'
    : new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }).format(
        date,
      );
}
export function selectedObligations(items: Obligation[], ids: string[]) {
  const set = new Set(ids);
  return items.filter((item) => set.has(item.sourceId));
}
export function paymentTotals(items: Obligation[]) {
  const totals = new Map<string, number>();
  for (const item of items)
    totals.set(item.currency, (totals.get(item.currency) || 0) + Math.round(item.amount * 100));
  return [...totals].map(([currency, amount]) => ({ currency, amount: amount / 100 }));
}
export function mergeHistory(current: Obligation[], incoming: Obligation[]) {
  return [...new Map([...current, ...incoming].map((item) => [item.sourceId, item])).values()];
}
export function paymentView(status: PaymentStatus, uncertain: boolean) {
  if (status === 'COMPLETED') return 'completed';
  if (status === 'CANCELLED') return 'cancelled';
  if (status === 'SUPERSEDED') return 'superseded';
  if (status === 'PROCESSING') return 'processing';
  return uncertain ? 'verification' : 'checkout';
}
export { legacyPaymentPath } from './payment-routes.ts';
export function addressErrors(value: PaymentAddress): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const key of ['firstName', 'lastName', 'city', 'country'] as const)
    if (value[key].trim().length < 2) errors[key] = 'En az 2 karakter girin.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim()))
    errors.email = 'Geçerli bir e-posta adresi girin.';
  const phone = parsePhoneNumberFromString(value.phone, { defaultCountry: 'TR', extract: false });
  if (!phone?.isValid() || phone.country !== 'TR')
    errors.phone = 'Türkiye ülke koduyla geçerli bir telefon numarası girin.';
  if (!/^\d{11}$/.test(value.identityNumber))
    errors.identityNumber = 'Kimlik numarası 11 haneli olmalıdır.';
  if (value.address.trim().length < 10)
    errors.address = 'Açık adresi en az 10 karakter olarak girin.';
  if (!/^\d{5}$/.test(value.zipCode)) errors.zipCode = 'Posta kodu 5 haneli olmalıdır.';
  return errors;
}
export function cardErrors(value: CardDraft, now = new Date()): Record<string, string> {
  const errors: Record<string, string> = {},
    digits = value.cardNumber.replace(/\D/g, '');
  let sum = 0;
  for (let i = digits.length - 1, n = 0; i >= 0; i--, n++) {
    let digit = Number(digits[i]);
    if (n % 2) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  if (!value.cardHolderName.trim()) errors.cardHolderName = 'Kart üzerindeki ad soyadı girin.';
  if (!/^\d{13,19}$/.test(digits) || sum % 10 !== 0 || /^0+$/.test(digits))
    errors.cardNumber = 'Geçerli bir kart numarası girin.';
  if (!/^(0[1-9]|1[0-2])$/.test(value.expireMonth))
    errors.expireMonth = 'Ayı 01–12 arasında girin.';
  if (!/^\d{4}$/.test(value.expireYear)) errors.expireYear = 'Yılı 4 haneli girin.';
  else if (
    Number(value.expireYear) < now.getFullYear() ||
    (Number(value.expireYear) === now.getFullYear() &&
      Number(value.expireMonth) < now.getMonth() + 1)
  )
    errors.expireMonth = 'Kartın son kullanma tarihi geçmiş.';
  if (!/^\d{3,4}$/.test(value.cvc)) errors.cvc = '3 veya 4 haneli güvenlik kodunu girin.';
  return errors;
}
export function checkoutPayload(draft: CheckoutDraft): CheckoutRequest {
  const result: CheckoutRequest = { installments: 1, locale: 'tr' };
  if (draft.addressSource === 'saved') result.addressId = draft.addressId;
  else {
    const phone = parsePhoneNumberFromString(draft.address.phone, 'TR')?.nationalNumber || '';
    result.addressData = {
      ...draft.address,
      phone: phone.replace(/^(\d{3})(\d{3})(\d{2})(\d{2})$/, '($1) $2 $3 $4'),
    };
    delete result.addressData.id;
    delete result.addressData.title;
    result.saveAddress = draft.saveAddress;
  }
  if (draft.cardSource === 'saved') result.userCardId = draft.cardId;
  else {
    result.cardData = {
      ...draft.card,
      cardHolderName: draft.card.cardHolderName.trim(),
      cardNumber: draft.card.cardNumber.replace(/\D/g, ''),
    };
    result.saveCard = draft.saveCard;
  }
  return result;
}
