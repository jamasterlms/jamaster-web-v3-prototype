import type { WorkspaceState } from '../../app/workspace-reducer.ts';
import { splitInstallments } from '../../lib/payments.ts';
import { isDate, localDate } from '../../lib/validation.ts';
import type { Student } from '../../types/index.ts';
import { readBankAccounts } from '../settings/bank-model.ts';

/** Preserve canonical source codes while adapting existing UI-labelled payment records. */
export function paymentMethodCode(value: string): string {
  const aliases: Record<string, string> = {
    Nakit: 'CASH',
    'Nakit ödeme': 'CASH',
    'Havale / EFT': 'BANK_TRANSFER',
    'Kredi kartı': 'CREDIT_CARD_SINGLE',
    Senet: 'PROMISSORY_NOTE',
  };
  return aliases[value] || value;
}

export type Sale = {
  id: string;
  studentId: number;
  course: string;
  /** Existing local alias for the source pricingId. */
  planId?: string;
  amount: number;
  /** Source list price. `amount` remains the agreed/net amount used by local balances. */
  listAmount?: number;
  discountedAmount?: number;
  method: string;
  installments: number;
  discount: number;
  date: string;
  dueDates?: string[];
  legacyOverdue?: boolean;
  startDate?: string;
  endDate?: string | null;
  status?: 'completed' | 'pending' | 'cancelled' | 'refunded';
  educationStatus?: 'active' | 'frozen' | 'transferred' | 'expired';
  educationId?: string;
  pricingId?: string;
  advisorId?: string;
  frozenDays?: string;
  usedBonusCount?: number;
  remainingBonusCount?: number;
  lastBonusUsedAt?: string | null;
  lastBonusUsedBy?: string | null;
  lifecycle?: SaleLifecycleEvent[];
  freezes?: SaleFreeze[];
  transfers?: SaleTransfer[];
};
export type SaleLifecycleEvent = {
  id: string;
  saleId: string;
  studentId: number;
  type: 'end-date-changed';
  createdAt: string;
  effectiveDate: string;
  previousEndDate?: string;
  endDate?: string;
  note?: string;
};
export type SaleFreeze = {
  id: string;
  saleId: string;
  studentId: number;
  branchId: string;
  freezeStartDate: string;
  freezeEndDate: string | null;
  freezeDays: string | null;
  reason: string | null;
  status: 'active' | 'completed' | 'cancelled';
  frozenBy: string;
  unfrozenBy: string | null;
  unfrozenAt: string | null;
  originalEndDate: string | null;
  newEndDate: string | null;
  createdAt: string;
  updatedAt: string;
};
export type SaleTransfer = {
  id: string;
  originalSaleId: string;
  newSaleId: string | null;
  fromStudentId: string;
  toStudentId: string | null;
  fromPricingId: string | null;
  toPricingId: string | null;
  transferType: 'STUDENT' | 'PERIOD' | 'BOTH';
  transferredAmount: string | null;
  paidAmount: string | null;
  reason: string | null;
  status: 'pending' | 'completed' | 'cancelled';
  branchId: string;
  transferredBy: string;
  createdAt: string;
  updatedAt: string;
};
export type Receipt = {
  id: string;
  saleId: string;
  studentId: number;
  amount: number;
  method: string;
  date: string;
  installmentId?: string;
  bankAccountId?: string;
  bankAccountName?: string;
  notes?: string;
};
export type FinanceRecords = { sales: Sale[]; receipts: Receipt[] };
const cents = (n: number) => Math.round(n * 100);
function savedObject(value?: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}
/** Materialize old balances once, without inventing sale or collection dates. */
export function financeRecords(
  state: Pick<WorkspaceState, 'sales' | 'receipts' | 'students' | 'settings'>,
): FinanceRecords {
  if (Array.isArray(state.sales) && Array.isArray(state.receipts))
    return { sales: state.sales, receipts: state.receipts };
  const sales: Sale[] = [],
    receipts: Receipt[] = [];
  state.students
    .filter((s) => s.amount > 0)
    .forEach((s) => {
      const old = savedObject(state.settings[`sale-${s.id}`]);
      const payment = savedObject(state.settings[`receipt-${s.id}`]);
      const sale: Sale = {
        id: `legacy-sale-${s.id}`,
        studentId: s.id,
        course: s.course,
        amount: s.amount,
        method: String(old.method || ''),
        installments:
          Number.isInteger(old.installments) &&
          Number(old.installments) > 0 &&
          Number(old.installments) <= 120
            ? Number(old.installments)
            : 1,
        discount: Number(old.discount) || 0,
        date: isDate(String(old.date || '')) ? String(old.date) : '',
        legacyOverdue: s.payment === 'Gecikmiş',
      };
      sales.push(sale);
      if (['Tamamlandı', 'Ödendi'].includes(s.payment))
        receipts.push({
          id: `legacy-receipt-${s.id}`,
          saleId: sale.id,
          studentId: s.id,
          amount: sale.amount,
          method: String(payment.method || ''),
          date: isDate(String(payment.date || '')) ? String(payment.date) : '',
        });
    });
  return { sales, receipts };
}
export function saleBalance(sale: Sale, receipts: Receipt[]) {
  return (
    Math.max(
      0,
      cents(sale.amount) -
        receipts.filter((r) => r.saleId === sale.id).reduce((n, r) => n + cents(r.amount), 0),
    ) / 100
  );
}
export function dueDates(first: string, count: number) {
  if (!isDate(first) || !Number.isInteger(count) || count < 1 || count > 120) return [];
  const [year, month, day] = first.split('-').map(Number);
  return Array.from({ length: count }, (_, i) => {
    const lastDay = new Date(year, month + i, 0, 12).getDate();
    return localDate(new Date(year, month - 1 + i, Math.min(day, lastDay), 12));
  });
}
export function installmentRows(records: FinanceRecords) {
  return records.sales.flatMap((s) => {
    const rows = splitInstallments(s.amount, s.installments).map((amount, i) => ({
      id: `${s.id}:${i}`,
      saleId: s.id,
      studentId: s.studentId,
      course: s.course,
      number: i + 1,
      amount,
      paid: 0,
      balance: amount,
      date: s.dueDates?.[i] || '',
    }));
    // Preserve receipt insertion order. Legacy pooled payments retain FIFO allocation;
    // newer payments to a specific installment cannot move earlier allocations.
    for (const receipt of records.receipts.filter((r) => r.saleId === s.id)) {
      let remaining = cents(receipt.amount);
      const targets = receipt.installmentId
        ? rows.filter((r) => r.id === receipt.installmentId)
        : rows;
      for (const row of targets) {
        const paid = Math.min(cents(row.balance), remaining);
        row.paid = (cents(row.paid) + paid) / 100;
        row.balance = (cents(row.balance) - paid) / 100;
        remaining -= paid;
      }
    }
    return rows;
  });
}
export function validateReceipt(
  receipt: Receipt,
  records: FinanceRecords,
  settings?: Record<string, string>,
) {
  const sale = records.sales.find(
    (s) => s.id === receipt.saleId && s.studentId === receipt.studentId,
  );
  if (!sale) return 'Tahsilata ait satış bulunamadı.';
  if (!isDate(receipt.date)) return 'Geçerli bir tahsilat tarihi seçin.';
  if (receipt.date > localDate()) return 'Tahsilat tarihi gelecekte olamaz.';
  if (sale.date && receipt.date < sale.date) return 'Tahsilat tarihi satış tarihinden önce olamaz.';
  if (!['Nakit', 'Havale / EFT', 'Kredi kartı'].includes(receipt.method))
    return 'Ödeme yöntemi seçin.';
  if (settings) {
    const key = receipt.method === 'Nakit' ? 'Nakit ödeme' : receipt.method;
    if (settings[`payment:${key}`] === 'false')
      return 'Bu ödeme yöntemi kapalı. Etkin bir yöntem seçin.';
    if (
      receipt.method === 'Havale / EFT' &&
      !readBankAccounts(settings).some(
        (account) =>
          account.id === receipt.bankAccountId && account.isActive && account.currency === 'TRY',
      )
    )
      return 'Aktif bir Türk lirası banka hesabı seçin.';
  }
  if (
    !Number.isFinite(receipt.amount) ||
    cents(receipt.amount) <= 0 ||
    Math.abs(receipt.amount * 100 - cents(receipt.amount)) > 0.00001
  )
    return 'Sıfırdan büyük, en fazla iki ondalıklı tutar girin.';
  if (cents(receipt.amount) > cents(saleBalance(sale, records.receipts)))
    return 'Tahsilat tutarı kalan bakiyeyi aşamaz.';
  if (receipt.installmentId) {
    const installment = installmentRows(records).find(
      (row) => row.id === receipt.installmentId && row.saleId === sale.id,
    );
    if (!installment) return 'Tahsilata ait taksit bulunamadı.';
    if (cents(receipt.amount) > cents(installment.balance))
      return 'Tahsilat tutarı seçilen taksitin kalanını aşamaz.';
  }
  return null;
}
export function validateSale(sale: Sale) {
  if (!sale.id || !sale.course.trim() || !isDate(sale.date)) return 'Satış bilgilerini tamamlayın.';
  if (
    !Number.isFinite(sale.amount) ||
    sale.amount < 0 ||
    Math.abs(sale.amount * 100 - cents(sale.amount)) > 0.00001
  )
    return 'Geçerli bir satış tutarı girin.';
  if (!Number.isInteger(sale.installments) || sale.installments < 1 || sale.installments > 120)
    return 'Geçerli bir taksit sayısı seçin.';
  if (!Number.isFinite(sale.discount) || sale.discount < 0 || sale.discount > 50)
    return 'İndirim oranını kontrol edin.';
  if (!['Nakit', 'Havale / EFT', 'Kredi kartı'].includes(sale.method))
    return 'Ödeme yöntemi seçin.';
  if (
    sale.dueDates?.length !== sale.installments ||
    sale.dueDates.some(
      (date, i) => !isDate(date) || date < sale.date || (i > 0 && date < sale.dueDates![i - 1]),
    )
  )
    return 'Taksit vadelerini kontrol edin.';
  return null;
}
export function lifecycleIssue(sale: Sale, event: SaleLifecycleEvent, today = localDate()) {
  if (event.saleId !== sale.id || event.studentId !== sale.studentId)
    return 'Eğitim işlemi satış kaydıyla eşleşmiyor.';
  if (!isDate(event.effectiveDate) || event.effectiveDate > today)
    return 'Geçerli ve gelecekte olmayan bir işlem tarihi seçin.';
  if (sale.educationStatus === 'transferred') return 'Transfer edilmiş eğitim değiştirilemez.';
  if (!isDate(event.endDate || '')) return 'Geçerli bir bitiş tarihi seçin.';
  if (event.endDate! < (sale.startDate || sale.date))
    return 'Bitiş tarihi başlangıç tarihinden önce olamaz.';
  return null;
}

