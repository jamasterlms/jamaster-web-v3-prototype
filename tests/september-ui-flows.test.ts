import test from 'node:test';
import assert from 'node:assert/strict';
import { initialPaymentIds } from '../src/features/payment/payment-selection-model.ts';
import type { Obligation } from '../src/features/payment/payment-model.ts';
import { messageRecipients } from '../src/features/communications/recipients.ts';
import {
  messageTargetKeys,
  normalizeMessageTargets,
} from '../src/features/communications/message-model.ts';
import { initialOperations, type MessageDraft } from '../src/features/operations/model.ts';
import type { WorkspaceState } from '../src/app/workspace-reducer.ts';
import {
  normalizeAnnouncementTargets,
  visibleAnnouncements,
  prepareAnnouncement,
  type Announcement,
} from '../src/features/administration/announcement-model.ts';
import { selectedCalendarRange } from '../src/features/calendar/calendar-interaction.ts';

const items = [{ sourceId: 'a' }, { sourceId: 'b' }] as Obligation[];
test('Payment first visit selects all; explicit URL and clear never expand into all', () => {
  assert.deepEqual(initialPaymentIds(new URLSearchParams(), items), ['a', 'b']);
  assert.deepEqual(initialPaymentIds(new URLSearchParams('id=b&id=b&id=missing'), items), ['b']);
  assert.deepEqual(initialPaymentIds(new URLSearchParams('id=missing'), items), []);
  assert.deepEqual(initialPaymentIds(new URLSearchParams('selection=none'), items), []);
});
const groups = [
  { ...initialOperations.groups[0], id: 'one', name: 'Sabah' },
  { ...initialOperations.groups[0], id: 'two', name: 'Akşam' },
];
const operations = { ...initialOperations, groups };
const state = {
  students: [
    {
      id: 1,
      name: 'Ada',
      phone: '05321234567',
      email: 'ada@example.com',
      payment: 'Ödendi',
      status: 'Öğrenci',
    },
    {
      id: 2,
      name: 'Ece',
      phone: '+90 532 123 45 67',
      email: 'ece@example.com',
      payment: 'Ödendi',
      status: 'Öğrenci',
    },
    {
      id: 3,
      name: 'Can',
      phone: '05331234567',
      email: 'can@example.com',
      payment: 'Ödendi',
      status: 'Öğrenci',
    },
  ],
  groupMemberships: {
    memberships: [
      { groupId: 'one', studentId: 1, status: 'active' },
      { groupId: 'two', studentId: 1, status: 'active' },
      { groupId: 'two', studentId: 2, status: 'active' },
      { groupId: 'two', studentId: 3, status: 'inactive' },
    ],
  },
} as unknown as WorkspaceState;
const message: MessageDraft = {
  ...initialOperations.messages[0],
  channel: 'sms',
  recipient: 'Sabah',
  recipientMode: 'bulk',
  recipientGroups: ['group:one', 'group:two'],
};
test('Several message groups union active memberships and dedupe normalized contacts', () => {
  assert.deepEqual(
    messageRecipients(message, state, operations).map((r) => r.address),
    ['+905321234567'],
  );
  assert.equal(messageRecipients({ ...message, channel: 'email' }, state, operations).length, 2);
});
test('Empty/deleted bulk scopes fail closed; stale single address never overrides explicit bulk', () => {
  assert.deepEqual(messageRecipients({ ...message, recipientGroups: [] }, state, operations), []);
  assert.deepEqual(
    messageRecipients(
      { ...message, recipientGroups: ['group:one', 'group:deleted'] },
      state,
      operations,
    ),
    [],
  );
  assert.deepEqual(
    messageRecipients({ ...message, recipientAddress: '05331234567' }, state, operations),
    messageRecipients(message, state, operations),
  );
});
test('Legacy message groups freeze canonical IDs and ambiguous names never target every student', () => {
  const legacy = { ...message, recipientGroups: undefined };
  const migrated = normalizeMessageTargets(legacy, groups);
  assert.deepEqual(messageTargetKeys(migrated, [{ ...groups[0], name: 'Yeni ad' }]), ['group:one']);
  const ambiguous = normalizeMessageTargets(legacy, [groups[0], { ...groups[1], name: 'Sabah' }]);
  assert.match(ambiguous.recipientGroups![0], /^missing:/);
  assert.deepEqual(messageRecipients(ambiguous, state, operations), []);
});
const notice: Announcement = {
  id: 'notice',
  title: ' Başlık ',
  body: ' İçerik ',
  status: 'Taslak',
  audience: 'Sabah',
};
test('Announcement drafts stay private for both roles and publish validates without creating another ID', () => {
  const draft = normalizeAnnouncementTargets([notice], groups)[0];
  assert.equal(visibleAnnouncements([draft], groups, 'teacher').length, 0);
  assert.equal(visibleAnnouncements([draft], groups, 'student').length, 0);
  const published = prepareAnnouncement(draft, 'Yayında', '2026-09-14T10:00:00Z');
  assert.equal(published.id, draft.id);
  assert.equal(published.title, 'Başlık');
  assert.equal(visibleAnnouncements([published], [groups[0]], 'student').length, 1);
  assert.equal(visibleAnnouncements([published], [groups[1]], 'student').length, 0);
  assert.throws(() => prepareAnnouncement({ ...draft, body: ' ' }, 'Yayında', 'now'));
  assert.equal(prepareAnnouncement({ ...draft, body: ' ' }, 'Taslak', 'now').status, 'Taslak');
});
test('Ambiguous legacy announcement names fail closed even when persona owns one of the groups', () => {
  const duplicate = { ...groups[1], name: 'Sabah' };
  const records = normalizeAnnouncementTargets(
    [{ ...notice, status: 'Yayında' }],
    [groups[0], duplicate],
  );
  assert.equal(visibleAnnouncements(records, [groups[0]], 'student').length, 0);
  assert.equal(visibleAnnouncements(records, [duplicate], 'teacher').length, 0);
});
test('Calendar drag includes anchor and end cells in both directions without clipped hour', () => {
  assert.deepEqual(selectedCalendarRange(660, 600), { start: 600, duration: 75 });
  assert.deepEqual(selectedCalendarRange(600, 660), { start: 600, duration: 75 });
  assert.deepEqual(selectedCalendarRange(660, 660), { start: 660, duration: 15 });
});
