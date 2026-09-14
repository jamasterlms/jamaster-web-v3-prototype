import assert from 'node:assert/strict';
import test from 'node:test';
import {
  noteFieldsIssue,
  saveGroupNote,
  removeGroupNote,
  filterGroupNotes,
  type GroupNote,
} from '../src/features/education/group-notes-model.ts';

const note: GroupNote = {
  id: 'n1',
  targetId: 'g1',
  targetType: 'group',
  title: 'Dönem değerlendirmesi',
  content: 'Konuşma etkinlikleri artırılacak.',
  createdAt: '2026-09-09T10:00:00.000Z',
  updatedAt: '2026-09-09T10:00:00.000Z',
};
test('notes enforce source field limits and reject blank content', () => {
  assert.ok(noteFieldsIssue({ title: ' ', content: 'Not' }));
  assert.ok(noteFieldsIssue({ title: 'Not', content: '\n ' }));
  assert.ok(noteFieldsIssue({ title: 'x'.repeat(256), content: 'Not' }));
  assert.ok(noteFieldsIssue({ title: 'Not', content: 'x'.repeat(10001) }));
  assert.equal(noteFieldsIssue({ title: 'x'.repeat(255), content: 'x'.repeat(10000) }), null);
});
test('editing preserves identity and creation date; stale writes do not overwrite a note', () => {
  const added = saveGroupNote([], note);
  assert.equal(added.error, null);
  const edit = { ...note, title: 'Güncel not', updatedAt: '2026-09-09T11:00:00.000Z' };
  const saved = saveGroupNote(added.notes, edit, note.updatedAt);
  assert.equal(saved.error, null);
  assert.equal(saved.notes[0].createdAt, note.createdAt);
  assert.ok(saveGroupNote(saved.notes, { ...edit, content: 'Eski taslak' }, note.updatedAt).error);
  assert.ok(saveGroupNote(saved.notes, { ...edit, targetId: 'g2' }, edit.updatedAt).error);
  assert.ok(
    saveGroupNote(saved.notes, { ...edit, createdAt: edit.updatedAt }, edit.updatedAt).error,
  );
  assert.ok(saveGroupNote([], edit, note.updatedAt).error);
});
test('note filters and deletion remain scoped to the group', () => {
  const notes = [
    note,
    { ...note, id: 'n2', targetId: 'g2' },
    {
      ...note,
      id: 'n3',
      title: 'Alıştırma',
      content: 'Dinleme çalışması',
      updatedAt: '2026-09-10T10:00:00.000Z',
    },
  ];
  assert.deepEqual(
    filterGroupNotes(notes, 'g1', 'KONUŞMA', 'createdAt:desc').map((n) => n.id),
    ['n1'],
  );
  assert.deepEqual(
    filterGroupNotes(notes, 'g1', '', 'updatedAt:desc').map((n) => n.id),
    ['n3', 'n1'],
  );
  assert.equal(removeGroupNote(notes, 'g2', 'n1', note.updatedAt).length, 3);
  assert.deepEqual(
    removeGroupNote(notes, 'g1', 'n1', note.updatedAt).map((n) => n.id),
    ['n2', 'n3'],
  );
});
