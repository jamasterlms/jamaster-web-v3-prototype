import type { WorkspaceState } from '../../app/workspace-reducer.ts';
import type { OperationsState } from '../operations/model.ts';
import {
  financeRecords,
  installmentRows,
  saleBalance,
  paymentMethodCode,
} from './finance-model.ts';
import { isDate, localDate } from '../../lib/validation.ts';
export type PrimaryReportKind =
  | 'sales'
  | 'collections'
  | 'overdue-receivables'
  | 'accounting'
  | 'bills';
export type PrimaryReportRow = {
  id: string;
  studentId?: number;
  saleId?: string;
  installmentId?: string;
  title: string;
  description?: string;
  course?: string;
  pricing?: string;
  educationId?: string;
  planId?: string;
  amount: number;
  paid?: number;
  balance?: number;
  date: string;
  dueDate?: string;
  createdAt?: string;
  method?: string;
  advisor?: string;
  advisorId?: string;
  status?: string;
  discountAmount?: number;
  startDate?: string;
  endDate?: string | null;
  daysOverdue?: number;
  number?: number;
  totalInstallments?: number;
  type?: 'INCOME' | 'EXPENSE' | 'COLLECTION';
  sourceType?: string;
  category?: string;
  categoryId?: string;
  transactionMode?: string;
  recurringPeriod?: string;
  recurringStartDate?: string;
  recurringEndDate?: string;
  createdBy?: string;
  href?: string;
};
export type BillRecord = {
  id: string;
  clientId: number;
  clientName: string;
  advisor?: string;
  advisorId?: string;
  amount: number;
  paidAmount?: number;
  date: string;
  dueDate: string;
  installmentNumber: number;
  totalInstallments: number;
  status: 'paid' | 'unpaid' | 'overdue' | 'pending';
  saleId?: string;
};
const saleHref = (studentId: number, saleId: string) =>
  `/admin/students/${studentId}/payments?tab=saleHistory&saleId=${encodeURIComponent(saleId)}`;
export function primaryReportRows(
  state: WorkspaceState,
  operations: OperationsState,
  kind: PrimaryReportKind,
  today = localDate(),
): PrimaryReportRow[] {
  const records = financeRecords(state);
  const students = new Map(state.students.map((s) => [s.id, s]));
  if (kind === 'bills')
    return (state.bills || []).map((b) => ({
      id: b.id,
      studentId: b.clientId,
      title: b.clientName,
      advisor: b.advisor,
      advisorId: b.advisorId,
      amount: b.amount,
      paid: b.paidAmount,
      balance: b.paidAmount === undefined ? undefined : Math.max(0, b.amount - b.paidAmount),
      date: b.date,
      dueDate: b.dueDate,
      createdAt: b.date,
      number: b.installmentNumber,
      totalInstallments: b.totalInstallments,
      status: b.status,
      href: `/admin/students/${b.clientId}/payments?tab=installments`,
    }));
  const receipts: PrimaryReportRow[] = records.receipts.map((r) => ({
    id: r.id,
    studentId: r.studentId,
    saleId: r.saleId,
    installmentId: r.installmentId,
    title: students.get(r.studentId)?.name || 'Öğrenci bulunamadı',
    amount: r.amount,
    date: r.date,
    method: paymentMethodCode(r.method),
    description: r.notes,
    advisorId: records.sales.find((s) => s.id === r.saleId)?.advisorId,
    advisor:
      records.sales.find((s) => s.id === r.saleId)?.advisorId || students.get(r.studentId)?.advisor,
    type: 'COLLECTION',
    sourceType: r.installmentId ? 'INSTALLMENT' : 'SALE',
    transactionMode: 'ONE_TIME',
    href: r.installmentId
      ? `/admin/students/${r.studentId}/payments?tab=installments&installmentId=${encodeURIComponent(r.installmentId)}`
      : saleHref(r.studentId, r.saleId),
  }));
  if (kind === 'collections') return receipts;
  if (kind === 'accounting')
    return [
      ...receipts,
      ...operations.expenses.map((e) => ({
        id: `expense:${e.id}`,
        title: e.title,
        description: e.note,
        amount: e.amount,
        date: e.date,
        type: e.type || 'EXPENSE',
        sourceType: 'EXPENSE',
        category: e.category,
        categoryId: e.categoryId,
        transactionMode: e.transactionMode || 'ONE_TIME',
        recurringPeriod: e.recurringPeriod,
        recurringStartDate: e.recurringStartDate,
        recurringEndDate: e.recurringEndDate,
        status: e.status,
        href: `/admin/expenses/form?id=${encodeURIComponent(e.id)}`,
      })),
    ];
  if (kind === 'overdue-receivables')
    return installmentRows(records)
      .filter((i) => i.balance > 0 && isDate(i.date) && i.date < today)
      .map((i) => {
        const sale = records.sales.find((s) => s.id === i.saleId)!;
        return {
          id: i.id,
          studentId: i.studentId,
          saleId: i.saleId,
          installmentId: i.id,
          title: students.get(i.studentId)?.name || 'Öğrenci bulunamadı',
          course: i.course,
          amount: i.amount,
          paid: i.paid,
          balance: i.balance,
          date: i.date,
          dueDate: i.date,
          createdAt: sale.date,
          method: paymentMethodCode(sale.method),
          advisorId: sale.advisorId,
          advisor: sale.advisorId || students.get(i.studentId)?.advisor,
          daysOverdue: Math.round(
            (Date.parse(today + 'T00:00:00Z') - Date.parse(i.date + 'T00:00:00Z')) / 86400000,
          ),
          href: `/admin/students/${i.studentId}/payments?tab=installments&installmentsTab=overdue`,
        };
      });
  return records.sales.map((s) => ({
    id: s.id,
    saleId: s.id,
    studentId: s.studentId,
    title: students.get(s.studentId)?.name || 'Öğrenci bulunamadı',
    course: s.course,
    pricing: operations.plans.find((p) => p.id === (s.pricingId || s.planId))?.name,
    planId: s.pricingId || s.planId,
    educationId: s.educationId,
    advisorId: s.advisorId,
    advisor: s.advisorId || students.get(s.studentId)?.advisor,
    status: s.status,
    startDate: s.startDate,
    endDate: s.endDate,
    discountAmount: s.discountedAmount,
    amount: s.amount,
    paid: Math.round((s.amount - saleBalance(s, records.receipts)) * 100) / 100,
    balance: saleBalance(s, records.receipts),
    date: s.date,
    createdAt: s.date,
    method: paymentMethodCode(s.method),
    href: saleHref(s.studentId, s.id),
  }));
}
/** Plans are visible in the ledger but never included as already collected/paid money. */
export function accountingTotals(rows: PrimaryReportRow[]) {
  const sum = (type: string) =>
    Math.round(
      rows
        .filter(
          (r) =>
            r.type === type &&
            r.transactionMode !== 'RECURRING' &&
            (type === 'COLLECTION' || r.status === 'Ödendi'),
        )
        .reduce((n, r) => n + Math.round(r.amount * 100), 0),
    ) / 100;
  const income = sum('INCOME'),
    expenses = sum('EXPENSE'),
    collections = sum('COLLECTION');
  return {
    income,
    expenses,
    collections,
    net: Math.round((income + collections - expenses) * 100) / 100,
  };
}
