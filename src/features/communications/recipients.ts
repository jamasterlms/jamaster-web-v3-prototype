import { messageTargetIssue, messageTargetKeys } from './message-model.ts';
import type { MessageDraft, OperationsState } from '../operations/model.ts';
import type { WorkspaceState } from '../../app/workspace-reducer.ts';
import { normalizePhone, parsePhone, emailSchema } from '../../lib/validation.ts';
export type Recipient = { address: string; name: string; studentId?: number };
export function messageRecipients(
  message: MessageDraft,
  state: WorkspaceState,
  operations: OperationsState,
): Recipient[] {
  const email = message.channel === 'email';
  const valid = (value: string) =>
    email ? emailSchema.safeParse(value).success : !!parsePhone(value);
  const normalize = (value: string) => (email ? value.trim().toLowerCase() : normalizePhone(value));
  if (message.recipientMode === 'single' || (!message.recipientMode && message.recipientAddress)) {
    const address = message.recipientAddress || message.recipient;
    if (!valid(address)) return [];
    const student = state.students.find(
      (s) => normalize(email ? s.email : s.phone) === normalize(address),
    );
    return [
      { address: normalize(address), name: student?.name || address, studentId: student?.id },
    ];
  }
  if (messageTargetIssue(message, operations.groups)) return [];
  const keys = messageTargetKeys(message, operations.groups);
  const groupIds = keys.filter((k) => k.startsWith('group:')).map((k) => k.slice(6));
  const students = state.students
    .filter(
      (student) =>
        (keys.includes('segment:active') &&
          !['Pasif', 'Geçmiş', 'Potansiyel'].includes(student.status)) ||
        (keys.includes('segment:pending-payment') &&
          !['Ödendi', 'Tamamlandı'].includes(student.payment)) ||
        state.groupMemberships?.memberships.some(
          (m) =>
            groupIds.includes(m.groupId) && m.studentId === student.id && m.status === 'active',
        ),
    )
    .map((student) => ({ ...student, studentId: student.id as number | undefined }));
  const source = [
    ...students,
    ...(keys.includes('segment:teachers')
      ? operations.teachers.map((teacher) => ({ ...teacher, studentId: undefined }))
      : []),
  ];
  const seen = new Set<string>();
  return source.flatMap((person) => {
    const address = email ? person.email : person.phone;
    if (!valid(address)) return [];
    const key = normalize(address);
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ address: key, name: person.name, studentId: person.studentId }];
  });
}
