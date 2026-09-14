import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type StaffSalary = {
  salaryType?: 'WEEKLY' | 'MONTHLY';
  baseAmount?: number;
  commissionRate?: number;
  paymentDay?: number;
  commissionBasis?: 'COLLECTION' | 'TURNOVER';
};
export function StaffSalaryFields({
  value,
  onChange,
}: {
  value?: StaffSalary;
  onChange: (value?: StaffSalary) => void;
}) {
  const set = (next: Partial<StaffSalary>) => onChange({ ...value, ...next });
  return (
    <fieldset className="form-section form-section-optional" data-form-section="optional">
      <legend>
        Maaş ve prim <span>İsteğe bağlı</span>
      </legend>
      <div className="setting-switch">
        <Label htmlFor="staff-salary-enabled">Maaş bilgisi ekle</Label>
        <Switch
          id="staff-salary-enabled"
          checked={!!value}
          onCheckedChange={(enabled) =>
            onChange(
              enabled
                ? {
                    salaryType: 'MONTHLY',
                    baseAmount: 0,
                    commissionRate: 0,
                    paymentDay: 1,
                    commissionBasis: 'COLLECTION',
                  }
                : undefined,
            )
          }
        />
      </div>
      {value && (
        <div className="form-grid">
          <div className="form-field">
            <Label htmlFor="staff-salary-type">Ödeme dönemi</Label>
            <Select
              value={value.salaryType || 'MONTHLY'}
              onValueChange={(salaryType) =>
                set({ salaryType: salaryType as 'WEEKLY' | 'MONTHLY' })
              }
            >
              <SelectTrigger id="staff-salary-type">
                <SelectValue placeholder="Ödeme dönemi seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY">Aylık</SelectItem>
                <SelectItem value="WEEKLY">Haftalık</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(['baseAmount', 'commissionRate', 'paymentDay'] as const).map((key) => (
            <div className="form-field" key={key}>
              <Label htmlFor={`staff-salary-${key}`}>
                {key === 'baseAmount'
                  ? 'Maaş tutarı'
                  : key === 'commissionRate'
                    ? 'Prim oranı (%)'
                    : 'Ödeme günü'}
              </Label>
              <Input
                id={`staff-salary-${key}`}
                type="number"
                min={key === 'paymentDay' ? 1 : 0}
                max={key === 'paymentDay' ? 31 : key === 'commissionRate' ? 100 : undefined}
                step={key === 'paymentDay' ? 1 : 0.01}
                placeholder={key === 'paymentDay' ? '1–31' : '0'}
                value={value[key] ?? ''}
                onValueChange={(amount) =>
                  set({ [key]: amount === '' ? undefined : Number(amount) })
                }
              />
            </div>
          ))}
          <div className="form-field">
            <Label htmlFor="staff-commission-basis">Prim hesabı</Label>
            <Select
              value={value.commissionBasis || 'COLLECTION'}
              onValueChange={(commissionBasis) =>
                set({ commissionBasis: commissionBasis as 'COLLECTION' | 'TURNOVER' })
              }
            >
              <SelectTrigger id="staff-commission-basis">
                <SelectValue placeholder="Prim hesabı seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COLLECTION">Tahsilat üzerinden</SelectItem>
                <SelectItem value="TURNOVER">Ciro üzerinden</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </fieldset>
  );
}
