import { ProfileImageInput } from '@/components/ui/profile-image-input';
import { CreatableCombobox } from '@/components/ui/combobox';
import { useWorkspace } from '@/app/workspace-provider';
import { useLearningData } from '@/features/education/learning-catalog';
import { useLevelCatalog } from '@/features/education/level-catalog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  meetingResults,
  meetingTypes,
  registrationNegativeReasons,
  scheduledResults,
} from '@/features/meetings/meeting-options';
import { localDate, phoneHint } from '@/lib/validation';
import { useState } from 'react';
import { meetingMinimumDate } from '@/lib/calendar';
import {
  dayPeriods,
  genders,
  maritalStatuses,
  bloodTypes,
  studentTypes,
  timePeriods,
  type RegistrationDraft,
} from './registration-model';

export const registrationStepFields: (keyof RegistrationDraft)[][] = [
  [
    'studentType',
    'name',
    'email',
    'phone',
    'secondPhone',
    'identityNumber',
    'birthDate',
    'birthPlace',
    'gender',
    'bloodType',
    'maritalStatus',
    'personalOccupation',
    'image',
    'address',
    'checkPhone',
  ],
  [
    'courseType',
    'course',
    'level',
    'subLevel',
    'dayPreference',
    'timePreference',
    'customDays',
    'customTime',
    'occupation',
    'source',
    'institution',
    'company',
    'status',
    'advisor',
  ],
  ['meetingType', 'meetingResult', 'meetingScore', 'meetingDate', 'negativeReason', 'meetingNote'],
];
export type RegistrationErrors = Partial<Record<keyof RegistrationDraft, string>>;
export function RegistrationFields({
  section,
  draft,
  patch,
  errors,
  validateField,
  prefix = 'register',
  profile = false,
}: {
  section: number;
  draft: RegistrationDraft;
  patch: (value: Partial<RegistrationDraft>) => void;
  errors: RegistrationErrors;
  validateField: (key: keyof RegistrationDraft) => void;
  prefix?: string;
  profile?: boolean;
}) {
  const { state } = useWorkspace();
  const catalog = useLearningData();
  const levels = useLevelCatalog();
  const [weekOffset, setWeekOffset] = useState(0);
  const id = (key: keyof RegistrationDraft) => `${prefix}-${key}`;
  const feedback = (key: keyof RegistrationDraft) =>
    errors[key] ? (
      <p className="field-error" id={`${id(key)}-error`}>
        {errors[key]}
      </p>
    ) : null;
  const description = (key: keyof RegistrationDraft) =>
    [
      errors[key] && `${id(key)}-error`,
      (key === 'phone' || key === 'secondPhone') && `${id(key)}-hint`,
    ]
      .filter(Boolean)
      .join(' ') || undefined;
  const field = (key: keyof RegistrationDraft, label: string, type = 'text', required = false) => (
    <div className="form-field" key={key}>
      <Label htmlFor={id(key)}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </Label>
      <Input
        id={id(key)}
        name={key}
        type={type}
        placeholder={
          type === 'tel' ? '05xx xxx xx xx' : type === 'email' ? 'ad@kurum.com' : `${label} girin`
        }
        required={required}
        value={String(draft[key] ?? '')}
        aria-invalid={!!errors[key]}
        aria-describedby={description(key)}
        autoComplete={
          (
            {
              name: 'name',
              email: 'email',
              phone: 'tel',
              secondPhone: 'off',
              birthDate: 'bday',
            } as Record<string, string>
          )[key]
        }
        min={
          key === 'birthDate'
            ? '1900-01-01'
            : key === 'meetingDate'
              ? meetingMinimumDate()
              : undefined
        }
        max={key === 'birthDate' ? localDate() : undefined}
        maxLength={
          key === 'phone' || key === 'secondPhone'
            ? 30
            : key === 'identityNumber'
              ? 30
              : key === 'image'
                ? 2048
                : 160
        }
        onBlur={() => validateField(key)}
        onValueChange={(value) =>
          patch({ [key]: value, ...(key === 'phone' ? { checkPhone: false } : {}) })
        }
      />
      {(key === 'phone' || key === 'secondPhone') && (
        <p className="field-hint" id={`${id(key)}-hint`}>
          {phoneHint}
        </p>
      )}
      {feedback(key)}
    </div>
  );
  const select = (
    key: keyof RegistrationDraft,
    label: string,
    options: string[][],
    optional = false,
    disabled = false,
  ) => (
    <div className="form-field" key={key}>
      <Label htmlFor={id(key)}>{label}</Label>
      <Select
        required={label.endsWith('*')}
        value={String(draft[key]) || (optional ? '_unset' : undefined)}
        disabled={disabled}
        onValueChange={(value) => {
          patch({
            [key]: value === '_unset' ? '' : value,
            ...(key === 'level' ? { subLevel: '' } : {}),
            ...(key === 'occupation' ? { institution: '', company: '' } : {}),
            ...(key === 'meetingResult'
              ? {
                  meetingDate: '',
                  negativeReason: '',
                  meetingScore: value === 'NEGATIVE' ? 1 : draft.meetingScore,
                }
              : {}),
          });
        }}
      >
        <SelectTrigger
          id={id(key)}
          aria-required={label.endsWith('*')}
          aria-invalid={!!errors[key]}
          aria-describedby={description(key)}
          onBlur={() => validateField(key)}
        >
          <SelectValue placeholder="Seçin" />
        </SelectTrigger>
        <SelectContent>
          {optional && <SelectItem value="_unset">Belirtilmedi</SelectItem>}
          {options.map(([value, text]) => (
            <SelectItem key={value} value={value}>
              {text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {feedback(key)}
    </div>
  );
  const creatable = (key: 'source' | 'institution' | 'company', label: string) => (
    <div className="form-field">
      <Label htmlFor={id(key)}>{label}</Label>
      <CreatableCombobox
        id={id(key)}
        value={draft[key]}
        onValueChange={(value) => patch({ [key]: value })}
        options={state.students.map((student) => String(student.profile?.[key] || ''))}
        invalid={!!errors[key]}
      />
      {feedback(key)}
    </div>
  );
  const textarea = (key: 'address' | 'meetingNote', label: string, limit: number) => (
    <div className="form-field">
      <Label htmlFor={id(key)}>{label}</Label>
      <Textarea
        id={id(key)}
        name={key}
        placeholder={`${label} yazın…`}
        value={draft[key]}
        maxLength={limit}
        aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? `${id(key)}-error` : undefined}
        onBlur={() => validateField(key)}
        onChange={(e) => patch({ [key]: e.target.value })}
      />
      <span className="field-hint field-counter">
        {draft[key].length} / {limit}
      </span>
      {feedback(key)}
    </div>
  );
  if (section === 0)
    return (
      <>
        <fieldset className="form-section" data-form-section="required">
          <legend>
            Temel bilgiler <span>Zorunlu</span>
          </legend>
          <div className="form-grid">
            {field('name', 'Ad soyad', 'text', true)}
            {select('studentType', 'Öğrenci tipi *', studentTypes)}
            {field('phone', 'Telefon', 'tel', true)}
            {field('email', 'E-posta', 'email', true)}
            {!profile && draft.name.trim() && (
              <Button
                type="button"
                variant="ghost"
                className="email-suggestion"
                onClick={() => {
                  const slug =
                    draft.name
                      .toLocaleLowerCase('tr')
                      .replace(/ı/g, 'i')
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .replace(/[^a-z0-9]+/g, '.')
                      .replace(/^\.|\.$/g, '') || 'ogrenci';
                  const digits = 1000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 9000);
                  patch({ email: `${slug}.${digits}@jamaster.com.tr` });
                }}
              >
                İsimden e-posta oluştur
              </Button>
            )}
          </div>
        </fieldset>
        <fieldset className="form-section form-section-optional" data-form-section="optional">
          <legend>
            Ek kişisel bilgiler <span>İsteğe bağlı</span>
          </legend>
          <p className="form-section-description">
            Bu alanları boş bırakabilir, öğrenci profilinden daha sonra tamamlayabilirsiniz.
          </p>
          <div className="form-grid">
            {field('secondPhone', 'İkinci telefon', 'tel')}
            {field('identityNumber', 'Kimlik / pasaport numarası')}
            {field('birthDate', 'Doğum tarihi', 'date')}
            {field('birthPlace', 'Doğum yeri')}
            {profile && (
              <>
                {select('gender', 'Cinsiyet', genders, true)}
                {select('bloodType', 'Kan grubu', bloodTypes, true)}
                {select('maritalStatus', 'Medeni durum', maritalStatuses, true)}
                {field('personalOccupation', 'Meslek / uzmanlık')}
              </>
            )}
            <ProfileImageInput
              id={id('image')}
              value={draft.image}
              onChange={(image) => patch({ image })}
            />
          </div>
          {textarea('address', 'Adres', 1000)}
          <div className="field-checkbox">
            <Checkbox
              id={`${prefix}-check`}
              checked={draft.checkPhone}
              onCheckedChange={(v) => patch({ checkPhone: v === true })}
            />
            <Label htmlFor={`${prefix}-check`}>Telefon numarasını öğrenciyle teyit ettim.</Label>
          </div>
        </fieldset>
      </>
    );
  if (section === 1)
    return (
      <>
        <fieldset className="form-section" data-form-section="required">
          <legend>
            Eğitim tercihleri <span>Zorunlu</span>
          </legend>
          <div className="form-grid">
            {select('courseType', 'Ders tipi *', [
              ['GROUP', 'Grup dersi'],
              ['INDIVIDUAL', 'Bireysel ders'],
            ])}
            {select('dayPreference', 'Gün tercihi *', dayPeriods)}
            {draft.dayPreference === 'CUSTOM' &&
              field('customDays', 'Tercih edilen günler', 'text')}
            {select('timePreference', 'Saat tercihi *', timePeriods)}
            {draft.timePreference === 'CUSTOM' &&
              field('customTime', 'Tercih edilen saatler', 'text')}
          </div>
        </fieldset>
        <fieldset className="form-section form-section-optional" data-form-section="optional">
          <legend>
            Seviye ve diğer bilgiler <span>İsteğe bağlı</span>
          </legend>
          <p className="form-section-description">
            Seviye henüz belirlenmediyse boş bırakabilirsiniz.
          </p>
          <div className="form-grid">
            {select(
              'course',
              'Eğitim',
              [
                ...new Set(
                  [
                    ...catalog.educations.filter((e) => e.isActive).map((e) => e.name),
                    draft.course,
                  ].filter(Boolean),
                ),
              ].map((value) => [value, value]),
              true,
            )}
            {field('advisor', 'Danışman')}
            {select(
              'level',
              'Seviye',
              [
                ...new Set(
                  [
                    ...levels.filter((l) => l.isActive && !l.deletedAt).map((l) => l.name),
                    draft.level,
                  ].filter(Boolean),
                ),
              ].map((v) => [v, v]),
              true,
            )}
            {select(
              'subLevel',
              'Alt seviye',
              [
                ...new Set(
                  [
                    ...(levels
                      .find((l) => l.name === draft.level)
                      ?.subLevels.filter((s) => s.isActive && !s.deletedAt)
                      .map((s) => s.title) || []),
                    draft.subLevel,
                  ].filter(Boolean),
                ),
              ].map((v) => [v, v]),
              true,
              !draft.level,
            )}
            {creatable('source', 'Bizi nereden duydunuz?')}
            {select(
              'occupation',
              'Öğrenim / çalışma durumu',
              [
                ['STUDENT', 'Öğrenci'],
                ['EMPLOYEE', 'Çalışan'],
                ['UNEMPLOYED', 'Çalışmıyor'],
              ],
              true,
            )}
            {draft.occupation === 'STUDENT' && creatable('institution', 'Okul / kurum')}
            {draft.occupation === 'EMPLOYEE' && creatable('company', 'Şirket')}
            {select('status', 'Hesap durumu', [
              ['ACTIVE', 'Aktif'],
              ['INACTIVE', 'Pasif'],
            ])}
          </div>
        </fieldset>
      </>
    );
  return (
    <>
      <fieldset className="form-section" data-form-section="required">
        <legend>
          Görüşme bilgileri <span>Zorunlu</span>
        </legend>
        <div className="form-grid">
          {select('meetingType', 'Görüşme tipi *', meetingTypes)}
          {select('meetingResult', 'Görüşme sonucu *', meetingResults)}
          {scheduledResults.has(draft.meetingResult) && (
            <>
              {field('meetingDate', 'Planlanan tarih ve saat', 'datetime-local', true)}
              <div className="meeting-mini-calendar" aria-label="Yedi günlük görüşme takvimi">
                <div className="meeting-mini-calendar-nav">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Önceki yedi gün"
                    onClick={() => setWeekOffset((value) => value - 7)}
                  >
                    <span aria-hidden>‹</span>
                  </Button>
                  <strong>7 günlük görünüm</strong>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Sonraki yedi gün"
                    onClick={() => setWeekOffset((value) => value + 7)}
                  >
                    <span aria-hidden>›</span>
                  </Button>
                </div>
                <div className="meeting-mini-calendar-days">
                  {Array.from({ length: 7 }, (_, index) => {
                    const date = new Date();
                    date.setHours(12, 0, 0, 0);
                    date.setDate(date.getDate() + weekOffset + index);
                    const day = localDate(date);
                    const minimumDay = meetingMinimumDate().slice(0, 10);
                    const disabled = day < minimumDay;
                    const count = state.meetings.filter((meeting) =>
                      meeting.date.startsWith(day),
                    ).length;
                    return (
                      <Button
                        key={day}
                        type="button"
                        disabled={disabled}
                        variant={draft.meetingDate.startsWith(day) ? 'default' : 'outline'}
                        onClick={() => {
                          if (disabled) return;
                          const time = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(draft.meetingDate)
                            ? draft.meetingDate.slice(11)
                            : '09:00';
                          patch({ meetingDate: `${day}T${time}` });
                        }}
                      >
                        <span>{date.toLocaleDateString('tr-TR', { weekday: 'short' })}</span>
                        <b>{date.getDate()}</b>
                        <small>{count} görüşme</small>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
          <fieldset className="form-field">
            <legend>Görüşme skoru *</legend>
            <div
              className="score-options"
              role="group"
              aria-label="Görüşme skoru"
              tabIndex={-1}
              aria-invalid={!!errors.meetingScore}
              aria-describedby={errors.meetingScore ? `${id('meetingScore')}-error` : undefined}
            >
              {[1, 2, 3, 4, 5].map((score) => (
                <Button
                  key={score}
                  type="button"
                  variant={draft.meetingScore === score ? 'default' : 'outline'}
                  aria-pressed={draft.meetingScore === score}
                  onClick={() => patch({ meetingScore: score })}
                >
                  {score}
                </Button>
              ))}
            </div>
            {feedback('meetingScore')}
          </fieldset>
        </div>
      </fieldset>
      <fieldset className="form-section form-section-optional" data-form-section="optional">
        <legend>
          Görüşme ek bilgileri <span>İsteğe bağlı</span>
        </legend>
        {draft.meetingResult === 'NEGATIVE' &&
          select('negativeReason', 'Olumsuzluk nedeni', registrationNegativeReasons, true)}
        {textarea('meetingNote', 'Not', 1500)}
      </fieldset>
    </>
  );
}
