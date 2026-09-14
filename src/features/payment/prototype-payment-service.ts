import { addressErrors, cardErrors } from './payment-model.ts';
import { PaymentServiceError, type PaymentService, type BranchPayment } from './payment-service.ts';
import type {
  PaymentAddress,
  PaymentCard,
  PaymentLink,
  Obligation,
  PaymentScope,
} from './payment-model.ts';

export type PaymentScenario = 'success' | 'decline' | 'verification' | 'expired';
export type PaymentDemoContext = 'branch' | 'tenant' | 'blocked' | 'missing-scope';
export type PrototypePaymentTools = {
  scenario: PaymentScenario;
  subscribe: (listener: () => void) => () => void;
  getScenario: () => PaymentScenario;
  setScenario: (scenario: PaymentScenario) => void;
  verify: (token: string, success: boolean) => Promise<void>;
  reset: () => void;
};
export const prototypeBillingAddress: PaymentAddress = {
  id: 'billing-address',
  title: 'New York · Fatura adresi',
  firstName: 'Deniz',
  lastName: 'Yılmaz',
  email: 'deniz@example.com',
  phone: '+905321234567',
  identityNumber: '10000000146',
  address: 'Atatürk Caddesi No: 15, Kat: 2',
  city: 'İstanbul',
  country: 'Türkiye',
  zipCode: '34000',
};
const clone = <T>(value: T): T => structuredClone(value);
/** Standalone prototype only. No transport, bank call, PAN or CVC storage. */
export function createPrototypePaymentService(
  storage?: Pick<Storage, 'getItem' | 'setItem'>,
  branchName = 'New York',
  demoContext: PaymentDemoContext = 'branch',
): PaymentService {
  const branchId = branchName === 'New York' ? 'new-york' : encodeURIComponent(branchName);
  const tenantContext = demoContext === 'tenant' || demoContext === 'blocked';
  const scope: PaymentScope = tenantContext
    ? {
        sourceType: 'TENANT_INVOICE',
        scope: { type: 'TENANT', tenantId: 'prototype' },
        returnPath: '/super/billing',
        panelPath: '/admin/dashboard',
      }
    : {
        sourceType: 'BRANCH_PAYMENT',
        scope: { type: 'BRANCH', tenantId: 'prototype', branchId },
        returnPath: '/admin/dashboard',
        panelPath: '/admin/dashboard',
      };
  const billingAddress = { ...prototypeBillingAddress, title: branchName + ' · Fatura adresi' };
  const today = new Date(),
    year = today.getFullYear(),
    month = today.getMonth();
  const date = (offset: number) =>
    new Date(year, month + offset, 15, 12).toISOString().slice(0, 10);
  const branchInitial: Obligation[] = [
    {
      sourceId: 'license-previous',
      title: 'Şube lisansı',
      description: branchName + ' · Önceki dönem',
      dueDate: date(-1),
      amount: 3500,
      currency: 'TRY',
      status: 'OVERDUE',
    },
    {
      sourceId: 'license-current',
      title: 'Şube lisansı',
      description: branchName + ' · Bu dönem',
      dueDate: date(0),
      amount: 3500,
      currency: 'TRY',
      status: 'PENDING',
    },
    {
      sourceId: 'message-package',
      title: 'İletişim paketi',
      description: 'SMS ve e-posta kullanım paketi',
      dueDate: date(0),
      amount: 1250,
      currency: 'TRY',
      status: 'PENDING',
    },
  ];
  const tenantInitial: Obligation[] = [
    {
      sourceId: 'tenant-invoice-previous',
      title: 'Jamaster kurum faturası',
      description: 'Önceki abonelik dönemi',
      dueDate: date(-1),
      amount: 8900,
      currency: 'TRY',
      status: 'OVERDUE',
    },
    {
      sourceId: 'tenant-invoice-current',
      title: 'Jamaster kurum faturası',
      description: 'Güncel abonelik dönemi',
      dueDate: date(0),
      amount: 8900,
      currency: 'TRY',
      status: 'PENDING',
    },
  ];
  const initial = tenantContext ? tenantInitial : branchInitial;
  let items = clone(initial),
    history: Obligation[] = [
      {
        ...initial[0],
        sourceId: 'license-paid',
        description: branchName + ' · Tamamlanan dönem',
        dueDate: date(-2),
        status: 'PAID',
      },
    ];
  let links: PaymentLink[] = [],
    addresses = [clone(billingAddress)];
  let cards: PaymentCard[] = [
    {
      id: 'saved-card',
      cardId: 'test-card',
      lastFourDigits: '1111',
      cardAlias: 'Kurumsal kart',
      cardAssociation: 'Visa',
      isDefault: true,
      isActive: true,
    },
  ];
  const storageKey = `jamaster-payment-prototype-v2:${tenantContext ? 'tenant' : branchId}:${demoContext}`;
  const legacyStorageKey =
    'jamaster-payment-prototype-v1' + (branchId === 'new-york' ? '' : ':' + branchId);
  try {
    const saved = JSON.parse(
      storage?.getItem(storageKey) ||
        (demoContext === 'branch' ? storage?.getItem(legacyStorageKey) : null) ||
        'null',
    );
    const validItem = (item: Obligation) =>
      item &&
      typeof item.sourceId === 'string' &&
      typeof item.title === 'string' &&
      typeof item.dueDate === 'string' &&
      Number.isFinite(item.amount) &&
      item.amount > 0 &&
      item.currency === 'TRY';
    if (
      [1, 2].includes(saved?.version) &&
      Array.isArray(saved.items) &&
      saved.items.every(validItem) &&
      Array.isArray(saved.history) &&
      saved.history.every(validItem) &&
      Array.isArray(saved.links) &&
      saved.links.every(
        (link: PaymentLink) =>
          link &&
          typeof link.token === 'string' &&
          ['OPEN', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'SUPERSEDED'].includes(link.status) &&
          Array.isArray(link.items) &&
          link.items.every(validItem) &&
          Number.isFinite(link.totalAmount) &&
          link.currency === 'TRY' &&
          link.sourceType === scope.sourceType,
      )
    ) {
      items = saved.items;
      history = saved.history;
      links = saved.links;
      if (
        Array.isArray(saved.cards) &&
        saved.cards.every(
          (card: PaymentCard) =>
            card &&
            typeof card.id === 'string' &&
            typeof card.cardId === 'string' &&
            /^\d{4}$/.test(card.lastFourDigits),
        )
      )
        cards = saved.cards.map((card: PaymentCard) => ({
          id: card.id,
          cardId: card.cardId,
          lastFourDigits: card.lastFourDigits,
          cardAlias: card.cardAlias || 'Kayıtlı kart',
          cardAssociation: card.cardAssociation || '',
          isDefault: !!card.isDefault,
          isActive: !!card.isActive,
        }));
      if (
        Array.isArray(saved.addresses) &&
        saved.addresses.every(
          (address: PaymentAddress) =>
            address &&
            typeof address.id === 'string' &&
            [
              'firstName',
              'lastName',
              'email',
              'phone',
              'address',
              'city',
              'country',
              'zipCode',
              'identityNumber',
            ].every((key) => typeof address[key as keyof PaymentAddress] === 'string'),
        )
      )
        addresses = saved.addresses;
    }
  } catch {
    /* A damaged session starts a fresh payment demonstration. */
  }
  // Only explicitly saved addresses and masked card metadata survive reload. Never PAN or CVC.
  const persist = () => {
    try {
      storage?.setItem(
        storageKey,
        JSON.stringify({ version: 2, items, history, links, cards, addresses }),
      );
    } catch {
      /* The current session stays usable. */
    }
  };
  const find = (token: string) => {
    const link = links.find((value) => value.token === token);
    if (!link)
      throw new PaymentServiceError(
        'Ödeme bağlantısı bulunamadı. Ödeme merkezinden yeni bir işlem açın.',
        404,
      );
    return link;
  };
  const branches = (): BranchPayment[] =>
    items.map((item) => ({
      id: item.sourceId,
      branchId,
      branchName,
      amount: item.amount,
      dueDate: item.dueDate,
      status: item.status === 'OVERDUE' ? 'overdue' : 'pending',
      paymentDate: null,
    }));
  const listeners = new Set<() => void>();
  const prototype: PrototypePaymentTools = {
    scenario: 'success',
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getScenario: () => prototype.scenario,
    setScenario(scenario) {
      prototype.scenario = scenario;
      listeners.forEach((listener) => listener());
    },
    async verify(token, success) {
      const link = find(token);
      if (link.status !== 'PROCESSING')
        throw new PaymentServiceError('İşlem durumu değişmiş. Ekranı yenileyin.', 409);
      link.status = success ? 'COMPLETED' : 'OPEN';
      if (success) {
        const ids = new Set(link.items.map((item) => item.sourceId));
        history = [...link.items.map((item) => ({ ...item, status: 'PAID' })), ...history];
        items = items.filter((item) => !ids.has(item.sourceId));
        link.completionSummary = {
          stillBlocked: demoContext === 'blocked' && items.length > 0,
          remainingCount: items.length,
          remainingAmount: items.reduce((sum, item) => sum + item.amount, 0),
          currency: 'TRY',
        };
      }
      persist();
    },
    reset() {
      items = clone(initial);
      links = [];
      history = [
        {
          ...initial[0],
          sourceId: 'license-paid',
          description: branchName + ' · Tamamlanan dönem',
          dueDate: date(-2),
          status: 'PAID',
        },
      ];
      addresses = [clone(billingAddress)];
      cards = [
        {
          id: 'saved-card',
          cardId: 'test-card',
          lastFourDigits: '1111',
          cardAlias: 'Kurumsal kart',
          cardAssociation: 'Visa',
          isDefault: true,
          isActive: true,
        },
      ];
      prototype.setScenario('success');
      persist();
    },
  };
  const service: PaymentService = {
    configured: true,
    prototype,
    async scope() {
      if (demoContext === 'missing-scope')
        throw new PaymentServiceError(
          'Ödeme kapsamı alınamadı. Oturum ve kurum bilginizi yenileyip tekrar deneyin.',
          404,
        );
      return clone(scope);
    },
    async access() {
      const blocked = demoContext === 'blocked' && items.length > 0;
      return { blocked, action: blocked ? 'PAYMENT_REQUIRED' : 'NONE', panelPath: scope.panelPath };
    },
    async obligations() {
      return {
        items: clone(items),
        totalAmount: items.reduce((sum, row) => sum + row.amount, 0),
        currency: 'TRY',
        count: items.length,
      };
    },
    async active() {
      return clone(links.find((link) => ['OPEN', 'PROCESSING'].includes(link.status)) || null);
    },
    async history(page) {
      return {
        items: clone(history.slice((page - 1) * 20, page * 20)),
        page,
        totalPages: Math.max(1, Math.ceil(history.length / 20)),
        totalItems: history.length,
      };
    },
    async link(token) {
      return clone(find(token));
    },
    async create(ids) {
      if (links.some((link) => link.status === 'PROCESSING'))
        throw new PaymentServiceError('Önce devam eden işlemin sonucunu kontrol edin.', 409);
      const selected = [...new Set(ids)].map((id) => items.find((item) => item.sourceId === id));
      if (!selected.length || selected.some((item) => !item))
        throw new PaymentServiceError('Güncel ödeme kalemlerini seçin.', 422);
      const token = 'prototype-' + crypto.randomUUID();
      links.forEach((link) => {
        if (link.status === 'OPEN') link.status = 'SUPERSEDED';
      });
      links.unshift({
        ...clone(scope),
        id: token,
        token,
        status: prototype.scenario === 'expired' ? 'CANCELLED' : 'OPEN',
        ...(prototype.scenario === 'expired' ? { prototypeClosure: 'expired' as const } : {}),
        items: clone(selected as Obligation[]),
        totalAmount: selected.reduce((sum, item) => sum + item!.amount, 0),
        currency: 'TRY',
      });
      persist();
      return { token, url: '/payment/' + token };
    },
    async checkout(token, body) {
      const link = find(token);
      if (link.status !== 'OPEN') throw new PaymentServiceError('İşlem durumu değişmiş.', 409);
      if (
        body.userCardId
          ? !cards.some((card) => card.cardId === body.userCardId && card.isActive)
          : !body.cardData || Object.keys(cardErrors(body.cardData)).length
      )
        throw new PaymentServiceError('Kart bilgilerini kontrol edin.', 422);
      if (
        body.addressId
          ? !addresses.some((address) => address.id === body.addressId)
          : !body.addressData || Object.keys(addressErrors(body.addressData)).length
      )
        throw new PaymentServiceError('Fatura adresini kontrol edin.', 422);
      if (body.installments !== 1)
        throw new PaymentServiceError('Bu işlem tek çekim olarak yapılmalıdır.', 422);
      if (prototype.scenario === 'decline')
        throw new PaymentServiceError(
          'Kart işlemi reddedildi. Başka bir kart seçerek tekrar deneyebilirsiniz.',
          422,
        );
      if (body.saveAddress && body.addressData)
        addresses.push({
          ...clone(body.addressData),
          id: crypto.randomUUID(),
          title: 'Fatura adresi',
        });
      if (body.saveCard && body.cardData) {
        const id = crypto.randomUUID();
        cards.push({
          id,
          cardId: id,
          lastFourDigits: body.cardData.cardNumber.replace(/\D/g, '').slice(-4),
          cardAlias: 'Kart •••• ' + body.cardData.cardNumber.replace(/\D/g, '').slice(-4),
          cardAssociation: 'Banka kartı',
          isDefault: !cards.length,
          isActive: true,
        });
      }
      link.status = 'PROCESSING';
      persist();
      if (prototype.scenario === 'verification')
        throw new PaymentServiceError(
          'İşlem sonucu bekleniyor. Doğrulama ekranından devam edin.',
          undefined,
          true,
        );
      return { status: 'PROCESSING', success: true };
    },
    async cancel(token) {
      const link = find(token);
      if (link.status !== 'OPEN')
        throw new PaymentServiceError('Yalnız açık ödeme iptal edilebilir.', 409);
      link.status = 'CANCELLED';
      persist();
    },
    async cards() {
      return clone(cards);
    },
    async resources() {
      return { addresses: clone(addresses), cards: clone(cards.filter((card) => card.isActive)) };
    },
    async setDefault(_source, id) {
      if (!cards.some((card) => card.id === id))
        throw new PaymentServiceError('Kart bulunamadı.', 404);
      cards = cards.map((card) => ({ ...card, isDefault: card.id === id }));
      persist();
    },
    async removeCard(_source, id) {
      cards = cards.filter((card) => card.id !== id);
      if (cards.length && !cards.some((card) => card.isDefault)) cards[0].isDefault = true;
      persist();
    },
    async branchPayments(query) {
      const params = new URLSearchParams(query),
        page = Math.max(1, Number(params.get('page')) || 1),
        limit = 10;
      const search = (params.get('search') || '').toLocaleLowerCase('tr-TR');
      const [key, direction] = (params.get('sortOrder') || 'dueDate:desc').split(':');
      const rows = branches()
        .filter((row) => row.branchName.toLocaleLowerCase('tr-TR').includes(search))
        .sort((a, b) => {
          const result =
            key === 'amount'
              ? a.amount - b.amount
              : String(a[key as keyof BranchPayment]).localeCompare(
                  String(b[key as keyof BranchPayment]),
                  'tr',
                );
          return direction === 'desc' ? -result : result;
        });
      return {
        data: rows.slice((page - 1) * limit, page * limit),
        page,
        totalPages: Math.max(1, Math.ceil(rows.length / limit)),
        totalItems: rows.length,
      };
    },
    async collectorLink(_branch, ids) {
      return service.create(ids);
    },
    async receiveBranchPayment(id) {
      if (
        links.some(
          (link) => link.status === 'PROCESSING' && link.items.some((item) => item.sourceId === id),
        )
      )
        throw new PaymentServiceError(
          'Bu ödeme için devam eden kart işleminin sonucunu kontrol edin.',
          409,
        );
      const item = items.find((item) => item.sourceId === id);
      if (!item) throw new PaymentServiceError('Ödeme bulunamadı veya önceden tahsil edildi.', 409);
      links.forEach((link) => {
        if (link.status === 'OPEN' && link.items.some((item) => item.sourceId === id))
          link.status = 'SUPERSEDED';
      });
      history.unshift({ ...item, status: 'PAID' });
      items = items.filter((item) => item.sourceId !== id);
      persist();
    },
  };
  return service;
}
