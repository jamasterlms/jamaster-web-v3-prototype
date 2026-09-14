import { DateRangeFilter } from '@/components/forms/date-range-filter';
import { MultiSelect } from '@/components/ui/multi-select';
import { BreakdownChart } from '@/components/shared/breakdown-chart';
import { localDate } from '@/lib/validation';
import { useWorkspace } from '@/app/workspace-provider';
import { Metrics, SearchField } from '@/components/shared/feature-primitives';
import { Icon } from '@/components/shared/icon';
import { EmptyState, PageHeading, Person } from '@/components/shared/primitives';
import { StudentPicker } from '@/components/shared/student-picker';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePageState } from '@/hooks/use-page-state';
import { useQueryFilter } from '@/hooks/use-query-filter';
import { useLocation, useSearchParams } from 'react-router-dom';
import { eventDate } from '@/lib/calendar';
import { normalize } from '@/lib/format';
import { labelFor, meetingResults, meetingTypes } from './meeting-options';
export function MeetingsPage() {
  const { state, openModal } = useWorkspace();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const [tab, setTab] = usePageState('tab', 'Planlanan'),
    [query, setQuery] = usePageState('query', '');
  const [range, setRange] = useQueryFilter(
    'dateRange',
    pathname.endsWith('monthly-meetings')
      ? { from: `${localDate().slice(0, 7)}-01`, to: localDate() }
      : { from: '', to: '' },
    {
      keys: ['startDate', 'endDate'],
      read: (query) => ({
        from: query.get('startDate')?.slice(0, 10) || '',
        to: query.get('endDate')?.slice(0, 10) || '',
      }),
      write: (query, value) => {
        query.set('startDate', value.from);
        query.set('endDate', value.to);
      },
    },
  );
  const [types, setTypes] = usePageState<string[]>('types', []),
    [results, setResults] = usePageState<string[]>('results', []);
  const inRange = (date: string) =>
    (!range.from || date >= range.from) && (!range.to || date <= range.to);
  const scheduled = state.events
    .filter((e) => e.type === 'meeting' && !e.completedAt && inRange(localDate(eventDate(e.day))))
    .sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
  const records = state.meetings.filter(
    (m) =>
      inRange((params.get('dateField') === 'meetingDate' ? m.date : m.createdAt).slice(0, 10)) &&
      (!types.length || types.includes(m.type)) &&
      (!results.length || results.includes(m.result)) &&
      normalize(
        (state.students.find((s) => s.id === m.studentId)?.name || '') +
          ' ' +
          m.note +
          ' ' +
          labelFor(meetingTypes, m.type) +
          ' ' +
          labelFor(meetingResults, m.result),
      ).includes(normalize(query)),
  );
  return (
    <>
      <PageHeading title="Görüşmeler" description="Her görüşmeden sonra net bir sonraki adım.">
        <StudentPicker mode="meeting">
          <Button>
            <Icon name="plus" />
            Yeni görüşme
          </Button>
        </StudentPicker>
      </PageHeading>
      <Metrics
        items={[
          { label: 'Planlanan görüşme', value: scheduled.length },
          { label: 'Görüşme kaydı', value: state.meetings.length, highlight: true },
          {
            label: 'Satışa dönüşen',
            value: state.meetings.filter((m) => m.result === 'SALE').length,
          },
        ]}
      />
      <div className="module-toolbar">
        <SearchField value={query} onChange={setQuery} placeholder="Öğrenci veya görüşme ara" />
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="Planlanan">Planlanan</TabsTrigger>
            <TabsTrigger value="Geçmiş">Görüşme geçmişi</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="module-toolbar secondary-filters">
        <DateRangeFilter {...range} onChange={setRange} />
        {tab === 'Geçmiş' && (
          <>
            <MultiSelect
              label="Görüşme tipi"
              value={types}
              onChange={setTypes}
              options={meetingTypes.map(([value, label]) => ({ value, label }))}
            />
            <MultiSelect
              label="Görüşme sonucu"
              value={results}
              onChange={setResults}
              options={meetingResults.map(([value, label]) => ({ value, label }))}
            />
          </>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setQuery('');
            setRange({ from: '', to: '' });
            setTypes([]);
            setResults([]);
          }}
        >
          Filtreleri sıfırla
        </Button>
      </div>
      {tab === 'Geçmiş' && (
        <BreakdownChart
          title="Görüşme sonuçları"
          unit="görüşme"
          items={meetingResults
            .map(([value, label]) => ({
              label,
              value: records.filter((m) => m.result === value).length,
            }))
            .filter((i) => i.value > 0)}
        />
      )}
      {tab === 'Planlanan' ? (
        <div className="meetings-list">
          {!scheduled.some((e) =>
            normalize((e.person || '') + e.title).includes(normalize(query)),
          ) && <EmptyState text="Aramanıza uygun planlanmış görüşme bulunmuyor." />}
          {scheduled
            .filter((e) => normalize(e.person + e.title).includes(normalize(query)))
            .map((e) => {
              const student =
                state.students.find((s) => s.id === e.studentId) ||
                (state.students.filter((s) => s.name === e.person).length === 1
                  ? state.students.find((s) => s.name === e.person)
                  : undefined);
              return (
                <div className="meeting-agenda-row" key={e.id}>
                  <div className="lesson-date">
                    <b>{eventDate(e.day).getDate()}</b>
                    {eventDate(e.day).toLocaleDateString('tr-TR', { month: 'short' })}
                    <small>{eventDate(e.day).getFullYear()}</small>
                  </div>
                  <div className="agenda-time">
                    {e.time}
                    <small>{e.duration} dakika</small>
                  </div>
                  <div className="agenda-person">
                    {student ? (
                      <Person student={student} />
                    ) : (
                      <>
                        <strong>{e.person}</strong>
                        <small>{e.title}</small>
                      </>
                    )}
                  </div>
                  <div className="agenda-purpose">
                    <strong>{e.title}</strong>
                    <small>
                      {e.room} · {e.teacher}
                    </small>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      student
                        ? openModal({ type: 'meeting', id: student.id, eventId: e.id })
                        : openModal({ type: 'event', id: e.id })
                    }
                  >
                    {student ? 'Görüşmeyi başlat' : 'Ayrıntıları aç'}
                    <Icon name="arrow-up-right" />
                  </Button>
                </div>
              );
            })}
        </div>
      ) : (
        <>
          <DataTable
            name="meeting-history"
            data={records}
            getRowId={(m) => String(m.id)}
            columns={[
              {
                id: 'student',
                header: 'Öğrenci',
                accessorFn: (m) =>
                  state.students.find((s) => s.id === m.studentId)?.name || 'Öğrenci bulunamadı',
              },
              {
                id: 'type',
                header: 'Görüşme tipi',
                accessorFn: (m) => labelFor(meetingTypes, m.type),
              },
              {
                id: 'result',
                header: 'Sonuç',
                accessorFn: (m) => labelFor(meetingResults, m.result),
              },
              {
                accessorKey: 'createdAt',
                header: 'Kayıt tarihi',
                cell: ({ row }) => new Date(row.original.createdAt).toLocaleString('tr-TR'),
              },
              { accessorKey: 'score', header: 'Skor' },
              {
                accessorKey: 'note',
                header: 'Not',
                cell: ({ row }) => (
                  <span className="meeting-note-cell">{row.original.note || '—'}</span>
                ),
              },
              {
                id: 'actions',
                header: 'İşlem',
                enableSorting: false,
                cell: ({ row }) => (
                  <Button
                    onClick={() => openModal({ type: 'meeting', id: row.original.studentId })}
                    variant="ghost"
                    size="icon"
                    aria-label="Takip et"
                    title="Takip et"
                  >
                    <Icon name="handshake" />
                  </Button>
                ),
              },
            ]}
            mobileCard={(m) => (
              <>
                <h3>
                  {state.students.find((s) => s.id === m.studentId)?.name || 'Öğrenci bulunamadı'}
                </h3>
                <p>
                  {labelFor(meetingTypes, m.type)} · {labelFor(meetingResults, m.result)}
                </p>
                <small>{new Date(m.createdAt).toLocaleString('tr-TR')}</small>
                <p>{m.note || 'Not bulunmuyor.'}</p>
                <Button
                  variant="outline"
                  onClick={() => openModal({ type: 'meeting', id: m.studentId })}
                >
                  Takip et
                </Button>
              </>
            )}
          />
        </>
      )}
    </>
  );
}
