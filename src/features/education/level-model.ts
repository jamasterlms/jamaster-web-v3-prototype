export type CatalogSubLevel = {
  id: string;
  title: string;
  order: number;
  levelId: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};
export type CatalogLevel = {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
  subLevels: CatalogSubLevel[];
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};
export type ObservedLevel = { level: string; subLevel?: string };
export type LevelIssue = { levelId?: string; subLevelId?: string; field: string; message: string };

export function readLevelCatalog(saved?: string, observed: ObservedLevel[] = []): CatalogLevel[] {
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const source: unknown = Array.isArray(parsed) ? parsed : (parsed.levels ?? parsed.data);
      if (Array.isArray(source))
        return source
          .filter((value) => value && typeof value === 'object')
          .map((value) => ({
            ...value,
            id: String(value.id || ''),
            name: String(value.name || ''),
            order: Number(value.order ?? 0),
            isActive: value.isActive !== false,
            deletedAt: value.deletedAt ?? null,
            subLevels: Array.isArray(value.subLevels)
              ? value.subLevels.map((sub: CatalogSubLevel) => ({
                  ...sub,
                  id: String(sub.id || ''),
                  title: String(sub.title || ''),
                  order: Number(sub.order ?? 0),
                  levelId: String(sub.levelId || ''),
                  isActive: sub.isActive !== false,
                  deletedAt: sub.deletedAt ?? null,
                }))
              : [],
          }));
    } catch {
      /* Unreadable legacy settings are not overwritten by this read-only adapter. */
    }
  }
  const levels: CatalogLevel[] = [];
  for (const item of observed) {
    const name = item.level.trim(),
      title = item.subLevel?.trim();
    if (!name) continue;
    let level = levels.find((record) => record.name === name);
    if (!level) {
      level = {
        id: `level:${encodeURIComponent(name)}`,
        name,
        order: levels.length + 1,
        isActive: true,
        subLevels: [],
        deletedAt: null,
      };
      levels.push(level);
    }
    if (title && !level.subLevels.some((record) => record.title === title))
      level.subLevels.push({
        id: `${level.id}:sub:${encodeURIComponent(title)}`,
        title,
        order: level.subLevels.length + 1,
        levelId: level.id,
        isActive: true,
        deletedAt: null,
      });
  }
  return levels;
}

export function validateLevelCatalog(levels: CatalogLevel[]): LevelIssue | null {
  if (!levels.length) return { field: 'levels', message: 'En az bir seviye ekleyin.' };
  const ids = new Set<string>(),
    names = new Set<string>();
  for (const level of levels) {
    const issue = (field: string, message: string): LevelIssue => ({
      levelId: level.id,
      field,
      message,
    });
    if (!level.id || ids.has(level.id))
      return issue('id', 'Seviye kimlikleri benzersiz ve dolu olmalıdır.');
    ids.add(level.id);
    if (!level.name.trim()) return issue('name', 'Seviye adını girin.');
    const name = level.name.trim().toLocaleLowerCase('tr');
    if (names.has(name)) return issue('name', 'Bu seviye adı zaten kullanılıyor.');
    names.add(name);
    if (!Number.isInteger(level.order) || level.order < 0)
      return issue('order', 'Sıra sıfır veya pozitif tam sayı olmalıdır.');
    const titles = new Set<string>();
    for (const sub of level.subLevels) {
      const subIssue = (field: string, message: string): LevelIssue => ({
        levelId: level.id,
        subLevelId: sub.id,
        field,
        message,
      });
      if (!sub.id || ids.has(sub.id))
        return subIssue('id', 'Alt seviye kimlikleri benzersiz ve dolu olmalıdır.');
      ids.add(sub.id);
      if (sub.levelId !== level.id)
        return subIssue('levelId', 'Alt seviye kendi üst seviyesine bağlı olmalıdır.');
      if (!sub.title.trim()) return subIssue('title', 'Alt seviye başlığını girin.');
      const title = sub.title.trim().toLocaleLowerCase('tr');
      if (titles.has(title))
        return subIssue('title', 'Bu alt seviye başlığı aynı seviyede zaten kullanılıyor.');
      titles.add(title);
      if (!Number.isInteger(sub.order) || sub.order < 0)
        return subIssue('order', 'Sıra sıfır veya pozitif tam sayı olmalıdır.');
    }
  }
  return null;
}

export function removeCatalogLevel(levels: CatalogLevel[], id: string): CatalogLevel[] {
  if (levels.length <= 1) return levels;
  return levels
    .filter((record) => record.id !== id)
    .map((record, i) => ({
      ...record,
      order: i + 1,
      subLevels: record.subLevels.map((sub, j) => ({ ...sub, order: j + 1 })),
    }));
}
export function removeCatalogSubLevel(
  levels: CatalogLevel[],
  levelId: string,
  subLevelId: string,
): CatalogLevel[] {
  return levels.map((level) =>
    level.id === levelId
      ? {
          ...level,
          subLevels: level.subLevels
            .filter((sub) => sub.id !== subLevelId)
            .map((sub, i) => ({ ...sub, order: i + 1 })),
        }
      : level,
  );
}

export function levelUsageReason(
  level: CatalogLevel,
  sub: CatalogSubLevel | undefined,
  observed: ObservedLevel[],
) {
  const count = observed.filter(
    (record) => record.level === level.name && (!sub || record.subLevel === sub.title),
  ).length;
  return count
    ? `${count} kayıt bu ${sub ? 'alt seviyeyi' : 'seviyeyi'} kullanıyor. Geçmiş bağlantıları korumak için silmek yerine pasife alın.`
    : null;
}
