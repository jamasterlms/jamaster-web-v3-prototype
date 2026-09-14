import type {
  CheckoutRequest,
  Obligation,
  PaymentAccess,
  PaymentAddress,
  PaymentCard,
  PaymentLink,
  PaymentScope,
  PaymentSource,
} from './payment-model.ts';

export type RequestOptions = {
  method?: 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  timeout?: number;
};
/** Inject the authenticated Jamaster API client. Tenant/branch headers belong to that client, never to UI role guesses. */
export type PaymentTransport = (path: string, options?: RequestOptions) => Promise<unknown>;
export type HistoryPage = {
  items: Obligation[];
  page: number;
  totalPages: number;
  totalItems: number;
};
export type PaymentResources = { addresses: PaymentAddress[]; cards: PaymentCard[] };
export type BranchPayment = {
  id: string;
  branchId: string;
  branchName: string;
  amount: number;
  status: string;
  dueDate: string;
  paymentDate: string | null;
};
export type BranchReceipt = {
  paymentType: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'CASH' | 'OTHER';
  paymentDate?: string;
  paymentReference?: string;
  notes?: string;
};
export type CheckoutResult = {
  status: string;
  success?: boolean;
  htmlContent?: string;
  threeDSHtmlContent?: string;
};
export class PaymentServiceError extends Error {
  status?: number;
  indeterminate: boolean;
  constructor(message: string, status?: number, indeterminate = false) {
    super(message);
    this.status = status;
    this.indeterminate = indeterminate;
  }
}
const cardPath = (source: PaymentSource) =>
  source === 'TENANT_INVOICE' ? '/super-admin/tenant-cards' : '/admin/branch-payment-cards';
