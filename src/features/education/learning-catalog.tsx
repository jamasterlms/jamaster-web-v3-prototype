import { useWorkspace } from '@/app/workspace-provider';
import { operationalData } from '@/data/institution';
import { useOperations } from '@/features/operations/operations-provider';
import {
  learningKinds,
  canonicalizeLearningEventEducation,
  linkLearningLevels,
  matchesEducationReference,
  readLearningCatalog,
  removeLearningRecord,
  saveLearningRecord,
  type LearningRecord,
  type LearningRows,
} from './learning-model';
import { useLevelCatalog } from './level-catalog';

export const learningSeedRows: LearningRows = Object.fromEntries(
  learningKinds.map((kind) => [kind, operationalData[kind]?.rows || []]),
);

/** Choice-only consumers need no OperationsProvider. */
export function useLearningData() {
  const { state } = useWorkspace();
  return linkLearningLevels(
    readLearningCatalog(state.moduleRows, learningSeedRows),
    useLevelCatalog(),
  );
}

/** Shared live catalog boundary for group, registration and pricing selectors. */
export function useLearningCatalog() {
  const { state, dispatch } = useWorkspace();
  const { operations, save } = useOperations();
  const catalog = useLearningData();
  const write = (rows: LearningRows) => {
    for (const key of learningKinds) dispatch({ type: 'module/rows', key, rows: rows[key] });
  };
  const saveRecord = (record: LearningRecord) => {
    // Use the pre-rename catalog while converting the old lesson selector's name values to IDs.
    for (const event of state.events) {
      const canonical = canonicalizeLearningEventEducation(event, catalog);
      if (canonical !== event) dispatch({ type: 'event/save', event: canonical });
    }
    write(saveLearningRecord(state.moduleRows, learningSeedRows, record));
    if (record.kind !== 'education') return;
    const previous = catalog.educations.find((item) => item.id === record.id);
    if (!previous || previous.name === record.name) return;
    // Legacy consumers still use course names. Update current linked records atomically per store.
    for (const group of operations.groups.filter((item) =>
      matchesEducationReference(item, previous, catalog),
    ))
      save({ type: 'save', collection: 'groups', record: { ...group, course: record.name } });
    for (const plan of operations.plans.filter((item) =>
      matchesEducationReference(item, previous, catalog),
    ))
      save({ type: 'save', collection: 'plans', record: { ...plan, course: record.name } });
    for (const student of state.students.filter((item) =>
      matchesEducationReference(item, previous, catalog),
    ))
      dispatch({
        type: 'student/save',
        student: {
          ...student,
          course: record.name,
          profile: { ...student.profile, course: record.name },
        },
      });
  };
  return {
    catalog,
    saveRecord,
    removeRecord: (record: LearningRecord) =>
      write(removeLearningRecord(state.moduleRows, learningSeedRows, record)),
    usage: {
      plans: operations.plans,
      groups: operations.groups,
      students: state.students,
      events: state.events,
    },
  };
}
