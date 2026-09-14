import { useWorkspace } from '@/app/workspace-provider';
import { operationalData } from '@/data/institution';
import { readLearningCatalog } from './learning-model';
import { readLevelCatalog, type ObservedLevel } from './level-model';

/** Read-only global level choices; safe without an OperationsProvider. */
export function useLevelCatalog() {
  const { state } = useWorkspace();
  const catalog = readLearningCatalog(state.moduleRows, {
    education: operationalData.education.rows,
  });
  const observed: ObservedLevel[] = [
    ...catalog.educations.flatMap((education) =>
      education.levels.flatMap((level) => [
        { level: level.name },
        ...level.subLevels.map((sub) => ({ level: level.name, subLevel: sub.name })),
      ]),
    ),
    ...state.students.map((student) => ({
      level: String(student.profile?.level || ''),
      subLevel: String(student.profile?.subLevel || ''),
    })),
  ];
  return readLevelCatalog(state.settings.levelCatalog, observed);
}
