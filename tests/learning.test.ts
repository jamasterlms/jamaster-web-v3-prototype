import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readLevelCatalog,
  validateLevelCatalog,
  removeCatalogLevel,
  removeCatalogSubLevel,
} from '../src/features/education/level-model.ts';
import {
  readLearningCatalog,
  linkLearningLevels,
  saveLearningRecord,
  validateLearningRecord,
  learningDeleteReason,
  matchesEducationReference,
  canonicalizeLearningEventEducation,
  type Education,
  type EducationPeriod,
  type ProgramTerm,
  type CurriculumUnit,
} from '../src/features/education/learning-model.ts';

const seeds = {
  education: [['Genel İngilizce', 'A1 · A2', '120 ders', '156 öğrenci', 'Aktif']],
  period: [['2026 Güz', '1 Eylül 2026', '31 Aralık 2026', 'Tüm eğitimler', 'Aktif']],
  'program-terms': [['Güz programı', 'Genel İngilizce', '7 Eylül 2026', '27 Kasım 2026', 'Aktif']],
  'curriculum-units': [['Hello', 'Genel İngilizce / A2', '8 ders', '01', 'Aktif']],
};
const education: Education = {
  kind: 'education',
  id: 'edu-1',
  name: 'İngilizce',
  type: 'GROUPS',
  description: '',
  isActive: true,
  levels: [],
};
const period: EducationPeriod = {
  kind: 'period',
  id: 'period-1',
  name: '12 hafta',
  periodType: 'WEEK',
  periodValue: 12,
  bonusCount: 0,
  description: '',
  isActive: true,
};
const term: ProgramTerm = {
  kind: 'program-terms',
  id: 'term-1',
  name: 'Güz',
  startDate: '2026-09-01',
  endDate: '2026-12-01',
  programId: '',
  termId: '',
  educationId: '',
  description: '',
  isActive: true,
};
const unit: CurriculumUnit = {
  kind: 'curriculum-units',
  id: 'unit-1',
  name: 'Hello',
  programTermId: 'term-1',
  educationId: '',
  levelId: '',
  subLevelId: '',
  order: 0,
  description: '',
  isActive: true,
};

test('legacy catalog IDs and original fields survive rename, reorder and structured round-trip', () => {
  const before = readLearningCatalog({}, seeds);
  assert.equal(before.periods[0].id, '2026-fall');
  assert.equal(
    before.periods[0].periodValue,
    undefined,
    'Calendar months must not be guessed as duration',
  );
  const next = saveLearningRecord({}, seeds, {
    ...before.educations[0],
    name: 'Genel İngilizce yeni',
  });
  const after = readLearningCatalog(next, seeds);
  assert.equal(after.educations[0].id, before.educations[0].id);
  assert.equal(
    next.education[0][3],
    '156 öğrenci',
    'Preserve historical cells without using them as editable counts',
  );
  assert.equal(after.units[0].educationId, before.educations[0].id);
  assert.equal(after.units[0].lessonCount, 8);
  assert.equal(after.programTerms[0].startDate, '2026-09-07');
  assert.equal(after.programTerms[0].endDate, '2026-11-27');
  const added = saveLearningRecord(next, seeds, education);
  const reordered = readLearningCatalog(
    { ...added, education: [...added.education].reverse() },
    seeds,
  );
  assert.equal(
    reordered.educations.find((record) => record.name === 'Genel İngilizce yeni')?.id,
    before.educations[0].id,
  );
  assert.equal(reordered.units[0].educationId, before.educations[0].id);
  assert.deepEqual(seeds.education[0], [
    'Genel İngilizce',
    'A1 · A2',
    '120 ders',
    '156 öğrenci',
    'Aktif',
  ]);
});

