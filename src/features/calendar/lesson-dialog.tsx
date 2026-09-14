import { useState, useRef } from 'react';
import { useWorkspace } from '@/app/workspace-provider';
import { useOperations } from '@/features/operations/operations-provider';
import type { CalendarEvent } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  attendedLessonIssue,
  lessonDraft,
  lessonIssue,
  lessonToEvent,
  type LessonDraft,
} from './lesson-model';
import { toast } from 'sonner';
import { useLearningData } from '@/features/education/learning-catalog';
export function LessonDialog({
  event,
  day,
  onClose,
  fixedGroupId,
  defaultTeacherId,
  initialRange,
}: {
  event?: CalendarEvent;
  day: number;
  onClose: () => void;
  fixedGroupId?: string;
  defaultTeacherId?: string;
  initialRange?: Partial<LessonDraft>;
}) {
  const { state, dispatch } = useWorkspace();
  const { operations } = useOperations();
  const catalog = useLearningData();
  const namedEducation = catalog.educations.filter((item) => item.name === event?.educationId);
  const previousEducation =
    catalog.educations.find((item) => item.id === event?.educationId) ||
    (namedEducation.length === 1 ? namedEducation[0] : undefined);
  const previousEducationId = previousEducation?.id || event?.educationId || '';
  const [draft, setDraft] = useState(() => {
    const draft = lessonDraft(event, day, { fixedGroupId, defaultTeacherId });
    return {
      ...draft,
      ...initialRange,
      educationId: previousEducationId,
      teacherId:
        draft.teacherId ||
        operations.teachers.find((teacher) => teacher.name === event?.teacher)?.id ||
        '',
    };
  });
  const initialDraft = useRef(JSON.stringify(draft));
  const [discard, setDiscard] = useState(false);
  const requestClose = () => {
    if (discard) setDiscard(false);
    else if (JSON.stringify(draft) !== initialDraft.current) {
      setRemove(false);
      setDiscard(true);
    } else onClose();
  };
  const [error, setError] = useState('');
  const [remove, setRemove] = useState(false);
  const patch = (value: Partial<LessonDraft>) => {
    setDraft((old) => ({
      ...old,
      ...(value.date && old.endDate === old.date ? { endDate: value.date } : {}),
      ...value,
    }));
    setError('');
  };
  const choose = (
    key: keyof LessonDraft,
    label: string,
    options: string[][],
    required = false,
    disabled = false,
  ) => (
    <div className="form-field">
      <Label htmlFor={`lesson-${key}`}>
        {label}
        {required ? ' *' : ''}
      </Label>
      <Select
        value={draft[key] || '_none'}
        onValueChange={(value) => patch({ [key]: value === '_none' ? '' : value })}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger id={`lesson-${key}`}>
          <SelectValue placeholder="Seçin" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_none">{required ? 'Seçin' : 'Belirtilmedi'}</SelectItem>
          {options.map(([id, name]) => (
            <SelectItem key={id} value={id}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
  return (
    <Dialog
      open
      onOpenChange={(value) => {
        if (!value) requestClose();
      }}
    >
      <DialogContent preventOutsideClose className="jam-modal dialog-wide">
        <DialogHeader>
          <DialogTitle>
            {discard
              ? 'Değişikliklerden vazgeçilsin mi?'
              : remove
                ? 'Ders silinsin mi?'
                : event
                  ? 'Dersi düzenle'
                  : 'Yeni ders'}
          </DialogTitle>
          <DialogDescription>
            {discard
              ? 'Kaydedilmemiş ders bilgileri var. Düzenlemeye dönebilir veya değişiklikleri silebilirsiniz.'
              : remove
                ? 'Ders programdan kaldırılır. Kaydedilmiş geçmiş yoklamalar korunur.'
                : 'Grup ve ders zamanını belirleyin; ek bilgileri daha sonra tamamlayabilirsiniz.'}
          </DialogDescription>
        </DialogHeader>
        {discard ? (
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscard(false)} autoFocus>
              Düzenlemeye dön
            </Button>
            <Button variant="destructive" onClick={onClose}>
              Değişiklikleri sil
            </Button>
          </DialogFooter>
        ) : remove ? (
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemove(false)}>
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (event) dispatch({ type: 'event/delete', id: event.id });
                toast.success('Ders silindi.');
                onClose();
              }}
            >
              Dersi sil
            </Button>
          </DialogFooter>
        ) : (
          <form
            className="dialog-form"
            onSubmit={(e) => {
              e.preventDefault();
              const issue =
                lessonIssue(draft) ||
                attendedLessonIssue(
                  draft,
                  event,
                  !!event && !!state.attendanceSessions?.some((s) => s.eventId === event.id),
                );
              if (issue) {
                setError(issue);
                return;
              }
              if (
                !operations.groups.some((g) => g.id === draft.groupId) ||
                (fixedGroupId && draft.groupId !== fixedGroupId)
              ) {
                setError('Bu bağlamda geçerli bir grup seçin.');
                return;
              }
              if (
                draft.educationId &&
                draft.educationId !== previousEducationId &&
                !catalog.educations.some((item) => item.id === draft.educationId && item.isActive)
              ) {
                setError('Kayıtlı, aktif bir eğitim seçin.');
                return;
              }
              if (
                draft.studentId &&
                draft.studentId !== String(event?.studentId || '') &&
                !state.students.some((s) => String(s.id) === draft.studentId)
              ) {
                setError('Kayıtlı bir öğrenci seçin.');
                return;
              }
              const group = operations.groups.find((g) => g.id === draft.groupId);
              if (!group) {
                setError('Seçilen grup bulunamadı.');
                return;
              }
              const teacher = operations.teachers.find((t) => t.id === draft.teacherId);
              dispatch({
                type: 'event/save',
                event: lessonToEvent(
                  draft,
                  event?.id || Date.now(),
                  {
                    teacher: teacher?.name || (draft.teacherId ? event?.teacher || '' : ''),
                    room: group.room,
                    studentName: state.students.find((s) => String(s.id) === draft.studentId)?.name,
                  },
                  event,
                ),
              });
              toast.success('Ders kaydedildi.');
              onClose();
            }}
          >
            <div className="dialog-form-body">
              {error && (
                <p role="alert" className="field-error">
                  {error}
                </p>
              )}
              <fieldset className="form-section" data-form-section="required">
                <legend>
                  Ders ve zaman <span>Zorunlu</span>
                </legend>
                <div className="form-grid">
                  {choose(
                    'groupId',
                    'Grup',
                    operations.groups.map((g) => [g.id, g.name]),
                    true,
                    !!event?.groupId || !!fixedGroupId,
                  )}
                  {choose(
                    'type',
                    'Ders tipi',
                    [
                      ['GROUP', 'Grup dersi'],
                      ['PRIVATE', 'Özel ders'],
                    ],
                    true,
                  )}
                  {(['date', 'startTime', 'endDate', 'endTime'] as const).map((key) => (
                    <div className="form-field" key={key}>
                      <Label htmlFor={`lesson-${key}`}>
                        {key === 'date'
                          ? 'Ders tarihi'
                          : key === 'endDate'
                            ? 'Bitiş tarihi'
                            : key === 'startTime'
                              ? 'Başlangıç'
                              : 'Bitiş'}{' '}
                        *
                      </Label>
                      <Input
                        id={`lesson-${key}`}
                        type={key === 'date' || key === 'endDate' ? 'date' : 'time'}
                        required
                        value={draft[key]}
                        onValueChange={(value) => patch({ [key]: value })}
                      />
                    </div>
                  ))}
                </div>
              </fieldset>
              <fieldset className="form-section form-section-optional" data-form-section="optional">
                <legend>
                  Ek bilgiler <span>İsteğe bağlı</span>
                </legend>
                <div className="form-grid">
                  {draft.type === 'PRIVATE' &&
                    choose('studentId', 'Öğrenci', [
                      ...state.students.map((student) => [String(student.id), student.name]),
                      ...(draft.studentId &&
                      !state.students.some((s) => String(s.id) === draft.studentId)
                        ? [[draft.studentId, `Öğrenci #${draft.studentId} · Eski kayıt`]]
                        : []),
                    ])}
                  <div className="form-field">
                    <Label htmlFor="lesson-title">Başlık</Label>
                    <Input
                      id="lesson-title"
                      value={draft.title}
                      placeholder="Ders başlığı"
                      onValueChange={(title) => patch({ title })}
                    />
                  </div>
                  {choose(
                    'teacherId',
                    'Öğretmen',
                    operations.teachers
                      .filter((t) => t.status === 'Aktif' || t.id === draft.teacherId)
                      .map((t) => [t.id, t.name]),
                  )}
                  {choose('educationId', 'Eğitim', [
                    ...catalog.educations
                      .filter((item) => item.isActive || item.id === draft.educationId)
                      .map((item) => [item.id, item.name]),
                    ...(draft.educationId &&
                    !catalog.educations.some((item) => item.id === draft.educationId)
                      ? [
                          [
                            draft.educationId,
                            namedEducation.length > 1
                              ? `${draft.educationId} · Eski kayıt`
                              : 'Kayıtlı eğitim',
                          ],
                        ]
                      : []),
                  ])}
                  {event &&
                    choose(
                      'status',
                      'Durum',
                      [
                        ['active', 'Aktif'],
                        ['cancelled', 'İptal edildi'],
                      ],
                      true,
                    )}
                </div>
              </fieldset>
            </div>
            <DialogFooter>
              {event && (
                <Button
                  type="button"
                  variant="ghost"
                  className="mr-auto"
                  onClick={() => setRemove(true)}
                >
                  Dersi sil
                </Button>
              )}
              <Button type="button" variant="outline" onClick={requestClose}>
                Vazgeç
              </Button>
              <Button type="submit">Dersi kaydet</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
