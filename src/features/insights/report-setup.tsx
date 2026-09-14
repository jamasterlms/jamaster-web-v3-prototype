import { useState } from 'react';
import { useWorkspace } from '@/app/workspace-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/shared/icon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { criteriaFields, criteriaForSlug, readReportData, reportDataKey } from './report-data';
export function ReportSetup({ slug }: { slug: string }) {
  const { state, dispatch } = useWorkspace();
  const [open, setOpen] = useState(false),
    [error, setError] = useState('');
  const data = readReportData(state),
    fields = criteriaFields.filter((f) => (criteriaForSlug[slug] || []).includes(f.key));
  if (!fields.length) return null;
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        setError('');
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Icon name="sliders-horizontal" />
          Rapor ölçütleri
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rapor ölçütleri</DialogTitle>
          <DialogDescription>
            Bu şubedeki yerel raporun ölçütlerini belirleyin. Boş değer bilinmiyor demektir.
          </DialogDescription>
        </DialogHeader>
        <form
          key={`${state.branch}-${slug}-${open}`}
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget),
              criteria = { ...data.criteria };
            for (const field of fields) {
              const raw = String(form.get(field.key) || '').trim(),
                value = raw === '' ? null : Number(raw);
              if (
                value !== null &&
                (!Number.isFinite(value) ||
                  value < 0 ||
                  (field.max != null && value > field.max) ||
                  (['gün', 'hak', 'görüşme'].includes(field.unit) && !Number.isInteger(value)))
              ) {
                setError(`${field.label} için geçerli ${field.unit} değeri girin.`);
                return;
              }
              criteria[field.key] = value;
            }
            if (
              criteria.attendanceLowBelow != null &&
              criteria.attendanceHighAtLeast != null &&
              criteria.attendanceLowBelow > criteria.attendanceHighAtLeast
            ) {
              setError('Düşük devam eşiği yüksek devam eşiğini aşamaz.');
              return;
            }
            dispatch({
              type: 'settings/save',
              values: {
                [reportDataKey(state.branch)]: JSON.stringify({
                  version: 1,
                  criteria,
                }),
              },
            });
            setOpen(false);
            setError('');
          }}
        >
          <div className="grid gap-4 my-4">
            {fields.map((field) => (
              <label key={field.key} className="text-sm">
                {field.label} ({field.unit})
                <Input
                  name={field.key}
                  type="number"
                  min="0"
                  max={field.max}
                  step={['gün', 'hak', 'görüşme'].includes(field.unit) ? '1' : '0.01'}
                  defaultValue={data.criteria[field.key] ?? ''}
                  placeholder="Belirlenmedi"
                />
              </label>
            ))}
          </div>
          {error && (
            <p role="alert" className="text-red-700 mb-3">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Vazgeç
            </Button>
            <Button type="submit">Kaydet</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
