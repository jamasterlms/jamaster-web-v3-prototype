import { isDate } from '../../lib/validation.ts';
import type { CatalogLevel as GlobalLevel } from './level-model.ts';

export const learningKinds = ['education', 'period', 'program-terms', 'curriculum-units'] as const;
export type LearningKind = (typeof learningKinds)[number];
export type LearningRows = Record<string, string[][]>;
export const educationTypeOptions = [
  { value: 'GROUPS', label: 'Grup' },
  { value: 'PRIVATE', label: 'Özel ders' },
  { value: 'BUSINESS', label: 'Kurumsal' },
  { value: 'KIDS', label: 'Çocuk' },
  { value: 'OTHER', label: 'Diğer' },
];
export const periodTypeOptions = [
  { value: 'WEEK', label: 'Hafta' },
  { value: 'MONTH', label: 'Ay' },
];
export type CatalogLevel = { id: string; name: string; subLevels: { id: string; name: string }[] };
type CatalogBase = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt?: string;
  legacyCells?: string[];
};
export type Education = CatalogBase & {
  kind: 'education';
  type: 'GROUPS' | 'PRIVATE' | 'BUSINESS' | 'KIDS' | 'OTHER' | '';
  levels: CatalogLevel[];
  lessonCount?: number;
};
export type EducationPeriod = CatalogBase & {
  kind: 'period';
  periodType: 'WEEK' | 'MONTH' | '';
  periodValue?: number;
  bonusCount: number;
};
export type ProgramTerm = CatalogBase & {
  kind: 'program-terms';
  startDate: string;
  endDate: string;
  programId: string;
  termId: string;
  educationId: string;
};
export type CurriculumUnit = CatalogBase & {
  kind: 'curriculum-units';
  programTermId: string;
  educationId: string;
  levelId: string;
  subLevelId: string;
  levelLinkResolved?: boolean;
  order: number;
  lessonCount?: number;
};
export type LearningRecord = Education | EducationPeriod | ProgramTerm | CurriculumUnit;
export type NamedCatalogOption = { id: string; name: string; isActive: boolean };
export type LearningCatalog = {
  educations: Education[];
  periods: EducationPeriod[];
  programTerms: ProgramTerm[];
  units: CurriculumUnit[];
  programs: NamedCatalogOption[];
  academicTerms: NamedCatalogOption[];
  levels?: GlobalLevel[];
};

const educationNameKey = (name: string) =>
  name.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr-TR');
const uniqueEducationByName = (educations: Education[], name: string) => {
  const matches = educations.filter(
    (education) => educationNameKey(education.name) === educationNameKey(name),
  );
  return matches.length === 1 ? matches[0] : undefined;
};

/** Name-only legacy references are usable only when they identify one education. */
export function matchesEducationReference(
  reference: { course: string; educationId?: string },
  education: Education,
  catalog: LearningCatalog,
) {
  if (reference.educationId) return reference.educationId === education.id;
  return uniqueEducationByName(catalog.educations, reference.course)?.id === education.id;
}

function legacyEventNamesEducation(
  event: { educationId?: string },
  education: Education,
  catalog: LearningCatalog,
) {
  return (
    !!event.educationId &&
    !catalog.educations.some((record) => record.id === event.educationId) &&
    educationNameKey(event.educationId) === educationNameKey(education.name)
  );
}

/** Canonicalize only a uniquely identified legacy name; preserve every other event field. */
export function canonicalizeLearningEventEducation<T extends { educationId?: string }>(
  event: T,
  catalog: LearningCatalog,
): T {
  if (!event.educationId || catalog.educations.some((record) => record.id === event.educationId))
    return event;
  const education = uniqueEducationByName(catalog.educations, event.educationId);
  return education ? { ...event, educationId: education.id } : event;
}

function fingerprint(text: string) {
  let hash = 2166136261;
  for (const character of text) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return (hash >>> 0).toString(36);
}
const active = (label?: string) =>
  !['Pasif', 'Tamamlandı', 'INACTIVE', 'false'].includes(label || '');
