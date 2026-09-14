import { useWorkspace } from '@/app/workspace-provider';
import { Metrics } from '@/components/shared/feature-primitives';
import { DataTable } from '@/components/ui/data-table';
import { attendanceLabel, attendancePeriodStats } from '@/features/calendar/attendance-model';
import { StudentPayments } from './student-payments';
import { dateTR } from '@/lib/format';
import { downloadCSV } from '@/lib/format';
import { DateRangeFilter } from '@/components/forms/date-range-filter';
import { Button } from '@/components/ui/button';
import { useQueryFilter } from '@/hooks/use-query-filter';

export function StudentRecords({ id, section }: { id: number; section: string }) {
  return section === 'payments' ? <StudentPayments id={id} /> : <StudentAttendance id={id} />;
}
function StudentAttendance({ id }: { id: number }) {
  const { state } = useWorkspace();
  const [range, setRange] = useQueryFilter(
    'student-attendance-date',
    { from: '', to: '' },
    {
      keys: ['startDate', 'endDate'],
      read: (p) => ({ from: p.get('startDate') || '', to: p.get('endDate') || '' }),
      write: (p, value) => {
        p.set('startDate', value.from);
        p.set('endDate', value.to);
      },
    },
  );
  const sessions = (state.attendanceSessions || [])
    .filter((s) => s.branch === state.branch && Object.hasOwn(s.marks, id))
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const periods = attendancePeriodStats(sessions, id);
  const stats = periods.all;
  const filtered = sessions.filter(
    (s) => (!range.from || s.date >= range.from) && (!range.to || s.date <= range.to),
  );
  const dateLabel = (date: string) =>
    date ? `${dateTR(date)} ${date.slice(0, 4)}` : 'Belirtilmedi';
  return (
    <>
      <Metrics
        items={[
          { label: 'Toplam yoklama', value: stats.total },
          { label: 'Katıldığı ders', value: stats.present },
          { label: 'Katılmadığı ders', value: stats.absent },
          {
            label: 'Kaydedilen devam',
            value: stats.rate === null ? '—' : `%${stats.rate}`,
            highlight: true,
          },
          {
            label: 'Bu ay devam',
            value: periods.month.rate === null ? '—' : `%${periods.month.rate}`,
            detail: `${periods.month.present} katılım / ${periods.month.total} yoklama`,
          },
          {
            label: 'Bu hafta devam',
            value: periods.week.rate === null ? '—' : `%${periods.week.rate}`,
            detail: `${periods.week.present} katılım / ${periods.week.total} yoklama`,
          },
        ]}
      />
      <h2 className="subsection-title">Yoklama geçmişi</h2>
      <div className="module-toolbar">
        <DateRangeFilter {...range} onChange={setRange} />
        <Button
          variant="outline"
          onClick={() =>
            downloadCSV(`ogrenci-${id}-yoklama.csv`, [
              [
                'Tarih',
                'Saat',
                'Ders',
                'Grup',
                'Seviye',
                'Alt seviye',
                'Derslik',
                'Durum',
                'Giriş zamanı',
              ],
              ...filtered.map((s) => [
                s.date,
                s.time,
                s.title,
                s.groupName,
                s.level,
                s.subLevel,
                s.room,
                attendanceLabel(s.marks[id]),
                s.checkInTimes?.[id] || '',
              ]),
            ])
          }
        >
          CSV indir
        </Button>
        <Button
          variant="ghost"
          disabled={!range.from && !range.to}
          onClick={() => setRange({ from: '', to: '' })}
        >
          Filtreyi sıfırla
        </Button>
      </div>
      <DataTable
        name="student-attendance"
        data={filtered}
        getRowId={(s) => s.id}
        columns={[
          {
            id: 'date',
            header: 'Ders tarihi',
            accessorFn: (s) => `${s.date} ${s.time}`,
            cell: ({ row }) => `${dateLabel(row.original.date)} · ${row.original.time}`,
          },
          { accessorKey: 'title', header: 'Ders' },
          { accessorKey: 'groupName', header: 'Grup' },
          {
            id: 'level',
            header: 'Seviye / alt seviye',
            accessorFn: (s) => [s.level, s.subLevel].filter(Boolean).join(' · ') || 'Belirtilmedi',
          },
          {
            accessorKey: 'room',
            header: 'Derslik',
            cell: ({ row }) => row.original.room || 'Belirtilmedi',
          },
          { id: 'mark', header: 'Durum', accessorFn: (s) => attendanceLabel(s.marks[id]) },
          {
            id: 'checkInTime',
            header: 'Giriş zamanı',
            accessorFn: (s) => s.checkInTimes?.[id] || '',
            cell: ({ row }) =>
              row.original.checkInTimes?.[id]
                ? new Date(row.original.checkInTimes[id]!).toLocaleString('tr-TR')
                : 'Kayıt yok',
          },
        ]}
        mobileCard={(s) => (
          <>
            <h3>{s.title}</h3>
            <p>
              {dateLabel(s.date)} · {s.time}
            </p>
            <p>{s.groupName}</p>
            <b>{attendanceLabel(s.marks[id])}</b>
          </>
        )}
      />
    </>
  );
}
