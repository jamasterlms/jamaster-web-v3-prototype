import { groupDraft } from '../src/features/education/group-model.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  initialOperations,
  operationsReducer,
  validateGroup,
  validAmount,
} from '../src/features/operations/model.ts';
test('Grup kapasitesi mevcut öğrencilerin altına düşürülemez', () => {
  const group = { ...groupDraft(initialOperations.groups[0]), subLevel: 'B1.1', capacity: 8 };
  assert.equal(validateGroup(group, 8), null);
  assert.ok(validateGroup(group, 9));
  assert.ok(validateGroup({ ...group, capacity: 1.5 }));
  assert.ok(validateGroup({ ...group, capacity: 0 }));
  assert.ok(validateGroup({ ...group, name: ' ' }));
});
test('Grup düzenlemesi üyeleri ilişkilendiren kayıt kimliğini korur', () => {
  const group = initialOperations.groups[0];
  const next = operationsReducer(initialOperations, {
    type: 'save',
    collection: 'groups',
    record: { ...group, capacity: 20 },
  });
  assert.equal(next.groups.length, initialOperations.groups.length);
  assert.equal(next.groups[0].id, group.id);
  assert.equal(next.groups[0].capacity, 20);
  assert.equal(initialOperations.groups[0].capacity, 16);
  assert.equal(next.teachers, initialOperations.teachers);
});
test('Mesaj taslağının başlığı, alıcısı ve içeriği düzenleme boyunca saklanır', () => {
  const draft = {
    ...initialOperations.messages[0],
    id: 'new-sms',
    title: 'Seviye görüşmesi',
    recipient: 'Bora Eren',
    body: 'Seviye görüşmenize dair yeni tarih bilgisi.',
  };
  const first = operationsReducer(initialOperations, {
    type: 'save',
    collection: 'messages',
    record: draft,
  });
  const next = operationsReducer(first, {
    type: 'save',
    collection: 'messages',
    record: { ...draft, body: draft.body + ' Yarın 09:00.' },
  });
  assert.equal(next.messages.length, initialOperations.messages.length + 1);
  assert.equal(next.messages[0].recipient, 'Bora Eren');
  assert.equal(next.messages[0].body, 'Seviye görüşmenize dair yeni tarih bilgisi. Yarın 09:00.');
  assert.equal(first.messages[0].body, draft.body);
});
test('Geçersiz finans tutarları kabul edilmez', () => {
  for (const amount of [0, -1, NaN, Infinity]) assert.equal(validAmount(amount), false);
  assert.equal(validAmount(18500), true);
  assert.equal(validAmount(0.01), true);
});
