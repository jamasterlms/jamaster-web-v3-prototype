import { useWorkspace } from '@/app/workspace-provider';
import { EmptyState, PageHeading } from '@/components/shared/primitives';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { pageFor } from '@/data/navigation';
import { LineChart } from '@/features/dashboard/charts';
import { distribution, financeSummary } from '@/features/insights/report-model';
import { useOperations } from '@/features/operations/operations-provider';
import { usePageState } from '@/hooks/use-page-state';
import { dateTR, money } from '@/lib/format';
import {
  inPeriod,
  installmentRows,
  periodLabel,
  reportPeriods,
  saleBalance,
} from './finance-model';

export function FinanceAnalysisPage({ route }: { route: string }) {
  const { state } = useWorkspace(),
    [period, setPeriod] = usePageState('analysis-period', 'all');
  const { operations } = useOperations();
  const advisor = route.includes('advisor'),
    cancellation = route.includes('cancellation-refund'),
    contracts = route.includes('contract-expiry'),
    packages = route.includes('pricing-package'),
    accounting = route.endsWith('/accounting');
  const summary = financeSummary(state, period);
  const methods = route.includes('payment-method'),
    discount = route.includes('discount'),
    funnel = route.includes('funnel'),
    forecast = route.includes('forecast');
  const meetings = state.meetings.filter((m) => inPeriod(m.createdAt, period));
  const planned = installmentRows(summary.records).filter(
    (r) => r.balance > 0 && r.date && inPeriod(r.date, period),
  );
  const data: [string, number][] =
    cancellation || contracts
      ? []
      : advisor
        ? distribution(
            summary.sales,
            (s) =>
              state.students.find((student) => student.id === s.studentId)?.advisor || 'Atanmadı',
            (s) => (route.includes('risk') ? saleBalance(s, summary.records.receipts) : s.amount),
          )
        : packages
          ? distribution(
              summary.sales,
              (s) => operations.plans.find((p) => p.id === s.planId)?.name || s.course,
              (s) => s.amount,
            )
          : accounting
            ? [
                ['Satış tahsilatları', summary.collected],
                [
                  'Ödenmiş giderler',
                  operations.expenses
                    .filter(
                      (e) =>
                        e.status === 'Ödendi' &&
                        e.type !== 'INCOME' &&
                        e.transactionMode !== 'RECURRING' &&
                        inPeriod(e.date, period),
                    )
                    .reduce((n, e) => n + e.amount, 0),
                ],
              ]
            : methods
              ? summary.methods
              : discount
                ? distribution(
                    summary.sales,
                    (s) => (s.discount ? `%${s.discount} ek indirim` : 'Ek indirimsiz'),
                    (s) => s.amount,
                  )
                : funnel
                  ? [
                      ['Görüşülen öğrenci', new Set(meetings.map((m) => m.studentId)).size],
                      [
                        'Satışla sonuçlanan görüşme',
                        meetings.filter((m) => m.result === 'SALE').length,
                      ],
                      [
                        'Satış yapılan öğrenci',
                        new Set(summary.sales.map((s) => s.studentId)).size,
                      ],
                    ]
                  : forecast
                    ? distribution(
                        planned,
                        (r) => r.date.slice(0, 7),
                        (r) => r.balance,
                      )
                    : summary.courses;
  const dates = reportPeriods([
    ...summary.records.sales.map((s) => s.date),
    ...summary.records.receipts.map((r) => r.date),
    ...installmentRows(summary.records).map((r) => r.date),
    ...state.meetings.map((m) => m.createdAt.slice(0, 10)),
  ]);
  const trend = distribution(
    summary.sales.filter((s) => s.date),
    (s) => s.date,
    (s) => s.amount,
  ).sort((a, b) => a[0].localeCompare(b[0]));
  const max = Math.max(0, ...data.map(([, v]) => v));
  return (
    <>
      <PageHeading
        title={pageFor(route).title}
        description={
          forecast
            ? 'Açık taksitlerin vade tarihine göre planlanan tahsilatları.'
            : 'Kaydedilmiş satış, görüşme ve tahsilat hareketlerinin dağılımı.'
        }
      >
        <div className="form-field">
          <Label htmlFor="analysis-period">Dönem</Label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger id="analysis-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['all', ...dates].map((p) => (
                <SelectItem key={p} value={p}>
                  {periodLabel(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeading>
      <div className="analysis-grid">
        <div className="analysis-panel">
          <h2>
            {advisor
              ? 'Danışman dağılımı'
              : packages
                ? 'Paket bazında satış'
                : accounting
                  ? 'Tahsilat ve giderler'
                  : cancellation
                    ? 'İptal ve iadeler'
                    : contracts
                      ? 'Sözleşme vade riski'
                      : methods
                        ? 'Ödeme kanalları'
                        : discount
                          ? 'Ek indirim dağılımı'
                          : funnel
                            ? 'Görüşme ve satış kayıtları'
                            : forecast
                              ? 'Vadeye göre açık bakiyeler'
                              : 'Eğitim bazında satış'}
          </h2>
          {!data.length && (
            <EmptyState
              text={
                contracts
                  ? 'Bitiş tarihine bağlı öğrenci sözleşmesi kaydı bulunmuyor.'
                  : cancellation
                    ? 'Kaydedilmiş iptal veya iade hareketi bulunmuyor.'
                    : 'Seçili dönemde bu ölçüte ait kayıt bulunmuyor.'
              }
            />
          )}
          {data.map(([label, value], i) => (
            <div className="analysis-bar" key={label}>
              <div>
                <span>{forecast ? periodLabel(label) : label}</span>
                <b data-sensitive={!funnel || undefined}>{funnel ? value : money(value)}</b>
              </div>
              <div className="capacity-meter">
                <span
                  className={`tone-${i % 3}`}
                  style={{ width: `${max ? (value / max) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
          {funnel && (
            <p className="muted">
              Görüşme sonucu ile satış kaydı ayrı ölçülür; her görüşme bir satış değildir.
            </p>
          )}
        </div>
        {!cancellation && !contracts && (
          <div className="analysis-panel">
            <span className="eyebrow">{forecast ? 'PLANLANAN TAHSİLAT' : 'SATIŞ HAREKETLERİ'}</span>
            <h2>{periodLabel(period)}</h2>
            <div className="widget-value" data-sensitive>
              {money(forecast ? planned.reduce((n, r) => n + r.balance, 0) : summary.sold)}
            </div>
            {forecast ? (
              <p className="muted">
                Vadesi belirtilen açık taksitlerden hesaplanır. Tarihi belirtilmeyen bakiyeler bu
                plana dahil edilmez.
              </p>
            ) : trend.length ? (
              <LineChart values={trend.map(([, v]) => v)} labels={trend.map(([d]) => dateTR(d))} />
            ) : (
              <EmptyState text="Tarihli satış hareketi bulunmuyor." />
            )}
          </div>
        )}
      </div>
    </>
  );
}
