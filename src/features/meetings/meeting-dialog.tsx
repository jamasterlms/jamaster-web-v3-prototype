import { DialogFooter } from '@/components/ui/dialog';
import { useWorkspace } from '@/app/workspace-provider';
import { Icon } from '@/components/shared/icon';
import { Avatar, IconButton, StatusBadge } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useOperations } from '@/features/operations/operations-provider';
import { useIsMobile } from '@/hooks/use-mobile';
import { navigate } from '@/hooks/use-route';
import { localDate, normalizePhone } from '@/lib/validation';
import { meetingMinimumDate } from '@/lib/calendar';
import type { Student } from '@/types';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { createMeeting, meetingIssue, newMeetingDraft, validateMeeting } from './meeting-model';
import {
  labelFor,
  meetingResults,
  meetingTypes,
  negativeReasonOptions,
  normalizeNegativeReason,
  quickReplies,
  scheduledResults,
} from './meeting-options';
export function MeetingDialog({
  student,
  reportMode = false,
  studentOrder,
  eventId,
}: {
  student: Student;
  reportMode?: boolean;
  studentOrder?: number[];
  eventId?: number;
}) {
  const { state, dispatch, closeModal, openModal } = useWorkspace();
  const mobile = useIsMobile();
  const { save: saveOperation } = useOperations();
  const [draft, setDraft] = useState(() => newMeetingDraft(student.id));
  const [ai, setAI] = useState(false);
  const [tab, setTab] = useState('info');
  const [quick, setQuick] = useState(false);
  const [sms, setSMS] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const committed = useRef(false);
  const issue = submitted ? meetingIssue(draft) : null;
  const validation = issue?.message;
  const errorField = issue?.field;
  const records = state.meetings
    .filter((item) => item.studentId === student.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 7);
  const orderedIds = reportMode
    ? (studentOrder || []).filter((id) => state.students.some((item) => item.id === id))
    : [];
  const studentIndex = orderedIds.indexOf(student.id);
  const hasPrevious = studentIndex > 0;
  const hasNext = studentIndex >= 0 && studentIndex < orderedIds.length - 1;
  const patch = (value: Partial<typeof draft>) => setDraft((current) => ({ ...current, ...value }));
  const nextStudent = (offset: number) => {
    const next = state.students.find((item) => item.id === orderedIds[studentIndex + offset]);
    if (!next) return;
    committed.current = false;
    openModal({
      type: 'meeting',
      id: next.id,
      reportMode: true,
      studentOrder: orderedIds,
    });
  };
  const pending = state.moduleRows['admin/verification-requests/meetings']?.some(
    (row) => row[1] === student.name && row.at(-1) === 'Onay bekliyor',
  );
  const save = () => {
    if (pending || committed.current) return;
    setSubmitted(true);
    const error = validateMeeting(draft);
    if (error) {
      setTab('form');
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    const result = createMeeting(draft, student.name);
    committed.current = true;
    if (result.event) result.event.teacher = student.advisor || 'Atanmadı';
    dispatch({ type: 'meeting/save', ...result, completedEventId: eventId });
    toast.success('Görüşme kaydedildi.');
    if (draft.result === 'SALE') {
      closeModal();
      navigate(`admin/sales/${student.id}`);
    } else if (reportMode && hasNext) nextStudent(1);
    else closeModal();
  };
  return (
    <Tabs
      value={tab}
      onValueChange={setTab}
      className={`meeting-flow ${ai ? 'ai-open' : ''}`}
      data-mobile-tab={tab}
    >
      <div className="meeting-topbar">
        <p>{student.name} ile görüşme kaydı oluştur</p>
        <Button
          variant="outline"
          size="sm"
          className="jamai-toggle"
          aria-pressed={ai}
          onClick={() => setAI(!ai)}
        >
          <Icon name="sparkles" />
          JamAI
          <Icon name={ai ? 'chevron-left' : 'chevron-right'} />
        </Button>
      </div>
      <div className="meeting-mobile-tabs">
        <TabsList>
          <TabsTrigger value="info">Öğrenci bilgileri</TabsTrigger>
          <TabsTrigger value="form">Görüşme formu</TabsTrigger>
          <TabsTrigger value="ai">JamAI</TabsTrigger>
        </TabsList>
      </div>
      {pending && (
        <div className="pending-banner">
          Bu öğrenci için onay bekleyen görüşme talebi bulunuyor. Doğrulama tamamlandıktan sonra
          yeni görüşme kaydedilebilir.
        </div>
      )}
      <form
        ref={formRef}
        className="dialog-form"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
        noValidate
      >
        <div className="dialog-form-body meeting-layout">
          <TabsContent value="info" forceMount className="meeting-info">
            <div className="meeting-person">
              <div className="detail-header">
                <Avatar name={student.name} color={student.color} />
                <div>
                  <h3>{student.name}</h3>
                  <p>Öğrenci no · {student.id}</p>
                </div>
              </div>
              <div className="meeting-info-row">
                <span>Durum</span>
                <StatusBadge>{student.status}</StatusBadge>
              </div>
              <div className="meeting-info-row">
                <span>Telefon</span>
                <span className="meeting-contact">
                  {student.phone}
                  <IconButton
                    icon="message-circle"
                    label="SMS yaz"
                    className="compact"
                    onClick={() => setSMS(true)}
                  />
                </span>
              </div>
              <div className="meeting-info-row">
                <span>Danışman</span>
                <b>{student.advisor || 'Belirtilmedi'}</b>
              </div>
              <div className="meeting-info-row">
                <span>Seviye</span>
                <b>{String(student.profile?.level || 'Belirtilmedi')}</b>
              </div>
              <div className="meeting-info-row">
                <span>E-posta</span>
                <span className="break-all text-xs">{student.email}</span>
              </div>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => openModal({ type: 'student', id: student.id })}
              >
                Öğrenci detayı
                <Icon name="arrow-up-right" />
              </Button>
            </div>
            <h3 className="meeting-section-title">Son görüşmeler</h3>
            {records.length ? (
              records.map((record) => (
                <div className="meeting-history-card" key={record.id}>
                  <div className="meeting-history-heading">
                    <Icon name="phone" />
                    <span>{labelFor(meetingResults, record.result)}</span>
                    <span className="ml-auto">{record.score}/5</span>
                  </div>
                  <p>{record.note || 'Görüşme kaydı oluşturuldu.'}</p>
                  <small>
                    {new Intl.DateTimeFormat('tr-TR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(record.createdAt))}{' '}
                  </small>
                </div>
              ))
            ) : (
              <p className="meeting-history-empty">Henüz görüşme kaydı bulunmuyor.</p>
            )}
          </TabsContent>
          <TabsContent value="form" forceMount className="meeting-form-main">
            <fieldset className="form-section" data-form-section="required">
              <legend>
                Görüşme bilgileri <span>Zorunlu</span>
              </legend>
              <div className="meeting-field">
                <Label>Görüşme tipi *</Label>
                <div
                  className="meeting-types"
                  role="group"
                  aria-label="Görüşme tipi"
                  aria-invalid={errorField === 'type'}
                  tabIndex={-1}
                >
                  {meetingTypes.map(([id, label, icon]) => (
                    <Button
                      type="button"
                      variant="outline"
                      className={`meeting-type ${draft.type === id ? 'active' : ''}`}
                      key={id}
                      aria-pressed={draft.type === id}
                      onClick={() => patch({ type: id })}
                    >
                      <Icon name={icon} />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="meeting-field">
                <Label id="meeting-score-label">Görüşme skoru *</Label>
                <div
                  className="meeting-score"
                  role="group"
                  aria-labelledby="meeting-score-label"
                  aria-invalid={errorField === 'score'}
                  tabIndex={-1}
                >
                  {[1, 2, 3, 4, 5].map((score) => (
                    <Button
                      type="button"
                      key={score}
                      className={`score-button ${draft.score === score ? 'active' : ''}`}
                      variant="outline"
                      aria-label={`${score} / 5 · ${['', 'Aşırı kötü', 'Ortalama altı', 'Ortalama', 'İyi', 'Çok iyi'][score]}`}
                      aria-pressed={draft.score === score}
                      onClick={() => patch({ score })}
                    >
                      {score}
                    </Button>
                  ))}
                  <span className="score-label">
                    {['', 'Aşırı kötü', 'Ortalama altı', 'Ortalama', 'İyi', 'Çok iyi'][draft.score]}
                  </span>
                </div>
              </div>
              <div className="meeting-field">
                <div className="form-field choice-field">
                  <Label htmlFor="meeting-dialog-select-1">{'Sonuç *'}</Label>
                  <Select
                    value={draft.result || undefined}
                    onValueChange={(result) =>
                      patch({
                        result,
                        date: '',
                        reason: '',
                        score: result === 'NEGATIVE' ? 1 : draft.score,
                      })
                    }
                  >
                    <SelectTrigger
                      id="meeting-dialog-select-1"
                      className="filter-select"
                      aria-required="true"
                      aria-invalid={errorField === 'result'}
                      aria-describedby={
                        errorField === 'result' ? 'meeting-result-error' : undefined
                      }
                    >
                      <SelectValue placeholder={'Görüşme sonucunu seçin'} />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {meetingResults.map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errorField === 'result' && (
                    <p id="meeting-result-error" className="field-error" role="alert">
                      {validation}
                    </p>
                  )}
                </div>
              </div>
              {scheduledResults.has(draft.result) && (
                <div className="meeting-field">
                  <Label htmlFor="meeting-datetime">Tarih / saat *</Label>
                  <div className="meeting-date-grid">
                    {Array.from({ length: 7 }, (_, i) => {
                      const nextDate = new Date();
                      nextDate.setDate(nextDate.getDate() + i);
                      const day = nextDate.getDate(),
                        date = localDate(nextDate);
                      return (
                        <button
                          type="button"
                          className={`meeting-date-button ${draft.date.startsWith(date) ? 'active' : ''}`}
                          key={date}
                          aria-pressed={draft.date.startsWith(date)}
                          aria-label={nextDate.toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                          onClick={() =>
                            patch({ date: date + 'T' + (draft.date.split('T')[1] || '09:00') })
                          }
                        >
                          {nextDate.toLocaleDateString('tr-TR', { weekday: 'short' })}
                          <b>{day}</b>
                        </button>
                      );
                    })}
                  </div>
                  <Input
                    id="meeting-datetime"
                    type="datetime-local"
                    min={meetingMinimumDate()}
                    aria-invalid={errorField === 'date'}
                    aria-describedby={errorField === 'date' ? 'meeting-date-error' : undefined}
                    value={draft.date}
                    onChange={(event) => patch({ date: event.target.value })}
                    required
                  />
                  {errorField === 'date' && (
                    <p id="meeting-date-error" className="field-error" role="alert">
                      {validation}
                    </p>
                  )}
                </div>
              )}
            </fieldset>
            <fieldset className="form-section form-section-optional" data-form-section="optional">
              <legend>
                Ek bilgiler <span>İsteğe bağlı</span>
              </legend>
              {draft.result === 'NEGATIVE' && (
                <div className="meeting-field">
                  <div className="form-field choice-field">
                    <Label htmlFor="meeting-dialog-select-2">
                      Olumsuzluk nedeni · İsteğe bağlı
                    </Label>
                    <Select
                      value={normalizeNegativeReason(draft.reason) || '__none'}
                      onValueChange={(reason) =>
                        patch({ reason: reason === '__none' ? '' : reason })
                      }
                    >
                      <SelectTrigger
                        id="meeting-dialog-select-2"
                        className="filter-select"
                        aria-label={'Olumsuz sebep'}
                        aria-invalid={errorField === 'reason'}
                        aria-describedby={
                          errorField === 'reason' ? 'meeting-reason-error' : undefined
                        }
                      >
                        <SelectValue placeholder={'Seçin'} />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectItem value="__none">Belirtilmedi</SelectItem>
                        {negativeReasonOptions.map(([reason, label]) => (
                          <SelectItem key={reason} value={reason}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errorField === 'reason' && (
                      <p id="meeting-reason-error" className="field-error" role="alert">
                        {validation}
                      </p>
                    )}
                  </div>
                </div>
              )}
              <div className="meeting-field">
                <div className="meeting-note-head">
                  <Label htmlFor="meeting-note">
                    Not <span className="muted">(isteğe bağlı)</span>
                  </Label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setQuick(!quick)}>
                    <Icon name="zap" />
                    Hızlı
                  </Button>
                </div>
                <Textarea
                  id="meeting-note"
                  className="meeting-note"
                  value={draft.note}
                  onChange={(event) => patch({ note: event.target.value })}
                  aria-invalid={errorField === 'note'}
                  aria-describedby={
                    errorField === 'note'
                      ? 'meeting-note-count meeting-note-error'
                      : 'meeting-note-count'
                  }
                  maxLength={1500}
                  placeholder="Görüşme hakkında kısa not…"
                />
                {errorField === 'note' && (
                  <p id="meeting-note-error" className="field-error" role="alert">
                    {validation}
                  </p>
                )}
                <span id="meeting-note-count" className="field-counter">
                  {draft.note.length} / 1.500
                </span>
                {quick && (
                  <div className="quick-replies">
                    {quickReplies.map((reply) => (
                      <button
                        type="button"
                        key={reply}
                        onClick={() => {
                          patch({ note: reply });
                          setQuick(false);
                        }}
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </fieldset>
          </TabsContent>
          {(ai || mobile) && (
            <TabsContent value="ai" forceMount asChild>
              <aside className="meeting-jamai">
                <div className="meeting-jamai-header">
                  <Icon name="sparkles" />
                  Görüşme hazırlığı
                </div>
                <p>
                  {student.name}, {student.course} eğitiminde. Devam oranı %{student.attendance};
                  ödeme durumu {student.payment.toLocaleLowerCase('tr')}.
                </p>
                <div className="brief-title">KONUŞMA BAŞLIKLARI</div>
                {[
                  student.attendance < 90
                    ? 'Devam durumunu ve uygun ders saatlerini konuşun.'
                    : 'Eğitimdeki ilerlemeyi ve sonraki hedefleri sorun.',
                  student.payment === 'Tamamlandı'
                    ? 'Yeni dönem beklentilerini değerlendirin.'
                    : 'Uygun ödeme planını birlikte değerlendirin.',
                  'Bir sonraki adımı ve takip tarihini netleştirin.',
                ].map((point, i) => (
                  <div key={point} className="brief-point">
                    <b>{i + 1}</b>
                    <p>{point}</p>
                  </div>
                ))}
                <div className="brief-title">GÖRÜŞME AÇILIŞI</div>
                <div className="opening-message">
                  Merhaba {student.name.split(' ')[0]}, eğitim sürecinizin nasıl ilerlediğini
                  konuşmak ve size yardımcı olmak için arıyorum.
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        `Merhaba ${student.name.split(' ')[0]}, eğitim sürecinizin nasıl ilerlediğini konuşmak ve size yardımcı olmak için arıyorum.`,
                      );
                      toast('Metin kopyalandı.');
                    } catch {
                      toast('Kopyalamak için metni seçebilirsiniz.');
                    }
                  }}
                >
                  <Icon name="copy" />
                  Metni kopyala
                </Button>
              </aside>
            </TabsContent>
          )}
        </div>
        <DialogFooter className="meeting-footer">
          <span className="meeting-footer-info">
            <Icon name="lock-keyhole" className="small" />
            Öğrenci geçmişine kaydedilir
          </span>
          {reportMode && (
            <>
              <IconButton
                icon="chevron-left"
                label="Önceki öğrenci"
                disabled={!hasPrevious}
                onClick={() => nextStudent(-1)}
              />
              <IconButton
                icon="chevron-right"
                label="Sonraki öğrenci"
                disabled={!hasNext}
                onClick={() => nextStudent(1)}
              />
            </>
          )}
          <Button type="button" variant="outline" onClick={closeModal}>
            İptal
          </Button>
          <Button type="submit" disabled={pending}>
            <Icon name="check" />
            {reportMode && hasNext ? 'Kaydet ve ilerle' : 'Kaydet'}
          </Button>
        </DialogFooter>
      </form>
      <Dialog open={sms} onOpenChange={setSMS}>
        <DialogContent className="jam-modal">
          <DialogHeader>
            <DialogTitle>Hızlı SMS</DialogTitle>
            <DialogDescription>
              {student.name} · {student.phone}
            </DialogDescription>
          </DialogHeader>
          <form
            className="dialog-form"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              saveOperation({
                type: 'save',
                collection: 'messages',
                record: {
                  id: crypto.randomUUID(),
                  channel: 'sms',
                  title:
                    String(data.get('title') || '').trim() ||
                    String(data.get('message')).trim().slice(0, 48),
                  body: String(data.get('message')).trim(),
                  recipient: student.name,
                  recipientMode: 'single',
                  recipientAddress: normalizePhone(String(data.get('phone'))),
                  date: localDate(),
                  status: 'Taslak',
                  template: false,
                },
              });
              toast.success('SMS taslağı kaydedildi.');
              setSMS(false);
            }}
          >
            <div className="dialog-form-body">
              <fieldset className="form-section" data-form-section="required">
                <legend>
                  Alıcı ve mesaj <span>Zorunlu</span>
                </legend>
                <div className="form-field">
                  <Label htmlFor="quick-sms-phone">Telefon *</Label>
                  <Input
                    id="quick-sms-phone"
                    name="phone"
                    type="tel"
                    required
                    defaultValue={student.phone}
                  />
                </div>
                <div className="form-field">
                  <Label htmlFor="sms-note">Mesaj *</Label>
                  <Textarea id="sms-note" name="message" required minLength={10} maxLength={300} />
                  <p className="field-hint">10–300 karakter</p>
                </div>
              </fieldset>
              <fieldset className="form-section form-section-optional" data-form-section="optional">
                <legend>
                  Taslak bilgisi <span>İsteğe bağlı</span>
                </legend>
                <div className="form-field">
                  <Label htmlFor="quick-sms-title">Taslak adı</Label>
                  <Input id="quick-sms-title" name="title" minLength={2} maxLength={160} />
                  <p className="field-hint">Alıcıya gönderilmez.</p>
                </div>
              </fieldset>
            </div>
            <DialogFooter className="form-actions">
              <Button type="button" variant="outline" onClick={() => setSMS(false)}>
                Görüşmeye dön
              </Button>
              <Button type="submit">Taslağı kaydet</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
