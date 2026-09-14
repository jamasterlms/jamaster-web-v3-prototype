import type { BranchReceipt } from './payment-service.ts';
import { isDateTime } from '../../lib/validation.ts';

export function parseReceipt(
  draft: BranchReceipt,
): { ok: true; value: BranchReceipt } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (!['CREDIT_CARD', 'BANK_TRANSFER', 'CASH', 'OTHER'].includes(draft.paymentType))
    errors.paymentType = 'Ödeme yöntemini seçin.';
  const date = draft.paymentDate ? new Date(draft.paymentDate) : null;
  if (date && (!isDateTime(draft.paymentDate!) || !Number.isFinite(date.getTime())))
    errors.paymentDate = 'Geçerli bir tarih ve saat girin.';
  if ((draft.paymentReference || '').length > 255)
    errors.paymentReference = 'İşlem referansı en fazla 255 karakter olabilir.';
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      paymentType: draft.paymentType,
      paymentDate: date?.toISOString(),
      paymentReference: draft.paymentReference?.trim() || undefined,
      notes: draft.notes?.trim() || undefined,
    },
  };
}
