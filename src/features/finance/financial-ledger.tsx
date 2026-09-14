import { useWorkspace } from '@/app/workspace-provider';
import { DateRangeFilter } from '@/components/forms/date-range-filter';
import { Metrics, SearchField } from '@/components/shared/feature-primitives';
import { Icon } from '@/components/shared/icon';
import { PageHeading, Person, StatusBadge } from '@/components/shared/primitives';
import { StudentPicker } from '@/components/shared/student-picker';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { pageFor } from '@/data/navigation';
import { usePageState } from '@/hooks/use-page-state';
import { useQueryFilter } from '@/hooks/use-query-filter';
import { dateTR, downloadCSV, money, normalize } from '@/lib/format';
import { localDate } from '@/lib/validation';
import type { ColumnDef } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { financeRecords, installmentRows, saleBalance, paymentMethodCode } from './finance-model';
import { ReceiptDialog } from './receipt-dialog';

type LedgerRow = {
  id: string;
  saleId: string;
  studentId: number;
  course: string;
  date: string;
  amount: number;
  paid: number;
  balance: number;
  method: string;
  status: string;
  number?: number;
  installmentId?: string;
};
export function LedgerPage({ route }: { route: string }) {
  const { state } = useWorkspace();
  const [query, setQuery] = usePageState('query', '');
  const [filter, setFilter] = useQueryFilter('status', 'Tümü', {
    keys: ['status'],
    read: (query) => {
      const value = query.get('status') || '';
      return ['Gecikmiş', 'Bekliyor', 'Tamamlandı', 'Kısmi ödeme'].includes(value) ? value : 'Tümü';
    },
    write: (query, value) => query.set('status', value),
  });
  const [method, setMethod] = usePageState('paymentMethod', 'Tümü');
  const [advisor, setAdvisor] = usePageState('advisorId', 'Tümü');
  const [range, setRange] = usePageState('dateRange', { from: '', to: '' });
  const [payment, setPayment] = useState<{
    saleId: string;
    amount: number;
    installmentId?: string;
  } | null>(null);
  const records = financeRecords(state),
    today = localDate(),
    slug = route.split('/').at(-1) || '';
  const collections = slug === 'collections',
    installments = /installment/.test(slug) || slug === 'overdue-receivables';
  const missingReportData: Record<string, string> = {
    'pending-sales':
      'Bekleyen satışları göstermek için satış durumları gerekiyor. Ödenmemiş bakiye, satışın beklemede olduğunu göstermez.',
    'completed-sales':
      'Tamamlanan satışları göstermek için satış durumları gerekiyor. Ödemenin tamamlanması farklı bir bilgidir.',
    'cancelled-sales': 'Bu rapor için satış iptal kayıtları gerekiyor.',
    'refunded-sales': 'Bu rapor için iade kayıtları ve iade tutarları gerekiyor.',
    'high-discount-sales': 'Yüksek indirimli satışların rapor verileri henüz alınamıyor.',
    'expiring-soon-sales': 'Bu rapor için sözleşme bitiş tarihleri ve satış durumları gerekiyor.',
    'unpaid-balance-heavy': 'Yüksek bakiye ölçütüyle hesaplanan paket raporu henüz alınamıyor.',
    'installment-risk': 'Danışman bazında hesaplanan taksit risk raporu henüz alınamıyor.',
  };
  const unavailable = missingReportData[slug];
  const status = (balance: number, paid: number, date: string, legacy = false) =>
    balance === 0
      ? 'Tamamlandı'
      : legacy || (!!date && date < today)
        ? 'Gecikmiş'
        : paid > 0
          ? 'Kısmi ödeme'
          : 'Bekliyor';
  let rows: LedgerRow[] = collections
    ? records.receipts.map((r) => ({
        ...r,
        course: records.sales.find((s) => s.id === r.saleId)?.course || '—',
        balance: 0,
        paid: r.amount,
        status: 'Tamamlandı',
      }))
    : installments
      ? installmentRows(records).map((r) => ({
          ...r,
          method: records.sales.find((s) => s.id === r.saleId)?.method || '',
          status: status(r.balance, r.paid, r.date),
        }))
      : records.sales.map((s) => {
          const balance = saleBalance(s, records.receipts);
          const overdue = installmentRows({
            sales: [s],
            receipts: records.receipts,
          }).some((i) => i.date && i.date < today && i.balance > 0);
          return {
            ...s,
            saleId: s.id,
            balance,
            paid: Math.round((s.amount - balance) * 100) / 100,
            status: status(balance, s.amount - balance, '', overdue || s.legacyOverdue),
          };
        });
  if (unavailable) rows = [];
  if (slug === 'no-discount-sales')
    rows = rows.filter((r) => records.sales.find((sale) => sale.id === r.saleId)?.discount === 0);
  if (/overdue|risk/.test(slug)) rows = rows.filter((r) => r.status === 'Gecikmiş');

  const students = new Map(state.students.map((s) => [s.id, s]));
  const list = rows
    .filter((r) => {
      const s = students.get(r.studentId);
      return (
        s &&
        (filter === 'Tümü' || r.status === filter) &&
        (method === 'Tümü' ||
          paymentMethodCode(r.method || 'Belirtilmedi') === paymentMethodCode(method)) &&
        (advisor === 'Tümü' ||
          (advisor === '__unknown__'
            ? !records.sales.find((sale) => sale.id === r.saleId)?.advisorId
            : records.sales.find((sale) => sale.id === r.saleId)?.advisorId === advisor)) &&
        (!range.from || (!!r.date && r.date >= range.from)) &&
        (!range.to || (!!r.date && r.date <= range.to)) &&
        normalize(s.name + ' ' + r.course).includes(normalize(query))
      );
    })
    .sort((a, b) => b.date.localeCompare(a.date));
  const dateTitle = collections ? 'Tahsilat tarihi' : installments ? 'Vade tarihi' : 'Satış tarihi';
  const reset = () => {
    setQuery('');
    setFilter('Tümü');
    setMethod('Tümü');
    setAdvisor('Tümü');
    setRange({ from: '', to: '' });
  };
  const selectFilter = (
    id: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    options: (string | { value: string; label: string })[],
  ) => (
    <div className="form-field">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem
              key={typeof o === 'string' ? o : o.value}
              value={typeof o === 'string' ? o : o.value}
            >
              {typeof o === 'string' ? o : o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
  const action = (r: LedgerRow) => (
    <div className="table-actions">
      {r.balance > 0 && (
        <Button
          onClick={() =>
            setPayment({
              saleId: r.saleId,
              amount: r.balance,
              installmentId: installments ? r.id : undefined,
            })
          }
          variant="ghost"
          size="icon"
          aria-label="Tahsilat ekle"
          title="Tahsilat ekle"
        >
          <Icon name="wallet" />
        </Button>
      )}
      <Button asChild variant="ghost" size="icon" aria-label="Detay" title="Detay">
        <Link
          to={`/admin/students/${r.studentId}/payments?tab=${installments || r.installmentId ? 'installments' : 'saleHistory'}&saleId=${encodeURIComponent(r.saleId)}${r.installmentId ? '&installmentId=' + encodeURIComponent(r.installmentId) : ''}`}
        >
          <Icon name="arrow-up-right" />
        </Link>
      </Button>
    </div>
  );
  return (
    <>
      <PageHeading
        title={pageFor(route).title}
        description={
          collections
            ? 'Ödeme tarihine göre tahsilatlar ve ödeme kanalları.'
            : installments
              ? 'Satışlara ait taksitler, vade tarihleri ve kalan bakiyeler.'
              : 'Satış geçmişi, tahsil edilen tutarlar ve kalan bakiyeler.'
        }
      >
        <StudentPicker mode="sale">
          <Button>
            <Icon name="plus" />
            Yeni satış
          </Button>
        </StudentPicker>
      </PageHeading>
      {unavailable && (
        <p className="pending-banner" role="status">
          {unavailable}
        </p>
      )}
      {!unavailable && (
        <Metrics
          items={[
            { label: 'Listelenen kayıt', value: list.length },
            {
              label: collections ? 'Tahsil edilen' : 'Toplam tutar',
              value: money(list.reduce((n, r) => n + r.amount, 0)),
              highlight: true,
            },
            {
              label: collections ? 'Ödeme kanalı' : 'Kalan bakiye',
              value: collections
                ? new Set(list.map((r) => r.method || 'Belirtilmedi')).size
                : money(list.reduce((n, r) => n + r.balance, 0)),
            },
          ]}
        />
      )}
      <div className="module-toolbar">
        <SearchField value={query} onChange={setQuery} placeholder="Öğrenci veya eğitim ara" />
        <Button
          variant="outline"
          disabled={!!unavailable}
          onClick={() =>
            downloadCSV('jamaster-finans.csv', [
              [
                'Öğrenci',
                'Eğitim',
                dateTitle,
                'Tutar',
                'Tahsil edilen',
                'Kalan',
                'Ödeme yöntemi',
                'Durum',
              ],
              ...list.map((r) => [
                students.get(r.studentId)!.name,
                r.course,
                r.date || 'Belirtilmedi',
                r.amount,
                r.paid,
                r.balance,
                r.method || 'Belirtilmedi',
                r.status,
              ]),
            ])
          }
        >
          <Icon name="download" />
          CSV indir
        </Button>
      </div>
      <div className="module-toolbar secondary-filters">
        {!collections &&
          selectFilter('ledger-status', 'Ödeme durumu', filter, setFilter, [
            'Tümü',
            'Tamamlandı',
            'Bekliyor',
            'Kısmi ödeme',
            'Gecikmiş',
          ])}
        {selectFilter('ledger-method', 'Ödeme yöntemi', method, setMethod, [
          'Tümü',
          'Havale / EFT',
          'Kredi kartı',
          'Nakit',
          'Belirtilmedi',
        ])}
        {selectFilter('ledger-advisor', 'Danışman', advisor, setAdvisor, [
          'Tümü',
          ...[
            ...new Set(
              rows
                .map((r) => records.sales.find((s) => s.id === r.saleId)?.advisorId)
                .filter((id): id is string => !!id),
            ),
          ].map((id) => ({ value: id, label: id })),
          ...(rows.some((r) => !records.sales.find((s) => s.id === r.saleId)?.advisorId)
            ? [{ value: '__unknown__', label: 'Bilgisi eksik' }]
            : []),
        ])}
        <DateRangeFilter {...range} onChange={setRange} />
        <Button variant="ghost" onClick={reset}>
          Filtreleri sıfırla
        </Button>
      </div>
      <DataTable
        name="ledger-records"
        unavailable={unavailable}
        data={list}
        getRowId={(r) => r.id}
        columns={[
          {
            id: 'student',
            header: 'Öğrenci',
            accessorFn: (r) => students.get(r.studentId)!.name,
            cell: ({ row }) => (
              <Link to={`/admin/students/${row.original.studentId}`}>
                <Person student={students.get(row.original.studentId)!} />
              </Link>
            ),
          },
          {
            accessorKey: 'course',
            header: installments ? 'Eğitim / Taksit' : 'Eğitim',
            cell: ({ row }) => (
              <>
                {row.original.course}
                {installments && (
                  <small className="block muted">{row.original.number}. taksit</small>
                )}
              </>
            ),
          },
          {
            accessorKey: 'date',
            header: dateTitle,
            cell: ({ row }) =>
              row.original.date ? (
                dateTR(row.original.date) + ' ' + row.original.date.slice(0, 4)
              ) : (
                <span className="muted">Belirtilmedi</span>
              ),
          },
          {
            accessorKey: 'amount',
            header: 'Tutar',
            cell: ({ row }) => <span data-sensitive>{money(row.original.amount)}</span>,
          },
          ...(collections
            ? ([
                {
                  accessorKey: 'method',
                  header: 'Ödeme yöntemi',
                  cell: ({ row }) => row.original.method || 'Belirtilmedi',
                },
              ] satisfies ColumnDef<LedgerRow>[])
            : ([
                {
                  accessorKey: 'balance',
                  header: 'Kalan bakiye',
                  cell: ({ row }) => <span data-sensitive>{money(row.original.balance)}</span>,
                },
                {
                  accessorKey: 'status',
                  header: 'Durum',
                  cell: ({ row }) => <StatusBadge>{row.original.status}</StatusBadge>,
                },
              ] satisfies ColumnDef<LedgerRow>[])),
          {
            id: 'actions',
            header: 'İşlem',
            enableSorting: false,
            enableHiding: false,
            cell: ({ row }) => action(row.original),
          },
        ]}
        mobileCard={(r) => (
          <>
            <Person student={students.get(r.studentId)!} />
            <p>
              {r.course}
              {installments ? ` · ${r.number}. taksit` : ''}
            </p>
            <div className="mobile-record-meta">
              <span>
                {dateTitle}: {r.date ? dateTR(r.date) : 'Belirtilmedi'}
              </span>
              <span data-sensitive>{money(r.amount)}</span>
              {!collections && <span data-sensitive>Kalan: {money(r.balance)}</span>}
              <StatusBadge>{r.status}</StatusBadge>
            </div>
            {action(r)}
          </>
        )}
      />
      {payment && (
        <ReceiptDialog
          key={payment.saleId}
          saleId={payment.saleId}
          initialAmount={payment.amount}
          installmentId={payment.installmentId}
          onClose={() => setPayment(null)}
        />
      )}
    </>
  );
}
