import { isDate, localDate } from '../../lib/validation.ts';
export type SalaryRecord = {
  id: string;
  personId: string;
  kind: 'teacher' | 'staff';
  name: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  salaryType: 'HOURLY' | 'WEEKLY' | 'MONTHLY';
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
  calculatedHours?: number;
  description?: string;
  payments?: { id: string; amount: number; date: string; description: string }[];
};
export function salaryPaymentIssue(record: SalaryRecord, amount: number, date: string) {
  if (record.status === 'CANCELLED' || record.status === 'PAID') return 'Bu kayda ödeme eklenemez.';
  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    Math.round(amount * 100) > Math.round((record.totalAmount - record.paidAmount) * 100)
  )
    return 'Ödeme tutarı sıfırdan büyük ve kalan tutarı aşmayacak şekilde olmalıdır.';
  if (!isDate(date) || date > localDate()) return 'Geçerli bir ödeme tarihi seçin.';
  return null;
}
