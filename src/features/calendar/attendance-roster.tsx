import { Icon } from '@/components/shared/icon';
import { useWorkspace } from '@/app/workspace-provider';
import { Person, StatusBadge } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { usePageState } from '@/hooks/use-page-state';
import { dateTR } from '@/lib/format';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  attendanceLabel,
  attendanceRosterIds,
  attendanceBranchConflict,
  lessonWindow,
  type AttendanceMark,
  type AttendanceRecord,
} from './attendance-model';

export function AttendanceRoster({
  record,
  groupId,
  groupName,
  level,
  subLevel,
  now,
  history = false,
}: {
  record: AttendanceRecord;
  groupId: string;
  groupName: string;
  level?: string;
  subLevel?: string;
  now: number;
  history?: boolean;
}) {
  const { state, dispatch } = useWorkspace();
  const { event, session: saved, id: key } = record;
  const [drafts, setDrafts] = usePageState<Record<string, Record<number, AttendanceMark>>>(
    'attendance-drafts',
    {},
  );
  const ids = attendanceRosterIds(
    event ? { ...event, groupId } : event,
    saved,
    state.students,
    groupName,
    state.groupMemberships,
  );
  const marks = drafts[key] || saved?.marks || {};
  const branchConflict = attendanceBranchConflict(
    state.attendanceSessions || [],
    record.eventId,
    state.branch,
  );
  const readOnly =
    history || branchConflict || !event || lessonWindow(event, now).status !== 'active';
  const changed = ids.some((id) => (marks[id] ?? null) !== (saved?.marks[id] ?? null));
  const clearDraft = () =>
    setDrafts((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });
  const rows = ids.map((id) => ({ id, student: state.students.find((s) => s.id === id) }));
  const identity = (row: (typeof rows)[number]) =>
    row.student ? (
      <Person student={row.student} />
    ) : (
      <span>
        Öğrenci #{row.id}
        <small className="muted block">Öğrenci kaydı artık mevcut değil</small>
      </span>
    );
  const controls = (id: number) => (
    <div className="attendance-options" role="group" aria-label={`Öğrenci ${id} yoklama durumu`}>
      {(['present', 'absent'] as const).map((mark) => (
        <Button
          key={mark}
          size="icon"
          variant={marks[id] === mark ? 'default' : 'outline'}
          aria-label={attendanceLabel(mark)}
          title={attendanceLabel(mark)}
          aria-pressed={marks[id] === mark}
          disabled={readOnly}
          onClick={() =>
            setDrafts((previous) => ({ ...previous, [key]: { ...marks, [id]: mark } }))
          }
        >
          <Icon name={mark === 'present' ? 'check' : 'circle-x'} />
        </Button>
      ))}
      <Button
        size="icon"
        aria-label="Yoklama seçimini temizle"
        title="Yoklama seçimini temizle"
        variant="ghost"
        disabled={readOnly || !marks[id]}
        onClick={() => setDrafts((previous) => ({ ...previous, [key]: { ...marks, [id]: null } }))}
      >
        <Icon name="x" />
      </Button>
    </div>
  );
  const checkIn = (id: number) => {
    const value = saved?.checkInTimes?.[id];
    if (!value) return '—';
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleString('tr-TR') : '—';
  };
  return (
    <section className="attendance-roster" aria-label="Oturum öğrenci listesi">
      <div className="section-bar">
        <h2>{record.title}</h2>
        <span className="muted">
          {dateTR(record.date)} {record.date.slice(0, 4)} · {record.time}
        </span>
      </div>
      <p className="muted mb-4">
        {!event
          ? record.archiveReason === 'rescheduled'
            ? 'Ders yeniden planlanmış. Bu yoklama önceki tarih ve saatiyle korunur.'
            : 'Ders takvimden kaldırılmış. Kaydedilmiş yoklama korunur.'
          : history
            ? 'Bu oturumun kaydedilmiş öğrenci listesi.'
            : record.status === 'cancelled'
              ? 'İptal edilen derste yoklama değiştirilemez.'
              : record.status === 'pending'
                ? 'Ders başlamadan yoklama alınamaz.'
                : record.status === 'completed'
                  ? 'Ders tamamlandı. Kaydedilen yoklama görüntüleniyor.'
                  : record.status === 'unknown'
                    ? 'Dersin saat bilgisi tamamlanmadan yoklama alınamaz.'
                    : 'İşaretlenmeyen öğrenciler bekliyor olarak kalır. Değişiklikler kaydettiğinizde uygulanır.'}
      </p>
      {!history && event?.lessonType === 'PRIVATE' && !event.studentId && (
        <p className="field-error" role="status">
          Bu özel derse öğrenci atanmamış. Ders programında düzenleme modunu açarak öğrenci seçin.
        </p>
      )}
      {branchConflict && (
        <p className="field-error" role="status">
          Bu dersin başka bir şubede yoklama kaydı var. Şube seçimini kontrol edin; bu bağlamda
          kayıt değiştirilemez.
        </p>
      )}
      {history && !saved ? (
        <p className="empty-state">Bu ders için kaydedilmiş yoklama bulunmuyor.</p>
      ) : (
        <DataTable
          name={`attendance-${record.eventId}`}
          data={rows}
          getRowId={(r) => String(r.id)}
          columns={[
            {
              id: 'student',
              header: 'Öğrenci',
              accessorFn: (r) => r.student?.name ?? String(r.id),
              cell: ({ row }) => identity(row.original),
            },
            {
              id: 'status',
              header: 'Yoklama durumu',
              accessorFn: (r) => attendanceLabel((history ? saved?.marks : marks)?.[r.id]),
              cell: ({ row }) => (
                <StatusBadge>
                  {attendanceLabel((history ? saved?.marks : marks)?.[row.original.id])}
                </StatusBadge>
              ),
            },
            { id: 'checkIn', header: 'Giriş zamanı', accessorFn: (r) => checkIn(r.id) },
            ...(!history
              ? [
                  {
                    id: 'actions',
                    header: 'Yoklama',
                    enableSorting: false,
                    enableHiding: false,
                    cell: ({ row }: { row: { original: (typeof rows)[number] } }) =>
                      controls(row.original.id),
                  },
                ]
              : []),
            {
              id: 'profile',
              header: '',
              enableSorting: false,
              cell: ({ row }) =>
                row.original.student && (
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    aria-label="Profili aç"
                    title="Profili aç"
                  >
                    <Link to={`/admin/students/${row.original.id}`}>
                      <Icon name="arrow-up-right" />
                    </Link>
                  </Button>
                ),
            },
          ]}
          mobileCard={(row) => (
            <>
              {identity(row)}
              <p>{attendanceLabel((history ? saved?.marks : marks)?.[row.id])}</p>
              <p className="muted">Giriş: {checkIn(row.id)}</p>
              {!history && controls(row.id)}
              {row.student && (
                <Button asChild variant="ghost" size="sm">
                  <Link to={`/admin/students/${row.id}`}>Profili aç</Link>
                </Button>
              )}
            </>
          )}
        />
      )}
      {!history && (
        <div className="form-actions attendance-save">
          <span className="muted" role="status">
            {ids.filter((id) => marks[id]).length} / {ids.length} öğrenci işaretlendi
            {changed ? ' · Kaydedilmemiş değişiklikler' : saved ? ' · Kaydedildi' : ''}
          </span>
          <Button variant="outline" disabled={!changed} onClick={clearDraft}>
            Değişiklikleri geri al
          </Button>
          <Button
            disabled={readOnly || !ids.length || !changed}
            onClick={() => {
              if (branchConflict || !event || lessonWindow(event, Date.now()).status !== 'active') {
                toast.error('Bu dersin yoklama zamanı sona erdi.');
                return;
              }
              dispatch({
                type: 'attendance/save',
                session: {
                  id: key,
                  branch: state.branch,
                  eventId: event.id,
                  groupId,
                  groupName,
                  title: record.title,
                  date: record.date,
                  time: record.time,
                  duration: event.duration,
                  lessonType: event.lessonType,
                  room: event.room,
                  level,
                  subLevel,
                  checkInTimes: saved?.checkInTimes,
                  marks: Object.fromEntries(ids.map((id) => [id, marks[id] ?? null])),
                  updatedAt: new Date().toISOString(),
                },
              });
              clearDraft();
              toast.success('Ders yoklaması kaydedildi.');
            }}
          >
            Yoklamayı kaydet
          </Button>
        </div>
      )}
    </section>
  );
}
