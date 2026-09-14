import type { LearningGroup } from '../operations/model.ts';

// Older locally saved groups predate the explicit selectors. Hydrate once when opening the editor.
export function groupDraft(group: LearningGroup): LearningGroup {
  return {
    groupType: 'IN_PERSON',
    educationType: 'GROUPS',
    subLevel: '',
    dayPeriod: 'WEEKDAY',
    timePeriod: 'MORNING',
    ...group,
  };
}
