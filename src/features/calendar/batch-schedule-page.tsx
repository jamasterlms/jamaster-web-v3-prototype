import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useWorkspace } from '@/app/workspace-provider';
import { useOperations } from '@/features/operations/operations-provider';
import { useLearningData } from '@/features/education/learning-catalog';
import { GroupDetailNavigation } from '@/features/education/detail-navigation';
import { financeRecords } from '@/features/finance/finance-model';
import { Icon } from '@/components/shared/icon';
import { IconButton, PageHeading, StatusBadge } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { usePageState } from '@/hooks/use-page-state';
import { eventDate } from '@/lib/calendar';
import { isDate, localDate } from '@/lib/validation';
import type { CalendarEvent } from '@/types';
import { lessonToEvent } from './lesson-model';
import {
  batchEventIssue,
  batchScheduleDraft,
  generateBatchSchedule,
  scheduleConflicts,
  scheduleMonday,
  scheduleWeekdays,
  type BatchScheduleDraft,
  type ScheduleDay,
} from './batch-schedule-model';

const dateLabel = (date: string) =>
  isDate(date)
    ? new Date(`${date}T12:00:00`).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Tarih seçin';

export function BatchSchedulePage({ groupId }: { groupId: string }) {
  const { state, dispatch } = useWorkspace(),
    { operations } = useOperations(),
    catalog = useLearningData();
  const [params] = useSearchParams(),
    navigate = useNavigate();
  const saleId = params.get('saleId') || '';
  const group = operations.groups.find((g) => g.id === groupId);
  const sale = saleId ? financeRecords(state).sales.find((s) => s.id === saleId) : undefined;
  const student = sale && state.students.find((s) => s.id === sale.studentId);
  const [draft, setDraft] = usePageState<BatchScheduleDraft>(
    `batch-schedule:${saleId || 'group'}`,
    () => batchScheduleDraft(localDate(), !!saleId),
  );
  const [excludedDate, setExcludedDate] = useState(''),
    [error, setError] = useState('');
  const [preview, setPreview] = useState<CalendarEvent[] | null>(null),
    [reviewed, setReviewed] = useState(false);
  const [discard, setDiscard] = useState(false);
  const submitting = useRef(false);
  const root = `/admin/groups/${encodeURIComponent(groupId)}/schedule`;
  const teacher = operations.teachers.find((t) => t.id === draft.teacherId);
  const education = catalog.educations.find((e) => e.id === draft.educationId);
  const contextIssue = !group
    ? 'Grup bulunamadı.'
    : !state.branch
      ? 'Önce şube seçin.'
      : group.status === 'Pasif'
        ? 'Pasif gruba yeni ders programı eklenemez.'
        : saleId && (!sale || !student)
          ? 'Bağlı satış veya öğrenci bulunamadı. Satış kaydından yeniden açın.'
          : draft.teacherId && (!teacher || teacher.status === 'Pasif')
            ? 'Seçilen öğretmen artık aktif değil. Başka bir öğretmen seçin veya alanı temizleyin.'
            : draft.educationId && (!education || !education.isActive)
              ? 'Seçilen eğitim artık aktif değil. Başka bir eğitim seçin veya alanı temizleyin.'
              : '';
  const set = <K extends keyof BatchScheduleDraft>(key: K, value: BatchScheduleDraft[K]) => {
    setDraft({ ...draft, [key]: value });
    setError('');
  };
  const setDay = (index: number, next: ScheduleDay) =>
    set(
      'days',
      draft.days.map((day, i) => (i === index ? next : day)),
    );
  const previewIssue = preview ? contextIssue || batchEventIssue(preview, state.events) : '';
  const conflicts =
    preview?.filter((event) => scheduleConflicts(event, state.events).length > 0) || [];
  const conflictIds = new Set(conflicts.map((e) => e.id));
  const conflictSignature = conflicts
    .map((event) =>
      scheduleConflicts(event, state.events)
        .map((other) => `${event.id}:${other.id}:${other.day}:${other.time}:${other.duration}`)
        .join(','),
    )
    .join('|');
  useEffect(() => setReviewed(false), [conflictSignature, preview]);
  const reset = () => setDraft(batchScheduleDraft(localDate(), !!saleId));
  const generate = () => {
    if (contextIssue) {
      setError(contextIssue);
      return;
    }
    const result = generateBatchSchedule(draft);
    if (result.error) {
      setError(result.error);
      return;
    }
    const firstId = state.events.reduce((max, event) => Math.max(max, event.id + 1), Date.now());
    const events = result.lessons.map((lesson, i) =>
      lessonToEvent(
        {
          ...lesson,
          groupId,
          date: lesson.date,
          endDate: lesson.date,
          type: draft.type,
          title: `${education?.name || group!.course} · ${group!.level}`,
          teacherId: draft.teacherId,
          educationId: draft.educationId,
          studentId: draft.type === 'PRIVATE' && student ? String(student.id) : '',
          status: 'active',
        },
        firstId + i,
        { teacher: teacher?.name || '', room: group!.room, studentName: student?.name },
      ),
    );
    const issue = batchEventIssue(events, state.events);
    if (issue) {
      setError(issue);
      return;
    }
    submitting.current = false;
    setError('');
    setReviewed(false);
    setPreview(events);
  };
  return (
    <>
      <Button asChild variant="ghost">
        <Link to={root}>
          <Icon name="arrow-left" />
          Ders programına dön
        </Link>
      </Button>
      <PageHeading
        title={group ? `${group.name} · Program oluştur` : 'Grup bulunamadı'}
        description="Haftalık ders saatlerini belirleyin, tarihleri kontrol edin ve programı topluca kaydedin."
      />
      {group && (
        <>
          <GroupDetailNavigation id={groupId} />
          {contextIssue && (
            <p className="pending-banner" role="alert">
              {contextIssue}
            </p>
          )}
          {sale && student && (
            <p className="pending-banner">
              {student.name} · {sale.course} satışına bağlı program. Kayıtlı haftalık tercihler
              bulunmadığından gün ve saatleri seçin.
            </p>
          )}
          <form
            className="batch-schedule-form"
            onSubmit={(e) => {
              e.preventDefault();
              generate();
            }}
          >
            <fieldset className="form-section" data-form-section="required">
              <legend>
                Program ve ders saatleri <span>Zorunlu</span>
              </legend>
              <div className="form-grid">
                <div className="form-field">
                  <Label htmlFor="batch-start">Başlangıç haftası *</Label>
                  <Input
                    id="batch-start"
                    type="date"
                    value={draft.weekStartDate}
                    onChange={(e) => set('weekStartDate', e.target.value)}
                    required
                    placeholder="Başlangıç tarihini seçin"
                    aria-describedby="batch-monday"
                  />
                  <p id="batch-monday" className="muted text-xs">
                    Hafta başlangıcı: {dateLabel(scheduleMonday(draft.weekStartDate))} · Pazartesi
                  </p>
                </div>
                <div className="form-field">
                  <Label htmlFor="batch-weeks">Hafta sayısı *</Label>
                  <Input
                    id="batch-weeks"
                    type="number"
                    min={1}
                    max={52}
                    step={1}
                    value={Number.isFinite(draft.weekCount) ? draft.weekCount : ''}
                    onChange={(e) =>
                      set('weekCount', e.target.value === '' ? NaN : Number(e.target.value))
                    }
                    required
                    placeholder="1–52 hafta"
                  />
                </div>
                <div className="form-field">
                  <Label htmlFor="batch-type">Ders tipi *</Label>
                  <Select
                    value={draft.type}
                    onValueChange={(value) => set('type', value as BatchScheduleDraft['type'])}
                  >
                    <SelectTrigger id="batch-type">
                      <SelectValue placeholder="Ders tipini seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GROUP">Grup dersi</SelectItem>
                      <SelectItem value="PRIVATE">Özel ders</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="schedule-days">
                {draft.days.map((day, dayIndex) => (
                  <div
                    key={day.dayId}
                    className={`batch-schedule-day ${day.isSelected ? 'selected' : ''}`}
                  >
                    <div className="schedule-day-header">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`batch-day-${day.dayId}`}
                          checked={day.isSelected}
                          onCheckedChange={(checked) =>
                            setDay(dayIndex, {
                              ...day,
                              isSelected: checked === true,
                              lessons:
                                checked && !day.lessons.length
                                  ? [{ startTime: '', endTime: '' }]
                                  : day.lessons,
                            })
                          }
                        />
                        <Label htmlFor={`batch-day-${day.dayId}`}>
                          {scheduleWeekdays[day.dayId - 1]}
                        </Label>
                      </div>
                      {day.isSelected && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setDay(dayIndex, {
                              ...day,
                              lessons: [...day.lessons, { startTime: '', endTime: '' }],
                            })
                          }
                        >
                          <Icon name="plus" />
                          Saat ekle
                        </Button>
                      )}
                    </div>
                    {day.isSelected && (
                      <div className="schedule-day-slots">
                        {day.lessons.length === 0 && (
                          <p className="muted text-sm">Bu gün için bir ders saati ekleyin.</p>
                        )}
                        {day.lessons.map((slot, slotIndex) => (
                          <div className="schedule-time-slot" key={slotIndex}>
                            {(['startTime', 'endTime'] as const).map((key) => (
                              <div className="form-field" key={key}>
                                <Label htmlFor={`batch-${day.dayId}-${slotIndex}-${key}`}>
                                  {key === 'startTime' ? 'Başlangıç' : 'Bitiş'} *
                                </Label>
                                <Input
                                  id={`batch-${day.dayId}-${slotIndex}-${key}`}
                                  type="time"
                                  step={60}
                                  value={slot[key]}
                                  placeholder={key === 'startTime' ? '09:00' : '10:00'}
                                  required
                                  aria-label={`${scheduleWeekdays[day.dayId - 1]}, ${slotIndex + 1}. ders ${key === 'startTime' ? 'başlangıç' : 'bitiş'} saati`}
                                  onChange={(e) =>
                                    setDay(dayIndex, {
                                      ...day,
                                      lessons: day.lessons.map((item, i) =>
                                        i === slotIndex ? { ...item, [key]: e.target.value } : item,
                                      ),
                                    })
                                  }
                                />
                              </div>
                            ))}
                            <IconButton
                              icon="trash2"
                              label={`${scheduleWeekdays[day.dayId - 1]}, ${slotIndex + 1}. saati kaldır`}
                              onClick={() =>
                                setDay(dayIndex, {
                                  ...day,
                                  lessons: day.lessons.filter((_, i) => i !== slotIndex),
                                })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </fieldset>
            <fieldset className="form-section form-section-optional" data-form-section="optional">
              <legend>
                Atamalar ve hariç tarihler <span>İsteğe bağlı</span>
              </legend>
              <p className="form-section-description">
                Öğretmen ve eğitim atamasını daha sonra tamamlayabilirsiniz. Seçtiğiniz tatil
                günlerinde ders oluşturulmaz.
              </p>
              <div className="form-grid">
                <div className="form-field">
                  <Label htmlFor="batch-teacher">Öğretmen</Label>
                  <Select
                    value={draft.teacherId || 'none'}
                    onValueChange={(value) => set('teacherId', value === 'none' ? '' : value)}
                  >
                    <SelectTrigger id="batch-teacher">
                      <SelectValue placeholder="Öğretmen seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Atanmadı</SelectItem>
                      {operations.teachers
                        .filter((t) => t.status !== 'Pasif')
                        .map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="form-field">
                  <Label htmlFor="batch-education">Eğitim</Label>
                  <Select
                    value={draft.educationId || 'none'}
                    onValueChange={(value) => set('educationId', value === 'none' ? '' : value)}
                  >
                    <SelectTrigger id="batch-education">
                      <SelectValue placeholder="Eğitim seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Belirtilmedi</SelectItem>
                      {catalog.educations
                        .filter((e) => e.isActive)
                        .map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="form-field">
                <Label htmlFor="batch-excluded">Hariç tutulacak tarih</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    className="min-w-0 flex-1"
                    id="batch-excluded"
                    type="date"
                    value={excludedDate}
                    placeholder="Tatil veya ara tarihini seçin"
                    onChange={(e) => setExcludedDate(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!isDate(excludedDate) || draft.excludeDates.includes(excludedDate)}
                    onClick={() => {
                      set('excludeDates', [...draft.excludeDates, excludedDate].sort());
                      setExcludedDate('');
                    }}
                  >
                    <Icon name="plus" />
                    Ekle
                  </Button>
                </div>
              </div>
              <div className="excluded-dates">
                {draft.excludeDates.length ? (
                  draft.excludeDates.map((date) => (
                    <span className="excluded-date" key={date}>
                      {dateLabel(date)}
                      <IconButton
                        icon="x"
                        label={`${dateLabel(date)} tarihini hariç tutulanlardan kaldır`}
                        onClick={() =>
                          set(
                            'excludeDates',
                            draft.excludeDates.filter((d) => d !== date),
                          )
                        }
                      />
                    </span>
                  ))
                ) : (
                  <p className="muted text-sm">Hariç tutulan tarih yok.</p>
                )}
              </div>
            </fieldset>
            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}
            <div className="batch-form-footer">
              <p className="muted text-sm">
                {draft.days.filter((d) => d.isSelected).reduce((n, d) => n + d.lessons.length, 0)}{' '}
                ders / hafta · {Number.isInteger(draft.weekCount) ? draft.weekCount : '—'} hafta
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => setDiscard(true)}>
                  Taslağı temizle
                </Button>
                <Button type="submit" disabled={!!contextIssue}>
                  <Icon name="eye" />
                  Programı önizle
                </Button>
              </div>
            </div>
          </form>
        </>
      )}
      <Dialog
        open={!!preview}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent className="jam-modal wide" preventOutsideClose>
          <DialogHeader>
            <DialogTitle>Ders programını kontrol edin</DialogTitle>
            <DialogDescription>
              {preview?.length || 0} ders · {group?.name} ·{' '}
              {draft.type === 'PRIVATE' ? 'Özel ders' : 'Grup dersi'}
            </DialogDescription>
          </DialogHeader>
          <div className="dialog-form-body">
            <div className="schedule-preview-summary">
              <span>Öğretmen: {teacher?.name || 'Atanmadı'}</span>
              <span>Eğitim: {education?.name || 'Belirtilmedi'}</span>
              <span>Derslik: {group?.room || 'Belirtilmedi'}</span>
              {draft.type === 'PRIVATE' && student && <span>Öğrenci: {student.name}</span>}
            </div>
            {previewIssue && (
              <p role="alert" className="field-error">
                {previewIssue}
              </p>
            )}
            {!!conflicts.length && (
              <p className="pending-banner">
                {conflicts.length} ders, mevcut programda aynı grup, öğretmen veya öğrencinin
                saatiyle çakışıyor. İşaretli derslerin saatlerini kontrol edin.
              </p>
            )}
            <DataTable
              name={`batch-${groupId}-preview`}
              data={preview || []}
              getRowId={(e) => String(e.id)}
              columns={[
                {
                  id: 'date',
                  header: 'Tarih',
                  accessorFn: (e) => e.day,
                  cell: ({ row }) => dateLabel(localDate(eventDate(row.original.day))),
                },
                { accessorKey: 'time', header: 'Başlangıç' },
                {
                  id: 'end',
                  header: 'Bitiş',
                  accessorFn: (e) =>
                    new Date(e.endTime!).toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                },
                { accessorKey: 'duration', header: 'Süre (dk)' },
                {
                  id: 'check',
                  header: 'Kontrol',
                  cell: ({ row }) => (
                    <StatusBadge>
                      {conflictIds.has(row.original.id) ? 'Çakışma' : 'Uygun'}
                    </StatusBadge>
                  ),
                },
              ]}
              mobileCard={(event) => (
                <>
                  <strong>{dateLabel(localDate(eventDate(event.day)))}</strong>
                  <p>
                    {event.time} · {event.duration} dakika
                  </p>
                  <StatusBadge>{conflictIds.has(event.id) ? 'Çakışma' : 'Uygun'}</StatusBadge>
                </>
              )}
            />
            {!!conflicts.length && (
              <div className="flex items-start gap-3 mt-4">
                <Checkbox
                  id="batch-conflicts-reviewed"
                  checked={reviewed}
                  onCheckedChange={(value) => setReviewed(value === true)}
                />
                <Label htmlFor="batch-conflicts-reviewed">
                  Çakışan saatleri kontrol ettim, bu dersleri de oluşturmak istiyorum.
                </Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreview(null)}>
              Düzenlemeye dön
            </Button>
            <Button
              disabled={!!previewIssue || (!!conflicts.length && !reviewed)}
              onClick={() => {
                if (
                  !preview ||
                  submitting.current ||
                  previewIssue ||
                  (conflicts.length && !reviewed)
                )
                  return;
                submitting.current = true;
                dispatch({ type: 'schedule/batch-create', events: preview });
                toast.success(`${preview.length} ders programınıza eklendi.`);
                reset();
                setPreview(null);
                navigate(`${root}?date=${localDate(eventDate(preview[0].day))}`);
              }}
            >
              Programı kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={discard} onOpenChange={setDiscard}>
        <DialogContent className="jam-modal" preventOutsideClose>
          <DialogHeader>
            <DialogTitle>Program taslağını temizle</DialogTitle>
            <DialogDescription>
              Seçtiğiniz günler, saatler ve hariç tutulan tarihler sıfırlanacak. Kaydedilmiş dersler
              etkilenmez.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscard(false)}>
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                reset();
                setExcludedDate('');
                setError('');
                setDiscard(false);
              }}
            >
              Taslağı temizle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
