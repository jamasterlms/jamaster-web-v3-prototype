import { Icon } from '@/components/shared/icon';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useWorkspace } from '@/app/workspace-provider';
import { DateRangeFilter } from '@/components/forms/date-range-filter';
import { PageNavigation } from '@/components/navigation/page-navigation';
import { Metrics, SearchField } from '@/components/shared/feature-primitives';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ReceiptDialog } from '@/features/finance/receipt-dialog';
import type { Sale } from '@/features/finance/finance-model';
import { SaleLifecycleDialog } from './sale-lifecycle-dialog';
import { financeRecords, installmentRows, saleBalance } from '@/features/finance/finance-model';
import { useQueryFilter } from '@/hooks/use-query-filter';
import { dateTR, downloadCSV, money, normalize } from '@/lib/format';
import { localDate } from '@/lib/validation';
import type { ColumnDef } from '@tanstack/react-table';

const tabs = [
  ['courses', 'Eğitimler'],
  ['saleHistory', 'Satış geçmişi'],
  ['installments', 'Taksitler'],
  ['receipts', 'Tahsilatlar'],
];
type PaymentRow = {
  id: string;
  saleId: string;
  course: string;
  date: string;
  amount: number;
  paid: number;
  balance: number;
  method?: string;
  number?: number;
  bank?: string;
  notes?: string;
  sale?: Sale;
};
export function StudentPayments({ id }: { id: number }) {
  const { state } = useWorkspace();
  const [params] = useSearchParams();
  const tab = tabs.some(([key]) => key === params.get('tab')) ? params.get('tab')! : 'courses';
  const [filters, setFilters] = useQueryFilter(
    `student-finance:${tab}`,
    { search: '', from: '', to: '', saleId: '', status: 'all' },
    {
      keys: ['search', 'startDate', 'endDate', 'saleId', 'status', 'installmentsTab'],
      read: (p) => ({
        search: p.get('search') || '',
        from: p.get('startDate') || '',
        to: p.get('endDate') || '',
        saleId: p.get('saleId') || '',
        status:
          p.get('status') ||
          (tab === 'installments' && p.get('installmentsTab') === 'overdue' ? 'overdue' : 'all'),
      }),
      write: (p, f) => {
        p.set('search', f.search);
        p.set('startDate', f.from);
        p.set('endDate', f.to);
        p.set('status', f.status);
        if (tab === 'installments')
          p.set('installmentsTab', f.status === 'overdue' ? 'overdue' : 'all');
        if (f.saleId) p.set('saleId', f.saleId);
      },
    },
  );
  const [payment, setPayment] = useState<{
    saleId: string;
    installmentId?: string;
    amount: number;
  } | null>(null);
  const [lifecycle, setLifecycle] = useState<{
    sale: Sale;
    kind: 'endDate' | 'freeze' | 'unfreeze' | 'transfer' | 'history';
  } | null>(null);
  const records = financeRecords(state);
  const sales = records.sales.filter((s) => s.studentId === id);
  const receipts = records.receipts.filter((r) => r.studentId === id);
  const installments = tab === 'installments',
    collections = tab === 'receipts',
    courses = tab === 'courses';
  const all: PaymentRow[] = installments
    ? installmentRows({ sales, receipts })
    : collections
      ? receipts.map((r) => ({
          ...r,
          course: sales.find((s) => s.id === r.saleId)?.course || 'Belirtilmedi',
          paid: r.amount,
          balance: 0,
          bank: r.bankAccountName,
        }))
      : sales.map((s) => ({
          ...s,
          sale: s,
          saleId: s.id,
          paid: Math.round((s.amount - saleBalance(s, receipts)) * 100) / 100,
          balance: saleBalance(s, receipts),
        }));
  const today = localDate();
  const list = all.filter(
    (r) =>
      (!filters.saleId || r.saleId === filters.saleId) &&
      (!filters.from || (!!r.date && r.date >= filters.from)) &&
      (!filters.to || (!!r.date && r.date <= filters.to)) &&
      normalize(r.course + ' ' + (r.notes || '')).includes(normalize(filters.search)) &&
      (!installments ||
        filters.status === 'all' ||
        (filters.status === 'paid'
          ? r.balance === 0
          : filters.status === 'overdue'
            ? !!r.date && r.date < today && r.balance > 0
            : r.balance > 0)),
  );
  const base = `/admin/students/${id}/payments`;
  const dateLabel = (date: string) =>
    date ? `${dateTR(date)} ${date.slice(0, 4)}` : 'Belirtilmedi';
  const details = (r: PaymentRow) => (
    <div className="table-actions">
      {courses ? (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLifecycle({ sale: r.sale!, kind: 'endDate' })}
          >
            Tarih
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={
              ['cancelled', 'refunded'].includes(r.sale?.status || '') ||
              r.sale?.educationStatus === 'transferred'
            }
            onClick={() =>
              setLifecycle({
                sale: r.sale!,
                kind: r.sale?.educationStatus === 'frozen' ? 'unfreeze' : 'freeze',
              })
            }
          >
            {r.sale?.educationStatus === 'frozen' ? 'Dondurmayı yönet' : 'Dondur'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={
              ['cancelled', 'refunded'].includes(r.sale?.status || '') ||
              r.sale?.educationStatus === 'transferred'
            }
            onClick={() => setLifecycle({ sale: r.sale!, kind: 'transfer' })}
          >
            Transfer
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="İşlem geçmişi"
            title="İşlem geçmişi"
            onClick={() => setLifecycle({ sale: r.sale!, kind: 'history' })}
          >
            <Icon name="history" />
          </Button>
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="Satış ayrıntıları"
            title="Satış ayrıntıları"
          >
            <Link to={`${base}?tab=saleHistory&saleId=${encodeURIComponent(r.saleId)}`}>
              <Icon name="file-text" />
            </Link>
          </Button>
        </>
      ) : (
        !collections &&
        r.balance > 0 && (
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
        )
      )}
      {!installments && !collections && !courses && (
        <Button
          asChild
          variant="ghost"
          size="icon"
          aria-label="Taksitleri aç"
          title="Taksitleri aç"
        >
          <Link to={`${base}?tab=installments&saleId=${encodeURIComponent(r.saleId)}`}>
            <Icon name="receipt-text" />
          </Link>
        </Button>
      )}
    </div>
  );
  const columns: ColumnDef<PaymentRow>[] = [
    { accessorKey: 'course', header: 'Eğitim' },
    ...(courses
      ? ([
          {
            id: 'startDate',
            header: 'Başlangıç',
            accessorFn: (r) => r.sale?.startDate || r.date,
            cell: ({ row }) => dateLabel(row.original.sale?.startDate || row.original.date),
          },
          {
            id: 'endDate',
            header: 'Bitiş',
            accessorFn: (r) => r.sale?.endDate || '',
            cell: ({ row }) =>
              row.original.sale?.endDate
                ? dateLabel(row.original.sale.endDate)
                : row.original.sale?.endDate === null
                  ? 'Süresiz'
                  : 'Belirtilmedi',
          },
          {
            id: 'educationStatus',
            header: 'Eğitim durumu',
            accessorFn: (r) =>
              ({
                active: 'Aktif',
                frozen: 'Dondurulmuş',
                transferred: 'Transfer edildi',
                expired: 'Süresi doldu',
              })[r.sale?.educationStatus || 'active'],
          },
        ] satisfies ColumnDef<PaymentRow>[])
      : []),
    ...(installments ? [{ accessorKey: 'number', header: 'Taksit' }] : []),
    {
      accessorKey: 'date',
      header: collections ? 'Tahsilat tarihi' : installments ? 'Vade tarihi' : 'Satış tarihi',
      cell: ({ row }) => dateLabel(row.original.date),
    },
    {
      accessorKey: 'amount',
      header: 'Tutar',
      cell: ({ row }) => <span data-sensitive>{money(row.original.amount)}</span>,
    },
    ...(!collections && !courses
      ? ([
          {
            accessorKey: 'paid',
            header: 'Tahsil edilen',
            cell: ({ row }) => <span data-sensitive>{money(row.original.paid)}</span>,
          },
          {
            accessorKey: 'balance',
            header: 'Kalan',
            cell: ({ row }) => <span data-sensitive>{money(row.original.balance)}</span>,
          },
        ] satisfies ColumnDef<PaymentRow>[])
      : []),
    ...(collections
      ? ([
          { accessorKey: 'method', header: 'Ödeme yöntemi' },
          {
            accessorKey: 'bank',
            header: 'Banka hesabı',
            cell: ({ row }) => row.original.bank || '—',
          },
          { accessorKey: 'notes', header: 'Not', cell: ({ row }) => row.original.notes || '—' },
        ] satisfies ColumnDef<PaymentRow>[])
      : []),
    ...(!collections
      ? ([
          {
            id: 'actions',
            header: 'İşlem',
            enableSorting: false,
            enableHiding: false,
            cell: ({ row }) => details(row.original),
          },
        ] satisfies ColumnDef<PaymentRow>[])
      : []),
  ];
  return (
    <>
      <PageNavigation
        items={tabs.map(([key, label]) => ({
          label,
          to: key === 'courses' && !params.has('tab') ? base : `${base}?tab=${key}`,
        }))}
      />
      <Metrics
        items={[
          { label: 'Satış kaydı', value: sales.length },
          {
            label: 'Tahsil edilen',
            value: money(receipts.reduce((n, r) => n + r.amount, 0)),
            highlight: true,
          },
          {
            label: 'Kalan bakiye',
            value: money(sales.reduce((n, s) => n + saleBalance(s, receipts), 0)),
          },
        ]}
      />
      {installments && (
        <div className="module-toolbar" aria-label="Taksit alt görünümü">
          <Button
            variant={filters.status !== 'overdue' ? 'default' : 'outline'}
            onClick={() => setFilters({ ...filters, status: 'all' })}
          >
            Tüm taksitler
          </Button>
          <Button
            variant={filters.status === 'overdue' ? 'default' : 'outline'}
            onClick={() => setFilters({ ...filters, status: 'overdue' })}
          >
            Vadesi geçmiş
          </Button>
        </div>
      )}
      {filters.saleId && (
        <p className="pending-banner">
          Seçilen satışın kayıtları gösteriliyor.{' '}
          <Button variant="ghost" size="sm" onClick={() => setFilters({ ...filters, saleId: '' })}>
            Tüm satışları göster
          </Button>
        </p>
      )}
      <div className="module-toolbar">
        <SearchField
          value={filters.search}
          onChange={(search) => setFilters({ ...filters, search })}
          placeholder="Eğitim veya açıklama ara"
        />
        <DateRangeFilter
          from={filters.from}
          to={filters.to}
          onChange={(range) => setFilters({ ...filters, ...range })}
        />
        {installments && (
          <Select
            value={filters.status}
            onValueChange={(status) => setFilters({ ...filters, status })}
          >
            <SelectTrigger aria-label="Taksit ödeme durumu">
              <SelectValue placeholder="Ödeme durumu" />
            </SelectTrigger>
            <SelectContent>
              {[
                ['all', 'Tüm taksitler'],
                ['paid', 'Ödenen'],
                ['pending', 'Ödenmemiş'],
                ['overdue', 'Vadesi geçmiş'],
              ].map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button
          variant="outline"
          onClick={() =>
            downloadCSV(`ogrenci-${id}-${tab}.csv`, [
              ['Eğitim', 'Tarih', 'Tutar', 'Tahsil edilen', 'Kalan'],
              ...list.map((r) => [r.course, r.date, r.amount, r.paid, r.balance]),
            ])
          }
        >
          CSV indir
        </Button>
        <Button
          variant="ghost"
          onClick={() => setFilters({ search: '', from: '', to: '', saleId: '', status: 'all' })}
        >
          Filtreleri sıfırla
        </Button>
      </div>
      <DataTable
        name={`student-${tab}`}
        data={list}
        getRowId={(r) => r.id}
        columns={columns}
        mobileCard={(r) => (
          <>
            <h3>
              {r.course}
              {installments ? ` · ${r.number}. taksit` : ''}
            </h3>
            <p>{dateLabel(r.date)}</p>
            <div className="mobile-record-meta">
              <span data-sensitive>{money(r.amount)}</span>
              {!courses && !collections && <span data-sensitive>Kalan: {money(r.balance)}</span>}
            </div>
            {collections ? (
              <p>
                {r.method || 'Belirtilmedi'}
                {r.bank ? ` · ${r.bank}` : ''}
              </p>
            ) : (
              details(r)
            )}
          </>
        )}
      />
      {payment && (
        <ReceiptDialog
          key={payment.installmentId || payment.saleId}
          {...payment}
          initialAmount={payment.amount}
          onClose={() => setPayment(null)}
        />
      )}
      {lifecycle && (
        <SaleLifecycleDialog
          sale={lifecycle.sale}
          initialKind={lifecycle.kind}
          onClose={() => setLifecycle(null)}
        />
      )}
    </>
  );
}
