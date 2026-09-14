import { useRef, useState } from 'react';
import { gridMinute, selectedCalendarRange } from './calendar-interaction';
import type { CalendarEvent } from '@/types';
import { eventDate, layoutEvents } from '@/lib/calendar';
export function CalendarGrid({
  events,
  sourceEvents = events,
  days,
  today,
  onDay,
  onEvent,
  onRange,
}: {
  events: CalendarEvent[];
  sourceEvents?: CalendarEvent[];
  days: number[];
  today: number;
  onDay: (day: number) => void;
  onEvent: (event: CalendarEvent) => void;
  onRange?: (day: number, start: number, duration: number, event?: CalendarEvent) => void;
}) {
  const [selection, setSelection] = useState<{ day: number; start: number; end: number } | null>(
    null,
  );
  const dragging = useRef<CalendarEvent | null>(null);
  const startHour = Math.min(8, ...events.map((e) => Number(e.time.slice(0, 2))));
  const endHour = Math.min(
    24,
    Math.max(
      19,
      ...events.map((e) =>
        Math.ceil((Number(e.time.slice(0, 2)) * 60 + Number(e.time.slice(3)) + e.duration) / 60),
      ),
    ),
  );
  const hours = endHour - startHour;
  return (
    <div
      className="schedule-scroll"
      tabIndex={0}
      role="region"
      aria-label="Ders programı; yatay kaydırılabilir"
    >
      <div
        className={`schedule-grid ${days.length === 1 ? 'day-view' : ''}`}
        style={{ gridTemplateColumns: `3.25rem repeat(${days.length}, minmax(7rem,1fr))` }}
      >
        <div className="schedule-corner" />
        {days.map((day) => (
          <button
            key={day}
            className={`schedule-day ${day === today ? 'today' : ''}`}
            onClick={() => onDay(day)}
          >
            <span>{eventDate(day).toLocaleDateString('tr-TR', { weekday: 'short' })}</span>
            <b>{eventDate(day).getDate()}</b>
          </button>
        ))}
        <div className="schedule-hours" style={{ height: `${hours * 5.5}rem` }}>
          {Array.from({ length: hours }, (_, i) => (
            <span key={i} style={{ top: `${i * 5.5}rem` }}>
              {String(startHour + i).padStart(2, '0')}:00
            </span>
          ))}
        </div>
        {days.map((day) => (
          <div
            key={day}
            className={`schedule-column ${day === today ? 'today' : ''}`}
            style={{ height: `${hours * 5.5}rem` }}
            data-editable={!!onRange}
            onPointerDown={(e) => {
              if (
                !onRange ||
                e.pointerType !== 'mouse' ||
                e.button !== 0 ||
                (e.target as HTMLElement).closest('button')
              )
                return;
              const rect = e.currentTarget.getBoundingClientRect(),
                minute = gridMinute(e.clientY, rect.top, rect.height, startHour, hours);
              e.currentTarget.setPointerCapture(e.pointerId);
              setSelection({ day, start: minute, end: minute });
            }}
            onPointerMove={(e) => {
              if (
                !selection ||
                selection.day !== day ||
                !e.currentTarget.hasPointerCapture(e.pointerId)
              )
                return;
              const rect = e.currentTarget.getBoundingClientRect();
              setSelection({
                ...selection,
                end: gridMinute(e.clientY, rect.top, rect.height, startHour, hours),
              });
            }}
            onPointerUp={(e) => {
              if (!selection || !onRange || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
              e.currentTarget.releasePointerCapture(e.pointerId);
              const range = selectedCalendarRange(selection.start, selection.end);
              onRange(day, range.start, range.duration);
              setSelection(null);
            }}
            onPointerCancel={() => setSelection(null)}
            onDragOver={(e) => {
              if (onRange && dragging.current) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (!onRange || !dragging.current) return;
              const rect = e.currentTarget.getBoundingClientRect();
              onRange(
                day,
                gridMinute(e.clientY, rect.top, rect.height, startHour, hours),
                dragging.current.duration,
                dragging.current,
              );
              dragging.current = null;
            }}
          >
            {selection?.day === day && (
              <div
                className="schedule-selection"
                style={{
                  top: `${(selectedCalendarRange(selection.start, selection.end).start / 60 - startHour) * 5.5}rem`,
                  height: `${(selectedCalendarRange(selection.start, selection.end).duration / 60) * 5.5}rem`,
                }}
              />
            )}
            {Array.from({ length: hours }, (_, i) => (
              <div className="schedule-line" key={i} style={{ top: `${i * 5.5}rem` }} />
            ))}
            {layoutEvents(events.filter((e) => e.day === day)).map(
              ({ event, start, column, columns }) => {
                const original = sourceEvents.find((source) => source.id === event.id) || event;
                const [hour, minute] = original.time.split(':').map(Number);
                const resize = (change: number) =>
                  onRange?.(
                    original.day,
                    hour * 60 + minute,
                    Math.max(15, original.duration + change),
                    original,
                  );
                return (
                  <div
                    key={event.id}
                    className={`schedule-event ${event.type === 'meeting' ? 'meeting' : event.color === 'green' ? 'green' : ''} ${event.status === 'cancelled' ? 'cancelled' : ''}`}
                    data-density={
                      event.duration < 40
                        ? 'tiny'
                        : event.duration < 65
                          ? 'short'
                          : event.duration < 90
                            ? 'medium'
                            : 'full'
                    }
                    style={{
                      top: `${(start / 60 - startHour) * 5.5}rem`,
                      height: `${Math.max((event.duration / 60) * 88 - 4, 20) / 16}rem`,
                      left: `calc(${(column / columns) * 100}% + 2px)`,
                      right: 'auto',
                      width: `calc(${100 / columns}% - 4px)`,
                    }}
                  >
                    <button
                      type="button"
                      className="schedule-event-content"
                      title={`${event.time} · ${event.title} · ${event.person || event.teacher} · ${event.room}`}
                      aria-label={`${event.time} · ${event.title} · ${event.duration} dakika${event.status === 'cancelled' ? ' · İptal edildi' : ''}`}
                      draggable={
                        !!onRange && event.type === 'lesson' && event.status !== 'cancelled'
                      }
                      onDragStart={(e) => {
                        dragging.current = original;
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', String(event.id));
                      }}
                      onDragEnd={() => {
                        dragging.current = null;
                      }}
                      onClick={() => onEvent(event)}
                    >
                      <small>
                        {event.time} · {event.duration} dk
                      </small>
                      <strong>{event.title}</strong>
                      <span>{event.person || event.teacher}</span>
                      <small>{event.room}</small>
                    </button>
                    {onRange &&
                      event.duration >= 30 &&
                      event.type === 'lesson' &&
                      event.status !== 'cancelled' && (
                        <button
                          type="button"
                          className="schedule-resize"
                          aria-label="Ders süresini değiştir; yukarı/aşağı ok ile 15 dakika"
                          draggable={false}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (!['ArrowUp', 'ArrowDown'].includes(e.key)) return;
                            e.preventDefault();
                            e.stopPropagation();
                            resize(e.key === 'ArrowDown' ? 15 : -15);
                          }}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            if (e.pointerType !== 'mouse') return;
                            e.preventDefault();
                            e.currentTarget.setPointerCapture(e.pointerId);
                            e.currentTarget.dataset.startY = String(e.clientY);
                          }}
                          onPointerUp={(e) => {
                            if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                            e.stopPropagation();
                            e.currentTarget.releasePointerCapture(e.pointerId);
                            const column = e.currentTarget
                              .closest('.schedule-column')!
                              .getBoundingClientRect();
                            const change =
                              Math.round(
                                (((e.clientY - Number(e.currentTarget.dataset.startY)) /
                                  column.height) *
                                  hours *
                                  60) /
                                  15,
                              ) * 15;
                            if (change) resize(change);
                          }}
                        />
                      )}
                  </div>
                );
              },
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
