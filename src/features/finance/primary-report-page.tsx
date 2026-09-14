import { Link } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { useWorkspace } from '@/app/workspace-provider';
import { useOperations } from '@/features/operations/operations-provider';
import { DateRangeFilter } from '@/components/forms/date-range-filter';
import { Metrics, SearchField } from '@/components/shared/feature-primitives';
import { PageHeading, StatusBadge } from '@/components/shared/primitives';
import { Icon } from '@/components/shared/icon';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useQueryFilter } from '@/hooks/use-query-filter';
import { money, fullDateTR, downloadCSV } from '@/lib/format';
import { isDate, localDate } from '@/lib/validation';
import { LineChart } from '@/features/dashboard/charts';
import { paymentTypeOptions, saleStatusOptions } from '@/features/insights/leaf-definitions';
import {
  primaryReportRows,
  accountingTotals,
  type PrimaryReportKind,
  type PrimaryReportRow,
} from './primary-report-model';
import { primaryFilteredRows, relationOptions, UNKNOWN_RELATION } from './primary-report-filters';
const titles: Record<PrimaryReportKind, string> = {
  sales: 'Satış raporu',
  collections: 'Tahsilatlar',
  'overdue-receivables': 'Vadesi geçmiş alacaklar',
  accounting: 'Muhasebe hareketleri',
  bills: 'Senetler',
};
const billStatus = {
  paid: 'Ödendi',
  unpaid: 'Ödenmedi',
  overdue: 'Gecikmiş',
  pending: 'Bekliyor',
};
const types = { INCOME: 'Gelir', EXPENSE: 'Gider', COLLECTION: 'Tahsilat' };
const sources: Record<string, string> = {
  EXPENSE: 'Gelir / gider kaydı',
  SALE: 'Satış',
  INSTALLMENT: 'Taksit',
  TEACHER_SALARY: 'Öğretmen maaşı',
  STAFF_SALARY: 'Personel maaşı',
};
const date = (v: string | null | undefined) => (v && isDate(v.slice(0, 10)) ? fullDateTR(v) : '—');
export function PrimaryReportPage({ kind }: { kind: PrimaryReportKind }) {
  const { state } = useWorkspace(),
    { operations } = useOperations();
  const today = localDate();
  const overdue = kind === 'overdue-receivables',
    accounting = kind === 'accounting',
    sales = kind === 'sales',
    bills = kind === 'bills';
  const defaults = {
    search: '',
    startDate: overdue ? '' : today.slice(0, 7) + '-01',
    endDate: overdue ? '' : today,
    status: [] as string[],
    paymentType: [] as string[],
    type: [] as string[],
    advisorId: 'all',
    education: 'all',
    pricing: 'all',
    categoryId: 'all',
    transactionMode: 'all',
    sort: overdue || sales || bills ? 'createdAt' : 'date',
    order: 'desc',
  };
  const [f, set] = useQueryFilter(`primary-${kind}`, defaults, {
    keys: Object.keys(defaults),
    read: (p) => ({
      ...defaults,
      ...Object.fromEntries(
        [
          'search',
          'startDate',
          'endDate',
          'advisorId',
          'education',
          'pricing',
          'categoryId',
          'transactionMode',
          'sort',
          'order',
        ]
          .filter((k) => p.has(k))
          .map((k) => [k, p.get(k) || '']),
      ),
      status: p.getAll('status').filter((v) => v && v !== 'all'),
      paymentType: p.getAll('paymentType').filter((v) => v && v !== 'all'),
      type: p.getAll('type').filter((v) => v && v !== 'all'),
    }),
    write: (p, v) => {
      for (const [key, value] of Object.entries(v)) {
        if (Array.isArray(value)) value.forEach((item) => p.append(key, item));
        else p.set(key, value);
      }
      p.delete('page');
    },
  });
  const raw = primaryReportRows(state, operations, kind);
  const advisorOptions = relationOptions(raw, 'advisorId', 'advisor');
  const categoryOptions = relationOptions(raw, 'categoryId', 'category');
  const educationOptions = relationOptions(raw, 'educationId', 'course');
  const pricingRows = ['', 'all'].includes(f.education)
    ? raw
    : raw.filter((r) =>
        f.education === UNKNOWN_RELATION ? !r.educationId : r.educationId === f.education,
      );
  const pricingOptions = relationOptions(pricingRows, 'planId', 'pricing');
  const invalidDate = !!(
    (f.startDate && !isDate(f.startDate.slice(0, 10))) ||
    (f.endDate && !isDate(f.endDate.slice(0, 10))) ||
    (f.startDate && f.endDate && f.startDate > f.endDate)
  );
  const unavailable = invalidDate
    ? 'Tarih aralığını kontrol edin.'
    : bills && state.bills === undefined
      ? 'Senet raporu henüz alınamadı. Satış veya taksit listesi senet kaydının yerine kullanılmaz.'
      : undefined;
  const projection = primaryFilteredRows(unavailable ? [] : raw, kind, f);
  const rows = projection.rows;
  const amount = (key: 'amount' | 'paid' | 'balance') =>
    rows.some((r) => r[key] === undefined)
      ? '—'
      : money(rows.reduce((n, r) => n + (r[key] || 0), 0));
  const totals = accountingTotals(rows);
  const metrics = accounting
    ? [
        {
          label: 'Tahsilat',
          value: unavailable ? '—' : money(totals.collections),
        },
        {
          label: 'Ödenmiş gelir',
          value: unavailable ? '—' : money(totals.income),
        },
        {
          label: 'Ödenmiş gider',
          value: unavailable ? '—' : money(totals.expenses),
        },
        { label: 'Net hareket', value: unavailable ? '—' : money(totals.net) },
      ]
    : [
        {
          label: bills ? 'Senet sayısı' : 'Kayıt sayısı',
          value: unavailable ? '—' : rows.length,
        },
        {
          label: overdue ? 'Taksitlerin ilk tutarı' : 'Toplam tutar',
          value: unavailable ? '—' : amount('amount'),
        },
        ...(sales || bills || overdue
          ? [
              { label: 'Ödenen', value: unavailable ? '—' : amount('paid') },
              {
                label: 'Kalan tutar',
                value: unavailable ? '—' : amount('balance'),
              },
            ]
          : []),
      ];
  const columns: ColumnDef<PrimaryReportRow>[] = [
    {
      accessorKey: 'title',
      header: accounting ? 'Başlık' : 'Öğrenci',
      cell: ({ row }) => (
        <div>
          <strong>{row.original.title}</strong>
          {row.original.description && (
            <p className="muted line-clamp-2 max-w-sm">{row.original.description}</p>
          )}
        </div>
      ),
    },
  ];
  const moneyColumn = (
    key: 'amount' | 'paid' | 'balance' | 'discountAmount',
    header: string,
  ): ColumnDef<PrimaryReportRow> => ({
    accessorKey: key,
    header,
    cell: ({ row }) => (
      <span data-sensitive>
        {row.original[key] === undefined ? '—' : money(row.original[key]!)}
      </span>
    ),
  });
  if (sales)
    columns.push(
      {
        accessorKey: 'course',
        header: 'Eğitim / paket',
        cell: ({ row }) => (
          <div>
            {row.original.course}
            <p className="muted">{row.original.pricing || '—'}</p>
          </div>
        ),
      },
      moneyColumn('amount', 'Satış tutarı'),
      moneyColumn('paid', 'Ödenen'),
      moneyColumn('discountAmount', 'İndirim tutarı'),
      {
        id: 'education-dates',
        header: 'Eğitim tarihleri',
        cell: ({ row }) => (
          <div>
            {date(row.original.startDate)}
            <p>{date(row.original.endDate)}</p>
          </div>
        ),
      },
    );
  else columns.push(moneyColumn('amount', 'Tutar'));
  if (overdue)
    columns.push(
      moneyColumn('balance', 'Ödenmemiş tutar'),
      { accessorKey: 'advisor', header: 'Danışman' },
      { accessorKey: 'daysOverdue', header: 'Gecikme (gün)' },
    );
  if (bills)
    columns.push(
      { accessorKey: 'advisor', header: 'Danışman' },
      {
        id: 'installment',
        header: 'Taksit',
        cell: ({ row }) =>
          `${row.original.number ?? '—'} / ${row.original.totalInstallments ?? '—'}`,
      },
    );
  if (accounting)
    columns.push(
      { accessorKey: 'category', header: 'Kategori' },
      {
        accessorKey: 'type',
        header: 'Tür',
        cell: ({ row }) => types[row.original.type!] || '—',
      },
      {
        accessorKey: 'sourceType',
        header: 'Kaynak',
        cell: ({ row }) => sources[row.original.sourceType!] || '—',
      },
      {
        accessorKey: 'transactionMode',
        header: 'İşlem',
        cell: ({ row }) =>
          row.original.transactionMode === 'RECURRING' ? 'Tekrarlayan plan' : 'Tek seferlik',
      },
      {
        accessorKey: 'createdBy',
        header: 'Oluşturan',
        cell: ({ row }) => row.original.createdBy || '—',
      },
    );
  if (kind === 'collections')
    columns.push({
      accessorKey: 'sourceType',
      header: 'Tür',
      cell: ({ row }) => sources[row.original.sourceType!] || '—',
    });
  columns.push({
    accessorKey: 'date',
    header: overdue ? 'Vade / satış tarihi' : 'Tarih',
    cell: ({ row }) => (
      <div>
        {date(row.original.date)}
        {(bills || overdue) && (
          <p className="muted">
            {bills ? 'Vade: ' : 'Satış: '}
            {date(bills ? row.original.dueDate : row.original.createdAt)}
          </p>
        )}
        {row.original.transactionMode === 'RECURRING' && (
          <p className="muted">
            {date(row.original.recurringStartDate)} – {date(row.original.recurringEndDate)}
          </p>
        )}
      </div>
    ),
  });
  if (!accounting && !bills)
    columns.push({
      accessorKey: 'method',
      header: 'Ödeme tipi',
      cell: ({ row }) =>
        paymentTypeOptions[row.original.method as keyof typeof paymentTypeOptions] ||
        row.original.method ||
        '—',
    });
  if (sales || bills)
    columns.push({
      accessorKey: 'status',
      header: 'Durum',
      cell: ({ row }) => (
        <StatusBadge>
          {(bills
            ? (billStatus as Record<string, string>)
            : (saleStatusOptions as Record<string, string>))[row.original.status || ''] || '—'}
        </StatusBadge>
      ),
    });
  const action = (r: PrimaryReportRow) => (
    <Button
      asChild
      variant="ghost"
      size="icon"
      aria-label={r.sourceType === 'EXPENSE' ? 'Hareketi düzenle' : 'Detayı aç'}
      title={r.sourceType === 'EXPENSE' ? 'Hareketi düzenle' : 'Detayı aç'}
    >
      <Link to={r.href || '/admin/reports'}>
        <Icon name={r.sourceType === 'EXPENSE' ? 'pencil' : 'arrow-up-right'} />
      </Link>
    </Button>
  );
  columns.push({
    id: 'actions',
    header: 'İşlemler',
    cell: ({ row }) => action(row.original),
  });
  const select = (
    key: 'education' | 'pricing' | 'advisorId' | 'categoryId' | 'transactionMode',
    label: string,
    options: { value: string; label: string }[],
    disabled = false,
  ) => (
    <Select
      value={f[key] || 'all'}
      onValueChange={(value) =>
        set({
          ...f,
          [key]: value,
          ...(key === 'education' ? { pricing: 'all' } : {}),
        })
      }
      disabled={disabled}
    >
      <SelectTrigger aria-label={label}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{label}: tümü</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
  const sortFields = sales
    ? { createdAt: 'Kayıt tarihi' }
    : bills
      ? { createdAt: 'Kayıt tarihi', amount: 'Tutar', dueDate: 'Vade tarihi' }
      : overdue
        ? { createdAt: 'Kayıt tarihi', amount: 'Tutar', daysOverdue: 'Gecikme' }
        : accounting
          ? { date: 'Tarih', amount: 'Tutar', title: 'Başlık' }
          : { date: 'Tarih', amount: 'Tutar' };
  const dist = new Map<string, number>();
  for (const r of rows) {
    const label = accounting
      ? types[r.type!] || 'Bilinmiyor'
      : bills
        ? billStatus[r.status as keyof typeof billStatus] || 'Bilinmiyor'
        : paymentTypeOptions[r.method as keyof typeof paymentTypeOptions] ||
          r.method ||
          'Belirtilmedi';
    dist.set(label, (dist.get(label) || 0) + r.amount);
  }
  const max = Math.max(1, ...dist.values());
  const trend = [
    ...rows.reduce((m, r) => {
      if (r.date && r.transactionMode !== 'RECURRING')
        m.set(r.date, (m.get(r.date) || 0) + r.amount);
      return m;
    }, new Map<string, number>()),
  ].sort(([a], [b]) => a.localeCompare(b));
  return (
    <>
      <PageHeading
        title={titles[kind]}
        description={
          accounting
            ? 'Gelir, gider, tahsilat ve planlanan işlemler.'
            : 'Kayıtlarınızı inceleyin ve ilgili öğrenci işlemlerine geçin.'
        }
      >
        <Button
          variant="outline"
          disabled={!!unavailable || !rows.length}
          onClick={() =>
            downloadCSV(`${kind}.csv`, [
              [
                'Ad / başlık',
                'Tutar',
                'Ödenen',
                'Kalan',
                'Tarih',
                'Vade',
                'Ödeme tipi',
                'Durum',
                'Açıklama',
              ],
              ...rows.map((r) => [
                r.title,
                r.amount,
                r.paid ?? '',
                r.balance ?? '',
                r.date,
                r.dueDate || '',
                r.method || '',
                r.status || '',
                r.description || '',
              ]),
            ])
          }
        >
          <Icon name="download" />
          Dışa aktar
        </Button>
      </PageHeading>
      <div className="module-toolbar">
        <SearchField
          value={f.search}
          onChange={(search) => set({ ...f, search })}
          placeholder={
            accounting ? 'Başlık, açıklama veya alıcı ara' : 'Öğrenci, eğitim veya danışman ara'
          }
        />
        {!overdue && (
          <DateRangeFilter
            from={f.startDate.slice(0, 10)}
            to={f.endDate.slice(0, 10)}
            onChange={({ from, to }) => set({ ...f, startDate: from, endDate: to })}
          />
        )}{' '}
        {(sales || bills) && (
          <MultiSelect
            label="Durum"
            value={f.status}
            onChange={(status) => set({ ...f, status })}
            options={Object.entries(bills ? billStatus : saleStatusOptions).map(
              ([value, label]) => ({ value, label }),
            )}
          />
        )}{' '}
        {!sales && !bills && !accounting && (
          <MultiSelect
            label="Ödeme tipi"
            value={f.paymentType}
            onChange={(paymentType) => set({ ...f, paymentType })}
            options={Object.entries(paymentTypeOptions).map(([value, label]) => ({ value, label }))}
          />
        )}{' '}
        {sales && (
          <>
            {select('education', 'Eğitim', educationOptions)}
            {select('pricing', 'Paket', pricingOptions)}
          </>
        )}{' '}
        {(bills || kind === 'collections') && select('advisorId', 'Danışman', advisorOptions)}
        {accounting && (
          <>
            <MultiSelect
              label="Tür"
              value={f.type}
              onChange={(type) => set({ ...f, type })}
              options={Object.entries(types).map(([value, label]) => ({
                value,
                label,
              }))}
            />
            {select('categoryId', 'Kategori', categoryOptions)}
            {select('transactionMode', 'İşlem türü', [
              { value: 'ONE_TIME', label: 'Tek seferlik' },
              { value: 'RECURRING', label: 'Tekrarlayan' },
            ])}
          </>
        )}
        <Select
          value={`${f.sort}:${f.order}`}
          onValueChange={(v) => {
            const [sort, order] = v.split(':');
            set({ ...f, sort, order });
          }}
        >
          <SelectTrigger aria-label="Sıralama">
            <SelectValue placeholder="Sıralama" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(sortFields).flatMap(([key, label]) =>
              ['desc', 'asc'].map((order) => (
                <SelectItem key={`${key}:${order}`} value={`${key}:${order}`}>
                  {label} · {order === 'asc' ? 'artan' : 'azalan'}
                </SelectItem>
              )),
            )}
          </SelectContent>
        </Select>
        <Button variant="ghost" onClick={() => set(defaults)}>
          Sıfırla
        </Button>
      </div>
      {unavailable && (
        <p role="status" className="pending-banner">
          {unavailable}
        </p>
      )}
      {projection.unknown > 0 && (
        <p role="status" className="field-hint my-3">
          {projection.unknown} kaydın tarih veya seçilen filtreye ait bilgisi eksik. Bu kayıtlar
          hesaplanan toplamlara dahil edilmedi.
        </p>
      )}
      <Metrics items={metrics} />
      <div className="analysis-grid">
        <Card className="analysis-panel">
          <h2>
            {bills
              ? 'Senet durumu'
              : accounting
                ? 'İşlem türüne göre kayıt tutarı (planlar dahil)'
                : 'Ödeme tipine göre tutar'}
          </h2>
          {[...dist].map(([label, value]) => (
            <div className="analysis-bar" key={label}>
              <div>
                <span>{label}</span>
                <b data-sensitive>{money(value)}</b>
              </div>
              <div className="capacity-meter">
                <span style={{ width: `${(value / max) * 100}%` }} />
              </div>
            </div>
          ))}
          {!rows.length && (
            <p className="empty-inline">
              {unavailable ? 'Dağılım henüz alınamadı.' : 'Bu filtrelere uygun kayıt yok.'}
            </p>
          )}
        </Card>
        <Card className="analysis-panel">
          <h2>
            {overdue
              ? 'Vade tarihine göre tutar'
              : accounting
                ? 'Tek seferlik kayıtların tarihine göre tutar'
                : 'Tarihe göre kayıt tutarı'}
          </h2>
          {trend.length ? (
            <LineChart values={trend.map(([, v]) => v)} labels={trend.map(([d]) => d)} />
          ) : (
            <p className="empty-inline">Tarihli kayıt bulunmuyor.</p>
          )}
        </Card>
      </div>
      <DataTable
        name={`primary-${kind}`}
        data={rows}
        manualSorting
        getRowId={(r) => r.id}
        unavailable={unavailable}
        columns={columns}
        mobileCard={(r) => (
          <>
            <strong>{r.title}</strong>
            <p>{r.course || r.category || sources[r.sourceType!] || ''}</p>
            <b data-sensitive>{money(r.amount)}</b>
            <p>
              {date(r.date)}
              {r.daysOverdue !== undefined ? ` · ${r.daysOverdue} gün gecikmiş` : ''}
            </p>
            {r.balance !== undefined && <p>Kalan: {money(r.balance)}</p>}
            {action(r)}
          </>
        )}
      />
      {accounting && (
        <p className="field-hint mt-4">
          Özet yalnız tahsilatlar ve ödenmiş tek seferlik gelir/gider kayıtlarını içerir.
          Tekrarlayan planlar gerçekleşmiş ödeme sayılmaz. Kategori ve oluşturan bilgisi yalnız
          kayıtlıysa gösterilir.
        </p>
      )}
      {sales && (
        <p className="field-hint mt-4">
          Satış durumu, eğitim tarihleri ve indirim tutarı mevcut kayıtta yoksa “—” görünür. Ödeme
          bakiyesi satış durumu olarak kullanılmaz.
        </p>
      )}
      {(kind === 'collections' || bills) && !raw.some((r) => r.advisorId) && (
        <p className="field-hint mt-4">
          Danışman kimliği olmayan kayıtları “Bilgisi eksik” seçeneğiyle inceleyebilirsiniz.
        </p>
      )}
    </>
  );
}