test('education duplicate names are rejected on create or rename while unchanged legacy duplicates keep their identities', () => {
  const first = { ...education, id: 'first', name: 'Genel İngilizce' };
  const second = { ...first, id: 'second' };
  const catalog = { ...readLearningCatalog({}, seeds), educations: [first, second] };
  assert.equal(
    validateLearningRecord({ ...education, id: 'new', name: '  GENEL   İNGİLİZCE ' }, catalog)
      ?.field,
    'name',
  );
  assert.equal(
    validateLearningRecord({ ...education, name: 'genel ingilizce' }, catalog, education)?.field,
    'name',
  );
  assert.equal(validateLearningRecord({ ...first, description: 'Changed' }, catalog, first), null);
  assert.equal(validateLearningRecord({ ...first, name: 'Fransızca' }, catalog, first), null);
  assert.equal(
    matchesEducationReference({ course: first.name }, first, catalog),
    false,
    'An ambiguous name does not identify the renamed education',
  );
  assert.equal(
    matchesEducationReference({ course: first.name, educationId: second.id }, first, catalog),
    false,
  );
  assert.equal(
    matchesEducationReference({ course: first.name, educationId: first.id }, first, catalog),
    true,
  );
  const legacy = readLearningCatalog(
    {
      education: [
        [...seeds.education[0], 'first'],
        [...seeds.education[0], 'second'],
      ],
    },
    seeds,
  );
  assert.equal(legacy.units[0].educationId, '');
  assert.equal(legacy.programTerms[0].educationId, '');
});

test('an explicitly cleared curriculum level remains cleared after save, reload and global linking', () => {
  const levels = readLevelCatalog(undefined, [{ level: 'A2' }]);
  const catalog = linkLearningLevels(readLearningCatalog({}, seeds), levels);
  assert.equal(catalog.units[0].levelId, levels[0].id);
  const cleared = { ...catalog.units[0], programTermId: term.id, levelId: '', subLevelId: '' };
  const rows = saveLearningRecord(saveLearningRecord({}, seeds, term), seeds, cleared);
  const saved = linkLearningLevels(readLearningCatalog(rows, seeds), levels);
  assert.equal(saved.units[0].levelId, '');
  assert.equal(saved.units[0].subLevelId, '');
  assert.equal(saved.units[0].legacyCells?.[1], 'Genel İngilizce / A2');
});

test('explicitly cleared lesson counts survive persistence while original legacy cells stay available', () => {
  const catalog = readLearningCatalog({}, seeds);
  let rows = saveLearningRecord({}, seeds, { ...catalog.educations[0], lessonCount: undefined });
  rows = saveLearningRecord(rows, seeds, { ...catalog.units[0], lessonCount: undefined });
  const saved = readLearningCatalog(rows, seeds);
  assert.equal(saved.educations[0].lessonCount, undefined);
  assert.equal(saved.units[0].lessonCount, undefined);
  assert.equal(saved.educations[0].legacyCells?.[2], '120 ders');
  assert.equal(saved.units[0].legacyCells?.[2], '8 ders');
  assert.equal(rows.education[0][2], '120 ders');
  assert.equal(rows['curriculum-units'][0][2], '8 ders');
});

test('a lesson education reference blocks deletion even without a matching group or other usage', () => {
  const catalog = { ...readLearningCatalog({}, seeds), educations: [education] };
  const context = {
    plans: [],
    groups: [],
    students: [],
    events: [{ educationId: education.id, status: 'CANCELLED' }],
  };
  assert.match(learningDeleteReason(education, catalog, context) || '', /ders/i);
  assert.equal(learningDeleteReason({ ...education, id: 'unused' }, catalog, context), null);
});

test('legacy lesson education names protect unique and ambiguous education records from deletion', () => {
  const catalog = readLearningCatalog({ education: seeds.education });
  const legacy = catalog.educations[0];
  const context = { plans: [], groups: [], students: [], events: [{ educationId: legacy.name }] };
  assert.match(learningDeleteReason(legacy, catalog, context) || '', /ders/i);
  const duplicate = { ...legacy, id: 'duplicate' };
  const ambiguous = { ...catalog, educations: [legacy, duplicate] };
  assert.match(learningDeleteReason(legacy, ambiguous, context) || '', /ders/i);
  assert.match(learningDeleteReason(duplicate, ambiguous, context) || '', /ders/i);
});

test('ambiguous legacy lesson names block education renames while stable event IDs remain unambiguous', () => {
  const first = { ...education, id: 'first' },
    second = { ...education, id: 'second' };
  const catalog = { ...readLearningCatalog({}, seeds), educations: [first, second] };
  const renamed = { ...first, name: 'Fransızca' };
  assert.equal(
    validateLearningRecord(renamed, catalog, first, { events: [{ educationId: first.name }] })
      ?.field,
    'name',
  );
  assert.equal(
    validateLearningRecord(first, catalog, first, { events: [{ educationId: first.name }] }),
    null,
  );
  assert.equal(
    validateLearningRecord(renamed, catalog, first, { events: [{ educationId: first.id }] }),
    null,
  );
});

