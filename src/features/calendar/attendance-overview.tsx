import { BulkActionBar } from '@/components/shared/bulk-action-bar';
import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { QrCode } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { AttendanceQrDialog } from './attendance-qr-dialog';
import { useWorkspace } from '@/app/workspace-provider';
import { useOperations } from '@/features/operations/operations-provider';
import { Metrics } from '@/components/shared/feature-primitives';
import { EmptyState, StatusBadge } from '@/components/shared/primitives';
import { Icon } from '@/components/shared/icon';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useQueryFilter } from '@/hooks/use-query-filter';
import { eventDate } from '@/lib/calendar';
import { dateTR } from '@/lib/format';
import type { CalendarEvent } from '@/types';
import {
  branchAttendanceOverview,
  lessonStatusLabels,
  lessonWindow,
  sessionKey,
  groupAttendanceRecords,
  attendanceRoute,
} from './attendance-model';
import { useLessonClock } from './use-lesson-clock';

export function AttendanceOverview() {
  const { state, openModal } = useWorkspace();
  const { operations } = useOperations();
  const now = useLessonClock();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const selectionBranch = useRef(state.branch);
  const root = useRef<HTMLDivElement>(null);
  const [qrIds, setQrIds] = useState<number[]>([]);
  const [groupId, setGroupId] = useQueryFilter('polling-overview-group', '', {
    keys: ['groupId'],
    read: (p) => p.get('groupId') || '',
    write: (p, v) => p.set('groupId', v),
  });
  const overview = branchAttendanceOverview(
    state.events.filter((e) => !groupId || e.groupId === groupId),
    now,
  );
  const eligibleIds = state.events
    .filter(
      (e) => e.type === 'lesson' && e.status !== 'cancelled' && (!groupId || e.groupId === groupId),
    )
    .map((e) => e.id)
    .sort((a, b) => a - b)
    .join(',');
  useEffect(() => {
    const eligible = new Set(eligibleIds.split(',').filter(Boolean).map(Number));
    if (selectionBranch.current !== state.branch) {
      setSelectedIds([]);
      setQrIds([]);
      selectionBranch.current = state.branch;
    } else setSelectedIds((ids) => ids.filter((id) => eligible.has(id)));
  }, [eligibleIds, state.branch]);
  const eligibleSelection = selectedIds.filter((id) => eligibleIds.split(',').includes(String(id)));
  const card = (event: CalendarEvent) => {
    const group = operations.groups.find((g) => g.id === event.groupId);
    const saved = state.attendanceSessions?.find(
      (s) => s.id === sessionKey(state.branch, event.id),
    );
    const marks = saved ? Object.values(saved.marks) : [];
    const archived =
      saved &&
      groupAttendanceRecords([event], [saved], state.branch, event.groupId || '', now).find(
        (r) => r.archiveReason,
      );
    return (
      <Card className="attendance-session-card" key={event.id}>
        <div className="attendance-card-heading">
          <Checkbox
            aria-label={`${event.title} QR kartını seç`}
            checked={selectedIds.includes(event.id)}
            disabled={event.status === 'cancelled'}
            onCheckedChange={(checked) =>
              setSelectedIds((ids) =>
                checked ? [...new Set([...ids, event.id])] : ids.filter((id) => id !== event.id),
              )
            }
          />
          <span>
            {dateTR(eventDate(event.day))} · {event.time}
          </span>
          <StatusBadge>{lessonStatusLabels[lessonWindow(event, now).status]}</StatusBadge>
        </div>
        <h3>{event.title}</h3>
        <p>
          {group?.name || 'Grup belirtilmedi'} · {event.teacher || 'Öğretmen belirtilmedi'}
        </p>
        <div className="attendance-card-meta">
          <span>
            <Icon name="map-pin" />
            {event.room || 'Derslik belirtilmedi'}
          </span>
          <span>{event.duration} dk</span>
        </div>
        <p className="muted">
          {archived
            ? 'Önceki oturumun yoklaması geçmişte korunuyor.'
            : saved
              ? `${marks.filter((m) => m === 'present').length} / ${marks.length} öğrenci katıldı`
              : 'Henüz yoklama kaydedilmedi'}
        </p>
        <div className="attendance-card-actions">
          <Button
            variant="outline"
            size="icon"
            aria-label={`${event.title} QR kodu`}
            title="QR kodunu aç"
            disabled={event.status === 'cancelled'}
            onClick={() => setQrIds([event.id])}
          >
            <QrCode />
          </Button>
          {group && (
            <Button asChild size="sm">
              <Link to={attendanceRoute(event, state.attendanceSessions || [], state.branch)}>
                {archived ? 'Geçmiş yoklamayı aç' : 'Yoklamayı aç'}
                <Icon name="arrow-up-right" />
              </Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openModal({ type: 'event', id: event.id })}
          >
            Ders bilgileri
          </Button>
        </div>
      </Card>
    );
  };
  return (
    <div className="attendance-overview" ref={root}>
      <BulkActionBar
        count={eligibleSelection.length}
        label="Seçili yoklama kartları"
        onClear={() => {
          setSelectedIds([]);
          root.current
            ?.querySelector<HTMLButtonElement>('[role="checkbox"]')
            ?.focus({ preventScroll: true });
        }}
      >
        <Button variant="outline" onClick={() => setQrIds(eligibleSelection)}>
          <QrCode /> Seçili kartları önizle
        </Button>
      </BulkActionBar>
      {qrIds.length > 0 && (
        <AttendanceQrDialog
          events={state.events.filter(
            (event) => qrIds.includes(event.id) && event.status !== 'cancelled',
          )}
          onClose={() => setQrIds([])}
        />
      )}
      <div className="module-toolbar">
        <div>
          <h2>Yoklama merkezi</h2>
          <p className="muted">Takvimdeki dersleri ve kaydedilen katılımları takip edin.</p>
        </div>
        <div className="form-field">
          <Label htmlFor="overview-group">Grup</Label>
          <Select value={groupId || 'all'} onValueChange={(v) => setGroupId(v === 'all' ? '' : v)}>
            <SelectTrigger id="overview-group">
              <SelectValue placeholder="Tüm gruplar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm gruplar</SelectItem>
              {operations.groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Metrics
        items={[
          { label: 'Devam eden ders', value: overview.active.length, highlight: true },
          { label: 'Bugünkü ders', value: overview.today.length },
          { label: 'Yaklaşan ders', value: overview.upcoming.length, detail: 'En yakın 10 ders' },
        ]}
      />
      <section aria-labelledby="active-lessons">
        <h2 className="subsection-title" id="active-lessons">
          Şu anda devam edenler
        </h2>
        {overview.active.length ? (
          <div className="attendance-session-grid">{overview.active.map(card)}</div>
        ) : (
          <EmptyState text="Şu anda devam eden ders bulunmuyor." />
        )}
      </section>
      <section aria-labelledby="today-lessons">
        <h2 className="subsection-title" id="today-lessons">
          Bugünün dersleri
        </h2>
        {overview.today.length ? (
          <div className="attendance-session-grid">{overview.today.map(card)}</div>
        ) : (
          <EmptyState text="Bugün için planlanmış ders bulunmuyor." />
        )}
      </section>
      <section aria-labelledby="upcoming-lessons">
        <h2 className="subsection-title" id="upcoming-lessons">
          Yaklaşan dersler
        </h2>
        {overview.upcoming.length ? (
          <div className="attendance-session-grid">{overview.upcoming.map(card)}</div>
        ) : (
          <EmptyState text="Yaklaşan ders bulunmuyor." />
        )}
      </section>
    </div>
  );
}
