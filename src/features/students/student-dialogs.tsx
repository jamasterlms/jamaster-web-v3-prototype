import { useMemberships } from '@/features/education/use-memberships';
import { useDisplay } from '@/app/display-provider';
import { DialogFooter } from '@/components/ui/dialog';
import { useWorkspace } from '@/app/workspace-provider';
import { Icon } from '@/components/shared/icon';
import { Avatar, StatusBadge } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { attendanceStats } from '@/features/calendar/attendance-model';
import { financeRecords, saleBalance } from '@/features/finance/finance-model';
import { navigate } from '@/hooks/use-route';
import { money } from '@/lib/format';
import { displayPhone, normalizePhone } from '@/lib/validation';
import type { Student } from '@/types';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { RegistrationFields, registrationStepFields } from './registration-fields';
import type { RegistrationDraft } from './registration-model';
import { RegistrationReview } from './registration-review';
import { studentDraft, studentFromDraft } from './student-model';
import { useRegistrationValidation } from './use-registration-validation';
export function StudentDetail({ student }: { student: Student }) {
  const memberships = useMemberships();
  const display = useDisplay();
  const { state, openModal, closeModal } = useWorkspace();
  const rate = attendanceStats(
    (state.attendanceSessions || []).filter((s) => s.branch === state.branch),
    student.id,
  ).rate;
  const finance = financeRecords(state);
  const balance = finance.sales
    .filter((s) => s.studentId === student.id)
    .reduce((n, s) => n + saleBalance(s, finance.receipts), 0);
  return (
    <>
      <div className="detail-header">
        <Avatar
          name={student.name}
          src={String(student.profile?.image || '')}
          color={student.color}
        />
        <div>
          <h3>{student.name}</h3>
          <p>
            #{student.id} · {student.type}
          </p>
        </div>
      </div>
      <div className="detail-grid">
        {[
          ['E-posta', student.email],
          ['Telefon', displayPhone(student.phone)],
          ['Eğitim', student.course],
          ['Gruplar', memberships.labelFor(student.id)],
          ['Öğretmen', student.teacher],
          ['Kaydedilen devam', rate === null ? 'Yoklama bulunmuyor' : `%${rate}`],
          ['Eğitim tutarı', money(student.amount)],
          ['Kalan bakiye', money(balance)],
        ].map(([title, value]) => (
          <div key={title}>
            <span>{title}</span>
            <b data-sensitive={['Eğitim tutarı', 'Kalan bakiye'].includes(title) || undefined}>
              {value}
            </b>
          </div>
        ))}
        <div>
          <span>Ödeme durumu</span>
          <StatusBadge>{student.payment}</StatusBadge>
        </div>
      </div>
      <div className="form-actions">
        <Button
          variant="outline"
          onClick={() => {
            display.setMobileOpen(false);
            openModal({ type: 'meeting', id: student.id });
          }}
        >
          <Icon name="handshake" />
          Görüşme
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            closeModal();
            display.setMobileOpen(false);
            navigate(`admin/sales/${student.id}`);
          }}
        >
          <Icon name="wallet" />
          Yeni satış
        </Button>
        <Button
          onClick={() => {
            display.setMobileOpen(false);
            openModal({ type: 'student-form', id: student.id });
          }}
        >
          <Icon name="pencil" />
          Düzenle
        </Button>
      </div>
    </>
  );
}
export function StudentForm({
  student,
  afterCreate,
}: {
  student?: Student;
  afterCreate?: 'meeting';
}) {
  const { state, dispatch, closeModal, openModal } = useWorkspace();
  const [draft, setDraft] = useState(() => studentDraft(student));
  const [section, setSection] = useState(0);
  const validation = useRegistrationValidation(draft, state.students, student?.id, true);
  const committed = useRef(false);
  const patch = (value: Partial<RegistrationDraft>) =>
    setDraft((previous) => ({ ...previous, ...value }));
  const save = () => {
    if (committed.current) return;
    const errors = validation.validate(section === 2 ? undefined : registrationStepFields[section]);
    if (Object.keys(errors).length) {
      if (section === 2) setSection(registrationStepFields[0].some((key) => errors[key]) ? 0 : 1);
      validation.focusError();
      return;
    }
    if (section < 2) {
      setSection(section + 1);
      return;
    }
    const parsed = validation.parse();
    if (!parsed.success) return;
    committed.current = true;
    const data = {
      ...parsed.data,
      meetingResult: draft.meetingResult,
      meetingNote: draft.meetingNote,
      meetingDate: draft.meetingDate,
      negativeReason: draft.negativeReason,
    };
    const savedId = student?.id ?? Math.max(0, ...state.students.map((s) => s.id)) + 1;
    dispatch({
      type: 'student/save',
      student: studentFromDraft(data, savedId, student),
    });
    toast.success(student ? 'Öğrenci bilgileri güncellendi.' : 'Öğrenci kaydı oluşturuldu.');
    if (afterCreate === 'meeting' && !student) openModal({ type: 'meeting', id: savedId });
    else closeModal();
  };
  return (
    <form
      noValidate
      ref={validation.formRef}
      className="dialog-form registration-form"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="dialog-form-body">
        <Tabs value={String(section)} onValueChange={(v) => setSection(Number(v))}>
          <TabsList aria-label="Öğrenci bilgileri">
            <TabsTrigger value="0">Kişisel bilgiler</TabsTrigger>
            <TabsTrigger value="1">Eğitim</TabsTrigger>
            <TabsTrigger value="2">Önizleme</TabsTrigger>
          </TabsList>
          <TabsContent value={String(section)} className="dialog-form">
            {Object.values(validation.errors).some(Boolean) && (
              <div className="form-error-summary" role="alert">
                İşaretli alanları kontrol edin. Değişiklikler henüz kaydedilmedi.
              </div>
            )}
            {section === 0 &&
              student &&
              /[•*]/.test(student.phone) &&
              draft.phone === student.phone && (
                <p className="field-hint">
                  Mevcut telefon maskeli olarak saklanıyor. Diğer bilgileri düzenleyebilirsiniz;
                  telefonu değiştirmek için tam numara girin.
                </p>
              )}
            {section < 2 ? (
              <RegistrationFields
                prefix="edit-student"
                profile={!!student}
                section={section}
                draft={draft}
                patch={patch}
                errors={validation.errors}
                validateField={validation.validateField}
              />
            ) : (
              <RegistrationReview
                draft={
                  validation.parse().success
                    ? {
                        ...draft,
                        phone: normalizePhone(draft.phone),
                        secondPhone: normalizePhone(draft.secondPhone),
                        email: draft.email.trim().toLowerCase(),
                      }
                    : draft
                }
                includeMeeting={false}
                onEdit={setSection}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
      <DialogFooter className="form-actions">
        <Button type="button" variant="ghost" onClick={closeModal}>
          Vazgeç
        </Button>
        {section > 0 && (
          <Button type="button" variant="outline" onClick={() => setSection(section - 1)}>
            Geri
          </Button>
        )}
        <Button type="submit">{section === 2 ? 'Değişiklikleri kaydet' : 'Devam et'}</Button>
      </DialogFooter>
    </form>
  );
}
