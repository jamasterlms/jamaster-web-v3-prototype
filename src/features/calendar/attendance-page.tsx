import { useWorkspace } from '@/app/workspace-provider';
import { EmptyState, PageHeading } from '@/components/shared/primitives';
import { GroupDetailNavigation } from '@/features/education/detail-navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useOperations } from '@/features/operations/operations-provider';
import { useQueryFilter } from '@/hooks/use-query-filter';
import { isDate, localDate } from '@/lib/validation';
import {
  groupAttendanceRecords,
  selectAttendanceRecord,
  type AttendanceRecord,
} from './attendance-model';
import { useLessonClock } from './use-lesson-clock';
import { AttendanceRoster } from './attendance-roster';
import { AttendanceHistory } from './attendance-history';

export function AttendancePage({ initialGroupId }: { initialGroupId?: string } = {}) {
  const { state } = useWorkspace();
  const { operations } = useOperations();
  const now = useLessonClock();
  const group = operations.groups.find((g) => g.id === initialGroupId);
  const [selection, setSelection] = useQueryFilter(
    'attendance-selection',
    { tab: 'current', date: localDate(), eventId: '' },
    {
      keys: ['tab', 'date', 'eventId'],
      read: (p) => ({
        tab: p.get('tab') === 'past' ? 'past' : 'current',
        date: p.get('date') ?? localDate(),
        eventId: p.get('eventId') || '',
      }),
      write: (p, v) => {
        p.set('tab', v.tab);
        p.set('date', v.date);
        if (v.eventId) p.set('eventId', v.eventId);
      },
    },
  );
  const records = groupAttendanceRecords(
    state.events,
    state.attendanceSessions || [],
    state.branch,
    initialGroupId || '',
    now,
  );
  const current = records.filter(
    (r) =>
      r.date === selection.date ||
      (selection.date === localDate(new Date(now)) && r.status === 'active'),
  );
  const selected = selectAttendanceRecord(
    selection.tab === 'past' ? records : current,
    selection.eventId,
  );
  const roster = (record: AttendanceRecord, history: boolean) =>
    group && (
      <AttendanceRoster
        key={record.id}
        record={record}
        groupId={group.id}
        groupName={group.name}
        level={group.level}
        subLevel={group.subLevel}
        now={now}
        history={history}
      />
    );
  return (
    <>
      <PageHeading
        title={group ? `${group.name} · Yoklamalar` : 'Grup bulunamadı'}
        description="Ders oturumlarını ve öğrenci katılımını takip edin."
      />
      {initialGroupId && <GroupDetailNavigation id={initialGroupId} />}
      {!group ? (
        <EmptyState text="Bu grup artık mevcut değil veya geçerli şubede bulunmuyor." />
      ) : (
        <Tabs
          value={selection.tab}
          onValueChange={(tab) => setSelection({ ...selection, tab, eventId: '' })}
        >
          <TabsList aria-label="Yoklama görünümü">
            <TabsTrigger value="current">Güncel yoklama</TabsTrigger>
            <TabsTrigger value="past">Geçmiş oturumlar</TabsTrigger>
          </TabsList>
          <TabsContent value="current">
            <div className="module-toolbar attendance-filters">
              <div className="form-field">
                <Label htmlFor="poll-date">Ders tarihi</Label>
                <Input
                  id="poll-date"
                  type="date"
                  placeholder="Ders tarihi seçin"
                  value={selection.date}
                  aria-invalid={!isDate(selection.date)}
                  onChange={(e) =>
                    setSelection({ ...selection, date: e.target.value, eventId: '' })
                  }
                />
              </div>
              <div className="form-field">
                <Label htmlFor="poll-lesson">Ders oturumu</Label>
                <Select
                  value={selected ? String(selected.eventId) : ''}
                  disabled={!current.length}
                  onValueChange={(eventId) => setSelection({ ...selection, eventId })}
                >
                  <SelectTrigger id="poll-lesson">
                    <SelectValue placeholder="Ders oturumu seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {current.map((r) => (
                      <SelectItem key={r.id} value={String(r.eventId)}>
                        {r.time} · {r.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="ghost"
                onClick={() =>
                  setSelection({ ...selection, date: localDate(new Date(now)), eventId: '' })
                }
              >
                Bugün
              </Button>
            </div>
            {!isDate(selection.date) ? (
              <p className="field-error" role="alert">
                Geçerli bir ders tarihi seçin.
              </p>
            ) : selected ? (
              roster(selected, false)
            ) : (
              <EmptyState
                text={
                  selection.eventId
                    ? 'İstenen ders oturumu bu tarihte bulunamadı. Bir oturum seçin.'
                    : 'Bu tarihte grup dersi bulunmuyor.'
                }
              />
            )}
          </TabsContent>
          <TabsContent value="past">
            <AttendanceHistory
              records={records}
              onSelect={(record) =>
                setSelection({ ...selection, date: record.date, eventId: String(record.eventId) })
              }
            />
            {selection.eventId && selected && (
              <div className="attendance-history-detail">
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    onClick={() => setSelection({ ...selection, eventId: '' })}
                  >
                    Öğrenci listesini kapat
                  </Button>
                </div>
                {roster(selected, true)}
              </div>
            )}
            {selection.eventId && !selected && (
              <EmptyState text="İstenen geçmiş oturum bulunamadı." />
            )}
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}
