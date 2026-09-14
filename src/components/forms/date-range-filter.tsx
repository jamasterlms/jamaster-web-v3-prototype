import { Icon } from '@/components/shared/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { isDate } from '@/lib/validation';
import { useId, useState } from 'react';
export function DateRangeFilter({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (v: { from: string; to: string }) => void;
}) {
  const id = useId(),
    [open, setOpen] = useState(false),
    [draft, setDraft] = useState({ from, to });
  const invalid = Boolean(
    (draft.from && !isDate(draft.from)) ||
      (draft.to && !isDate(draft.to)) ||
      (draft.from && draft.to && draft.from > draft.to),
  );
  const formatDate = (value: string) => value.split('-').reverse().join('.');
  const caption =
    from && to
      ? `${formatDate(from)} – ${formatDate(to)}`
      : from
        ? `${formatDate(from)} ve sonrası`
        : to
          ? `${formatDate(to)} ve öncesi`
          : 'Tarih aralığı';
  return (
    <Popover
      open={open}
      onOpenChange={(value) => {
        if (value) setDraft({ from, to });
        setOpen(value);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="filter-button date-range-trigger"
          data-active={Boolean(from || to)}
          aria-label={`Tarih filtresi: ${caption}`}
        >
          <Icon name="calendar-days" />
          <span>{caption}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="date-range-popover grid gap-3" align="end">
        <div className="form-field">
          <Label htmlFor={`${id}-from`}>Başlangıç</Label>
          <Input
            id={`${id}-from`}
            type="date"
            value={draft.from}
            max={draft.to || undefined}
            aria-invalid={invalid}
            aria-describedby={invalid ? `${id}-error` : undefined}
            onChange={(e) => setDraft({ ...draft, from: e.target.value })}
          />
        </div>
        <div className="form-field">
          <Label htmlFor={`${id}-to`}>Bitiş</Label>
          <Input
            id={`${id}-to`}
            type="date"
            value={draft.to}
            min={draft.from || undefined}
            aria-invalid={invalid}
            aria-describedby={invalid ? `${id}-error` : undefined}
            onChange={(e) => setDraft({ ...draft, to: e.target.value })}
          />
        </div>
        {invalid && (
          <p className="field-error" id={`${id}-error`} role="alert">
            Geçerli tarihler seçin; bitiş başlangıçtan önce olamaz.
          </p>
        )}
        <div className="flex justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!from && !to && !draft.from && !draft.to}
            onClick={() => {
              onChange({ from: '', to: '' });
              setOpen(false);
            }}
          >
            Temizle
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={invalid}
            onClick={() => {
              onChange(draft);
              setOpen(false);
            }}
          >
            Uygula
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
