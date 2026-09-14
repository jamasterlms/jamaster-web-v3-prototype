type Selection = { level?: string; subLevel?: string };
export type SelectableLevel = {
  name: string;
  isActive: boolean;
  deletedAt?: string | null;
  subLevels: { title: string; isActive: boolean; deletedAt?: string | null }[];
};

/** Historical values may remain unchanged, but new assignments use the active catalog. */
export function levelSelectionErrors(
  value: Selection,
  levels: SelectableLevel[],
  previous?: Selection,
): Partial<Record<'level' | 'subLevel', string>> {
  if (previous && value.level === previous.level && value.subLevel === previous.subLevel) return {};
  if (!value.level) return value.subLevel ? { level: 'Önce seviye seçin.' } : {};
  const level = levels.find(
    (item) => item.name === value.level && item.isActive && !item.deletedAt,
  );
  if (!level) return { level: 'Aktif bir seviye seçin.' };
  if (
    value.subLevel &&
    !level.subLevels.some(
      (item) => item.title === value.subLevel && item.isActive && !item.deletedAt,
    )
  )
    return { subLevel: 'Seçilen seviyeye ait aktif bir alt seviye seçin.' };
  return {};
}
