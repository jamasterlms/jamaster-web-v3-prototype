import { normalizeMessageTargets } from '../communications/message-model.ts';
import type { OperationsState } from '../operations/model.ts';
import { isDate } from '../../lib/validation.ts';

export type GroupTeacherAssignment = {
  id: string;
  groupId: string;
  teacherId: string;
  title?: string;
  isActive: boolean;
  startDate?: string; // Unknown for a migrated head teacher; mandatory on creation.
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
};
export const isHeadTeacher = (assignment: GroupTeacherAssignment) =>
  assignment.title === 'Sınıf Öğretmeni' || assignment.id.startsWith('head_teacher_');

export function restoreOperations(saved: unknown, seed: OperationsState): OperationsState {
  const value = saved && typeof saved === 'object' ? (saved as Partial<OperationsState>) : {};
  const keys = ['groups', 'teachers', 'expenses', 'plans', 'messages', 'automations'] as const;
  const base = keys.every((k) => Array.isArray(value[k])) ? (value as OperationsState) : seed;
  return {
    ...base,
    messages: base.messages.map((message) => normalizeMessageTargets(message, base.groups)),
    groupTeacherAssignments: Array.isArray(base.groupTeacherAssignments)
      ? base.groupTeacherAssignments
      : [],
    groups: base.groups.map((group) => {
      if (group.headTeacherId !== undefined) return group;
      const matches = base.teachers.filter((t) => t.name === group.teacher);
      return { ...group, headTeacherId: matches.length === 1 ? matches[0].id : '' };
    }),
  };
}
export function groupTeacherRows(
  state: OperationsState,
  groupId: string,
): GroupTeacherAssignment[] {
  const group = state.groups.find((g) => g.id === groupId);
  const assignments = (state.groupTeacherAssignments || []).filter((a) => a.groupId === groupId);
  if (!group?.headTeacherId) return assignments;
  // The head teacher is owned by the group form; avoid a duplicate editable row.
  return [
    {
      id: `head_teacher_${group.id}_${group.headTeacherId}`,
      groupId,
      teacherId: group.headTeacherId,
      title: 'Sınıf Öğretmeni',
      isActive: true,
    },
    ...assignments.filter((a) => a.teacherId !== group.headTeacherId),
  ];
}
export function groupTeacherIssue(
  state: OperationsState,
  next: GroupTeacherAssignment,
): string | null {
  const previous = (state.groupTeacherAssignments || []).find((a) => a.id === next.id);
  if (
    !next.id ||
    !state.groups.some((g) => g.id === next.groupId) ||
    !state.teachers.some((t) => t.id === next.teacherId)
  )
    return 'Grup ve öğretmen seçin.';
  if (isHeadTeacher(next) || (previous && isHeadTeacher(previous)))
    return 'Sınıf öğretmeni grup bilgileri üzerinden değiştirilir.';
  if (
    previous &&
    (previous.groupId !== next.groupId ||
      previous.teacherId !== next.teacherId ||
      previous.startDate !== next.startDate)
  )
    return 'Öğretmen ve başlangıç tarihi değiştirilemez.';
  if (
    groupTeacherRows(state, next.groupId).some(
      (a) => a.id !== next.id && a.teacherId === next.teacherId,
    )
  )
    return 'Öğretmen bu gruba zaten atanmış.';
  if (!next.startDate || !isDate(next.startDate.slice(0, 10)))
    return 'Başlangıç tarihi zorunludur.';
  if (
    next.endDate &&
    (!isDate(next.endDate.slice(0, 10)) || next.endDate.slice(0, 10) < next.startDate.slice(0, 10))
  )
    return 'Bitiş tarihi başlangıç tarihinden önce olamaz.';
  if (typeof next.isActive !== 'boolean') return 'Atama durumunu seçin.';
  return null;
}
