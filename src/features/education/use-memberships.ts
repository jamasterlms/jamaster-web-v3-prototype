import { useMemo } from 'react';
import { useWorkspace } from '@/app/workspace-provider';
import { useOperations } from '@/features/operations/operations-provider';
import type { LearningGroup } from '@/features/operations/model';
import type { Student } from '@/types';
import { migrateMemberships, type StudentGroupMembership } from './membership-model';

export function useMemberships() {
  const { state } = useWorkspace();
  const { operations } = useOperations();
  return useMemo(() => {
    const records =
      state.groupMemberships || migrateMemberships({}, state.students, operations.groups);
    const groups = new Map(operations.groups.map((g) => [g.id, g]));
    const students = new Map(state.students.map((s) => [s.id, s]));
    const activeByStudent = new Map<number, StudentGroupMembership[]>();
    const membersByGroup = new Map<string, Student[]>();
    const knownHistory = new Set<number>();
    const labels = new Map<number, string[]>();
    const appendLabel = (id: number, label: string) => {
      if (!labels.has(id)) labels.set(id, []);
      labels.get(id)!.push(label);
    };
    for (const m of records.memberships) {
      knownHistory.add(m.studentId);
      if (m.status !== 'active') continue;
      if (!activeByStudent.has(m.studentId)) activeByStudent.set(m.studentId, []);
      activeByStudent.get(m.studentId)!.push(m);
      appendLabel(
        m.studentId,
        groups.get(m.groupId)?.name || `Grup ${m.groupId} (kayıt bulunamadı)`,
      );
      const student = students.get(m.studentId);
      if (student) {
        if (!membersByGroup.has(m.groupId)) membersByGroup.set(m.groupId, []);
        membersByGroup.get(m.groupId)!.push(student);
      }
    }
    for (const m of records.unresolved) {
      knownHistory.add(m.studentId);
      appendLabel(m.studentId, `${m.groupName} (eşleşme bekliyor)`);
    }
    return {
      records,
      groupsFor: (id: number) =>
        (activeByStudent.get(id) || [])
          .map((m) => groups.get(m.groupId))
          .filter((g): g is LearningGroup => !!g),
      labelsFor: (id: number) => labels.get(id) || [],
      labelFor: (id: number) => labels.get(id)?.join(', ') || 'Henüz atanmadı',
      hasHistory: (id: number) => knownHistory.has(id),
      membersOf: (groupId: string) => membersByGroup.get(groupId) || [],
      membershipFor: (studentId: number, groupId: string) =>
        activeByStudent.get(studentId)?.find((m) => m.groupId === groupId),
    };
  }, [state.groupMemberships, state.students, operations.groups]);
}
