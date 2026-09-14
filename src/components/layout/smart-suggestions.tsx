import { useDisplay } from '@/app/display-provider';
import { useWorkspace } from '@/app/workspace-provider';
import { Icon } from '@/components/shared/icon';
import { StudentPicker } from '@/components/shared/student-picker';
import { Button } from '@/components/ui/button';
import { attendanceStats } from '@/features/calendar/attendance-model';
import { financeRecords, installmentRows } from '@/features/finance/finance-model';
import { useOperations } from '@/features/operations/operations-provider';
import { eventDay } from '@/lib/calendar';
import { localDate } from '@/lib/validation';
import { Link } from 'react-router-dom';
export function SmartSuggestions() {
  const { state } = useWorkspace(),
    { operations } = useOperations(),
    display = useDisplay();
  const finance = financeRecords(state);
  const overdue = installmentRows(finance).filter(
    (r) => r.balance > 0 && r.date && r.date < localDate(),
  );
  const meetings = state.events.filter(
    (e) =>
      e.day === eventDay() && e.type === 'meeting' && !e.completedAt && e.status !== 'cancelled',
  );
  const risk = state.students.filter((s) => {
    const rate = attendanceStats(
      (state.attendanceSessions || []).filter((r) => r.branch === state.branch),
      s.id,
    ).rate;
    return s.status === 'Aktif' && rate !== null && rate < 90;
  });
  const unassigned = operations.groups.filter((g) => g.status !== 'Pasif' && !g.teacher);
  const suggestions = [
    {
      title: 'Gecikmiş tahsilatlar',
      text: overdue.length
        ? `${overdue.length} taksit için ödeme bekleniyor.`
        : 'Gecikmiş taksit bulunmuyor.',
      icon: 'wallet',
      action: 'Listeyi görüntüle',
      path: '/admin/payments/installments?status=Gecikmiş',
      tone: 'rose',
    },
    {
      title: 'Bugünkü görüşmeler',
      text: `Bugün ${meetings.length} açık görüşme var.`,
      icon: 'handshake',
      action: 'Ajandayı görüntüle',
      path: `/admin/reports/meetings?startDate=${localDate()}&endDate=${localDate()}&dateField=meetingDate&meetingDateResultStatus=pending`,
      tone: 'yellow',
    },
    {
      title: 'Devam uyarıları',
      text: `${risk.length} öğrencinin devam oranı %90’ın altında.`,
      icon: 'graduation-cap',
      action: 'Öğrencileri incele',
      path: '/admin/education-reports/attendance-risk-students',
      tone: 'lilac',
    },
    {
      title: 'Öğretmen atamaları',
      text: `${unassigned.length} grup öğretmen ataması bekliyor.`,
      icon: 'users',
      action: 'Grupları incele',
      path: '/admin/groups?teacher=unassigned',
      tone: 'blue',
    },
  ];
  return (
    <section className="smart-suggestions">
      <h3>Akıllı öneriler</h3>
      {suggestions.map((s) => (
        <div className="suggestion" key={s.title}>
          <span className={`suggestion-icon ${s.tone}`}>
            <Icon name={s.icon} />
          </span>
          <div>
            <h4>{s.title}</h4>
            <p>{s.text}</p>
            <Button size="sm" variant="secondary" asChild>
              <Link to={s.path} onClick={() => display.setMobileOpen(false)}>
                {s.action}
                <Icon name="arrow-right" />
              </Link>
            </Button>
          </div>
        </div>
      ))}
      <h3>Kısa yollar</h3>
      <div className="suggestion-shortcuts">
        <StudentPicker>
          <Button variant="outline">
            <Icon name="handshake" />
            Yeni görüşme
          </Button>
        </StudentPicker>
        <Button variant="outline" asChild>
          <Link to="/admin/reports/collections" onClick={() => display.setMobileOpen(false)}>
            <Icon name="wallet" />
            Tahsilatlar
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/admin/reports" onClick={() => display.setMobileOpen(false)}>
            <Icon name="chart-no-axes-combined" />
            Raporlar
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/admin/announcements" onClick={() => display.setMobileOpen(false)}>
            <Icon name="megaphone" />
            Duyurular
          </Link>
        </Button>
      </div>
    </section>
  );
}
