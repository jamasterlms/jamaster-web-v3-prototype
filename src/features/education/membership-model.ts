type StudentIdentity = { id: number; group: string };
type GroupIdentity = { id: string; name: string };
export type StudentGroupMembership = {
  id: string;
  studentId: number;
  groupId: string;
  status: 'active' | 'completed' | 'cancelled' | 'ended';
  createdAt?: string;
  endedAt?: string;
};
export type GroupTransfer = {
  id: string;
  studentId: number;
  toGroupId?: string;
  fromGroupIds?: string[];
  transferDate?: string;
  reason?: string;
  recordedAt: string;
};
export type MembershipRecords = {
  memberships: StudentGroupMembership[];
  history: GroupTransfer[];
  unresolved: { studentId: number; groupName: string }[];
  recovery?: { memberships: unknown[]; history: unknown[] };
};
export type ActiveSaleInfo = {
  hasActiveSale: boolean;
  saleId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  listAmount?: string;
  paidAmount?: string;
  warning?: string;
};
const unassigned = new Set(['', 'Atanmadı', 'Henüz atanmadı', '—']);
const validTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && isDate(value.slice(0, 10)) && Number.isFinite(Date.parse(value));
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object';
export function migrateMemberships(
  saved: Partial<MembershipRecords>,
  students: StudentIdentity[],
  groups: GroupIdentity[],
): MembershipRecords {
  // An explicit empty collection means migrated, including after the last removal.
  if (Array.isArray(saved.memberships)) {
    const recovery = {
      memberships: Array.isArray(saved.recovery?.memberships)
        ? [...saved.recovery.memberships]
        : [],
      history: Array.isArray(saved.recovery?.history) ? [...saved.recovery.history] : [],
    };
    const records: MembershipRecords = {
      memberships: [],
      history: [],
      unresolved: Array.isArray(saved.unresolved)
        ? saved.unresolved.filter(
            (m) => object(m) && Number.isInteger(m.studentId) && typeof m.groupName === 'string',
          )
        : [],
    };
    const active = new Set<string>();
    const ids = new Set<string>();
    for (const m of saved.memberships) {
      const valid =
        object(m) &&
        typeof m.id === 'string' &&
        !!m.id &&
        Number.isInteger(m.studentId) &&
        typeof m.groupId === 'string' &&
        !!m.groupId &&
        ['active', 'completed', 'cancelled', 'ended'].includes(m.status) &&
        (!m.createdAt || validTimestamp(m.createdAt)) &&
        (!m.endedAt || validTimestamp(m.endedAt));
      const key = valid ? `${m.studentId}:${m.groupId}` : '';
      if (!valid || ids.has(m.id) || (m.status === 'active' && active.has(key))) {
        recovery.memberships.push(m);
        continue;
      }
      records.memberships.push(m);
      ids.add(m.id);
      if (m.status === 'active') active.add(key);
    }
    const historyIds = new Set<string>();
    for (const t of Array.isArray(saved.history) ? saved.history : []) {
      const valid =
        object(t) &&
        typeof t.id === 'string' &&
        !!t.id &&
        !historyIds.has(t.id) &&
        Number.isInteger(t.studentId) &&
        validTimestamp(t.recordedAt) &&
        (!t.transferDate || validTimestamp(t.transferDate)) &&
        (t.reason === undefined || typeof t.reason === 'string') &&
        (t.toGroupId === undefined || typeof t.toGroupId === 'string') &&
        (t.fromGroupIds === undefined ||
          (Array.isArray(t.fromGroupIds) &&
            t.fromGroupIds.every((id) => typeof id === 'string' && !!id))) &&
        ((!!t.toGroupId && t.fromGroupIds === undefined) ||
          (!t.toGroupId &&
            Array.isArray(t.fromGroupIds) &&
            t.fromGroupIds.length > 0 &&
            !!t.reason?.trim()));
      if (!valid) {
        recovery.history.push(t);
        continue;
      }
      records.history.push(t);
      historyIds.add(t.id);
    }
    if (recovery.memberships.length || recovery.history.length) records.recovery = recovery;
    return records;
  }
  const records: MembershipRecords = { memberships: [], history: [], unresolved: [] };
  for (const student of students) {
    if (unassigned.has(student.group || '')) continue;
    const matches = groups.filter((g) => g.name === student.group);
    if (matches.length === 1)
      records.memberships.push({
        id: `legacy_${student.id}_${matches[0].id}`,
        studentId: student.id,
        groupId: matches[0].id,
        status: 'active',
      });
    else records.unresolved.push({ studentId: student.id, groupName: student.group });
  }
  return records;
}
export function groupStudentIds(records: MembershipRecords, groupId: string): number[] {
  return [
    ...new Set(
      records.memberships
        .filter((m) => m.groupId === groupId && m.status === 'active')
        .map((m) => m.studentId),
    ),
  ].sort((a, b) => a - b);
}
export function studentGroups<T extends GroupIdentity>(
  records: MembershipRecords,
  groups: T[],
  studentId: number,
): T[] {
  const ids = new Set(
    records.memberships
      .filter((m) => m.studentId === studentId && m.status === 'active')
      .map((m) => m.groupId),
  );
  return groups.filter((g) => ids.has(g.id));
}
export function membershipTransferIssue(
  records: MembershipRecords,
  input: GroupTransfer,
  students: StudentIdentity[],
  groups: GroupIdentity[],
) {
  if (!students.some((s) => s.id === input.studentId)) return 'Öğrenci bulunamadı.';
  if (!input.id || records.history.some((t) => t.id === input.id))
    return 'Bu işlem zaten kaydedildi.';
  if (
    !validTimestamp(input.recordedAt) ||
    (input.transferDate && !validTimestamp(input.transferDate))
  )
    return 'Geçerli bir işlem tarihi girin.';
  if (input.toGroupId && input.fromGroupIds?.length)
    return 'Ekleme ve çıkarma ayrı işlemler olarak yapılmalıdır.';
  if (!input.toGroupId && !input.fromGroupIds?.length) return 'İşlem yapılacak grup seçin.';
  if (input.toGroupId && !groups.some((g) => g.id === input.toGroupId)) return 'Grup bulunamadı.';
  if (input.toGroupId && groupStudentIds(records, input.toGroupId).includes(input.studentId))
    return 'Öğrenci zaten bu gruba üye.';
  if (input.fromGroupIds?.length) {
    if (!input.reason?.trim()) return 'Gruptan çıkarma nedeni zorunludur.';
    if (input.fromGroupIds.some((id) => !groupStudentIds(records, id).includes(input.studentId)))
      return 'Öğrencinin belirtilen gruba üyeliği bulunamadı.';
  }
  return null;
}
export function transferMembership(
  records: MembershipRecords,
  input: GroupTransfer,
  students: StudentIdentity[],
  groups: GroupIdentity[],
) {
  const error = membershipTransferIssue(records, input, students, groups);
  if (error) return { records, error };
  const effectiveAt = input.transferDate || input.recordedAt;
  const memberships = records.memberships.map((m) =>
    m.studentId === input.studentId &&
    m.status === 'active' &&
    input.fromGroupIds?.includes(m.groupId)
      ? { ...m, status: 'ended' as const, endedAt: effectiveAt }
      : m,
  );
  if (input.toGroupId)
    memberships.push({
      id: `membership_${input.id}`,
      studentId: input.studentId,
      groupId: input.toGroupId,
      status: 'active',
      createdAt: effectiveAt,
    });
  return {
    error: null,
    records: {
      ...records,
      memberships,
      history: [{ ...input, reason: input.reason?.trim() || undefined }, ...records.history],
    },
  };
}
import { isDate } from '../../lib/validation.ts';