test('canonicalized legacy lesson references retain all event fields and keep the deletion guard after education rename', () => {
  const rows = { education: seeds.education };
  const catalog = readLearningCatalog(rows);
  const original = catalog.educations[0];
  const event = {
    id: 71,
    educationId: original.name,
    title: 'Elective lesson',
    groupId: 'other-group',
    date: '2026-09-01',
    status: 'CANCELLED',
    notes: 'Preserve this history',
  };
  const canonical = canonicalizeLearningEventEducation(event, catalog);
  assert.deepEqual(canonical, { ...event, educationId: original.id });
  assert.equal(event.educationId, original.name, 'The input event is not mutated');
  const renamed = { ...original, name: 'Renamed elective' };
  const savedCatalog = readLearningCatalog(saveLearningRecord(rows, {}, renamed));
  assert.match(
    learningDeleteReason(savedCatalog.educations[0], savedCatalog, {
      plans: [],
      groups: [],
      students: [],
      events: [canonical],
    }) || '',
    /ders/i,
  );
  assert.equal(canonicalizeLearningEventEducation(canonical, savedCatalog), canonical);
  const ambiguous = { ...catalog, educations: [original, { ...original, id: 'duplicate' }] };
  assert.equal(canonicalizeLearningEventEducation(event, ambiguous), event);
});

test('education type is required on create and locked after it has been recorded', () => {
  const catalog = readLearningCatalog({}, seeds);
  assert.equal(validateLearningRecord(education, catalog), null);
  assert.equal(validateLearningRecord({ ...education, name: ' ' }, catalog)?.field, 'name');
  assert.equal(validateLearningRecord({ ...education, type: '' }, catalog)?.field, 'type');
  assert.equal(
    validateLearningRecord({ ...education, type: 'PRIVATE' }, catalog, education)?.field,
    'type',
  );
});

test('education periods store integer duration and bonuses; an existing duration is immutable', () => {
  const catalog = readLearningCatalog({}, seeds);
  assert.equal(validateLearningRecord(period, catalog), null);
  for (const value of [0, -1, 1.5, NaN])
    assert.equal(
      validateLearningRecord({ ...period, periodValue: value }, catalog)?.field,
      'periodValue',
    );
  for (const value of [-1, 0.5, NaN])
    assert.equal(
      validateLearningRecord({ ...period, bonusCount: value }, catalog)?.field,
      'bonusCount',
    );
  assert.equal(
    validateLearningRecord({ ...period, periodValue: 6 }, catalog, period)?.field,
    'periodValue',
  );
});

test('program terms require valid strictly increasing dates but may overlap another term', () => {
  const catalog = readLearningCatalog({}, seeds);
  assert.equal(validateLearningRecord(term, catalog), null);
  assert.equal(
    validateLearningRecord({ ...term, endDate: term.startDate }, catalog)?.field,
    'endDate',
  );
  assert.equal(
    validateLearningRecord({ ...term, startDate: '2026-02-30' }, catalog)?.field,
    'startDate',
  );
  assert.equal(validateLearningRecord({ ...term, startDate: '2026-10-01' }, catalog), null);
});

test('curriculum requires a real program term and rejects an unknown level', () => {
  const catalog = readLearningCatalog(saveLearningRecord({}, seeds, term), seeds);
  assert.equal(validateLearningRecord(unit, catalog), null);
  assert.equal(
    validateLearningRecord({ ...unit, programTermId: '' }, catalog)?.field,
    'programTermId',
  );
  assert.equal(
    validateLearningRecord({ ...unit, programTermId: 'missing' }, catalog)?.field,
    'programTermId',
  );
  assert.equal(validateLearningRecord({ ...unit, order: -1 }, catalog)?.field, 'order');
  assert.equal(
    validateLearningRecord({ ...unit, lessonCount: 1.5 }, catalog)?.field,
    'lessonCount',
  );
  const edu = catalog.educations[0];
  assert.equal(
    validateLearningRecord({ ...unit, educationId: edu.id, levelId: 'other-level' }, catalog)
      ?.field,
    'levelId',
  );
  assert.equal(
    validateLearningRecord({ ...unit, programTermId: catalog.programTerms[1].id }, catalog, unit)
      ?.field,
    'programTermId',
  );
});

