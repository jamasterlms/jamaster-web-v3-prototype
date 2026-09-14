export type GroupNote = {
  id: string;
  targetId: string;
  targetType: 'group';
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
};
export const noteSortOptions = [
  ['createdAt:desc', 'Oluşturulma · yeni'],
  ['createdAt:asc', 'Oluşturulma · eski'],
  ['updatedAt:desc', 'Düzenlenme · yeni'],
  ['updatedAt:asc', 'Düzenlenme · eski'],
  ['title:asc', 'Başlık · A–Z'],
  ['title:desc', 'Başlık · Z–A'],
];
export function noteFieldsIssue(value: { title: string; content: string }) {
  if (!value.title.trim()) return 'Not başlığını girin.';
  if (value.title.length > 255) return 'Başlık en fazla 255 karakter olabilir.';
  if (!value.content.trim()) return 'Not içeriğini girin.';
  if (value.content.length > 10000) return 'Not içeriği en fazla 10.000 karakter olabilir.';
  return null;
}
export function isGroupNote(value: unknown): value is GroupNote {
  if (!value || typeof value !== 'object') return false;
  const n = value as GroupNote;
  return (
    n.targetType === 'group' &&
    ['id', 'targetId', 'title', 'content', 'createdAt', 'updatedAt'].every(
      (key) => typeof n[key as keyof GroupNote] === 'string',
    ) &&
    !!n.id &&
    !!n.targetId &&
    Number.isFinite(Date.parse(n.createdAt)) &&
    Number.isFinite(Date.parse(n.updatedAt))
  );
}
export function saveGroupNote(notes: GroupNote[], note: GroupNote, expectedUpdatedAt?: string) {
  const fail = (error: string) => ({ notes, error });
  if (!isGroupNote(note)) return fail('Not bilgileri doğrulanamadı.');
  const issue = noteFieldsIssue(note);
  if (issue) return fail(issue);
  const previous = notes.find((n) => n.id === note.id);
  if (previous ? previous.updatedAt !== expectedUpdatedAt : !!expectedUpdatedAt)
    return fail('Bu not değiştirildi veya silindi. Güncel notu yeniden açın.');
  if (
    previous &&
    (previous.targetId !== note.targetId ||
      previous.createdAt !== note.createdAt ||
      previous.createdBy !== note.createdBy)
  )
    return fail('Notun grubu ve oluşturulma bilgileri değiştirilemez.');
  if (note.updatedAt < (previous?.updatedAt || note.createdAt)) return fail('Not tarihi geçersiz.');
  const next = { ...note, title: note.title.trim(), content: note.content.trim() };
  return {
    notes: previous ? notes.map((n) => (n.id === next.id ? next : n)) : [next, ...notes],
    error: null,
  };
}
export function removeGroupNote(
  notes: GroupNote[],
  groupId: string,
  id: string,
  expectedUpdatedAt: string,
) {
  return notes.filter(
    (n) => n.id !== id || n.targetId !== groupId || n.updatedAt !== expectedUpdatedAt,
  );
}
export function filterGroupNotes(
  notes: GroupNote[],
  groupId: string,
  search: string,
  sort: string,
) {
  const key = (value: string) => value.normalize('NFC').toLocaleLowerCase('tr-TR');
  const [field, order] = noteSortOptions.some(([v]) => v === sort)
    ? sort.split(':')
    : ['createdAt', 'desc'];
  return notes
    .filter(isGroupNote)
    .filter(
      (n) => n.targetId === groupId && key(n.title + ' ' + n.content).includes(key(search.trim())),
    )
    .sort((a, b) => {
      const av = a[field as 'title' | 'createdAt' | 'updatedAt'],
        bv = b[field as 'title' | 'createdAt' | 'updatedAt'];
      return av.localeCompare(bv, 'tr') * (order === 'asc' ? 1 : -1);
    });
}
