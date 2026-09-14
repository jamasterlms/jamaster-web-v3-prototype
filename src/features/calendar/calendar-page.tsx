import {
  defaultCalendarFilters,
  calendarFilterKeys,
  readCalendarFilters,
  writeCalendarFilters,
  type CalendarFilters,
} from './calendar-filter-model';
import { calendarRange } from './calendar-interaction';
import type { LessonDraft } from './lesson-model';
import { useState, useRef, useEffect } from 'react';
import { AuditHistory } from '@/features/entities/audit-history';
import { useMemberships } from '@/features/education/use-memberships';
import { useWorkspace } from '@/app/workspace-provider';
import { useOperations } from '@/features/operations/operations-provider';
import { PageNavigation } from '@/components/navigation/page-navigation';
import {
  GroupDetailNavigation,
  TeacherDetailNavigation,
} from '@/features/education/detail-navigation';
import { PageHeading, IconButton, EmptyState } from '@/components/shared/primitives';
import { Icon } from '@/components/shared/icon';
import { StudentPicker } from '@/components/shared/student-picker';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { usePageState } from '@/hooks/use-page-state';
import { useQueryFilter } from '@/hooks/use-query-filter';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  eventDate,
  eventDay,
  startOfWeek,
  splitCalendarEvents,
  scopedCalendarEvents,
  type CalendarScope,
} from '@/lib/calendar';
import { dateTR } from '@/lib/format';
import type { CalendarEvent } from '@/types';
import { AttendanceOverview } from './attendance-overview';
import { LessonDialog } from './lesson-dialog';
import { CalendarGrid } from './calendar-grid';
import { toast } from 'sonner';
import { Link, useSearchParams } from 'react-router-dom';
import { isDate, localDate } from '@/lib/validation';
export function CalendarPage({
  attendance = false,
  scope,
  embedded = false,
}: {
  attendance?: boolean;
  scope?: CalendarScope;
  embedded?: boolean;
}) {
  const [, setSearchParams] = useSearchParams();
  const { state, openModal } = useWorkspace();
  const { operations } = useOperations();
  const memberships = useMemberships();
  const scopedGroup = operations.groups.find((g) => g.id === scope?.groupId);
  const scopedTeacher = operations.teachers.find((t) => t.id === scope?.teacherId);
  const scopedStudent = state.students.find((s) => s.id === scope?.studentId);
  const scopeMissing =
    (scope?.groupId && !scopedGroup) ||
    (scope?.teacherId && !scopedTeacher) ||
    (scope?.studentId !== undefined && !scopedStudent);
  const scopedEvents =
    scope?.studentId !== undefined
      ? state.events.filter(
          (e) =>
            e.type === 'lesson' &&
            (e.studentId === scope.studentId ||
              (e.groupId &&
                memberships.membersOf(e.groupId).some((s) => s.id === scope.studentId))),
        )
      : scopedCalendarEvents(state.events, scope, operations.teachers);
  const [historyTab, setHistoryTab] = useQueryFilter('teacher-history-tab', 'schedule', {
    keys: ['tab'],
    read: (p) => (p.get('tab') === 'audit' ? 'audit' : 'schedule'),
    write: (p, v) => p.set('tab', v),
  });
  const mobile = useIsMobile();
  const root = useRef<HTMLElement>(null);
  const today = eventDay();
  const [day, setDay] = useQueryFilter('day', today, {
    keys: ['date'],
    read: (params) =>
      isDate(params.get('date') || '')
        ? eventDay(new Date(`${params.get('date')}T12:00:00`))
        : today,
    write: (params, value) => params.set('date', localDate(eventDate(value))),
  });
  const [filters, setFilters] = useQueryFilter('calendarFilters', defaultCalendarFilters, {
    keys: calendarFilterKeys,
    read: readCalendarFilters,
    write: writeCalendarFilters,
  });
  const { view, rooms, eventTypes, lessonType } = filters;
  const changeFilter = (patch: Partial<CalendarFilters>) => setFilters({ ...filters, ...patch });
  const setView = (view: string) => changeFilter({ view });
  const openDay = (date: number) =>
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.set('date', localDate(eventDate(date)));
        writeCalendarFilters(next, { ...filters, view: 'Gün' });
        return next;
      },
      { replace: true },
    );
  const setRooms = (rooms: string[]) => changeFilter({ rooms });
  const setEventTypes = (eventTypes: string[]) => changeFilter({ eventTypes });
  const setLessonType = (lessonType: string) => changeFilter({ lessonType });
  const legacyTeachers = operations.teachers.filter((t) => t.name === filters.teacher);
  const teacher = operations.teachers.some((t) => t.id === filters.teacher)
    ? filters.teacher
    : legacyTeachers.length === 1
      ? legacyTeachers[0].id
      : filters.teacher;
  const setTeacher = (teacher: string) => changeFilter({ teacher });
  const teacherEvents =
    teacher === 'all' || scope?.teacherId
      ? scopedEvents
      : scopedEvents.filter((event) =>
          event.teacherId
            ? event.teacherId === teacher
            : operations.teachers.some(
                (t) =>
                  t.id === teacher &&
                  t.name === event.teacher &&
                  operations.teachers.filter((other) => other.name === t.name).length === 1,
              ),
        );
  const [mode, setMode] = usePageState('mode', 'view');
  const [editing, setEditing] = useState<CalendarEvent | 'new' | null>(null);
  const [initialRange, setInitialRange] = useState<Partial<LessonDraft> | undefined>();
  const [fullscreen, setFullscreen] = useState(false);
  const ownsFullscreen = useRef(false);
  useEffect(() => {
    if (!fullscreen || !root.current) return;
    const previous = document.activeElement as HTMLElement | null;
    const blocked: { element: HTMLElement; inert: boolean }[] = [];
    let branch: HTMLElement = root.current;
    while (branch.parentElement && branch.parentElement !== document.body) {
      for (const sibling of branch.parentElement.children) {
        if (sibling !== branch && sibling instanceof HTMLElement) {
          blocked.push({ element: sibling, inert: sibling.inert });
          sibling.inert = true;
        }
      }
      branch = branch.parentElement;
    }
    root.current.focus({ preventScroll: true });
    return () => {
      blocked.forEach(({ element, inert }) => {
        element.inert = inert;
      });
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [fullscreen]);
  useEffect(() => {
    const update = () => {
      setFullscreen(ownsFullscreen.current && !!document.fullscreenElement);
      if (!document.fullscreenElement) ownsFullscreen.current = false;
    };
    document.addEventListener('fullscreenchange', update);
    return () => {
      document.removeEventListener('fullscreenchange', update);
      if (ownsFullscreen.current && document.fullscreenElement)
        void document.exitFullscreen().catch(() => {});
    };
  }, []);
  const activeView = mobile ? 'Liste' : view;
  const anchor = eventDate(day);
  const first =
    activeView === 'Ay'
      ? startOfWeek(new Date(anchor.getFullYear(), anchor.getMonth(), 1))
      : activeView === 'Gün'
        ? day
        : startOfWeek(anchor);
  const days = Array.from(
    { length: activeView === 'Ay' ? 42 : activeView === 'Gün' ? 1 : 7 },
    (_, i) => first + i,
  );
  const events = splitCalendarEvents(teacherEvents).filter(
    (event) =>
      days.includes(event.day) &&
      (!rooms.length || rooms.includes(event.room)) &&
      (!eventTypes.length || eventTypes.includes(event.type)) &&
      (lessonType === 'ALL' ||
        (event.type === 'lesson' &&
          (event.lessonType ||
            (operations.groups.find((g) => g.id === event.groupId)?.educationType === 'PRIVATE'
              ? 'PRIVATE'
              : 'GROUP')) === lessonType)),
  );
  const openEvent = (segment: CalendarEvent) => {
    const event = state.events.find((item) => item.id === segment.id) || segment;
    if (mode === 'edit' && event.type === 'lesson') setEditing(event);
    else openModal({ type: 'event', id: event.id });
  };
  const move = (direction: number) =>
    setDay(
      activeView === 'Ay'
        ? eventDay(new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1))
        : day + direction * (activeView === 'Gün' ? 1 : 7),
    );
  const choose = (
    id: string,
    label: string,
    value: string,
    onChange: (value: string) => void,
    options: string[][],
  ) => (
    <div className="form-field">
      <Label htmlFor={id} className={id === 'calendar-view' ? 'sr-only' : undefined}>
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Seçin" />
        </SelectTrigger>
        <SelectContent>
          {options.map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
  return (
    <section
      ref={root}
      tabIndex={-1}
      className="calendar-page"
      data-fullscreen={fullscreen || undefined}
    >
      {!embedded && (
        <PageHeading
          title={
            scopeMissing
              ? 'Kayıt bulunamadı'
              : scope
                ? `${scopedGroup?.name || scopedTeacher?.name || scopedStudent?.name} · Ders programı`
                : 'Ders Programı'
          }
          description="Dersleri, görüşmeleri ve yoklamaları bir arada yönetin."
        >
          {scope?.groupId && !scopeMissing && (
            <Button variant="outline" asChild>
              <Link to={`/admin/groups/${encodeURIComponent(scope.groupId)}/schedule/create`}>
                <Icon name="calendar-range" />
                Program oluştur
              </Link>
            </Button>
          )}
          {mode === 'edit' &&
            !attendance &&
            !scopeMissing &&
            !(scope?.teacherId && historyTab === 'audit') && (
              <Button onClick={() => setEditing('new')}>
                <Icon name="plus" />
                Ders ekle
              </Button>
            )}
          {!scope && (
            <StudentPicker mode="meeting">
              <Button variant="outline">
                <Icon name="handshake" />
                Görüşme ekle
              </Button>
            </StudentPicker>
          )}
        </PageHeading>
      )}
      {!embedded &&
        (scope?.groupId ? (
          <GroupDetailNavigation id={scope.groupId} />
        ) : scope?.teacherId ? (
          <TeacherDetailNavigation id={scope.teacherId} />
        ) : (
          <PageNavigation
            items={[
              { to: '/admin/calendar', label: 'Takvim' },
              { to: '/admin/calendar/pollings', label: 'Yoklamalar' },
            ]}
          />
        ))}
      {scope?.teacherId && (
        <Tabs
          value={historyTab}
          onValueChange={(value) => setHistoryTab(value === 'audit' ? 'audit' : 'schedule')}
        >
          <TabsList aria-label="Öğretmen geçmişi">
            <TabsTrigger value="schedule">Ders programı</TabsTrigger>
            <TabsTrigger value="audit">İşlem geçmişi</TabsTrigger>
          </TabsList>
        </Tabs>
      )}
      {scopeMissing ? (
        <EmptyState text="Bu kayıt geçerli şubede bulunmuyor." />
      ) : scope?.teacherId && historyTab === 'audit' ? (
        <AuditHistory targetType="teacher" targetId={scope.teacherId} />
      ) : attendance ? (
        <AttendanceOverview />
      ) : (
        <>
          <div className="calendar-toolbar">
            <h2>
              {activeView === 'Ay'
                ? anchor.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
                : `${dateTR(eventDate(days[0]))}${days.length > 1 ? ` – ${dateTR(eventDate(days.at(-1)!))}` : ''}`}
            </h2>
            <div className="calendar-actions">
              <Tabs value={mode} onValueChange={setMode}>
                <TabsList>
                  <TabsTrigger value="view">Görüntüle</TabsTrigger>
                  <TabsTrigger value="edit">Düzenle</TabsTrigger>
                </TabsList>
              </Tabs>
              {!mobile &&
                choose(
                  'calendar-view',
                  'Görünüm',
                  view,
                  setView,
                  ['Ay', 'Hafta', 'Gün', 'Liste'].map((v) => [v, v]),
                )}
              <IconButton icon="chevron-left" label="Önceki dönem" onClick={() => move(-1)} />
              <Button variant="outline" onClick={() => setDay(today)}>
                Bugün
              </Button>
              <IconButton icon="chevron-right" label="Sonraki dönem" onClick={() => move(1)} />
              <IconButton
                icon={fullscreen ? 'minimize' : 'maximize'}
                label={fullscreen ? 'Tam ekrandan çık' : 'Takvimi tam ekran aç'}
                onClick={async () => {
                  try {
                    if (document.fullscreenElement) await document.exitFullscreen();
                    else {
                      ownsFullscreen.current = true;
                      await document.documentElement.requestFullscreen();
                      setFullscreen(true);
                    }
                  } catch {
                    ownsFullscreen.current = false;
                    toast.error('Bu cihazda tam ekran açılamadı.');
                  }
                }}
              />
            </div>
          </div>
          <div className="calendar-filters">
            {!scope?.teacherId &&
              choose('calendar-teacher', 'Öğretmen', teacher, setTeacher, [
                ['all', 'Tüm öğretmenler'],
                ...(teacher !== 'all' && !operations.teachers.some((t) => t.id === teacher)
                  ? [[teacher, 'Öğretmen bulunamadı']]
                  : []),
                ...operations.teachers.map((t) => [t.id, t.name]),
              ])}
            {choose('calendar-lesson-type', 'Ders tipi', lessonType, setLessonType, [
              ['ALL', 'Tüm dersler'],
              ['GROUP', 'Grup dersi'],
              ['PRIVATE', 'Özel ders'],
            ])}
            <div className="form-field">
              <span className="calendar-filter-label">Derslik</span>
              <MultiSelect
                label="Derslik"
                value={rooms}
                onChange={setRooms}
                options={[...new Set(scopedEvents.map((e) => e.room))]
                  .filter(Boolean)
                  .map((value) => ({ value, label: value }))}
              />
            </div>
            {!scope && (
              <div className="form-field">
                <span className="calendar-filter-label">Etkinlik</span>
                <MultiSelect
                  label="Etkinlik"
                  value={eventTypes}
                  onChange={setEventTypes}
                  options={[
                    { value: 'meeting', label: 'Görüşme' },
                    { value: 'lesson', label: 'Ders' },
                  ]}
                />
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilters({ ...defaultCalendarFilters, view });
              }}
            >
              Filtreleri sıfırla
            </Button>
          </div>
          {!events.length && (
            <p className="calendar-empty-note" role="status">
              Bu tarih aralığında filtrelere uygun etkinlik bulunmuyor.
            </p>
          )}
          {activeView === 'Liste' ? (
            <div className="calendar-agenda">
              {days.map((date) => (
                <section key={date}>
                  <h3>
                    {eventDate(date).toLocaleDateString('tr-TR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                    {date === today && <span>Bugün</span>}
                  </h3>
                  {events
                    .filter((e) => e.day === date)
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((e) => (
                      <button
                        key={e.id}
                        className={`agenda-event ${e.type}`}
                        onClick={() => openEvent(e)}
                      >
                        <time>{e.time}</time>
                        <span>
                          <strong>{e.title}</strong>
                          <small>
                            {e.person || e.teacher || 'Öğretmen belirtilmedi'} ·{' '}
                            {e.room || 'Derslik belirtilmedi'}
                          </small>
                        </span>
                        <span>
                          {e.duration} dk{e.status === 'cancelled' && ' · İptal edildi'}
                        </span>
                      </button>
                    ))}
                  {!events.some((e) => e.day === date) && (
                    <p className="empty-inline">Planlanan etkinlik yok.</p>
                  )}
                </section>
              ))}
            </div>
          ) : activeView === 'Ay' ? (
            <div className="calendar-month" role="region" aria-label="Aylık ders programı">
              {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((name) => (
                <div className="month-weekday" key={name}>
                  {name}
                </div>
              ))}
              {days.map((date) => (
                <section
                  key={date}
                  className={
                    eventDate(date).getMonth() !== anchor.getMonth() ? 'outside-month' : ''
                  }
                >
                  <button
                    className={date === today ? 'today' : ''}
                    aria-label={eventDate(date).toLocaleDateString('tr-TR', { dateStyle: 'full' })}
                    aria-current={date === today ? 'date' : undefined}
                    onClick={() => {
                      openDay(date);
                    }}
                  >
                    {eventDate(date).getDate()}
                  </button>
                  {events
                    .filter((e) => e.day === date)
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .slice(0, 3)
                    .map((e) => (
                      <button
                        key={e.id}
                        className={`month-event ${e.type} ${e.status === 'cancelled' ? 'cancelled' : ''}`}
                        title={`${e.time} ${e.title}`}
                        onClick={() => openEvent(e)}
                      >
                        {e.time} {e.title}
                      </button>
                    ))}
                  {events.filter((e) => e.day === date).length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="month-more"
                      onClick={() => {
                        openDay(date);
                      }}
                    >
                      {events.filter((e) => e.day === date).length - 3} etkinlik daha
                    </Button>
                  )}
                </section>
              ))}
            </div>
          ) : (
            <CalendarGrid
              sourceEvents={scopedEvents}
              events={events}
              days={days}
              today={today}
              onDay={(date) => {
                openDay(date);
              }}
              onEvent={openEvent}
              onRange={
                mode === 'edit' && scope?.studentId === undefined
                  ? (date, start, duration, event) => {
                      setInitialRange(calendarRange(date, start, duration));
                      setDay(date);
                      setEditing(
                        event ? state.events.find((e) => e.id === event.id) || event : 'new',
                      );
                    }
                  : undefined
              }
            />
          )}
        </>
      )}
      {editing && (
        <LessonDialog
          key={editing === 'new' ? 'new' : editing.id}
          event={editing === 'new' ? undefined : editing}
          day={day}
          fixedGroupId={scope?.groupId}
          defaultTeacherId={scope?.teacherId}
          initialRange={initialRange}
          onClose={() => {
            setEditing(null);
            setInitialRange(undefined);
          }}
        />
      )}
    </section>
  );
}
