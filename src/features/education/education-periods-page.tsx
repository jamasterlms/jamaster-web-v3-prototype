import { LearningCatalogPage } from './learning-catalog-page';
import {
  CatalogChoice,
  CatalogExtras,
  CatalogInput,
  CatalogSection,
  type LearningFieldProps,
} from './learning-form';
import { learningDate, periodTypeOptions, type EducationPeriod } from './learning-model';

const duration = (record: EducationPeriod) =>
  record.periodType && record.periodValue !== undefined
    ? `${record.periodValue} ${record.periodType === 'WEEK' ? 'hafta' : 'ay'}`
    : 'Süre belirtilmedi';
function EducationPeriodFields({
  value,
  onChange,
  previous,
  issue,
}: LearningFieldProps<EducationPeriod>) {
  const locked = !!previous?.periodType;
  return (
    <>
      <CatalogSection title="Dönem süresi ve haklar">
        <div className="form-grid">
          <CatalogInput
            field="name"
            label="Dönem adı *"
            value={value.name}
            required
            onChange={(name) => onChange({ ...value, name })}
            issue={issue}
          />
          <CatalogChoice
            field="periodType"
            label="Dönem tipi *"
            value={value.periodType}
            required
            disabled={locked}
            options={periodTypeOptions}
            onChange={(periodType) =>
              onChange({ ...value, periodType: periodType as EducationPeriod['periodType'] })
            }
            issue={issue}
          />
          <CatalogInput
            field="periodValue"
            label="Süre *"
            type="number"
            min={1}
            step={1}
            value={value.periodValue ?? ''}
            required
            disabled={locked}
            onChange={(text) =>
              onChange({ ...value, periodValue: text === '' ? undefined : Number(text) })
            }
            issue={issue}
          />
          <CatalogInput
            field="bonusCount"
            label="Bonus hakkı *"
            type="number"
            min={0}
            step={1}
            value={Number.isFinite(value.bonusCount) ? value.bonusCount : ''}
            required
            onChange={(text) =>
              onChange({ ...value, bonusCount: text === '' ? NaN : Number(text) })
            }
            issue={issue}
          />
        </div>
        <p className="field-hint">
          Eğitim dönemi hafta veya ay cinsinden süreyi belirtir. Kaydedilen süreyi değiştirmek için
          yeni dönem oluşturun.
        </p>
      </CatalogSection>
      <CatalogExtras value={value} onChange={onChange}>
        {value.legacyCells && learningDate(value.legacyCells[1]) && (
          <p className="field-hint">
            Önceki takvim bilgisi korunuyor: {value.legacyCells[1]} — {value.legacyCells[2]}. Eğitim
            süresi bu tarihlerden hesaplanmaz.
          </p>
        )}
      </CatalogExtras>
    </>
  );
}
export function EducationPeriodsPage() {
  return (
    <LearningCatalogPage<EducationPeriod>
      kind="period"
      title="Eğitim dönemleri"
      description="Hafta veya ay cinsinden eğitim süresini ve bonus haklarını tanımlayın."
      createLabel="Eğitim dönemi ekle"
      fields={EducationPeriodFields}
      columns={(_catalog, usage) => [
        { accessorKey: 'name', header: 'Dönem' },
        {
          accessorKey: 'periodType',
          header: 'Dönem tipi',
          cell: ({ row }) =>
            periodTypeOptions.find((option) => option.value === row.original.periodType)?.label ||
            'Belirtilmedi',
        },
        { id: 'duration', header: 'Süre', cell: ({ row }) => duration(row.original) },
        { accessorKey: 'bonusCount', header: 'Bonus hakkı' },
        {
          accessorKey: 'description',
          header: 'Açıklama',
          cell: ({ row }) => row.original.description || '—',
        },
        {
          id: 'pricingCount',
          header: 'Fiyat paketi',
          cell: ({ row }) => usage.plans.filter((plan) => plan.periodId === row.original.id).length,
        },
      ]}
      preview={(value, _catalog, usage) => [
        ['Ad', value.name],
        ['Süre', duration(value)],
        ['Bonus hakkı', String(value.bonusCount)],
        ['Fiyat paketi', String(usage.plans.filter((plan) => plan.periodId === value.id).length)],
      ]}
    />
  );
}
