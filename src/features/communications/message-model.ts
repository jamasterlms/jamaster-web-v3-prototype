import type { MessageDraft, LearningGroup } from '../operations/model.ts';

export function switchRecipientMode(
  draft: MessageDraft,
  mode: 'single' | 'bulk',
  groups: string[],
): MessageDraft {
  return {
    ...draft,
    recipientMode: mode,
    // Keep the typed address in the editor when switching back. Bulk saves omit it.
    recipient:
      mode === 'bulk' && !groups.includes(draft.recipient) ? groups[0] || '' : draft.recipient,
  };
}

export const recipientSegments = [
  { value: 'segment:active', label: 'Tüm aktif öğrenciler' },
  { value: 'segment:pending-payment', label: 'Ödemesi bekleyen öğrenciler' },
  { value: 'segment:teachers', label: 'Öğretmenler' },
];
export const recipientOptions = (groups: Pick<LearningGroup, 'id' | 'name'>[]) => [
  ...recipientSegments,
  ...groups.map((g) => ({ value: `group:${g.id}`, label: g.name })),
];
export function messageTargetKeys(
  draft: MessageDraft,
  groups: Pick<LearningGroup, 'id' | 'name'>[],
): string[] {
  if (Array.isArray(draft.recipientGroups)) return [...new Set(draft.recipientGroups)];
  const segment = recipientSegments.find((s) => s.label === draft.recipient);
  if (segment) return [segment.value];
  const matches = groups.filter((g) => g.name === draft.recipient);
  return matches.length === 1
    ? [`group:${matches[0].id}`]
    : draft.recipient
      ? [`missing:${draft.recipient}`]
      : [];
}
export function messageTargetIssue(
  draft: MessageDraft,
  groups: Pick<LearningGroup, 'id' | 'name'>[],
): string | null {
  const keys = messageTargetKeys(draft, groups);
  if (!keys.length) return 'En az bir alıcı grubu seçin.';
  const allowed = new Set(recipientOptions(groups).map((g) => g.value));
  return keys.some((key) => !allowed.has(key))
    ? 'Bir alıcı grubu artık bulunamıyor. Seçimleri kontrol edin.'
    : null;
}
export function messageTargetLabel(
  draft: MessageDraft,
  groups: Pick<LearningGroup, 'id' | 'name'>[],
): string {
  if (draft.recipientMode === 'single' || (!draft.recipientMode && draft.recipientAddress))
    return draft.recipientAddress || draft.recipient;
  const options = recipientOptions(groups);
  return messageTargetKeys(draft, groups)
    .map((key) => options.find((o) => o.value === key)?.label || 'Bulunamayan grup')
    .join(', ');
}
export function normalizeMessageTargets(
  draft: MessageDraft,
  groups: Pick<LearningGroup, 'id' | 'name'>[],
): MessageDraft {
  const mode = draft.recipientMode || (draft.recipientAddress ? 'single' : 'bulk');
  return mode === 'bulk'
    ? {
        ...draft,
        recipientMode: mode,
        recipientAddress: undefined,
        recipientGroups: messageTargetKeys(draft, groups),
      }
    : { ...draft, recipientMode: mode };
}
