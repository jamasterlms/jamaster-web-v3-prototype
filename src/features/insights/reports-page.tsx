import { useWorkspace } from '@/app/workspace-provider';
import { Icon } from '@/components/shared/icon';
import { PageHeading, SectionCard } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { Label as UIFieldLabel } from '@/components/ui/label';
import {
  Select as UISelect,
  SelectContent as UISelectContent,
  SelectItem as UISelectItem,
  SelectTrigger as UISelectTrigger,
  SelectValue as UISelectValue,
} from '@/components/ui/select';
import { navigation, navRoute } from '@/data/navigation';
import { attendanceStats } from '@/features/calendar/attendance-model';
import { inPeriod, periodLabel, reportPeriods } from '@/features/finance/finance-model';
import { useOperations } from '@/features/operations/operations-provider';
import { usePageState } from '@/hooks/use-page-state';
import { downloadCSV, money } from '@/lib/format';
import { Link } from 'react-router-dom';
import { distribution, financeSummary } from './report-model';
export function ReportsPage({ finance = false }: { finance?: boolean }) {
  const [period, setPeriod] = usePageState('report-period', 'all');
  const { state } = useWorkspace();
  const parent = navigation
    .flatMap((group) => group.items)
    .find((item) => item.path === (finance ? '/admin/reports' : '/admin/education-reports'))!;
  const { operations } = useOperations();
  const summary = financeSummary(state, period);
  const allSessions = (state.attendanceSessions || []).filter((s) => s.branch === state.branch);
  const attendance = attendanceStats(allSessions.filter((s) => inPeriod(s.date, period)));
  const students = state.students.filter((s) => inPeriod(s.date, period));
  const periods = reportPeriods([
    ...state.students.map((s) => s.date),
    ...summary.records.sales.map((s) => s.date),
    ...summary.records.receipts.map((r) => r.date),
    ...allSessions.map((s) => s.date),
  ]);
  const metrics = finance
    ? [
        ['Dönemdeki satışlar', money(summary.sold)],
        ['Dönemdeki tahsilatlar', money(summary.collected)],
        ['Tüm açık bakiyeler', money(summary.allTimeBalance)],
        ['Satış kaydı', String(summary.sales.length)],
      ]
    : [
        ['Dönemdeki kayıtlar', String(students.length)],
        [
          'Şu an aktif gruplar',
          String(operations.groups.filter((g) => g.status === 'Aktif').length),
        ],
        ['Kaydedilen devam', attendance.rate === null ? '—' : `%${attendance.rate}`],
        [
          'Şu an dondurulmuş',
          String(state.students.filter((s) => s.status === 'Dondurulmuş').length),
        ],
      ];
  const data = finance
    ? summary.courses
    : distribution(
        students,
        (s) => s.course,
        () => 1,
      );
  const total = data.reduce((n, [, value]) => n + value, 0);
  return (
    <>
      <PageHeading
        title={finance ? 'Satış Raporları' : 'Eğitim Raporları'}
        description="Eğitim ve finans süreçlerinizin güncel durumunu takip edin."
      >
        <div className="form-field choice-field">
          <UIFieldLabel htmlFor="reports-page-select-1">{'Dönem'}</UIFieldLabel>
          <UISelect name={undefined} value={period || undefined} onValueChange={setPeriod}>
            <UISelectTrigger
              id="reports-page-select-1"
              className="filter-select"
              aria-label={'Dönem'}
            >
              <UISelectValue placeholder={'Seçin'} />
            </UISelectTrigger>
            <UISelectContent position="popper">
              {(['all', ...periods] as (string | { value: string; label: string })[]).map(
                (option) => (
                  <UISelectItem
                    key={typeof option === 'string' ? option : option.value}
                    value={typeof option === 'string' ? option : option.value}
                  >
                    {typeof option === 'string' ? periodLabel(option) : option.label}
                  </UISelectItem>
                ),
              )}
            </UISelectContent>
          </UISelect>
        </div>
      </PageHeading>
      <div className="report-metrics">
        {metrics.map(([label, value], index) => (
          <div className={`mini-stat ${index === 1 ? 'highlight' : ''}`} key={label}>
            <span>{label}</span>
            <b data-sensitive={value.includes('₺') ? true : undefined}>{value}</b>
          </div>
        ))}
      </div>
      <div className="report-charts">
        <SectionCard title={finance ? 'Satış dağılımı' : 'Dönemdeki kayıt dağılımı'}>
          <div className="report-chart-body">
            {!data.length && <p className="empty-inline">Seçili dönemde kayıt bulunmuyor.</p>}
            {data.map(([label, count], index) => (
              <div className="distribution-item" key={label}>
                <div className="flex justify-between">
                  <span>{label}</span>
                  <b>{finance ? money(count) : `${count} öğrenci`}</b>
                </div>
                <div className="distribution-track">
                  <div
                    style={{
                      width: `${total ? (count / total) * 100 : 0}%`,
                      background: ['#a2c8b3', '#c3acd5', '#a7c6d7'][index % 3],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title={finance ? 'Tahsilat kanalları' : 'Kaydedilen derse katılım'}>
          {finance ? (
            <div className="report-chart-body">
              {!summary.methods.length && (
                <p className="empty-inline">Seçili dönemde tahsilat bulunmuyor.</p>
              )}
              {summary.methods.map(([label, value]) => (
                <div className="distribution-item" key={label}>
                  <div className="flex justify-between gap-3">
                    <span>{label}</span>
                    <b data-sensitive>{money(value)}</b>
                  </div>
                  <div className="distribution-track">
                    <div
                      style={{
                        width: `${summary.collected ? (value / summary.collected) * 100 : 0}%`,
                        background: '#a2c8b3',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="report-chart-body donut-wrap">
                <svg
                  width="170"
                  height="170"
                  viewBox="0 0 170 170"
                  role="img"
                  aria-label={
                    attendance.rate === null
                      ? 'Yoklama kaydı bulunmuyor'
                      : `Devam oranı yüzde ${attendance.rate}`
                  }
                >
                  <circle cx="85" cy="85" r="65" fill="none" stroke="#f1edf5" strokeWidth="13" />
                  <circle
                    cx="85"
                    cy="85"
                    r="65"
                    fill="none"
                    stroke="#c3acd5"
                    strokeWidth="13"
                    strokeDasharray={`${((attendance.rate || 0) / 100) * 409} 409`}
                    transform="rotate(-90 85 85)"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="donut-center">
                  <strong>
                    {attendance.rate ?? '—'}
                    {attendance.rate !== null && <span>%</span>}
                  </strong>
                  <small>{attendance.total} yoklama işareti</small>
                </div>
              </div>
              <p className="muted px-5 pb-4">Bekleyen yoklamalar orana dahil edilmez.</p>
            </>
          )}
        </SectionCard>
      </div>
      <div className="section-bar mb-4 mt-6">
        <h2>Tüm {finance ? 'finans' : 'eğitim'} raporları</h2>
        <Button
          variant="ghost"
          onClick={() =>
            downloadCSV('jamaster-rapor.csv', [['Gösterge', periodLabel(period)], ...metrics])
          }
        >
          <Icon name="download" />
          CSV indir
        </Button>
      </div>
      <div className="report-catalog">
        {parent.children
          ?.filter(
            (item) =>
              navRoute(item.path) !== (finance ? 'admin/reports' : 'admin/education-reports'),
          )
          .map((item) => (
            <Link key={item.path} to={`/${navRoute(item.path)}`}>
              <Icon name="file-text" />
              {item.label}
              <Icon name="arrow-up-right" />
            </Link>
          ))}
      </div>
    </>
  );
}
