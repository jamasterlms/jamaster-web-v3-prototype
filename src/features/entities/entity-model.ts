export type EntityRef = {
  kind: 'students' | 'groups' | 'teachers' | 'staff' | 'users';
  id: string;
};
export const entityPath = (entity: EntityRef) =>
  `/${entity.kind === 'users' ? 'super' : 'admin'}/${entity.kind}/${encodeURIComponent(entity.id)}`;
export function entityFromPath(path: string): EntityRef | null {
  const match = path.match(/^\/(?:admin|super)\/(students|groups|teachers|staff|users)\/([^/?]+)$/);
  if (!match || ['register', 'create', 'form', 'past', 'potential', 'salary'].includes(match[2]))
    return null;
  try {
    return { kind: match[1] as EntityRef['kind'], id: decodeURIComponent(match[2]) };
  } catch {
    return null;
  }
}
// Materialize legacy identifiers before inserting or editing any row; indices never become URLs.
export const identifyTeamRows = (rows: string[][], kind: string) =>
  rows.map((row, i) => {
    const next = [...row];
    next[5] ||= `${kind}-${i + 1}`;
    return next;
  });

export function shouldPreview({
  fullPage,
  drawer,
  toolsOpen,
  mobileOpen,
}: {
  fullPage: boolean;
  drawer: boolean;
  toolsOpen: boolean;
  mobileOpen: boolean;
}) {
  return !fullPage && (drawer ? mobileOpen : toolsOpen);
}
