import { EntityPreview } from '@/features/entities/entity-preview';
import { useDisplay } from '@/app/display-provider';
import { useWorkspace } from '@/app/workspace-provider';
import { Icon } from '@/components/shared/icon';
import { StudentPicker } from '@/components/shared/student-picker';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JamAIPanel } from '@/features/jamai/jamai-panel';
import { eventDay, eventDate, startOfWeek, splitCalendarEvents } from '@/lib/calendar';
import { useStickyPanel } from '@/hooks/use-sticky-panel';
import { SetupChecklist } from '@/features/onboarding/setup-checklist';
export function DailyPanel({ mobile = false }: { mobile?: boolean }) {
  const panelRef = useStickyPanel(mobile);
  const display = useDisplay();
  const today = eventDay(),
    day = display.dailyDay,
    setDay = display.setDailyDay;
  const selectedDate = eventDate(day),
    weekStart = startOfWeek(selectedDate);
  const { state, openModal } = useWorkspace();
  const events = splitCalendarEvents(state.events)
    .filter((event) => event.day === day && event.status !== 'cancelled')
    .sort((a, b) => a.time.localeCompare(b.time));
  return (
    <aside
      ref={panelRef}
      id={mobile ? 'mobile-tools-panel' : 'workspace-tools-panel'}
      className="daily-panel"
      aria-label={display.preview ? 'Hızlı önizleme' : 'Günlük akış ve JamAI'}
    >
      {display.preview ? (
        <EntityPreview key={`${display.preview.kind}:${display.preview.id}`} />
      ) : (
        <Tabs
          value={display.tool}
          onValueChange={(v) => {
            display.setPreview(null);
            display.setTool(v as 'daily' | 'jamai');
          }}
          className="daily-tabs"
        >
          <div className="daily-header">
            <TabsList className="daily-switcher" aria-label="Araç görünümü">
              <TabsTrigger value="daily">
                <Icon name="calendar-days" />
                Günlük akış
              </TabsTrigger>
              <TabsTrigger value="jamai">
                <Icon name="sparkles" />
                JamAI
              </TabsTrigger>
            </TabsList>
            <SetupChecklist />
            <Button
              variant="ghost"
              size="icon"
              className="tools-close"
              aria-label="Araçları kapat"
              onClick={() => {
                if (mobile) display.setMobileOpen(false);
                else {
                  display.setToolsOpen(false);
                  document.getElementById('workspace-tools-toggle')?.focus({ preventScroll: true });
                }
              }}
            >
              <Icon name="x" />
            </Button>
          </div>
          <>
            <TabsContent value="daily" className="daily-feed-scroll">
              <div className="daily-content">
                <div className="daily-month-row">
                  <div className="daily-month">
                    {selectedDate
                      .toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
                      .toLocaleUpperCase('tr-TR')}
                  </div>
                  <div className="daily-date-actions">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Önceki hafta"
                      onClick={() => setDay(day - 7)}
                    >
                      <Icon name="chevron-left" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDay(today)}>
                      Bugün
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Sonraki hafta"
                      onClick={() => setDay(day + 7)}
                    >
                      <Icon name="chevron-right" />
                    </Button>
                  </div>
                </div>
                <h2 className="daily-title">
                  {day === today
                    ? 'Bugün'
                    : selectedDate.toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                      })}{' '}
                  <small>{selectedDate.toLocaleDateString('tr-TR', { weekday: 'long' })}</small>
                </h2>
                <div className="mini-week">
                  {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((name, i) => (
                    <button
                      key={name}
                      onClick={() => setDay(i + weekStart)}
                      className={day === i + weekStart ? 'selected' : ''}
                      aria-pressed={day === i + weekStart}
                    >
                      <span>{name}</span>
                      <b>{eventDate(i + weekStart).getDate()}</b>
                    </button>
                  ))}
                </div>
                <div className="daily-divider" />
                <div className="timeline-heading">
                  <h3>Dersler ve görüşmeler</h3>
                  <span className="badge">{events.length} etkinlik</span>
                </div>
                <div className="timeline">
                  {events.length ? (
                    events.map((event) => (
                      <div className="timeline-item" key={event.id}>
                        <span className="timeline-time">{event.time}</span>
                        <button
                          className={`timeline-card ${event.type === 'meeting' ? 'meeting' : event.color === 'green' ? 'green' : ''}`}
                          onClick={() => openModal({ type: 'event', id: event.id })}
                        >
                          <span className="timeline-label">
                            {event.type === 'meeting' ? 'GÖRÜŞME' : 'DERS'} · {event.duration} DK
                            {state.events.find((original) => original.id === event.id)?.day !==
                              day && ' · DEVAM'}
                          </span>
                          <h3>{event.title}</h3>
                          <p>{event.person || event.teacher}</p>
                          <div className="timeline-meta">
                            <span>
                              <Icon name="map-pin" className="small" />
                              {event.room}
                            </span>
                            {event.count && <span>{event.count} öğrenci</span>}
                          </div>
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="empty-inline">Bu gün için planlanmış etkinlik yok.</p>
                  )}
                </div>
                <StudentPicker mode="meeting">
                  <Button variant="outline" className="daily-add">
                    <Icon name="plus" />
                    Görüşme ekle
                  </Button>
                </StudentPicker>
              </div>
            </TabsContent>
            <TabsContent value="jamai" className="jamai-panel-content">
              <JamAIPanel />
            </TabsContent>
          </>
        </Tabs>
      )}
    </aside>
  );
}
