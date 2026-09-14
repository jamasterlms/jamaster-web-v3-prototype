import { useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  validateLearningRecord,
  type LearningCatalog,
  type LearningIssue,
  type LearningRecord,
  type LearningUsageContext,
} from './learning-model';

export type LearningFieldProps<T extends LearningRecord> = {
  value: T;
  onChange: (value: T) => void;
  previous?: T;
  catalog: LearningCatalog;
  issue: LearningIssue | null;
};
export function CatalogField({
  field,
  label,
  issue,
  children,
}: {
  field: string;
  label: string;
  issue?: LearningIssue | null;
  children: ReactNode;
}) {
  return (
    <div className="form-field">
      <Label htmlFor={`learning-${field}`}>{label}</Label>
      {children}
      {issue?.field === field && (
        <p id={`learning-${field}-error`} className="field-error" role="alert">
          {issue.message}
        </p>
      )}
    </div>
  );
}
export function CatalogInput({
  field,
  label,
  value,
  onChange,
  required,
  type = 'text',
  min,
  step,
  issue,
  disabled,
}: {
  field: string;
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  min?: number | string;
  step?: number;
  issue?: LearningIssue | null;
  disabled?: boolean;
}) {
  return (
    <CatalogField field={field} label={label} issue={issue}>
      <Input
        id={`learning-${field}`}
        name={field}
        type={type}
        value={value}
        required={required}
        min={min}
        step={step}
        disabled={disabled}
        aria-invalid={issue?.field === field}
        aria-describedby={issue?.field === field ? `learning-${field}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
    </CatalogField>
  );
}
export function CatalogChoice({
  field,
  label,
  value,
  onChange,
  options,
  required,
  disabled,
  issue,
}: {
  field: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
  issue?: LearningIssue | null;
}) {
  const choices =
    value && !options.some((option) => option.value === value)
      ? [...options, { value, label: `${value} (mevcut kayıt)` }]
      : options;
  return (
    <CatalogField field={field} label={label} issue={issue}>
      <Select
        value={value || '_unset'}
        onValueChange={(next) => onChange(next === '_unset' ? '' : next)}
        required={required}
        disabled={disabled}
      >
        <SelectTrigger
          id={`learning-${field}`}
          aria-required={required}
          aria-invalid={issue?.field === field}
          aria-describedby={issue?.field === field ? `learning-${field}-error` : undefined}
        >
          <SelectValue placeholder="Seçin" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_unset">{required ? 'Seçin' : 'Belirtilmedi'}</SelectItem>
          {choices.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </CatalogField>
  );
}
export function CatalogSection({
  title,
  optional,
  children,
}: {
  title: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <fieldset
      className={`form-section ${optional ? 'form-section-optional' : ''}`}
      data-form-section={optional ? 'optional' : 'required'}
    >
      <legend>
        {title} <span>{optional ? 'İsteğe bağlı / varsayılan' : 'Zorunlu'}</span>
      </legend>
      {children}
    </fieldset>
  );
}
export function CatalogExtras<T extends LearningRecord>({
  value,
  onChange,
  children,
}: {
  value: T;
  onChange: (value: T) => void;
  children?: ReactNode;
}) {
  return (
    <CatalogSection title="Ek bilgiler" optional>
      {children}
      {value.kind !== 'program-terms' && (
        <CatalogField field="description" label="Açıklama">
          <Textarea
            id="learning-description"
            value={value.description}
            onChange={(event) => onChange({ ...value, description: event.target.value })}
          />
        </CatalogField>
      )}
      <div className="field-checkbox">
        <Switch
          id="learning-isActive"
          checked={value.isActive}
          onCheckedChange={(isActive) => onChange({ ...value, isActive })}
        />
        <Label htmlFor="learning-isActive">Aktif</Label>
      </div>
      <p className="field-hint">
        Pasif kayıtlar geçmiş ilişkilerde korunur; yeni seçim listelerine eklenmez.
      </p>
    </CatalogSection>
  );
}
export function LearningEditor<T extends LearningRecord>({
  initial,
  previous,
  title,
  catalog,
  usage,
  fields,
  preview,
  onSave,
  onClose,
}: {
  initial: T;
  previous?: T;
  title: string;
  catalog: LearningCatalog;
  usage?: LearningUsageContext;
  fields: (props: LearningFieldProps<T>) => ReactNode;
  preview: (record: T) => [string, string][];
  onSave: (record: T) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initial),
    [issue, setIssue] = useState<LearningIssue | null>(null),
    [review, setReview] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  return (
    <DialogContent preventOutsideClose className="jam-modal dialog-wide">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {review
            ? 'Kaydetmeden önce bilgileri kontrol edin.'
            : 'Zorunlu alanları tamamlayın; ek bilgileri daha sonra düzenleyebilirsiniz.'}
        </DialogDescription>
      </DialogHeader>
      <form
        className="dialog-form"
        ref={form}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const normalized = {
            ...value,
            name: value.name.trim(),
            description: value.description.trim(),
          };
          const error = validateLearningRecord(normalized, catalog, previous, usage);
          setIssue(error);
          if (error) {
            setReview(false);
            requestAnimationFrame(() =>
              form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
            );
            return;
          }
          if (!review) {
            setValue(normalized);
            setReview(true);
            return;
          }
          onSave(normalized);
        }}
      >
        <div className="dialog-form-body">
          {issue && (
            <div className="form-error-summary" role="alert">
              {issue.message}
            </div>
          )}
          {review ? (
            <dl className="detail-grid">
              {[
                ...preview(value),
                ['Durum', value.isActive ? 'Aktif' : 'Pasif'],
                ...(value.description ? [['Açıklama', value.description]] : []),
              ].map(([label, text]) => (
                <div key={label}>
                  <dt className="muted">{label}</dt>
                  <dd>{text || 'Belirtilmedi'}</dd>
                </div>
              ))}
            </dl>
          ) : (
            fields({ value, onChange: setValue, previous, catalog, issue })
          )}
        </div>
        <DialogFooter className="form-actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          {review && (
            <Button type="button" variant="outline" onClick={() => setReview(false)}>
              Bilgileri düzenle
            </Button>
          )}
          <Button type="submit">{review ? 'Kaydet' : 'Önizle'}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