type RawCard = {
  id: string;
  cardId?: string;
  userCardId?: string;
  priority?: number;
  isDefault?: boolean;
  isActive: boolean;
  lastFourDigits: string;
  cardAlias?: string | null;
  cardAssociation?: string | null;
  userCard?: { lastFourDigits: string; cardAlias?: string | null; cardAssociation?: string | null };
};
type RawAddress = {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  identityNumber: string;
  title: string;
};
function normalizeCards(rows: RawCard[], source: PaymentSource): PaymentCard[] {
  const ordered =
    source === 'BRANCH_PAYMENT'
      ? [...rows].sort((a, b) => (a.priority ?? Infinity) - (b.priority ?? Infinity))
      : rows;
  const defaultId = ordered.find((c) => c.isActive)?.id;
  return ordered
    .filter((row) => source !== 'TENANT_INVOICE' || row.userCard)
    .map((row) => {
      const card = source === 'TENANT_INVOICE' ? row.userCard! : row;
      return {
        id: row.id,
        cardId: (source === 'TENANT_INVOICE' ? row.userCardId : row.cardId) || '',
        lastFourDigits: card.lastFourDigits,
        cardAlias: card.cardAlias || null,
        cardAssociation: card.cardAssociation || null,
        isDefault: source === 'TENANT_INVOICE' ? !!row.isDefault : row.id === defaultId,
        isActive: row.isActive,
      };
    });
}
export function createPaymentService(request: PaymentTransport) {
  const cards = async (source: PaymentSource) => {
    if (source === 'STUDENT_INSTALLMENT') return [];
    const response = (await request(cardPath(source) + '?limit=100')) as { data: RawCard[] };
    return normalizeCards(response.data, source);
  };
  return {
    configured: true,
    branchPayments: (query: string) =>
      request('/super/branch-payments?' + query) as Promise<{
        data: BranchPayment[];
        page: number;
        totalPages: number;
        totalItems: number;
      }>,
    collectorLink: (branchId: string, ids: string[]) =>
      request('/super/branch-payments/' + encodeURIComponent(branchId) + '/payment-links', {
        method: 'POST',
        body: { sourceIds: ids },
      }) as Promise<{ token: string; url: string }>,
    receiveBranchPayment: (id: string, body: BranchReceipt) =>
      request('/super/branch-payments/' + encodeURIComponent(id) + '/receive', {
        method: 'POST',
        body,
      }),
    scope: () => request('/payment/scopes') as Promise<PaymentScope>,
    access: () => request('/payment/access') as Promise<PaymentAccess>,
    obligations: () =>
      request('/payment/obligations') as Promise<{
        items: Obligation[];
        totalAmount: number;
        currency: string;
        count: number;
      }>,
    active: () => request('/payment/active-link') as Promise<PaymentLink | null>,
    history: (page: number) => request('/payment/history?page=' + page) as Promise<HistoryPage>,
    link: (token: string) =>
      request('/payment-links/' + encodeURIComponent(token)) as Promise<PaymentLink>,
    create: (ids: string[]) =>
      request('/payment-links', {
        method: 'POST',
        body: { sourceIds: [...new Set(ids)], intent: 'CHECKOUT' },
      }) as Promise<{ token: string; url: string }>,
    checkout: (token: string, body: CheckoutRequest) =>
      request('/payment-links/' + encodeURIComponent(token) + '/checkout', {
        method: 'POST',
        body,
        timeout: 60000,
      }) as Promise<CheckoutResult>,
    cancel: (token: string) =>
      request('/payment-links/' + encodeURIComponent(token) + '/cancel', {
        method: 'POST',
        body: {},
      }),
    cards,
    setDefault: (source: PaymentSource, id: string) =>
      request(cardPath(source) + '/' + encodeURIComponent(id), {
        method: 'PUT',
        body: source === 'TENANT_INVOICE' ? { isDefault: true } : { priority: 1 },
      }),
    removeCard: (source: PaymentSource, id: string) =>
      request(cardPath(source) + '/' + encodeURIComponent(id), { method: 'DELETE' }),
    resources: async (source: PaymentSource): Promise<PaymentResources> => {
      if (source === 'STUDENT_INSTALLMENT')
        throw new PaymentServiceError('Bu ödeme türünde çevrim içi ödeme henüz desteklenmiyor.');
      const [addresses, savedCards] = await Promise.all([
        request(
          (source === 'TENANT_INVOICE' ? '/super-admin' : '/admin') + '/user-addresses?limit=100',
        ) as Promise<{ data: RawAddress[] }>,
        cards(source),
      ]);
      return {
        cards: savedCards.filter((card) => card.isActive && card.cardId),
        addresses: addresses.data.map((a) => ({
          id: a.id,
          title: a.title,
          firstName: a.name,
          lastName: a.surname,
          email: a.email,
          phone: a.phone,
          address: a.address,
          city: a.city,
          country: a.country,
          zipCode: a.postalCode,
          identityNumber: a.identityNumber,
        })),
      };
    },
  };
}
export type PaymentService = ReturnType<typeof createPaymentService> & {
  prototype?: import('./prototype-payment-service.ts').PrototypePaymentTools;
};
/** No invented balances, card vault or successful charge in an unconnected workspace. */
export const unavailablePaymentService: PaymentService = {
  ...createPaymentService(async () => {
    throw new PaymentServiceError(
      'Ödeme hizmetine bağlantı kurulamadı. Tutarlar ve ödeme durumları doğrulanamıyor.',
    );
  }),
  configured: false,
};
export function paymentError(error: unknown) {
  if (error instanceof PaymentServiceError) return error.message;
  return 'İşlem tamamlanamadı. Bağlantınızı kontrol edip yeniden deneyin.';
}

/** A known rejection can be corrected; an uncertain financial mutation must be verified. */
export function paymentMutationFailure(error: unknown): 'rejected' | 'verify' {
  return error instanceof PaymentServiceError &&
    !error.indeterminate &&
    !!error.status &&
    error.status >= 400 &&
    error.status < 500 &&
    error.status !== 409 &&
    error.status !== 408
    ? 'rejected'
    : 'verify';
}
