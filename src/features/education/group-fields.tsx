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
import type { LearningGroup, Teacher } from '@/features/operations/model';
import { dayPeriods, timePeriods } from '@/features/students/registration-model';
import { useLearningData } from './learning-catalog';
import { useOperations } from '@/features/operations/operations-provider';
import { useLevelCatalog } from './level-catalog';
export const groupTypes = [
  ['IN_PERSON', 'Yüz yüze'],
  ['ONLINE', 'Online'],
  ['HYBRID', 'Hibrit'],
];
export const educationTypes = [
  ['GROUPS', 'Grup'],
  ['PRIVATE', 'Özel ders'],
  ['BUSINESS', 'Kurumsal'],
  ['KIDS', 'Çocuk'],
  ['OTHER', 'Diğer'],
];
export function GroupFields({
  value,
  onChange,
  teachers,
}: {
  value: LearningGroup;
  onChange: (v: LearningGroup) => void;
  teachers: Teacher[];
}) {
  const catalog = useLearningData();
  const { operations } = useOperations();
  const levels = useLevelCatalog();
  const choice = (
    key: keyof LearningGroup,
    label: string,
    options: string[][],
    optional = false,
  ) => (
    <div className="form-field">
      <Label htmlFor={`group-${key}`}>
        {label}
        {!optional && ' *'}
      </Label>
      <Select
        value={String(value[key] || (optional ? '_unset' : '')) || undefined}
        required={!optional}
        onValueChange={(v) =>
          onChange({
            ...value,
            [key]: v === '_unset' ? undefined : v,
            ...(key === 'level' ? { subLevel: '' } : {}),
            ...(key === 'course'
              ? {
                  educationType:
                    catalog.educations.find((e) => e.name === v)?.type || value.educationType,
                }
              : {}),
          })
        }
      >
        <SelectTrigger id={`group-${key}`} aria-required={!optional}>
          <SelectValue placeholder="Seçin" />
        </SelectTrigger>
        <SelectContent>
          {optional && <SelectItem value="_unset">Belirtilmedi</SelectItem>}
          {options.map(([v, l]) => (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
  const input = (
    key: 'name' | 'capacity' | 'schedule' | 'room',
    label: string,
    required = false,
  ) => (
    <div className="form-field">
      <Label htmlFor={`group-${key}`}>
        {label}
        {required && ' *'}
      </Label>
      <Input
        id={`group-${key}`}
        required={required}
        placeholder={key === 'capacity' ? '16' : `${label} girin`}
        type={key === 'capacity' ? 'number' : 'text'}
        min={key === 'capacity' ? 1 : undefined}
        max={key === 'capacity' ? 100 : undefined}
        minLength={key === 'name' ? 2 : undefined}
        maxLength={240}
        value={value[key]}
        onChange={(e) =>
          onChange({
            ...value,
            [key]: key === 'capacity' ? Number(e.target.value) : e.target.value,
          })
        }
      />
    </div>
  );
  return (
    <>
      <fieldset className="form-section" data-form-section="required">
        <legend>
          Grup ve eğitim bilgileri <span>Zorunlu</span>
        </legend>
        <div className="form-grid">
          {input('name', 'Grup adı', true)}
          {choice(
            'course',
            'Eğitim',
            [
              ...new Set(
                [
                  ...catalog.educations.filter((e) => e.isActive).map((e) => e.name),
                  value.course,
                ].filter(Boolean),
              ),
            ].map((v) => [v, v]),
          )}
          {choice('groupType', 'Grup tipi', groupTypes)}
          {choice('educationType', 'Eğitim tipi', educationTypes)}
          {choice(
            'level',
            'Seviye',
            [
              ...new Set(
                [
                  ...levels.filter((l) => l.isActive && !l.deletedAt).map((l) => l.name),
                  value.level,
                ].filter(Boolean),
              ),
            ].map((v) => [v, v]),
          )}
          {choice(
            'subLevel',
            'Alt seviye',
            [
              ...new Set(
                [
                  ...(levels
                    .find((l) => l.name === value.level)
                    ?.subLevels.filter((s) => s.isActive && !s.deletedAt)
                    .map((s) => s.title) || []),
                  value.subLevel,
                ].filter((v): v is string => !!v),
              ),
            ].map((v) => [v, v]),
          )}
          <div className="form-field">
            <Label htmlFor="group-head-teacher">Öğretmen *</Label>
            <Select
              required
              value={value.headTeacherId || undefined}
              onValueChange={(id) => {
                const teacher = teachers.find((t) => t.id === id);
                if (teacher)
                  onChange({ ...value, headTeacherId: teacher.id, teacher: teacher.name });
              }}
            >
              <SelectTrigger id="group-head-teacher" aria-required>
                <SelectValue placeholder="Öğretmen seçin" />
              </SelectTrigger>
              <SelectContent>
                {teachers
                  .filter((t) => t.status === 'Aktif' || t.id === value.headTeacherId)
                  .map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} · {t.email}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {operations.groups.find((g) => g.id === value.id)?.headTeacherId !==
              value.headTeacherId &&
              operations.groupTeacherAssignments.some(
                (a) => a.groupId === value.id && a.teacherId === value.headTeacherId && a.isActive,
              ) && (
                <p className="muted text-sm">
                  Bu seçimde öğretmenin mevcut ek ataması pasife alınır.
                </p>
              )}
          </div>
          {input('capacity', 'Kapasite', true)}
          {choice('dayPeriod', 'Gün dilimi', dayPeriods)}
          {choice('timePeriod', 'Zaman dilimi', timePeriods)}
        </div>
      </fieldset>
      <fieldset className="form-section form-section-optional" data-form-section="optional">
        <legend>
          Program ve ek bilgiler <span>İsteğe bağlı</span>
        </legend>
        <p className="form-section-description">
          Derslik ve program bilgileri henüz belli değilse daha sonra tamamlayabilirsiniz.
        </p>
        <div className="form-grid">
          {choice(
            'programTermId',
            'Program dönemi',
            [
              ...catalog.programTerms
                .filter((t) => t.isActive || t.id === value.programTermId)
                .map((t) => [t.id, t.name]),
              ...(value.programTermId &&
              !catalog.programTerms.some((t) => t.id === value.programTermId)
                ? [[value.programTermId, 'Kayıtlı program dönemi']]
                : []),
            ],
            true,
          )}
          {input('room', 'Derslik')}
          {input('schedule', 'Ders günleri ve saatleri')}
          <div className="form-field">
            <Label htmlFor="group-status">Durum</Label>
            <Select
              value={value.status}
              onValueChange={(status) =>
                onChange({ ...value, status: status as LearningGroup['status'] })
              }
            >
              <SelectTrigger id="group-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['Aktif', 'Planlandı', 'Tamamlandı', 'Pasif'].map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="form-field">
          <Label htmlFor="group-description">Açıklama</Label>
          <Textarea
            id="group-description"
            maxLength={1500}
            value={value.description || ''}
            onChange={(e) => onChange({ ...value, description: e.target.value })}
          />
        </div>
      </fieldset>
    </>
  );
}
