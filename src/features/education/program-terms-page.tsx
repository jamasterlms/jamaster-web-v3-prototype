import { LearningCatalogPage } from './learning-catalog-page';
import {
  CatalogChoice,
  CatalogExtras,
  CatalogInput,
  CatalogSection,
  type LearningFieldProps,
} from './learning-form';
import type { ProgramTerm } from './learning-model';

const showDate = (date: string) => (date ? date.split('-').reverse().join('.') : 'Belirtilmedi');
function ProgramTermFields({ value, onChange, catalog, issue }: LearningFieldProps<ProgramTerm>) {
  return (
    <>
      <CatalogSection title="Program takvimi">
        <div className="form-grid">
          <CatalogInput
            field="name"
            label="Program dönemi adı *"
            value={value.name}
            required
            onChange={(name) => onChange({ ...value, name })}
            issue={issue}
          />
          <CatalogInput
            field="startDate"
            label="Başlangıç tarihi *"
            type="date"
            value={value.startDate}
            required
            onChange={(startDate) => onChange({ ...value, startDate })}
            issue={issue}
          />
          <CatalogInput
            field="endDate"
            label="Bitiş tarihi *"
            type="date"
            value={value.endDate}
            required
            onChange={(endDate) => onChange({ ...value, endDate })}
            issue={issue}
          />
        </div>
      </CatalogSection>
      <CatalogExtras value={value} onChange={onChange}>
        <div className="form-grid">
          <CatalogChoice
            field="programId"
            label="Program"
            value={value.programId}
            options={catalog.programs
              .filter((record) => record.isActive || record.id === value.programId)
              .map((record) => ({ value: record.id, label: record.name }))}
            onChange={(programId) => onChange({ ...value, programId })}
            issue={issue}
          />
          <CatalogChoice
            field="termId"
            label="Akademik dönem"
            value={value.termId}
            options={catalog.academicTerms
              .filter((record) => record.isActive || record.id === value.termId)
              .map((record) => ({ value: record.id, label: record.name }))}
            onChange={(termId) => onChange({ ...value, termId })}
            issue={issue}
          />
          <CatalogChoice
            field="educationId"
            label="İlişkili eğitim"
            value={value.educationId}
            options={catalog.educations
              .filter((record) => record.isActive || record.id === value.educationId)
              .map((record) => ({ value: record.id, label: record.name }))}
            onChange={(educationId) => onChange({ ...value, educationId })}
            issue={issue}
          />
        </div>
        {(!catalog.programs.length || !catalog.academicTerms.length) && (
          <p className="field-hint">
            Program veya akademik dönem kaydı bulunmadığında bu seçimleri boş bırakabilirsiniz.
          </p>
        )}
      </CatalogExtras>
    </>
  );
}
export function ProgramTermsPage() {
  return (
    <LearningCatalogPage<ProgramTerm>
      kind="program-terms"
      title="Program dönemleri"
      description="Program başlangıç ve bitiş tarihlerini, isteğe bağlı program ilişkilerini yönetin."
      createLabel="Program dönemi ekle"
      fields={ProgramTermFields}
      columns={(catalog) => [
        { accessorKey: 'name', header: 'Program dönemi' },
        {
          accessorKey: 'startDate',
          header: 'Başlangıç',
          cell: ({ row }) => showDate(row.original.startDate),
        },
        {
          accessorKey: 'endDate',
          header: 'Bitiş',
          cell: ({ row }) => showDate(row.original.endDate),
        },
        {
          id: 'education',
          header: 'İlişkili eğitim',
          cell: ({ row }) =>
            catalog.educations.find((education) => education.id === row.original.educationId)
              ?.name || '—',
        },
      ]}
      preview={(value, catalog) => [
        ['Ad', value.name],
        ['Başlangıç', showDate(value.startDate)],
        ['Bitiş', showDate(value.endDate)],
        [
          'Program',
          catalog.programs.find((record) => record.id === value.programId)?.name ||
            value.programId ||
            'Belirtilmedi',
        ],
        [
          'Akademik dönem',
          catalog.academicTerms.find((record) => record.id === value.termId)?.name ||
            value.termId ||
            'Belirtilmedi',
        ],
        [
          'İlişkili eğitim',
          catalog.educations.find((record) => record.id === value.educationId)?.name ||
            'Belirtilmedi',
        ],
      ]}
    />
  );
}
