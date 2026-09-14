import { PersonalShortcuts } from '@/features/settings/account-page';
import { useMemberships } from '@/features/education/use-memberships';
import { useEntityNavigation } from '@/features/entities/use-entity-navigation';
import { useWorkspace } from '@/app/workspace-provider';
import { Icon } from '@/components/shared/icon';
import {
  Avatar,
  IconButton,
  PageHeading,
  Person,
  SectionCard,
  StatusBadge,
} from '@/components/shared/primitives';
import { StudentPicker } from '@/components/shared/student-picker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { attendanceLabel, attendanceStats } from '@/features/calendar/attendance-model';
import { financeRecords, saleBalance } from '@/features/finance/finance-model';
import { usePageState } from '@/hooks/use-page-state';
import { navigate } from '@/hooks/use-route';
import { eventDate, eventDay, startOfWeek } from '@/lib/calendar';
import { dateTR, money } from '@/lib/format';
import { localDate } from '@/lib/validation';
import { BarChart, LineChart, PerformanceChart, Sparkline } from './charts';
export function DashboardPage() {
  const memberships = useMemberships();
  const openEntity = useEntityNavigation();
  const { state, openModal } = useWorkspace();
  const today = new Date(),
    currentMonth = localDate(today).slice(0, 7),
    monthLabel = today.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  const weekDates = Array.from({ length: 7 }, (_, i) =>
    localDate(eventDate(startOfWeek(today) + i)),
  );
  const weekLabels = weekDates.map((date) => dateTR(date));
  const [filter, setFilter] = usePageState('filter', 'Tümü');
  const active = state.students.filter((s) => s.status === 'Aktif');
  const finance = financeRecords(state);
  const collected = finance.receipts.reduce((n, r) => n + r.amount, 0);
  const balanceFor = (id: number) =>
    finance.sales
      .filter((s) => s.studentId === id)
      .reduce((n, s) => n + saleBalance(s, finance.receipts), 0);
  const pending = state.students.filter((s) => balanceFor(s.id) > 0);
  const sessions = (state.attendanceSessions || []).filter((s) => s.branch === state.branch);
  const averageAttendance = attendanceStats(
    sessions.filter((s) => s.date.startsWith(currentMonth)),
  ).rate;
  const lastSession = [...sessions].sort((a, b) =>
    (b.date + b.time).localeCompare(a.date + a.time),
  )[0];
  const monthStudents = state.students.filter((s) => s.date.startsWith(currentMonth));
  const sales = finance.sales
    .filter((s) => s.date.startsWith(currentMonth))
    .reduce((n, s) => n + s.amount, 0);
  const stats = [
    {
      label: 'Aktif öğrenciler',
      value: String(active.length),
      sub: `Bu ay ${monthStudents.length} yeni kayıt`,
      icon: 'users',
      route: 'admin/students',
    },
    {
      label: 'Toplam tahsilatlar',
      value: (collected / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 1 }),
      unit: 'bin ₺',
      sub: 'Kaydedilen tüm tahsilatlar',
      icon: 'wallet',
      route: 'admin/reports/collections',
      highlight: true,
    },
    {
      label: 'Derse katılım',
      value: averageAttendance === null ? '—' : String(averageAttendance),
      unit: averageAttendance === null ? '' : '%',
      sub: 'Bu ay kaydedilen yoklamalar',
      icon: 'circle-check',
      route: 'admin/education-reports',
    },
    {
      label: 'Bekleyen tahsilatlar',
      value: String(pending.length),
      sub: `Toplam ${money(pending.reduce((n, s) => n + balanceFor(s.id), 0))}`,
      icon: 'receipt-text',
      route: 'admin/payments/installments',
    },
  ];
  const payments = pending
    .slice(0, 3)
    .map((student) => ({ student, amount: balanceFor(student.id), date: 'Kalan eğitim bakiyesi' }));
  return (
    <div className="dashboard-page">
      <PageHeading
        title="İyi günler, Furkan"
        description="Şubenizde bugün neler oluyor, birlikte bakalım."
      >
        <span className="date-pill">
          <Icon name="calendar-days" className="small" />
          {today.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </PageHeading>
      <PersonalShortcuts />
      <div className="quick-actions" aria-label="Hızlı işlemler">
        <Button variant="outline" onClick={() => navigate('admin/students/register')}>
          <Icon name="plus" />
          Yeni öğrenci
        </Button>
        <StudentPicker mode="meeting">
          <Button variant="outline">
            <Icon name="handshake" />
            Yeni görüşme
          </Button>
        </StudentPicker>
        <Button variant="outline" onClick={() => navigate('admin/calendar/pollings')}>
          <Icon name="check-check" />
          Yoklama al
        </Button>
        <Button variant="outline" onClick={() => navigate('admin/groups')}>
          <Icon name="users" />
          Gruplar
        </Button>
        <Button variant="outline" onClick={() => navigate('admin/reports/sales')}>
          <Icon name="chart-no-axes-combined" />
          Satış raporu
        </Button>
      </div>
      <div className="dashboard-top">
        <div className="stats-grid">
          {stats.map((s) => (
            <Card key={s.label} className={`stat-card ${s.highlight ? 'highlight' : ''}`}>
              <div className="stat-top">
                <span className="stat-icon">
                  <Icon name={s.icon} />
                </span>
                <IconButton
                  icon="arrow-up-right"
                  label={`${s.label} detayları`}
                  className="stat-arrow"
                  onClick={() => navigate(s.route)}
                />
              </div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-bottom">
                <div>
                  <div
                    className="stat-value"
                    data-sensitive={
                      s.icon === 'wallet' || s.icon === 'receipt-text' ? true : undefined
                    }
                  >
                    {s.value}
                    <small>{s.unit}</small>
                  </div>
                  <span className="stat-sub">{s.sub}</span>
                </div>
                <Sparkline bars={s.highlight} />
              </div>
            </Card>
          ))}
        </div>
        <PerformanceChart />
      </div>
      <SectionCard
        title="Son kayıtlar"
        action={() => navigate('admin/students')}
        className="tracker-card"
        headerEnd={
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              {['Tümü', 'Tamamlandı', 'Bekliyor', 'Kısmi ödeme', 'Gecikmiş'].map((value) => (
                <TabsTrigger key={value} value={value}>
                  {value === 'Tamamlandı' ? 'Ödendi' : value}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
      >
        <div className="tracker-list">
          {active
            .filter((s) => filter === 'Tümü' || s.payment === filter)
            .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
            .slice(0, 5)
            .map((s) => (
              <div key={s.id} className="tracker-row">
                <Person student={s} />
                <div className="row-data tracker-group">
                  <span className="badge">
                    <Icon name="users" className="small" />
                    {memberships.labelFor(s.id)}
                  </span>
                  <div className="muted">{s.teacher}</div>
                </div>
                <div className="row-data">
                  <span data-sensitive>{money(s.amount)}</span>
                  <div className="mt-1">
                    <StatusBadge>{s.payment}</StatusBadge>
                  </div>
                </div>
                <div className="tracker-date">
                  {dateTR(s.date)}
                  <div className="muted">{new Date(s.date + 'T12:00:00').getFullYear()}</div>
                </div>
                <IconButton
                  icon="arrow-up-right"
                  label={`${s.name} detayları`}
                  className="soft compact"
                  onClick={(e) => openEntity({ kind: 'students', id: String(s.id) }, e.detail > 1)}
                />
              </div>
            ))}
        </div>
      </SectionCard>
      <div className="dashboard-section-heading">
        <h2>Şubenize genel bakış</h2>
        <span>{monthLabel}</span>
      </div>
      <div className="dashboard-more">
        <SectionCard title="Aylık Satış Raporu" action={() => navigate('admin/reports/sales')}>
          <div className="widget-body">
            <div className="widget-value" data-sensitive>
              {money(sales)}
            </div>
            <div className="widget-caption">{monthLabel} · Satış tarihine göre</div>
            <LineChart
              values={weekDates.map((date) =>
                finance.sales.filter((s) => s.date === date).reduce((n, s) => n + s.amount, 0),
              )}
              labels={weekLabels}
            />
          </div>
        </SectionCard>
        <SectionCard title="Aylık Görüşme Raporu" action={() => navigate('admin/reports/meetings')}>
          <div className="widget-body">
            <div className="widget-value">
              {state.meetings.filter((m) => m.createdAt.startsWith(currentMonth)).length}{' '}
              <small>görüşme</small>
            </div>
            <div className="widget-caption">
              {
                state.meetings.filter(
                  (m) => m.result === 'SALE' && m.createdAt.startsWith(currentMonth),
                ).length
              }{' '}
              satışla sonuçlanan görüşme
            </div>
            <BarChart
              values={weekDates.map(
                (date) =>
                  state.meetings.filter((m) => localDate(new Date(m.createdAt)) === date).length,
              )}
              color="#9ab574"
              labels={weekLabels}
            />
          </div>
        </SectionCard>
        <SectionCard
          title="Bekleyen öğrenci ödemeleri"
          action={() => navigate('admin/payments/installments')}
        >
          <div className="widget-body">
            <div className="widget-heading">
              <span>Takip edilecek ödemeler</span>
              <span data-sensitive>{money(payments.reduce((n, p) => n + p.amount, 0))}</span>
            </div>
            {!payments.length && <p className="empty-inline">Bekleyen ödeme bulunmuyor.</p>}
            {payments.map((p) => (
              <button
                className="widget-row"
                key={p.student.id}
                onClick={(e) =>
                  openEntity({ kind: 'students', id: String(p.student.id) }, e.detail > 1)
                }
              >
                <Avatar name={p.student.name} color={p.student.color} />
                <div>
                  <strong>{p.student.name}</strong>
                  <small>{p.date}</small>
                </div>
                <span className="widget-end" data-sensitive>
                  {money(p.amount)}
                </span>
              </button>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Bugünkü Görüşmeler" action={() => navigate('admin/reports/meetings')}>
          <div className="widget-body">
            {state.events
              .filter((e) => e.day === eventDay(today) && e.type === 'meeting')
              .map((item) => (
                <button
                  key={item.id}
                  className="widget-row"
                  onClick={() => openModal({ type: 'event', id: item.id })}
                >
                  <Icon name="handshake" />
                  <div>
                    <strong>{item.person}</strong>
                    <small>{item.title}</small>
                  </div>
                  <span className="widget-end">{item.time}</span>
                </button>
              ))}
            <StudentPicker mode="meeting">
              <Button variant="ghost">
                <Icon name="plus" />
                Görüşme ekle
              </Button>
            </StudentPicker>
          </div>
        </SectionCard>
        <SectionCard title="Bugünkü Dersler" action={() => navigate('admin/calendar')}>
          <div className="widget-body">
            {!state.events.some(
              (e) => e.day === eventDay(today) && e.type === 'lesson' && e.status !== 'cancelled',
            ) && <p className="empty-inline">Bugün için planlanmış ders bulunmuyor.</p>}
            {state.events
              .filter(
                (e) => e.day === eventDay(today) && e.type === 'lesson' && e.status !== 'cancelled',
              )
              .map((e) => (
                <button
                  className="widget-row"
                  key={e.id}
                  onClick={() => openModal({ type: 'event', id: e.id })}
                >
                  <Icon name="book-open" />
                  <div>
                    <strong>{e.title}</strong>
                    <small>
                      {e.teacher} · {e.room}
                    </small>
                  </div>
                  <span className="widget-end">
                    {e.time}
                    <small>{e.count} öğrenci</small>
                  </span>
                </button>
              ))}
          </div>
        </SectionCard>
        <SectionCard title="Son yoklama durumu" action={() => navigate('admin/calendar/pollings')}>
          <div className="widget-body">
            {lastSession ? (
              <>
                <div className="widget-heading">
                  <span>{lastSession.groupName}</span>
                  <span>
                    {dateTR(lastSession.date)} · {lastSession.time}
                  </span>
                </div>
                {state.students
                  .filter((s) => Object.hasOwn(lastSession.marks, s.id))
                  .map((s) => (
                    <div className="widget-row" key={s.id}>
                      <Avatar name={s.name} color={s.color} />
                      <div>
                        <strong>{s.name}</strong>
                        <small>{lastSession.title}</small>
                      </div>
                      <span className="widget-end">
                        <StatusBadge>{attendanceLabel(lastSession.marks[s.id])}</StatusBadge>
                      </span>
                    </div>
                  ))}
              </>
            ) : (
              <p className="empty-inline">Henüz kaydedilmiş yoklama bulunmuyor.</p>
            )}
            <Button variant="ghost" onClick={() => navigate('admin/calendar/pollings')}>
              <Icon name="check-check" />
              Yoklama al
            </Button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
