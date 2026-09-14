import { isDate, localDate } from '../../lib/validation.ts';
import type {
  Receipt,
  Sale,
  SaleFreeze,
  SaleLifecycleEvent,
  SaleTransfer,
} from './finance-model.ts';

export type TransferMode = 'STUDENT' | 'PERIOD' | 'BOTH';
export type LifecycleCommand =
  | { kind: 'endDate'; effectiveDate: string; endDate: string; note: string }
  | { kind: 'freeze'; freezeStartDate: string; freezeEndDate: string; note: string }
  | { kind: 'unfreeze'; effectiveDate: string; note: string }
  | {
      kind: 'transfer';
      transferType: TransferMode;
      toStudentId?: number;
      toPricingId?: string;
      transferredAmount: number;
      reason: string;
    };
export type LifecycleContext = { id: string; now: string; branchId: string; actor: string };

export const activeFreeze = (sale: Sale) =>
  sale.freezes?.find((freeze) => freeze.status === 'active');
export const saleLifecycleRevision = (sale: Sale) =>
  JSON.stringify({
    endDate: sale.endDate ?? null,
    educationStatus: sale.educationStatus ?? null,
    lifecycle: (sale.lifecycle || []).map((event) => [event.id, event.createdAt]),
    freezes: (sale.freezes || []).map((freeze) => [freeze.id, freeze.status, freeze.updatedAt]),
    transfers: (sale.transfers || []).map((transfer) => [
      transfer.id,
      transfer.status,
      transfer.updatedAt,
    ]),
  });

const cents = (value: number) => Math.round(value * 100);
export function collectedForSale(saleId: string, receipts: Receipt[]) {
  return (
    receipts.filter((r) => r.saleId === saleId).reduce((sum, r) => sum + cents(r.amount), 0) / 100
  );
}
export function transferInvariant(sale: Sale, receipts: Receipt[], amount: number) {
  const paid = collectedForSale(sale.id, receipts);
  const outstanding = Math.max(0, cents(sale.amount) - cents(paid)) / 100;
  if (
    !Number.isFinite(amount) ||
    cents(amount) <= 0 ||
    Math.abs(amount * 100 - cents(amount)) > 0.00001
  )
    return {
      paid,
      outstanding,
      issue: 'Sıfırdan büyük, en fazla iki ondalıklı transfer tutarı girin.',
    };
  if (cents(amount) > cents(outstanding))
    return { paid, outstanding, issue: 'Transfer tutarı ödenmemiş bakiyeyi aşamaz.' };
  return { paid, outstanding, issue: null };
}

export function lifecycleCommandIssue(
  sale: Sale,
  command: LifecycleCommand,
  studentIds: number[],
  pricingIds: string[],
  receipts: Receipt[],
) {
  if (
    ['cancelled', 'refunded'].includes(sale.status || '') ||
    sale.educationStatus === 'transferred'
  )
    return 'İptal, iade veya transfer edilmiş satışta eğitim işlemi yapılamaz.';
  if (command.kind === 'transfer') {
    if (sale.transfers?.some((transfer) => transfer.status === 'pending'))
      return 'Bu satış için bekleyen bir transfer taslağı zaten var.';
    if (
      (command.transferType === 'STUDENT' || command.transferType === 'BOTH') &&
      (!command.toStudentId ||
        !studentIds.includes(command.toStudentId) ||
        command.toStudentId === sale.studentId)
    )
      return 'Farklı ve mevcut bir hedef öğrenci seçin.';
    if (
      (command.transferType === 'PERIOD' || command.transferType === 'BOTH') &&
      (!command.toPricingId ||
        !pricingIds.includes(command.toPricingId) ||
        command.toPricingId === (sale.pricingId || sale.planId))
    )
      return 'Farklı ve mevcut bir hedef dönem/paket seçin.';
    return transferInvariant(sale, receipts, command.transferredAmount).issue;
  }
  const effectiveDate = command.kind === 'freeze' ? command.freezeStartDate : command.effectiveDate;
  if (!isDate(effectiveDate) || effectiveDate > localDate())
    return 'Geçerli ve gelecekte olmayan bir işlem tarihi seçin.';
  if (
    command.kind === 'endDate' &&
    (!isDate(command.endDate) || command.endDate < (sale.startDate || sale.date))
  )
    return 'Bitiş tarihi eğitim başlangıcından önce olamaz.';
  if (command.kind === 'freeze') {
    if (sale.educationStatus === 'frozen' || activeFreeze(sale)) return 'Eğitim zaten dondurulmuş.';
    if (!isDate(command.freezeEndDate) || command.freezeEndDate < command.freezeStartDate)
      return 'Dondurma bitişini kontrol edin.';
    if (sale.endDate && command.freezeStartDate > sale.endDate)
      return 'Dondurma başlangıcı eğitim bitişinden sonra olamaz.';
  }
  if (command.kind === 'unfreeze') {
    const freeze = activeFreeze(sale);
    if (sale.educationStatus !== 'frozen' || !freeze)
      return 'Yalnız etkin dondurma kaydı olan eğitim yeniden başlatılabilir.';
    if (command.effectiveDate < freeze.freezeStartDate)
      return 'Dondurma bitişi başlangıç tarihinden önce olamaz.';
  }
  return null;
}

