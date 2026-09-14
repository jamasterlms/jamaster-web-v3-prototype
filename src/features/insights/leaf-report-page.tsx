import { Link } from 'react-router-dom';
import { ReportSetup } from './report-setup';
import { criteriaFields } from './report-data';
import { useWorkspace } from '@/app/workspace-provider';
import { useOperations } from '@/features/operations/operations-provider';
import { useMemberships } from '@/features/education/use-memberships';
import { useEntityNavigation } from '@/features/entities/use-entity-navigation';
import { useQueryFilter } from '@/hooks/use-query-filter';
import { DateRangeFilter } from '@/components/forms/date-range-filter';
import { Metrics, SearchField } from '@/components/shared/feature-primitives';
import { PageHeading, IconButton, StatusBadge } from '@/components/shared/primitives';
import { Icon } from '@/components/shared/icon';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { Card } from '@/components/ui/card';
import { LineChart } from '@/features/dashboard/charts';
import { pageFor } from '@/data/navigation';
import { money, fullDateTR, downloadCSV } from '@/lib/format';
import { localDate, isDate } from '@/lib/validation';
import {
  educationFamilies,
  educationLeafDefinitions,
  salesLeafDefinitions,
  leafLabels,
  educationStatusOptions,
  saleStatusOptions,
  paymentTypeOptions,
} from './leaf-definitions';
import {
  educationProjection,
  salesProjection,
  type LeafFilters,
  type LeafRow,
  type LeafResult,
} from './leaf-projection';
const moneyFields = new Set(['paidAmount', 'remainingAmount', 'totalRevenue', 'totalRemaining']);
const dateFields = new Set([
  'lastAttendanceAt',
  'lastMeetingAt',
  'lastFreezeStart',
  'lastFreezeEnd',
  'endDate',
  'transferredAt',
]);
function formatValue(key: string, value: string | number | null | undefined) {
  if (value == null) return '—';
  if (moneyFields.has(key)) return money(Number(value));
  if (dateFields.has(key)) return fullDateTR(String(value));
  if (['attendanceRate', 'conversionRate'].includes(key))
    return `%${Number(value).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}`;
  if (key === 'educationStatus')
    return educationStatusOptions[value as keyof typeof educationStatusOptions] || String(value);
  return String(value);
}
export function LeafReportPage({ route, kind }: { route: string; kind: 'education' | 'sales' }) {
  const { state } = useWorkspace(),
    { operations } = useOperations(),
    memberships = useMemberships(),
    open = useEntityNavigation();
  const slug = route.split('/').at(-1) || '';
  const educational = kind === 'education';
  const ed = educationLeafDefinitions[slug],
    sales = salesLeafDefinitions[slug];
  const dates = educational ? !!ed?.dates : true;
  const today = localDate();
  const defaults: LeafFilters = {
    search: '',
    status: [],
    paymentType: [],
    startDate: dates ? `${today.slice(0, 7)}-01` : '',
    endDate: dates ? today : '',
    sort: educational
      ? 'createdAt'
      : [
            'installment-risk',
            'unpaid-balance-heavy',
            'advisor-revenue-risk',
            'contract-expiry-revenue-risk',
          ].includes(slug)
        ? 'totalRemaining'
        : 'totalRevenue',
    order: 'desc',
  };
  const [filter, setFilter] = useQueryFilter(`leaf-${kind}-${slug}`, defaults, {
    keys: ['search', 'status', 'paymentType', 'startDate', 'endDate', 'sort', 'order'],
    read: (p) => ({
      ...defaults,
      search: p.get('search') || '',
      status: p.getAll('status').filter((v) => v !== 'all'),
      paymentType: p.getAll('paymentType').filter((v) => v !== 'all'),
      startDate: p.has('startDate') ? (p.get('startDate') || '').slice(0, 10) : defaults.startDate,
      endDate: p.has('endDate') ? (p.get('endDate') || '').slice(0, 10) : defaults.endDate,
      sort: p.get('sort') || defaults.sort,
      order: p.get('order') === 'asc' ? 'asc' : 'desc',
    }),
    write: (p, v) => {
      p.set('search', v.search);
      p.set('startDate', v.startDate);
      p.set('endDate', v.endDate);
      p.set('sort', v.sort);
      p.set('order', v.order);
      v.status.forEach((x) => p.append('status', x));
      v.paymentType.forEach((x) => p.append('paymentType', x));
      p.delete('page');
    },
  });
  const result: LeafResult = educational
    ? educationProjection(state, memberships.records, slug, filter)
    : salesProjection(state, operations, slug, filter);
  const invalidDate =
    (filter.startDate && !isDate(filter.startDate)) ||
    (filter.endDate && !isDate(filter.endDate)) ||
    (filter.startDate && filter.endDate && filter.startDate > filter.endDate);
  if (invalidDate) {
    result.rows = [];
    result.trend = [];
    result.unavailable = 'Tarih aralığını kontrol edin.';
  }
  const rows = result.rows;
  const keys: string[] =
    educational && ed
      ? [...educationFamilies[ed.family]]
      : sales
        ? ['label', ...sales.columns]
        : [];
  const unknown = (!ed && educational) || (!sales && !educational);
  const title = pageFor(route).title;
  const label = (key: string) =>
    key === 'label' ? sales?.label || 'Başlık' : leafLabels[key] || key;
  const total = (key: string) =>
    rows.some((r) => typeof r[key] !== 'number')
      ? null
      : rows.reduce((n, r) => n + Number(r[key]), 0);
  const blocked = !!result.unavailable || result.criteriaMissing.length > 0;
  const countMetric = (value: number | null) => (blocked || value == null ? '—' : value);
  const moneyMetric = (value: number | null) => (blocked || value == null ? '—' : money(value));
  const rates = rows.filter((r) => typeof r.attendanceRate === 'number');
  const attendanceFamily = !!ed?.family.startsWith('Attendance');
  const riskSummary = [
    'sales-by-advisor',
    'installment-risk',
    'expiring-soon-sales',
    'advisor-revenue-risk',
    'contract-expiry-revenue-risk',
  ].includes(slug);
  const noRevenue = ['installment-risk', 'contract-expiry-revenue-risk'].includes(slug);
  const noBalance = ['conversion-funnel', 'cancellation-refund-analysis'].includes(slug);
  const funnelConverted = rows.find((r) => r.id === '2')?.totalSales;
  const metrics = educational
    ? [
        { label: 'Toplam öğrenci', value: countMetric(rows.length) },
        {
          label: 'Aktif öğrenci',
          value: countMetric(rows.filter((r) => r.educationStatus === 'active').length),
        },
        {
          label: attendanceFamily ? 'Ortalama devam' : 'Dondurulmuş',
          value: blocked
            ? '—'
            : attendanceFamily
              ? rates.length
                ? `%${(rates.reduce((n, r) => n + Number(r.attendanceRate), 0) / rates.length).toFixed(1)}`
                : '—'
              : rows.filter((r) => r.educationStatus === 'frozen').length,
        },
        {
          label: 'Grupsuz öğrenci',
          value: countMetric(
            rows.some((r) => r.activeGroupCount == null)
              ? null
              : rows.filter((r) => r.activeGroupCount === 0).length,
          ),
        },
      ]
    : [
        { label: 'Toplam satır', value: countMetric(rows.length) },
        {
          label: slug === 'conversion-funnel' ? 'Dönüşen öğrenci' : 'Satış sayısı',
          value: countMetric(
            slug === 'conversion-funnel'
              ? typeof funnelConverted === 'number'
                ? funnelConverted
                : null
              : total('totalSales'),
          ),
        },
        ...(!noRevenue ? [{ label: 'Ciro', value: moneyMetric(total('totalRevenue')) }] : []),
        ...(!noBalance
          ? [
              {
                label: 'Kalan tutar',
                value: moneyMetric(total('totalRemaining')),
              },
            ]
          : []),
        ...(riskSummary || noBalance
          ? [{ label: 'Toplam risk', value: countMetric(total('riskCount')) }]
          : []),
      ];
  const distribution = new Map<string, number>();
  for (const r of rows) {
    const key = educational ? formatValue('educationStatus', r.educationStatus) : String(r.label);
    distribution.set(
      key,
      (distribution.get(key) || 0) +
        (educational
          ? 1
          : Number(
              r[
                slug === 'conversion-funnel'
                  ? 'totalSales'
                  : noRevenue
                    ? 'totalRemaining'
                    : 'totalRevenue'
              ] || 0,
            )),
    );
  }
  const trend: [string, number][] = result.trend || [];
  const max = Math.max(1, ...distribution.values());
  const sorts = educational
    ? [
        ['createdAt:desc', 'Kayıt: en yeni'],
        ['createdAt:asc', 'Kayıt: en eski'],
        ['daysToEnd:asc', 'Kalan gün'],
        ['attendanceRate:desc', 'Devam oranı'],
        ['paidAmount:desc', 'Ödenen tutar'],
      ]
    : [
        ['totalRevenue', 'Ciro'],
        ['totalSales', 'Satış sayısı'],
        ['totalRemaining', 'Kalan tutar'],
        ['riskCount', 'Risk sayısı'],
      ].flatMap(([key, label]) =>
        ['desc', 'asc'].map((order) => [
          `${key}:${order}`,
          `${label} · ${order === 'asc' ? 'artan' : 'azalan'}`,
        ]),
      );
  if (unknown) return <PageHeading title="Rapor bulunamadı" />;
  return (
    <>
      <PageHeading
        title={title}
        description={
          educational
            ? 'Öğrencilerin kayıtlı eğitim, katılım ve görüşme bilgileri.'
            : 'Satış kayıtlarından hesaplanan dağılım ve toplamlar.'
        }
      >
        <Button
          variant="outline"
          disabled={!!result.unavailable || !rows.length}
          onClick={() =>
            downloadCSV(`${slug}.csv`, [
              keys.map(label),
              ...rows.map((r) => keys.map((k) => formatValue(k, r[k]))),
            ])
          }
        >
          <Icon name="download" />
          Dışa aktar
        </Button>
      </PageHeading>
      <div className="module-toolbar">
        <ReportSetup slug={slug} />
        <SearchField
          value={filter.search}
          onChange={(search) => setFilter({ ...filter, search })}
          placeholder={
            educational ? 'Öğrenci, e-posta veya danışman ara' : 'Rapor satırlarında ara'
          }
        />
        {dates && (
          <DateRangeFilter
            from={filter.startDate}
            to={filter.endDate}
            onChange={({ from, to }) => setFilter({ ...filter, startDate: from, endDate: to })}
          />
        )}
        <MultiSelect
          label="Durum"
          value={filter.status}
          onChange={(status) => setFilter({ ...filter, status })}
          options={Object.entries(educational ? educationStatusOptions : saleStatusOptions).map(
            ([value, label]) => ({ value, label }),
          )}
        />
        {!educational && (
          <MultiSelect
            label="Ödeme tipi"
            value={filter.paymentType}
            onChange={(paymentType) => setFilter({ ...filter, paymentType })}
            options={Object.entries(paymentTypeOptions).map(([value, label]) => ({ value, label }))}
          />
        )}
        <Select
          value={`${filter.sort}:${filter.order}`}
          onValueChange={(v) => {
            const [sort, order] = v.split(':');
            setFilter({ ...filter, sort, order });
          }}
        >
          <SelectTrigger aria-label="Rapor sıralaması">
            <SelectValue placeholder="Sıralama seçin" />
          </SelectTrigger>
          <SelectContent>
            {sorts.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" onClick={() => setFilter(defaults)}>
          Sıfırla
        </Button>
      </div>
      {result.unavailable && (
        <p role="status" className="pending-banner">
          {result.unavailable}
        </p>
      )}

      {!!result.criteriaMissing.length && (
        <p role="status" className="pending-banner">
          Bu rapor için ölçüt belirleyin:{' '}
          {result.criteriaMissing
            .map((key) => criteriaFields.find((f) => f.key === key)?.label || key)
            .join(', ')}
          .
        </p>
      )}
      {!!result.unknown && (
        <p role="status" className="field-hint my-3">
          {result.unknown} kaydın rapora uygunluğu eksik bilgiler nedeniyle bilinmiyor. Bilinen
          sonuçlar aşağıdadır.
        </p>
      )}
      <Metrics items={metrics} />
      <div className="analysis-grid">
        <Card className="analysis-panel">
          <h2>
            {educational
              ? 'Öğrenci dağılımı'
              : slug === 'conversion-funnel'
                ? 'Aşama sayıları'
                : noRevenue
                  ? 'Kalan tutar dağılımı'
                  : 'Satış tutarı dağılımı'}
          </h2>
          {[...distribution].map(([label, value]) => (
            <div className="analysis-bar" key={label}>
              <div>
                <span>{label}</span>
                <b>
                  {educational || slug === 'conversion-funnel' ? `${value} kayıt` : money(value)}
                </b>
              </div>
              <div className="capacity-meter">
                <span style={{ width: `${(value / max) * 100}%` }} />
              </div>
            </div>
          ))}
          {!distribution.size && (
            <p className="empty-inline">
              {result.unavailable ? 'Dağılım verisi henüz alınamadı.' : 'Eşleşen kayıt bulunmuyor.'}
            </p>
          )}
        </Card>
        <Card className="analysis-panel">
          <h2>{result.trendTitle || 'Dönemsel kayıtlar'}</h2>
          {trend.length ? (
            <LineChart
              values={trend.map(([, v]) => v)}
              labels={trend.map(([d]) => d)}
              color="#9abfa8"
            />
          ) : (
            <p className="empty-inline">Tarihli kayıt bulunmuyor.</p>
          )}
        </Card>
      </div>
      <DataTable
        name={`leaf-${kind}-${slug}`}
        data={rows}
        manualSorting
        getRowId={(r) => r.id}
        unavailable={result.unavailable}
        entityKind={educational ? 'students' : undefined}
        onOpen={
          educational
            ? (r, full, ordered) =>
                open(
                  { kind: 'students', id: r.id },
                  full,
                  ordered.map((r) => ({ kind: 'students', id: r.id })),
                )
            : undefined
        }
        columns={[
          ...keys.map((key) => ({
            accessorKey: key,
            header: label(key),
            cell: ({ row }: { row: { original: LeafRow } }) =>
              key === 'studentName' ? (
                <div>
                  <Link to={`/admin/students/${row.original.id}`}>{row.original.studentName}</Link>
                  <p className="muted text-xs">{row.original.studentEmail}</p>
                </div>
              ) : key === 'educationStatus' ? (
                <StatusBadge>{formatValue(key, row.original[key])}</StatusBadge>
              ) : (
                formatValue(key, row.original[key])
              ),
          })),
          ...(educational
            ? [
                {
                  id: 'actions',
                  header: 'İşlemler',
                  cell: ({ row }: { row: { original: LeafRow } }) => (
                    <IconButton
                      icon="arrow-up-right"
                      label="Öğrenci detayı"
                      onClick={() =>
                        open(
                          { kind: 'students', id: row.original.id },
                          false,
                          rows.map((r) => ({ kind: 'students', id: r.id })),
                        )
                      }
                    />
                  ),
                },
              ]
            : []),
        ]}
        mobileCard={(r) => (
          <>
            <strong>{r.studentName || r.label}</strong>
            <dl className="mobile-record-meta">
              {keys.slice(1).map((k) => (
                <div key={k}>
                  <dt>{label(k)}</dt>
                  <dd>{formatValue(k, r[k])}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
      />
      <p className="field-hint mt-4">{result.notice} “—” henüz bilinmeyen alanları belirtir.</p>
    </>
  );
}