function rowId(kind: LearningKind, row: string[]) {
  if (row[5]) return row[5];
  // This ID was already exposed by pricing selectors before catalog metadata existed.
  if (kind === 'period' && row[0] === '2026 Güz') return '2026-fall';
  return `${kind}-${fingerprint(JSON.stringify(row.slice(0, 5)))}`;
}
function metadata(row: string[]): Partial<LearningRecord> {
  try {
    const parsed = JSON.parse(row[6] || '{}');
    return parsed?.version === 1 && parsed.record && typeof parsed.record === 'object'
      ? parsed.record
      : {};
  } catch {
    return {};
  }
}
function storedLessonCount(row: string[]) {
  const saved = metadata(row) as Partial<Education | CurriculumUnit>;
  return Object.hasOwn(saved, 'lessonCount') ? (saved.lessonCount ?? undefined) : count(row[2]);
}
export function learningDate(value = '') {
  if (isDate(value.slice(0, 10))) return value.slice(0, 10);
  const [day, month, year] = value.split(' ');
  const index = [
    'Ocak',
    'Şubat',
    'Mart',
    'Nisan',
    'Mayıs',
    'Haziran',
    'Temmuz',
    'Ağustos',
    'Eylül',
    'Ekim',
    'Kasım',
    'Aralık',
  ].indexOf(month);
  const result = `${year}-${String(index + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return index >= 0 && isDate(result) ? result : '';
}
const count = (value = '') => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
};

export function readLearningCatalog(rows: LearningRows, seeds: LearningRows = {}): LearningCatalog {
  const raw = (key: string) => rows[key] ?? seeds[key] ?? [];
  const base = (kind: LearningKind, row: string[]) => ({
    id: rowId(kind, row),
    name: row[0] || '',
    description: '',
    isActive: active(row[4]),
    legacyCells: row.slice(0, 5),
  });
  const educations: Education[] = raw('education').map((row) => {
    const id = rowId('education', row);
    return {
      ...base('education', row),
      type: '',
      levels: (row[1] || '')
        .split(/\s*[·,]\s*/)
        .filter(Boolean)
        .map((name) => ({ id: `${id}:level:${fingerprint(name)}`, name, subLevels: [] })),
      ...metadata(row),
      lessonCount: storedLessonCount(row),
      kind: 'education',
      id,
    } as Education;
  });
  const periods: EducationPeriod[] = raw('period').map(
    (row) =>
      ({
        ...base('period', row),
        periodType: '',
        periodValue: undefined,
        bonusCount: 0,
        ...metadata(row),
        kind: 'period',
        id: rowId('period', row),
      }) as EducationPeriod,
  );
  const programTerms: ProgramTerm[] = raw('program-terms').map(
    (row) =>
      ({
        ...base('program-terms', row),
        startDate: learningDate(row[2]),
        endDate: learningDate(row[3]),
        programId: '',
        termId: '',
        educationId: uniqueEducationByName(educations, row[1] || '')?.id || '',
        ...metadata(row),
        kind: 'program-terms',
        id: rowId('program-terms', row),
      }) as ProgramTerm,
  );
  const units: CurriculumUnit[] = raw('curriculum-units').map((row) => {
    const [educationName, levelName] = (row[1] || '').split(/\s*\/\s*/);
    const education = uniqueEducationByName(educations, educationName);
    const saved = metadata(row) as Partial<CurriculumUnit>;
    return {
      ...base('curriculum-units', row),
      programTermId: '',
      educationId: education?.id || '',
      levelId: education?.levels.find((level) => level.name === levelName)?.id || '',
      subLevelId: '',
      order: count(row[3]) ?? 0,
      ...saved,
      lessonCount: storedLessonCount(row),
      levelLinkResolved: saved.levelLinkResolved ?? Object.hasOwn(saved, 'levelId'),
      kind: 'curriculum-units',
      id: rowId('curriculum-units', row),
    } as CurriculumUnit;
  });
  const named = (key: string): NamedCatalogOption[] =>
    raw(key).map((row) => ({
      id: row[5] || `${key}-${fingerprint(JSON.stringify(row.slice(0, 5)))}`,
      name: row[0] || '',
      isActive: active(row[4]),
    }));
  return {
    educations,
    periods,
    programTerms,
    units,
    programs: named('programs'),
    academicTerms: named('academic-terms'),
  };
}

/** Upgrade only exact observed legacy names; global level identity is independent of education. */
export function linkLearningLevels(
  catalog: LearningCatalog,
  levels: GlobalLevel[],
): LearningCatalog & { levels: GlobalLevel[] } {
  return {
    ...catalog,
    levels,
    units: catalog.units.map((unit) => {
      if (levels.some((level) => level.id === unit.levelId)) return unit;
      const previous = catalog.educations
        .find((education) => education.id === unit.educationId)
        ?.levels.find((level) => level.id === unit.levelId);
      if (!previous && unit.levelLinkResolved) return unit;
      const name = previous?.name || unit.legacyCells?.[1]?.split(/\s*\/\s*/)[1];
      const level = levels.find((candidate) => candidate.name === name);
      if (!level) return unit;
      const subName = previous?.subLevels.find((sub) => sub.id === unit.subLevelId)?.name;
      return {
        ...unit,
        levelId: level.id,
        levelLinkResolved: true,
        subLevelId: level.subLevels.find((sub) => sub.title === subName)?.id || unit.subLevelId,
      };
    }),
  };
}

export function learningRecords(catalog: LearningCatalog, kind: LearningKind): LearningRecord[] {
  return kind === 'education'
    ? catalog.educations
    : kind === 'period'
      ? catalog.periods
      : kind === 'program-terms'
        ? catalog.programTerms
        : catalog.units;
}
export function learningRecordToRow(record: LearningRecord, previous?: string[]) {
  const row = [...(previous || record.legacyCells || ['', '', '', '', ''])];
  row[0] = record.name;
  if (record.kind === 'education') {
    row[1] = record.levels.map((level) => level.name).join(' · ');
    if (record.lessonCount !== undefined) row[2] = `${record.lessonCount} ders`;
  } else if (record.kind === 'program-terms') {
    row[2] = record.startDate;
    row[3] = record.endDate;
  } else if (record.kind === 'curriculum-units') {
    if (record.lessonCount !== undefined) row[2] = `${record.lessonCount} ders`;
    row[3] = String(record.order);
  }
  row[4] =
    row[4] && active(row[4]) === record.isActive ? row[4] : record.isActive ? 'Aktif' : 'Pasif';
  row[5] = record.id;
  // JSON omits undefined; persist a null marker so a cleared optional value wins over old cells.
  const stored =
    record.kind === 'education' || record.kind === 'curriculum-units'
      ? { ...record, lessonCount: record.lessonCount ?? null }
      : record;
  row[6] = JSON.stringify({ version: 1, record: stored });
  return row;
}
export function saveLearningRecord(
  rows: LearningRows,
  seeds: LearningRows,
  record: LearningRecord,
): LearningRows {
  if (record.kind === 'curriculum-units') record = { ...record, levelLinkResolved: true };
  const catalog = readLearningCatalog(rows, seeds);
  const next = { ...rows };
  // Materialize every linked identity before a rename or insertion can change legacy fingerprints.
  for (const kind of learningKinds) {
    const sourceRows = rows[kind] ?? seeds[kind] ?? [];
    const records = learningRecords(catalog, kind);
    const exists = records.some((item) => item.id === record.id);
    next[kind] = records.map((item, i) =>
      learningRecordToRow(
        kind === record.kind && item.id === record.id ? record : item,
        sourceRows[i],
      ),
    );
    if (kind === record.kind && !exists) next[kind].unshift(learningRecordToRow(record));
  }
  return next;
}
export function removeLearningRecord(
  rows: LearningRows,
  seeds: LearningRows,
  record: LearningRecord,
) {
  const next = saveLearningRecord(rows, seeds, record);
  next[record.kind] = next[record.kind].filter((row) => row[5] !== record.id);
  return next;
}
export function newLearningRecord(kind: LearningKind, id: string): LearningRecord {
  const base = {
    id,
    name: '',
    description: '',
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  if (kind === 'education') return { ...base, kind, type: 'GROUPS', levels: [] };
  if (kind === 'period')
    return { ...base, kind, periodType: 'MONTH', periodValue: 1, bonusCount: 0 };
  if (kind === 'program-terms')
    return {
      ...base,
      kind,
      startDate: '',
      endDate: '',
      programId: '',
      termId: '',
      educationId: '',
    };
  return {
    ...base,
    kind,
    programTermId: '',
    educationId: '',
    levelId: '',
    subLevelId: '',
    order: 0,
  };
}

export type LearningIssue = { field: string; message: string };
export function validateLearningRecord(
  record: LearningRecord,
  catalog: LearningCatalog,
  previous?: LearningRecord,
  context?: Pick<LearningUsageContext, 'events'>,
): LearningIssue | null {
  const issue = (field: string, message: string) => ({ field, message });
  if (!record.name.trim()) return issue('name', 'Adı girin.');
  if (record.kind === 'education') {
    const old =
      previous?.kind === 'education' && previous.id === record.id
        ? previous
        : catalog.educations.find((education) => education.id === record.id);
    if (
      old &&
      old.name !== record.name &&
      !uniqueEducationByName(catalog.educations, old.name) &&
      context?.events?.some((event) => legacyEventNamesEducation(event, old, catalog))
    )
      return issue(
        'name',
        'Aynı eğitim adına bağlı eski ders kayıtları var. Önce derslerin eğitim bağlantısını düzeltin.',
      );
    if (
      (!old || educationNameKey(old.name) !== educationNameKey(record.name)) &&
      catalog.educations.some(
        (education) =>
          education.id !== record.id &&
          educationNameKey(education.name) === educationNameKey(record.name),
      )
    )
      return issue('name', 'Bu eğitim adı zaten kullanılıyor. Farklı bir ad girin.');
    if (!educationTypeOptions.some((option) => option.value === record.type))
      return issue('type', 'Eğitim tipini seçin.');
    if (previous?.kind === 'education' && previous.type && previous.type !== record.type)
      return issue(
        'type',
        'Kaydedilen eğitim tipi değiştirilemez. Yeni bir eğitim oluşturabilirsiniz.',
      );
  }
  if (record.kind === 'period') {
    if (!['WEEK', 'MONTH'].includes(record.periodType))
      return issue('periodType', 'Hafta veya ay seçin.');
    if (!Number.isInteger(record.periodValue) || Number(record.periodValue) < 1)
      return issue('periodValue', 'Süre en az 1 tam sayı olmalıdır.');
    if (!Number.isInteger(record.bonusCount) || record.bonusCount < 0)
      return issue('bonusCount', 'Bonus sayısı sıfır veya pozitif tam sayı olmalıdır.');
    if (
      previous?.kind === 'period' &&
      previous.periodType &&
      (previous.periodType !== record.periodType || previous.periodValue !== record.periodValue)
    )
      return issue(
        'periodValue',
        'Kaydedilen dönem süresi değiştirilemez. Yeni bir dönem oluşturabilirsiniz.',
      );
  }
  if (record.kind === 'program-terms') {
    if (!isDate(record.startDate)) return issue('startDate', 'Geçerli bir başlangıç tarihi seçin.');
    if (!isDate(record.endDate) || record.endDate <= record.startDate)
      return issue('endDate', 'Bitiş tarihi başlangıçtan sonra olmalıdır.');
    for (const [field, value, options] of [
      ['programId', record.programId, catalog.programs],
      ['termId', record.termId, catalog.academicTerms],
    ] as const) {
      if (
        value &&
        !options.some((option) => option.id === value) &&
        !(previous?.kind === 'program-terms' && previous[field] === value)
      )
        return issue(field, 'Kayıtlı bir seçenek seçin.');
    }
  }
  if (record.kind === 'curriculum-units') {
    const old = previous?.kind === 'curriculum-units' ? previous : undefined;
    if (
      !record.programTermId ||
      !catalog.programTerms.some((term) => term.id === record.programTermId)
    )
      return issue('programTermId', 'Kayıtlı bir program dönemi seçin.');
    if (old?.programTermId && old.programTermId !== record.programTermId)
      return issue(
        'programTermId',
        'Birim başka bir program dönemine taşınamaz. Yeni bir birim oluşturabilirsiniz.',
      );
    if (!Number.isInteger(record.order) || record.order < 0)
      return issue('order', 'Sıra sıfır veya pozitif tam sayı olmalıdır.');
    const levels = catalog.levels ?? catalog.educations.flatMap((education) => education.levels);
    if (record.levelId && !levels.some((level) => level.id === record.levelId))
      return issue('levelId', 'Kayıtlı bir seviye seçin.');
    if (
      record.subLevelId &&
      !levels
        .find((level) => level.id === record.levelId)
        ?.subLevels.some((sub) => sub.id === record.subLevelId)
    )
      return issue('subLevelId', 'Seçilen seviyeye ait bir alt seviye seçin.');
  }
  if (
    (record.kind === 'program-terms' || record.kind === 'curriculum-units') &&
    record.educationId &&
    !catalog.educations.some((e) => e.id === record.educationId)
  )
    return issue('educationId', 'Kayıtlı bir eğitim seçin.');
  if (
    (record.kind === 'education' || record.kind === 'curriculum-units') &&
    record.lessonCount !== undefined &&
    (!Number.isInteger(record.lessonCount) || record.lessonCount < 0)
  )
    return issue('lessonCount', 'Ders sayısı sıfır veya pozitif tam sayı olmalıdır.');
  return null;
}

export type LearningUsageContext = {
  plans: { course: string; educationId?: string; periodId?: string }[];
  groups: { course: string; educationId?: string; programTermId?: string }[];
  students: { course: string; status: string }[];
  events?: { educationId?: string }[];
};
export function learningDeleteReason(
  record: LearningRecord,
  catalog: LearningCatalog,
  context: LearningUsageContext,
): string | null {
  if (record.kind === 'education') {
    if (
      context.events?.some(
        (event) =>
          event.educationId === record.id || legacyEventNamesEducation(event, record, catalog),
      )
    )
      return 'Ders kayıtları bu eğitime bağlı. Geçmiş bağlantıları korumak için silmek yerine pasife alabilirsiniz.';
    const count = context.plans.filter(
      (r) => r.educationId === record.id || r.course === record.name,
    ).length;
    if (count)
      return `${count} fiyat paketinde kullanılıyor. Yeni seçimleri durdurmak için pasife alın.`;
    if (
      context.groups.some((r) => r.educationId === record.id || r.course === record.name) ||
      context.students.some((r) => r.course === record.name) ||
      catalog.units.some((r) => r.educationId === record.id) ||
      catalog.programTerms.some((r) => r.educationId === record.id)
    )
      return 'Öğrenci, grup veya program kayıtları bu eğitime bağlı. Silmek yerine pasife alabilirsiniz.';
  }
  if (record.kind === 'period' && context.plans.some((r) => r.periodId === record.id))
    return 'Bu dönem fiyat paketinde kullanılıyor. Silmek yerine pasife alabilirsiniz.';
  if (record.kind === 'program-terms') {
    if (catalog.units.some((r) => r.programTermId === record.id))
      return 'Bu program dönemine bağlı müfredat birimleri var. Silmek yerine pasife alabilirsiniz.';
    if (context.groups.some((r) => r.programTermId === record.id))
      return 'Bu program dönemine bağlı gruplar var. Silmek yerine pasife alabilirsiniz.';
  }
  return null;
}
