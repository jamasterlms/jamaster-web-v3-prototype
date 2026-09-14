import { useWorkspace } from '@/app/workspace-provider';
import { PageNavigation } from '@/components/navigation/page-navigation';
import { PageHeading } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { createMeeting } from '@/features/meetings/meeting-model';
import { usePageState } from '@/hooks/use-page-state';
import { navigate } from '@/hooks/use-route';
import { useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { emptyRegistration, type RegistrationDraft } from './registration-model';
import { RegistrationFields, registrationStepFields } from './registration-fields';
import { RegistrationReview } from './registration-review';
import { studentDraft, studentFromDraft } from './student-model';
import { useRegistrationValidation } from './use-registration-validation';
import { normalizePhone, parsePhone } from '@/lib/validation';

export function RegistrationPage() {
  const { state, dispatch } = useWorkspace();
  const [params] = useSearchParams();
  const requestedStudentId = params.get('studentId');
  const requestedId = Number(requestedStudentId);
  const invalidStudentId =
    requestedStudentId !== null &&
    (!Number.isInteger(requestedId) ||
      !state.students.some((student) => student.id === requestedId));
  const existing =
    requestedStudentId !== null && !invalidStudentId
      ? state.students.find((student) => student.id === requestedId)
      : undefined;
  const requestedPhone = params.get('phone')?.trim() || '';
  const phonePrefill = parsePhone(requestedPhone) ? normalizePhone(requestedPhone) : '';
  const draftScope = existing
    ? `existing-${existing.id}`
    : requestedPhone
      ? `phone-${encodeURIComponent(phonePrefill || requestedPhone)}`
      : 'new';
  const initialDraft = useMemo(
    () => (existing ? studentDraft(existing) : { ...emptyRegistration, phone: phonePrefill }),
    [existing, phonePrefill],
  );
  const [savedStep, setStep] = usePageState(`registration-step:${draftScope}`, 0);
  const [savedDraft, setDraft] = usePageState<RegistrationDraft>(
    `registration-draft:${draftScope}`,
    initialDraft,
  );
  const draft = { ...emptyRegistration, ...savedDraft };
  const step = Number.isInteger(savedStep) ? Math.max(0, Math.min(3, savedStep)) : 0;
  const [visited, setVisited] = usePageState(`registration-visited:${draftScope}`, step);
  const validation = useRegistrationValidation(draft, state.students, existing?.id);
  const committed = useRef(false);
  useEffect(() => {
    validation.setErrors({});
    committed.current = false;
  }, [draftScope]);
  const patch = (value: Partial<RegistrationDraft>) =>
    setDraft((previous) => ({ ...emptyRegistration, ...previous, ...value }));
  const move = (next: number) => {
    setStep(next);
    setVisited((current) => Math.max(current, next));
    requestAnimationFrame(() => document.getElementById('registration-step-title')?.focus());
  };
  const submit = () => {
    if (committed.current) return;
    const errors = validation.validate(step === 3 ? undefined : registrationStepFields[step]);
    if (Object.keys(errors).length) {
      const invalidStep = registrationStepFields.findIndex((keys) =>
        keys.some((key) => errors[key]),
      );
      if (step === 3) setStep(Math.max(0, invalidStep));
      validation.focusError();
      return;
    }
    if (step < 3) {
      move(step + 1);
      return;
    }
    const parsed = validation.parse();
    if (!parsed.success) return;
    committed.current = true;
    const data = parsed.data;
    const id = existing?.id ?? Math.max(0, ...state.students.map((s) => s.id)) + 1;
    dispatch({ type: 'student/save', student: studentFromDraft(data, id, existing) });
    dispatch({
      type: 'meeting/save',
      ...createMeeting(
        {
          studentId: id,
          type: data.meetingType,
          score: data.meetingScore,
          result: data.meetingResult,
          date: data.meetingDate,
          reason: data.negativeReason,
          note: data.meetingNote,
        },
        data.name,
      ),
    });
    setDraft({ ...emptyRegistration });
    setStep(0);
    setVisited(0);
    toast.success(
      existing ? 'Öğrenci ve görüşme bilgileri kaydedildi.' : 'Öğrenci kaydı oluşturuldu.',
    );
    navigate(data.meetingResult === 'SALE' ? `admin/sales/${id}` : `admin/students/${id}`);
  };
  const titles = ['Kişisel bilgiler', 'Eğitim bilgileri', 'Görüşme sonucu', 'Önizleme'];
  const parsed = step === 3 ? validation.parse() : undefined;
  if (invalidStudentId)
    return (
      <>
        <PageHeading
          title="Öğrenci bulunamadı"
          description="Bağlantıdaki öğrenci numarası mevcut bir kayıtla eşleşmiyor."
        />
        <Button asChild>
          <Link to="/admin/students">Öğrenci listesine dön</Link>
        </Button>
      </>
    );
  return (
    <>
      <PageHeading
        title={existing ? `${existing.name} · Kayıt ve görüşme` : 'Yeni öğrenci kaydı'}
        description="Kişisel bilgiler, eğitim tercihleri ve görüşme tek bir akışta."
      />
      <PageNavigation
        items={[
          { to: '/admin/students', label: 'Aktif öğrenciler' },
          { to: '/admin/students/past', label: 'Geçmiş öğrenciler' },
          { to: '/admin/students/potential', label: 'Potansiyel' },
          { to: '/admin/students/register', label: 'Kayıt oluştur' },
        ]}
      />
      <ol className="registration-steps" aria-label="Kayıt adımları">
        {titles.map((title, index) => (
          <li key={title} aria-current={step === index ? 'step' : undefined}>
            <Button
              type="button"
              variant={step === index ? 'default' : 'ghost'}
              disabled={index > Math.max(step, visited)}
              onClick={() => move(index)}
            >
              {index + 1}
              <span>{title}</span>
            </Button>
          </li>
        ))}
      </ol>
      {!!validation.matches.length && (
        <div className="form-error-summary registration-existing-match" role="alert">
          <div>
            <b>Bu iletişim bilgileriyle kayıtlı öğrenci bulundu.</b>
            <p>Yeni öğrenci oluşturmadan mevcut kayıtla devam edin.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ...new Map(
                validation.matches.map((match) => [match.student.id, match.student]),
              ).values(),
            ].map((student) => (
              <Button
                key={student.id}
                type="button"
                variant="outline"
                onClick={() => {
                  navigate(`admin/students/register?studentId=${student.id}`);
                }}
              >
                {student.name} · Kaydı seç
              </Button>
            ))}
          </div>
        </div>
      )}
      <form
        noValidate
        ref={validation.formRef}
        className="dialog-form module-form registration-form"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="form-section-heading">
          <div>
            <span className="eyebrow">ADIM {step + 1} / 4</span>
            <h2 id="registration-step-title" tabIndex={-1}>
              {titles[step]}
            </h2>
          </div>
          <p>
            {step === 3
              ? 'Kaydetmeden önce bilgileri kontrol edin.'
              : '* işaretli alanlar zorunludur.'}
          </p>
        </div>
        {Object.values(validation.errors).some(Boolean) && (
          <div className="form-error-summary" role="alert">
            İşaretli alanları kontrol edin. Bilgileriniz korunuyor.
          </div>
        )}
        {step < 3 ? (
          <RegistrationFields
            section={step}
            draft={draft}
            patch={patch}
            errors={validation.errors}
            validateField={validation.validateField}
          />
        ) : (
          <RegistrationReview draft={parsed?.success ? parsed.data : draft} onEdit={move} />
        )}
        <div className="form-actions registration-actions">
          {step > 0 && (
            <Button type="button" variant="outline" onClick={() => move(step - 1)}>
              Geri
            </Button>
          )}
          <Button type="submit">{step === 3 ? 'Bilgileri onayla ve kaydet' : 'Devam et'}</Button>
        </div>
      </form>
    </>
  );
}
