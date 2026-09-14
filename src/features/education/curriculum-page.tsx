import { LearningCatalogPage } from './learning-catalog-page';
import {
  CatalogChoice,
  CatalogExtras,
  CatalogInput,
  CatalogSection,
  type LearningFieldProps,
} from './learning-form';
import type { CurriculumUnit } from './learning-model';

function CurriculumFields({
  value,
  onChange,
  previous,
  catalog,
  issue,
}: LearningFieldProps<CurriculumUnit>) {
  const levels = catalog.levels || [];
  const level = levels.find((record) => record.id === value.levelId);
  return (
    <>
      <CatalogSection title="Müfredat birimi">
        <div className="form-grid">
          <CatalogInput
            field="name"
            label="Birim başlığı *"
            value={value.name}
            required
            onChange={(name) => onChange({ ...value, name })}
            issue={issue}
          />
          <CatalogChoice
            field="programTermId"
            label="Program dönemi *"
            value={value.programTermId}
            required
            disabled={!!previous?.programTermId}
            options={catalog.programTerms
              .filter((record) => record.isActive || record.id === value.programTermId)
              .map((record) => ({ value: record.id, label: record.name }))}
            onChange={(programTermId) => {
              const term = catalog.programTerms.find((record) => record.id === programTermId);
              onChange({ ...value, programTermId, educationId: term?.educationId || '' });
            }}
            issue={issue}
          />
        </div>
        {previous?.programTermId && (
          <p className="field-hint">
            Program dönemi kayıt sonrasında değişmez. Başka bir dönem için yeni birim
            oluşturabilirsiniz.
          </p>
        )}
        {!catalog.programTerms.some((record) => record.isActive) && !value.programTermId && (
          <p className="field-hint">
            Önce Program dönemleri sayfasından aktif bir dönem oluşturun.
          </p>
        )}
      </CatalogSection>
      <CatalogExtras value={value} onChange={onChange}>
        <div className="form-grid">
          <CatalogInput
            field="order"
            label="Sıra"
            type="number"
            min={0}
            step={1}
            value={Number.isFinite(value.order) ? value.order : ''}
            onChange={(text) => onChange({ ...value, order: text === '' ? 0 : Number(text) })}
            issue={issue}
          />
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
          <CatalogChoice
            field="levelId"
            label="Seviye"
            value={value.levelId}
            options={levels
              .filter(
                (record) => (record.isActive && !record.deletedAt) || record.id === value.levelId,
              )
              .map((record) => ({ value: record.id, label: record.name }))}
            onChange={(levelId) => onChange({ ...value, levelId, subLevelId: '' })}
            issue={issue}
          />
          <CatalogChoice
            field="subLevelId"
            label="Alt seviye"
            value={value.subLevelId}
            disabled={!level}
            options={(level?.subLevels || [])
              .filter(
                (record) =>
                  (record.isActive && !record.deletedAt) || record.id === value.subLevelId,
              )
              .map((record) => ({ value: record.id, label: record.title }))}
            onChange={(subLevelId) => onChange({ ...value, subLevelId })}
            issue={issue}
          />
        </div>
        {value.legacyCells?.[1] && !value.educationId && (
          <p className="field-hint">
            Önceki eğitim / seviye bilgisi: {value.legacyCells[1]}. İlişki kurmak için kayıtlı
            eğitimi seçin.
          </p>
        )}
      </CatalogExtras>
    </>
  );
}
export function CurriculumPage() {
  return (
    <LearningCatalogPage<CurriculumUnit>
      kind="curriculum-units"
      title="Müfredat birimleri"
      description="Birimleri program dönemine bağlayın; sıralama, içerik ve ders planını yönetin."
      createLabel="Müfredat birimi ekle"
      fields={CurriculumFields}
      columns={(catalog) => [
        { accessorKey: 'name', header: 'Birim başlığı' },
        {
          id: 'programTerm',
          header: 'Program dönemi',
          cell: ({ row }) =>
            catalog.programTerms.find((record) => record.id === row.original.programTermId)?.name ||
            'Bağlantı belirtilmedi',
        },
        { accessorKey: 'order', header: 'Sıra' },
        {
          accessorKey: 'lessonCount',
          header: 'Ders sayısı',
          cell: ({ row }) => row.original.lessonCount ?? '—',
        },
        {
          id: 'education',
          header: 'Eğitim / seviye',
          cell: ({ row }) => {
            const education = catalog.educations.find(
              (record) => record.id === row.original.educationId,
            );
            return education
              ? [
                  education.name,
                  catalog.levels?.find((record) => record.id === row.original.levelId)?.name,
                ]
                  .filter(Boolean)
                  .join(' / ')
              : row.original.legacyCells?.[1] || '—';
          },
        },
      ]}
      preview={(value, catalog) => {
        const education = catalog.educations.find((record) => record.id === value.educationId);
        const level = catalog.levels?.find((record) => record.id === value.levelId);
        return [
          ['Ad', value.name],
          [
            'Program dönemi',
            catalog.programTerms.find((record) => record.id === value.programTermId)?.name ||
              'Bağlantı belirtilmedi',
          ],
          ['Sıra', String(value.order)],
          [
            'Ders sayısı',
            value.lessonCount === undefined ? 'Belirtilmedi' : String(value.lessonCount),
          ],
          ['Eğitim', education?.name || 'Belirtilmedi'],
          ['Seviye', level?.name || 'Belirtilmedi'],
          [
            'Alt seviye',
            level?.subLevels.find((record) => record.id === value.subLevelId)?.title ||
              'Belirtilmedi',
          ],
        ];
      }}
    />
  );
}