test('curriculum level IDs use the global catalog independently of education and preserve observed legacy links', () => {
  const levels = readLevelCatalog(undefined, [
    { level: 'A1', subLevel: 'Starter' },
    { level: 'A2' },
  ]);
  const catalog = linkLearningLevels(
    readLearningCatalog(saveLearningRecord({}, seeds, term), seeds),
    levels,
  );
  assert.equal(catalog.units[0].levelId, levels[1].id);
  assert.equal(
    validateLearningRecord(
      { ...unit, educationId: '', levelId: levels[0].id, subLevelId: levels[0].subLevels[0].id },
      catalog,
    ),
    null,
  );
  assert.equal(
    validateLearningRecord(
      { ...unit, levelId: levels[1].id, subLevelId: levels[0].subLevels[0].id },
      catalog,
    )?.field,
    'subLevelId',
  );
  assert.equal(validateLearningRecord({ ...unit, levelId: 'unknown' }, catalog)?.field, 'levelId');
});

test('linked catalog records cannot be deleted; activation changes preserve links', () => {
  const rows = saveLearningRecord(saveLearningRecord({}, seeds, term), seeds, unit);
  const catalog = readLearningCatalog(rows, seeds);
  assert.match(
    learningDeleteReason(term, catalog, { plans: [], groups: [], students: [] }) || '',
    /müfredat/i,
  );
  assert.match(
    learningDeleteReason(period, catalog, {
      plans: [{ periodId: 'period-1', course: '' }],
      groups: [],
      students: [],
    }) || '',
    /fiyat/i,
  );
  assert.equal(learningDeleteReason(unit, catalog, { plans: [], groups: [], students: [] }), null);
  const updated = readLearningCatalog(
    saveLearningRecord(rows, seeds, { ...term, isActive: false }),
    seeds,
  );
  assert.equal(updated.units.find((r) => r.id === 'unit-1')?.programTermId, 'term-1');
});

test('global levels migrate only observed names and sublevels, without synthesizing suffixes', () => {
  const levels = readLevelCatalog(undefined, [
    { level: 'A1', subLevel: 'Starter' },
    { level: 'A1' },
    { level: 'C1' },
  ]);
  assert.deepEqual(
    levels.map((level) => [level.name, level.subLevels.map((sub) => sub.title)]),
    [
      ['A1', ['Starter']],
      ['C1', []],
    ],
  );
  assert.equal(levels[0].subLevels[0].levelId, levels[0].id);
  const saved = JSON.stringify({
    levels: [
      {
        ...levels[0],
        id: 'source-level',
        subLevels: [{ ...levels[0].subLevels[0], id: 'source-sub', levelId: 'source-level' }],
      },
    ],
  });
  assert.equal(readLevelCatalog(saved, [{ level: 'B2' }])[0].id, 'source-level');
  assert.equal(
    readLevelCatalog(saved, [{ level: 'B2' }]).length,
    1,
    'Stored catalog is authoritative; observations cannot reactivate deleted levels',
  );
});

test('global level validation rejects duplicate IDs and wrong sublevel parents', () => {
  const levels = readLevelCatalog(undefined, [
    { level: 'A1', subLevel: 'Starter' },
    { level: 'A2' },
  ]);
  assert.equal(validateLevelCatalog(levels), null);
  assert.ok(validateLevelCatalog([{ ...levels[0], name: ' ' }]));
  assert.ok(
    validateLevelCatalog([
      { ...levels[0], subLevels: [{ ...levels[0].subLevels[0], levelId: 'wrong' }] },
    ]),
  );
  assert.ok(validateLevelCatalog([levels[0], { ...levels[1], id: levels[0].id }]));
  assert.ok(validateLevelCatalog([{ ...levels[0], order: -1 }]));
});

test('removing levels keeps one level and renumbers retained levels and sublevels', () => {
  const levels = readLevelCatalog(undefined, [
    { level: 'A1', subLevel: 'First' },
    { level: 'A1', subLevel: 'Second' },
    { level: 'A2' },
  ]);
  const subs = removeCatalogSubLevel(levels, levels[0].id, levels[0].subLevels[0].id);
  assert.equal(subs[0].subLevels[0].title, 'Second');
  assert.equal(subs[0].subLevels[0].order, 1);
  const next = removeCatalogLevel(levels, levels[0].id);
  assert.equal(next[0].name, 'A2');
  assert.equal(next[0].order, 1);
  assert.equal(removeCatalogLevel(next, next[0].id).length, 1);
  assert.equal(levels[0].subLevels.length, 2);
});
