import { ProfileImageInput } from '@/components/ui/profile-image-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { Teacher } from '@/features/operations/model';

export function TeacherFields({
  value,
  onChange,
}: {
  value: Teacher;
  onChange: (value: Teacher) => void;
}) {
  const patch = (next: Partial<Teacher>) => onChange({ ...value, ...next });
  const salary = value.salary;
  return (
    <>
      <fieldset className="form-section" data-form-section="required">
        <legend>
          Öğretmen bilgileri <span>Zorunlu</span>
        </legend>
        <div className="form-grid">
          <div className="form-field">
            <Label htmlFor="teacher-name">Ad soyad *</Label>
            <Input
              id="teacher-name"
              required
              minLength={2}
              maxLength={160}
              autoComplete="name"
              value={value.name}
              onChange={(e) => patch({ name: e.target.value })}
            />
          </div>
          <div className="form-field">
            <Label htmlFor="teacher-email">E-posta *</Label>
            <Input
              id="teacher-email"
              type="email"
              required
              value={value.email}
              onChange={(e) => patch({ email: e.target.value })}
            />
          </div>
          <div className="form-field">
            <Label htmlFor="teacher-phone">Telefon *</Label>
            <Input
              id="teacher-phone"
              type="tel"
              required
              value={value.phone}
              onValueChange={(phone) => patch({ phone })}
            />
          </div>
          <div className="form-field">
            <Label htmlFor="teacher-status">Durum *</Label>
            <Select
              required
              value={value.status}
              onValueChange={(status) => patch({ status: status as Teacher['status'] })}
            >
              <SelectTrigger id="teacher-status" aria-required="true">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[...new Set(['Aktif', 'Pasif', value.status])].map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </fieldset>
      <fieldset className="form-section form-section-optional" data-form-section="optional">
        <legend>
          Fotoğraf, çalışma ve maaş bilgileri <span>İsteğe bağlı</span>
        </legend>
        <p className="form-section-description">
          Öğretmen kaydını bu bilgileri girmeden oluşturabilirsiniz.
        </p>
        <ProfileImageInput value={value.image || ''} onChange={(image) => patch({ image })} />
        <div className="form-grid">
          <div className="form-field">
            <Label htmlFor="teacher-specialty">Uzmanlık</Label>
            <Input
              id="teacher-specialty"
              maxLength={160}
              value={value.specialty}
              onChange={(e) => patch({ specialty: e.target.value })}
            />
          </div>
          <div className="form-field">
            <Label htmlFor="teacher-hours">Haftalık ders yükü (saat)</Label>
            <Input
              id="teacher-hours"
              type="number"
              min={0}
              max={168}
              step="0.5"
              value={value.weeklyHours || ''}
              onChange={(e) => patch({ weeklyHours: Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="field-checkbox">
          <Switch
            id="teacher-salary-enabled"
            checked={!!salary}
            onCheckedChange={(enabled) =>
              patch({
                salary: enabled ? { amount: 0, salaryType: 'MONTHLY', paymentDay: 1 } : undefined,
              })
            }
          />
          <Label htmlFor="teacher-salary-enabled">Maaş bilgisi ekle</Label>
        </div>
        {salary && (
          <div className="form-conditional">
            <p className="field-hint">
              Maaş bilgisi eklediğinizde tutar, maaş tipi ve ödeme günü gereklidir.
            </p>
            <div className="form-grid">
              <div className="form-field">
                <Label htmlFor="salary-amount">Maaş tutarı (₺) *</Label>
                <Input
                  id="salary-amount"
                  type="number"
                  required
                  min={0}
                  step="0.01"
                  value={Number.isFinite(salary.amount) ? salary.amount : ''}
                  onChange={(e) =>
                    patch({
                      salary: {
                        ...salary,
                        amount: e.target.value === '' ? NaN : Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
              <div className="form-field">
                <Label htmlFor="salary-type">Maaş tipi *</Label>
                <Select
                  required
                  value={salary.salaryType}
                  onValueChange={(salaryType) =>
                    patch({
                      salary: {
                        ...salary,
                        salaryType: salaryType as NonNullable<Teacher['salary']>['salaryType'],
                      },
                    })
                  }
                >
                  <SelectTrigger id="salary-type" aria-required="true">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      ['HOURLY', 'Saatlik'],
                      ['WEEKLY', 'Haftalık'],
                      ['MONTHLY', 'Aylık'],
                    ].map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="form-field">
                <Label htmlFor="salary-day">Ödeme günü *</Label>
                <Input
                  id="salary-day"
                  type="number"
                  required
                  min={1}
                  max={31}
                  step={1}
                  value={salary.paymentDay || ''}
                  onChange={(e) =>
                    patch({ salary: { ...salary, paymentDay: Number(e.target.value) } })
                  }
                />
              </div>
            </div>
          </div>
        )}
      </fieldset>
    </>
  );
}