export function applyLifecycleEvent(sale: Sale, event: SaleLifecycleEvent): Sale {
  if (lifecycleIssue(sale, event)) return sale;
  const base = { ...sale, lifecycle: [event, ...(sale.lifecycle || [])] };
  return { ...base, endDate: event.endDate };
}

export function freezeIssue(sale: Sale, freeze: SaleFreeze) {
  if (freeze.saleId !== sale.id || freeze.studentId !== sale.studentId)
    return 'Dondurma kaydı satışla eşleşmiyor.';
  if (!isDate(freeze.freezeStartDate) || freeze.freezeStartDate < (sale.startDate || sale.date))
    return 'Geçerli bir dondurma başlangıcı seçin.';
  if (
    freeze.freezeEndDate &&
    (!isDate(freeze.freezeEndDate) || freeze.freezeEndDate < freeze.freezeStartDate)
  )
    return 'Dondurma bitişini kontrol edin.';
  if (freeze.status === 'active' && sale.freezes?.some((f) => f.status === 'active'))
    return 'Bu eğitimde etkin bir dondurma zaten var.';
  return null;
}
export function studentFinancials(student: Student, records: FinanceRecords, today = localDate()) {
  const sales = records.sales.filter((s) => s.studentId === student.id);
  const amount = sales.reduce((n, s) => n + cents(s.amount), 0) / 100;
  const balance = sales.reduce((n, s) => n + cents(saleBalance(s, records.receipts)), 0) / 100;
  const overdue =
    installmentRows({ ...records, sales }).some((r) => r.date && r.date < today && r.balance > 0) ||
    sales.some((s) => s.legacyOverdue && saleBalance(s, records.receipts) > 0);
  const payment =
    balance === 0
      ? 'Tamamlandı'
      : overdue
        ? 'Gecikmiş'
        : balance < amount
          ? 'Kısmi ödeme'
          : 'Bekliyor';
  return { ...student, amount, payment };
}
export const inPeriod = (date: string, period: string) =>
  period === 'all' || (!!date && date.startsWith(period));
export function reportPeriods(dates: string[], today = localDate()) {
  return [...new Set([today.slice(0, 7), ...dates.filter(isDate).map((d) => d.slice(0, 7))])]
    .sort()
    .reverse();
}
export const periodLabel = (period: string) =>
  period === 'all'
    ? 'Tüm dönemler'
    : new Date(`${period}-01T12:00:00`).toLocaleDateString('tr-TR', {
        month: 'long',
        year: 'numeric',
      });
