import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useWorkspace } from '@/app/workspace-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { CreatableCombobox } from '@/components/ui/combobox';
import { Icon } from '@/components/shared/icon';
import { displayPhone, localDate } from '@/lib/validation';
import { fullDateTR } from '@/lib/format';
import { useLevelCatalog } from '@/features/education/level-catalog';
import { levelSelectionErrors } from '@/features/education/level-selection';
import { studentDraft } from './student-model';
import {
  genders,
  bloodTypes,
  maritalStatuses,
  dayPeriods,
  timePeriods,
} from './registration-model';
import {
  prepareInformationEdit,
  type InformationKey,
  type InformationPatch,
} from './student-information-model';
import type { Student } from '@/types';

type Field = {
  key: InformationKey;
  label: string;
  type?: 'date' | 'tel' | 'email' | 'textarea' | 'choice';
  options?: readonly (readonly string[])[];
};
const sections: { title: string; fields: Field[] }[] = [
  {
    title: 'Kişisel bilgiler',
    fields: [
      { key: 'identityNumber', label: 'Kimlik / pasaport numarası' },
      { key: 'birthDate', label: 'Doğum tarihi', type: 'date' },
      { key: 'birthPlace', label: 'Doğum yeri' },
      { key: 'gender', label: 'Cinsiyet', options: genders },
      { key: 'bloodType', label: 'Kan grubu', options: bloodTypes },
      { key: 'maritalStatus', label: 'Medeni durum', options: maritalStatuses },
      { key: 'personalOccupation', label: 'Meslek / uzmanlık' },
    ],
  },
  {
    title: 'İletişim bilgileri',
    fields: [
      { key: 'phone', label: 'Telefon', type: 'tel' },
      { key: 'secondPhone', label: 'İkinci telefon', type: 'tel' },
      { key: 'email', label: 'E-posta', type: 'email' },
      { key: 'address', label: 'Adres', type: 'textarea' },
    ],
  },
  {
    title: 'Eğitim bilgileri',
    fields: [
      {
        key: 'courseType',
        label: 'Ders tipi',
        options: [
          ['GROUP', 'Grup dersi'],
          ['INDIVIDUAL', 'Bireysel ders'],
        ],
      },
      { key: 'level', label: 'Seviye / alt seviye' },
      { key: 'dayPreference', label: 'Gün tercihi', options: dayPeriods },
      { key: 'timePreference', label: 'Saat tercihi', options: timePeriods },
      { key: 'source', label: 'Bizi nereden duydunuz?', type: 'choice' },
      {
        key: 'occupation',
        label: 'Çalışma / öğrenim durumu',
        options: [
          ['STUDENT', 'Öğrenci'],
          ['EMPLOYEE', 'Çalışan'],
          ['UNEMPLOYED', 'Çalışmıyor'],
        ],
      },
      { key: 'institution', label: 'Okul / kurum', type: 'choice' },
      { key: 'company', label: 'Şirket', type: 'choice' },
    ],
  },
];
type Edit = { field: Field; patch: InformationPatch; expected: InformationPatch };
export function StudentInformation({ student }: { student: Student }) {
  const { state, dispatch } = useWorkspace();
  const levels = useLevelCatalog();
  const current = studentDraft(student);
  const [edit, setEdit] = useState<Edit | null>(null);
  const [error, setError] = useState('');
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (edit) form.current?.querySelector<HTMLElement>('input,textarea,[role=combobox]')?.focus();
  }, [edit?.field.key]);
  const start = (field: Field) => {
    const keys: InformationKey[] =
      field.key === 'level'
        ? ['level', 'subLevel']
        : field.key === 'occupation'
          ? ['occupation', 'institution', 'company']
          : field.key === 'dayPreference'
            ? ['dayPreference', 'customDays']
            : field.key === 'timePreference'
              ? ['timePreference', 'customTime']
              : [field.key];
    const values = Object.fromEntries(keys.map((k) => [k, current[k]])) as InformationPatch;
    setEdit({ field, patch: values, expected: { ...values } });
    setError('');
  };
  const patch = (value: InformationPatch) => {
    setEdit((e) => (e ? { ...e, patch: { ...e.patch, ...value } } : e));
    setError('');
  };
  const select = (
    id: string,
    value: string,
    options: readonly (readonly string[])[],
    change: (v: string) => void,
    required = false,
  ) => (
    <Select value={value || '_unset'} onValueChange={(v) => change(v === '_unset' ? '' : v)}>
      <SelectTrigger id={id} aria-invalid={!!error}>
        <SelectValue placeholder="Seçin" />
      </SelectTrigger>
      <SelectContent>
        {!required && <SelectItem value="_unset">Belirtilmedi</SelectItem>}
        {options
          .filter(([v]) => !!v)
          .map(([v, label]) => (
            <SelectItem key={v} value={v}>
              {label}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
  const display = (field: Field) => {
    const value = current[field.key];
    if (field.key === 'level')
      return [current.level, current.subLevel].filter(Boolean).join(' · ') || 'Belirtilmedi';
    if (field.type === 'tel') return value ? displayPhone(value) : 'Belirtilmedi';
    if (field.type === 'date') return value ? fullDateTR(value) : 'Belirtilmedi';
    if (field.key === 'dayPreference' && value === 'CUSTOM')
      return current.customDays || 'Özel günler';
    if (field.key === 'timePreference' && value === 'CUSTOM')
      return current.customTime || 'Özel saat';
    return field.options?.find(([v]) => v === value)?.[1] || value || 'Belirtilmedi';
  };
  return (
    <div className="student-information">
      {sections.map((section) => (
        <Card key={section.title} className="information-card">
          <h2>{section.title}</h2>
          <div className="information-fields">
            {section.fields
              .filter((f) => f.key !== 'institution' || current.occupation === 'STUDENT')
              .filter((f) => f.key !== 'company' || current.occupation === 'EMPLOYEE')
              .map((field) => (
                <div
                  key={field.key}
                  className={`information-field ${field.type === 'textarea' ? 'information-field-wide' : ''}`}
                >
                  {edit?.field.key === field.key ? (
                    <form
                      ref={form}
                      noValidate
                      className="information-editor"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const levelErrors =
                          field.key === 'level'
                            ? levelSelectionErrors(edit.patch, levels, current)
                            : {};
                        if (Object.keys(levelErrors).length) {
                          setError(Object.values(levelErrors)[0]!);
                          return;
                        }
                        const result = prepareInformationEdit(
                          student,
                          edit.patch,
                          edit.expected,
                          state.students,
                        );
                        if (result.error) {
                          setError(result.error);
                          return;
                        }
                        dispatch({
                          type: 'student/information',
                          id: student.id,
                          patch: edit.patch,
                          expected: edit.expected,
                        });
                        setEdit(null);
                        toast.success(`${field.label} güncellendi.`);
                      }}
                    >
                      <Label htmlFor={`info-${field.key}`}>{field.label}</Label>
                      {field.key === 'level' ? (
                        <div className="information-levels">
                          {select(
                            'info-level',
                            edit.patch.level || '',
                            levels
                              .filter((l) => l.isActive && !l.deletedAt)
                              .map((l) => [l.name, l.name]),
                            (level) => patch({ level, subLevel: '' }),
                          )}
                          <Label htmlFor="info-subLevel">Alt seviye</Label>
                          {select(
                            'info-subLevel',
                            edit.patch.subLevel || '',
                            (levels.find((l) => l.name === edit.patch.level)?.subLevels || [])
                              .filter((s) => s.isActive && !s.deletedAt)
                              .map((s) => [s.title, s.title]),
                            (subLevel) => patch({ subLevel }),
                          )}
                        </div>
                      ) : field.options ? (
                        select(
                          `info-${field.key}`,
                          edit.patch[field.key] || '',
                          field.options,
                          (value) => {
                            if (field.key === 'occupation')
                              patch({
                                occupation: value as typeof current.occupation,
                                institution:
                                  value === edit.expected.occupation
                                    ? edit.expected.institution
                                    : '',
                                company:
                                  value === edit.expected.occupation ? edit.expected.company : '',
                              });
                            else if (field.key === 'dayPreference')
                              patch({
                                dayPreference: value as typeof current.dayPreference,
                                customDays: value === 'CUSTOM' ? edit.patch.customDays : '',
                              });
                            else if (field.key === 'timePreference')
                              patch({
                                timePreference: value as typeof current.timePreference,
                                customTime: value === 'CUSTOM' ? edit.patch.customTime : '',
                              });
                            else patch({ [field.key]: value });
                          },
                          ['courseType', 'dayPreference', 'timePreference'].includes(field.key),
                        )
                      ) : field.type === 'choice' ? (
                        <CreatableCombobox
                          id={`info-${field.key}`}
                          value={edit.patch[field.key] || ''}
                          onValueChange={(value) => patch({ [field.key]: value })}
                          options={state.students.map((s) => String(s.profile?.[field.key] || ''))}
                          placeholder={`${field.label} seçin veya ekleyin`}
                          invalid={!!error}
                        />
                      ) : field.type === 'textarea' ? (
                        <Textarea
                          id={`info-${field.key}`}
                          value={edit.patch[field.key] || ''}
                          onChange={(e) => patch({ [field.key]: e.target.value })}
                          placeholder={`${field.label} yazın…`}
                          rows={3}
                          maxLength={1000}
                          aria-invalid={!!error}
                        />
                      ) : (
                        <Input
                          id={`info-${field.key}`}
                          type={field.type || 'text'}
                          value={edit.patch[field.key] || ''}
                          onValueChange={(value) => patch({ [field.key]: value })}
                          max={field.type === 'date' ? localDate() : undefined}
                          placeholder={`${field.label} girin`}
                          aria-invalid={!!error}
                        />
                      )}
                      {field.key === 'occupation' &&
                        edit.patch.occupation !== edit.expected.occupation && (
                          <p className="field-hint">
                            Durum değiştiğinde önceki okul ve şirket bilgileri temizlenir.
                          </p>
                        )}
                      {(['dayPreference', 'timePreference'] as string[]).includes(field.key) &&
                        edit.patch[field.key] === 'CUSTOM' && (
                          <>
                            <Label htmlFor="info-custom">
                              {field.key === 'dayPreference' ? 'Günler' : 'Saat aralığı'}
                            </Label>
                            <Input
                              id="info-custom"
                              value={
                                (field.key === 'dayPreference'
                                  ? edit.patch.customDays
                                  : edit.patch.customTime) || ''
                              }
                              placeholder={
                                field.key === 'dayPreference'
                                  ? 'Pazartesi, çarşamba…'
                                  : '18:00 – 21:00'
                              }
                              onValueChange={(value) =>
                                patch(
                                  field.key === 'dayPreference'
                                    ? { customDays: value }
                                    : { customTime: value },
                                )
                              }
                            />
                          </>
                        )}
                      {error && (
                        <p className="field-error" role="alert">
                          {error}
                        </p>
                      )}
                      <div className="information-edit-actions">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEdit(null);
                            setError('');
                          }}
                        >
                          <Icon name="x" />
                          Vazgeç
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={JSON.stringify(edit.patch) === JSON.stringify(edit.expected)}
                        >
                          <Icon name="check" />
                          Kaydet
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <span className="information-label">{field.label}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        className="information-value"
                        disabled={!!edit}
                        onClick={() => start(field)}
                        aria-label={`${field.label} düzenle: ${display(field)}`}
                      >
                        <span>{display(field)}</span>
                        <Icon name="pencil" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
