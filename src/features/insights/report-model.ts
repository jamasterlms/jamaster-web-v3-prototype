import type { WorkspaceState } from '../../app/workspace-reducer.ts';
import { financeRecords, inPeriod, saleBalance } from '../finance/finance-model.ts';
export function distribution<T>(rows: T[], key: (row: T) => string, value: (row: T) => number) {
  const result = new Map<string, number>();
  rows.forEach((row) => {
    const label = key(row) || 'Belirtilmedi';
    result.set(label, (result.get(label) || 0) + value(row));
  });
  return [...result].sort((a, b) => b[1] - a[1]);
}
export function financeSummary(state: WorkspaceState, period: string) {
  const records = financeRecords(state);
  const sales = records.sales.filter((s) => inPeriod(s.date, period));
  const receipts = records.receipts.filter((r) => inPeriod(r.date, period));
  return {
    records,
    sales,
    receipts,
    sold: sales.reduce((n, s) => n + s.amount, 0),
    collected: receipts.reduce((n, r) => n + r.amount, 0),
    balance: sales.reduce((n, s) => n + saleBalance(s, records.receipts), 0),
    allTimeBalance: records.sales.reduce((n, s) => n + saleBalance(s, records.receipts), 0),
    courses: distribution(
      sales,
      (s) => s.course,
      (s) => s.amount,
    ),
    methods: distribution(
      receipts,
      (r) => r.method,
      (r) => r.amount,
    ),
  };
}
