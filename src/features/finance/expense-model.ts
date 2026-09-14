import type { Expense } from '../operations/model.ts';

export function expenseDraft(expense: Expense): Expense {
  return { type: 'EXPENSE', transactionMode: 'ONE_TIME', isRecurringActive: true, ...expense };
}
export function normalizeExpense(expense: Expense): Expense {
  const base = { ...expenseDraft(expense), title: expense.title.trim(), note: expense.note.trim() };
  if (base.transactionMode === 'RECURRING') return { ...base, date: base.recurringStartDate || '' };
  const { recurringPeriod, recurringStartDate, recurringEndDate, isRecurringActive, ...oneTime } =
    base;
  return oneTime;
}
export function monthlyExpenses(expenses: Expense[], month: string) {
  return expenses.filter(
    (e) => e.type !== 'INCOME' && e.transactionMode !== 'RECURRING' && e.date.startsWith(month),
  );
}