/** Pure local adapter. Transfer creates pending metadata only; it never moves money or receipts. */
export function applyLifecycleCommand(
  sale: Sale,
  command: LifecycleCommand,
  context: LifecycleContext,
  receipts: Receipt[],
) {
  if (command.kind === 'endDate') {
    const event: SaleLifecycleEvent = {
      id: context.id,
      saleId: sale.id,
      studentId: sale.studentId,
      type: 'end-date-changed',
      createdAt: context.now,
      effectiveDate: command.effectiveDate,
      previousEndDate: sale.endDate ?? undefined,
      endDate: command.endDate,
      note: command.note.trim() || undefined,
    };
    return { ...sale, endDate: command.endDate, lifecycle: [event, ...(sale.lifecycle || [])] };
  }
  if (command.kind === 'freeze') {
    const original = sale.endDate || null;
    const freeze: SaleFreeze = {
      id: context.id,
      saleId: sale.id,
      studentId: sale.studentId,
      branchId: context.branchId,
      freezeStartDate: command.freezeStartDate,
      freezeEndDate: command.freezeEndDate,
      freezeDays: null,
      reason: command.note.trim() || null,
      status: 'active',
      frozenBy: context.actor,
      unfrozenBy: null,
      unfrozenAt: null,
      originalEndDate: original,
      newEndDate: null,
      createdAt: context.now,
      updatedAt: context.now,
    };
    return {
      ...sale,
      educationStatus: 'frozen' as const,
      freezes: [freeze, ...(sale.freezes || [])],
    };
  }
  if (command.kind === 'unfreeze') {
    const unfrozenAt =
      command.effectiveDate === context.now.slice(0, 10)
        ? context.now
        : `${command.effectiveDate}T00:00:00.000Z`;
    return {
      ...sale,
      educationStatus: 'active' as const,
      freezes: (sale.freezes || []).map((freeze) =>
        freeze.status === 'active'
          ? {
              ...freeze,
              status: 'completed' as const,
              unfrozenBy: context.actor,
              unfrozenAt,
              updatedAt: context.now,
            }
          : freeze,
      ),
    };
  }
  const amounts = transferInvariant(sale, receipts, command.transferredAmount);
  const transfer: SaleTransfer = {
    id: context.id,
    originalSaleId: sale.id,
    newSaleId: null,
    fromStudentId: String(sale.studentId),
    toStudentId: command.toStudentId ? String(command.toStudentId) : null,
    fromPricingId: sale.pricingId || sale.planId || null,
    toPricingId: command.toPricingId || null,
    transferType: command.transferType,
    transferredAmount: command.transferredAmount.toFixed(2),
    paidAmount: amounts.paid.toFixed(2),
    reason: command.reason.trim() || null,
    status: 'pending',
    branchId: context.branchId,
    transferredBy: context.actor,
    createdAt: context.now,
    updatedAt: context.now,
  };
  return { ...sale, transfers: [transfer, ...(sale.transfers || [])] };
}
