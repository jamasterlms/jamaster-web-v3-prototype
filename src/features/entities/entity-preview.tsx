import { lessonWindow } from '@/features/calendar/attendance-model';
import { useMemberships } from '@/features/education/use-memberships';
import { useDisplay } from '@/app/display-provider';
import { useWorkspace } from '@/app/workspace-provider';
import { Avatar, EmptyState, StatusBadge } from '@/components/shared/primitives';
import { Icon } from '@/components/shared/icon';
import { Button } from '@/components/ui/button';
import { operationalData } from '@/data/institution';
import { useOperations } from '@/features/operations/operations-provider';
import { StudentDetail } from '@/features/students/student-dialogs';
import { scopedCalendarEvents, eventDate } from '@/lib/calendar';
import { Link } from 'react-router-dom';
import { entityPath, identifyTeamRows } from './entity-model';
export function EntityPreview() {
  const memberships = useMemberships();
  const {
    preview,
    setPreview,
    setMobileOpen,
    previewIndex,
    previewCount,
    previousPreview,
    nextPreview,
  } = useDisplay();
  const { state, openModal } = useWorkspace();
  const { operations } = useOperations();
  if (!preview) return null;
  const student =
    preview.kind === 'students'
      ? state.students.find((s) => String(s.id) === preview.id)
      : undefined;
  const group =
    preview.kind === 'groups' ? operations.groups.find((g) => g.id === preview.id) : undefined;
  const teacher =
    preview.kind === 'teachers' ? operations.teachers.find((t) => t.id === preview.id) : undefined;
  const row = ['staff', 'users'].includes(preview.kind)
    ? identifyTeamRows(
        state.moduleRows[preview.kind] || operationalData[preview.kind].rows,
        preview.kind,
      ).find((r) => r[5] === preview.id)
    : undefined;
  const name = student?.name || group?.name || teacher?.name || row?.[0];
  const path = entityPath(preview);
  const related = scopedCalendarEvents(
    state.events,
    group ? { groupId: group.id } : teacher ? { teacherId: teacher.id } : { groupId: '__none__' },
    operations.teachers,
  )
    .filter((e) => ['active', 'pending'].includes(lessonWindow(e, Date.now()).status))
    .sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
  return (
    <div className="entity-preview" aria-label="Hızlı önizleme">
      <div className="preview-heading daily-header">
        <div className="preview-history-controls">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Önceki önizleme"
            title="Önceki önizleme"
            disabled={previewIndex <= 0}
            onClick={previousPreview}
          >
            <Icon name="chevron-left" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sonraki önizleme"
            title="Sonraki önizleme"
            disabled={previewIndex >= previewCount - 1}
            onClick={nextPreview}
          >
            <Icon name="chevron-right" />
          </Button>
        </div>
        <span>
          Önizleme{' '}
          <small aria-live="polite">
            {previewIndex + 1} / {previewCount}
          </small>
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Önizlemeyi kapat"
          onClick={() => {
            setPreview(null);
          }}
        >
          <Icon name="x" />
        </Button>
      </div>
      <div className="preview-scroll">
        {!name ? (
          <EmptyState text="Kayıt bulunamadı." />
        ) : (
          <>
            {student ? (
              <StudentDetail student={student} />
            ) : (
              <>
                <div className="detail-header">
                  <Avatar name={name} src={teacher?.image} />
                  <div>
                    <h3>{name}</h3>
                    <StatusBadge>{group?.status || teacher?.status || row?.[4] || ''}</StatusBadge>
                  </div>
                </div>
                <dl className="preview-facts">
                  {(group
                    ? [
                        ['Eğitim', group.course],
                        ['Öğretmen', group.teacher],
                        ['Derslik', group.room || 'Belirlenmedi'],
                        [
                          'Doluluk',
                          `${memberships.membersOf(group.id).length} / ${group.capacity}`,
                        ],
                      ]
                    : teacher
                      ? [
                          ['Uzmanlık', teacher.specialty || 'Belirtilmedi'],
                          ['E-posta', teacher.email],
                          ['Telefon', teacher.phone],
                        ]
                      : [
                          ['Görev', row?.[preview.kind === 'users' ? 2 : 1]],
                          ['Şube / iletişim', row?.[preview.kind === 'users' ? 1 : 2]],
                          ['Telefon', row?.[6]],
                        ]
                  ).map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value || 'Belirtilmedi'}</dd>
                    </div>
                  ))}
                </dl>
                {teacher && (
                  <div className="preview-actions">
                    <Button variant="outline" asChild>
                      <a href={`tel:${teacher.phone}`}>
                        <Icon name="phone" />
                        Ara
                      </a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href={`mailto:${teacher.email}`}>
                        <Icon name="mail" />
                        E-posta
                      </a>
                    </Button>
                  </div>
                )}
                {group && (
                  <>
                    <h4>Öğrenciler</h4>
                    <div className="preview-members">
                      {memberships
                        .membersOf(group.id)
                        .slice(0, 5)
                        .map((s) => (
                          <Link key={s.id} to={`/admin/students/${s.id}`}>
                            {s.name}
                            <Icon name="chevron-right" />
                          </Link>
                        ))}
                    </div>
                  </>
                )}
                {(group || teacher) && (
                  <>
                    <h4>Yaklaşan dersler</h4>
                    {related.slice(0, 3).map((e) => (
                      <Button
                        key={e.id}
                        className="preview-event"
                        variant="ghost"
                        onClick={() => openModal({ type: 'event', id: e.id })}
                      >
                        <span>
                          {e.title}
                          <small>
                            {eventDate(e.day).toLocaleDateString('tr-TR')} · {e.time}
                          </small>
                        </span>
                        <Icon name="arrow-up-right" />
                      </Button>
                    ))}
                    {!related.length && <p className="field-hint">Planlanmış ders bulunmuyor.</p>}
                  </>
                )}
                <Button variant="outline" asChild>
                  <Link
                    data-full-page
                    to={`${path}?edit=1`}
                    onClick={() => {
                      setPreview(null);
                      setMobileOpen(false);
                    }}
                  >
                    <Icon name="pencil" />
                    Bilgileri düzenle
                  </Link>
                </Button>
              </>
            )}
          </>
        )}
      </div>
      {name && (
        <div className="preview-footer">
          <Button className="preview-full-page" asChild>
            <Link
              data-full-page
              to={path}
              onClick={() => {
                setPreview(null);
                setMobileOpen(false);
              }}
            >
              Detay sayfasını aç
              <Icon name="arrow-up-right" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
