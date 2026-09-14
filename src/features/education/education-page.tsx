import { LearningCatalogPage } from './learning-catalog-page';
import {
  CatalogChoice,
  CatalogExtras,
  CatalogInput,
  CatalogSection,
  type LearningFieldProps,
} from './learning-form';
import { educationTypeOptions, type Education } from './learning-model';

const typeLabel = (value: string) =>
  educationTypeOptions.find((option) => option.value === value)?.label || 'Belirtilmedi';
function EducationFields({ value, onChange, previous, issue }: LearningFieldProps<Education>) {
  return (
    <>
      <CatalogSection title="Eğitim bilgileri">
        <div className="form-grid">
          <CatalogInput
            field="name"
            label="Eğitim adı *"
            value={value.name}
            required
            onChange={(name) => onChange({ ...value, name })}
            issue={issue}
          />
          <CatalogChoice
            field="type"
            label="Eğitim tipi *"
            value={value.type}
            required
            disabled={!!previous?.type}
            options={educationTypeOptions}
            onChange={(type) => onChange({ ...value, type: type as Education['type'] })}
            issue={issue}
          />
        </div>
        {previous?.type && (
          <p className="field-hint">
            Kaydedilen eğitim tipi sabittir. Farklı bir tip için yeni eğitim oluşturabilirsiniz.
          </p>
        )}
      </CatalogSection>
      <CatalogExtras value={value} onChange={onChange}>
        <CatalogInput
          field="lessonCount"
          label="Planlanan ders sayısı"
          type="number"
          min={0}
          step={1}
          value={value.lessonCount ?? ''}
          onChange={(text) =>
            onChange({ ...value, lessonCount: text === '' ? undefined : Number(text) })
          }
          issue={issue}
        />
        {!!value.levels.length && (
          <p className="field-hint">
            Tanımlı seviyeler: {value.levels.map((level) => level.name).join(', ')}
          </p>
        )}
      </CatalogExtras>
    </>
  );
}
export function EducationPage() {
  return (
    <LearningCatalogPage<Education>
      kind="education"
      title="Eğitimler"
      description="Eğitim türlerini, açıklamaları ve kullanım durumlarını yönetin."
      createLabel="Eğitim ekle"
      fields={EducationFields}
      columns={(_catalog, usage) => [
        { accessorKey: 'name', header: 'Eğitim' },
        {
          accessorKey: 'type',
          header: 'Eğitim tipi',
          cell: ({ row }) => typeLabel(row.original.type),
        },
        {
          accessorKey: 'description',
          header: 'Açıklama',
          cell: ({ row }) => row.original.description || '—',
        },
        {
          id: 'pricingCount',
          header: 'Fiyat paketi',
          cell: ({ row }) =>
            usage.plans.filter(
              (plan) => plan.educationId === row.original.id || plan.course === row.original.name,
            ).length,
        },
        {
          id: 'activeStudents',
          header: 'Aktif öğrenci',
          cell: ({ row }) =>
            usage.students.filter(
              (student) => student.course === row.original.name && student.status === 'Aktif',
            ).length,
        },
      ]}
      preview={(value, _catalog, usage) => [
        ['Ad', value.name],
        ['Eğitim tipi', typeLabel(value.type)],
        [
          'Ders sayısı',
          value.lessonCount === undefined ? 'Belirtilmedi' : String(value.lessonCount),
        ],
        [
          'Fiyat paketi',
          String(
            usage.plans.filter(
              (plan) => plan.educationId === value.id || plan.course === value.name,
            ).length,
          ),
        ],
        [
          'Aktif öğrenci',
          String(
            usage.students.filter(
              (student) => student.course === value.name && student.status === 'Aktif',
            ).length,
          ),
        ],
        ['Seviyeler', value.levels.map((level) => level.name).join(', ') || 'Belirtilmedi'],
      ]}
    />
  );
}
