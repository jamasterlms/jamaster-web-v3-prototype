import { documentFileIssue } from '../features/students/document-model.ts';
import { saleLifecycleRevision } from '../features/finance/sale-lifecycle.ts';
import { submissionIssue, gradeIssue } from '../features/activities/submission-model.ts';
import type {
  EntityNote,
  AuditLog,
  CommunicationLog,
  SignedDocument,
  SaleWithoutDocument,
} from '../features/entities/record-model';
import type { BillRecord } from '../features/finance/primary-report-model';
import {
  activitySchema,
  type Activity,
  type Submission,
} from '../features/activities/activity-model.ts';
import type { AttendanceSession } from '../features/calendar/attendance-model.ts';
import { salaryPaymentIssue, type SalaryRecord } from '../features/payroll/payroll-model.ts';
import { noteFieldsIssue } from '../features/education/group-notes-model.ts';
import { batchEventIssue } from '../features/calendar/batch-schedule-model.ts';
import {
  saveGroupNote,
  removeGroupNote,
  type GroupNote,
} from '../features/education/group-notes-model.ts';
import {
  transferMembership,
  type MembershipRecords,
  type GroupTransfer,
  type ActiveSaleInfo,
} from '../features/education/membership-model.ts';
import {
  financeRecords,
  studentFinancials,
  validateReceipt,
  validateSale,
  type Receipt,
  type Sale,
} from '../features/finance/finance-model.ts';
import type { CalendarEvent, ChatMessage, Meeting, Student } from '../types/index.ts';
import {
  prepareInformationEdit,
  type InformationPatch,
} from '../features/students/student-information-model.ts';
export type WorkspaceState = {
  students: Student[];
  events: CalendarEvent[];
  groupNotes?: GroupNote[];
  entityNotes?: EntityNote[];
  auditLogs?: AuditLog[];
  communicationLogs?: CommunicationLog[];
  salaryRecords?: SalaryRecord[];
  signedDocuments?: SignedDocument[];
  salesWithoutDocuments?: Record<string, SaleWithoutDocument[]>;
  bills?: BillRecord[];
  activities?: Activity[];
  activitySubmissions?: Submission[];
  meetings: Meeting[];
  attendance: Record<number, string>;
  attendanceSessions?: AttendanceSession[];
  groupMemberships?: MembershipRecords;
  activeSaleInfo?: Record<number, ActiveSaleInfo>;
  sales?: Sale[];
  receipts?: Receipt[];
  moduleRows: Record<string, string[][]>;
  branch: string;
  privacy: boolean;
  chat: ChatMessage[];
  settings: Record<string, string>;
};
export type WorkspaceAction =
  | { type: 'student/information'; id: number; patch: InformationPatch; expected: InformationPatch }
  | { type: 'document/save'; document: SignedDocument }
  | { type: 'communication/simulate'; logs: CommunicationLog[] }
  | { type: 'activity/save'; activity: Activity }
  | {
      type: 'activity/status';
      id: string;
      status: Activity['status'];
      expected: Activity['status'];
    }
  | {
      type: 'submission/save';
      expectedBranch?: string;
      submission: Submission;
      expectedActivityUpdatedAt?: string;
      expectedPreviousSubmittedAt?: string | null;
    }
  | {
      type: 'submission/grade';
      id: string;
      grade?: number;
      letter?: string;
      feedback: string;
      privateFeedback?: string;
      returned: boolean;
    }
  | { type: 'activity/delete'; id: string }
  | { type: 'salary/payment'; id: string; payment: NonNullable<SalaryRecord['payments']>[number] }
  | { type: 'entity-note/save'; note: EntityNote; expectedUpdatedAt?: string }
  | {
      type: 'entity-note/delete';
      id: string;
      targetType: EntityNote['targetType'];
      targetId: string;
      expectedUpdatedAt: string;
    }
  | { type: 'group-note/save'; note: GroupNote; expectedUpdatedAt?: string }
  | { type: 'group-note/delete'; groupId: string; id: string; expectedUpdatedAt: string }
  | { type: 'schedule/batch-create'; events: CalendarEvent[] }
  | { type: 'event/save'; event: CalendarEvent }
  | { type: 'event/delete'; id: number }
  | { type: 'student/save'; student: Student }
  | { type: 'membership/transfer'; transfer: GroupTransfer; groups: { id: string; name: string }[] }
  | { type: 'teacher/rename'; previous: string; name: string }
  | { type: 'meeting/save'; meeting: Meeting; event?: CalendarEvent; completedEventId?: number }
  | {
      type: 'group/update';
      id: string;
      previousName: string;
      name: string;
      course: string;
      teacher: string;
      room: string;
    }
  | { type: 'attendance/set'; id: number; status: string }
  | { type: 'attendance/save'; session: AttendanceSession }
  | { type: 'sale/save'; sale: Sale }
  | {
      type: 'sale/lifecycle';
      sale: Sale;
      expectedRevision: string;
    }
  | { type: 'receipt/save'; receipt: Receipt }
  | { type: 'module/rows'; key: string; rows: string[][] }
  | { type: 'branch/set'; branch: string }
  | { type: 'privacy/toggle' }
  | { type: 'chat/add'; messages: ChatMessage[] }
  | { type: 'chat/clear' }
  | { type: 'settings/save'; values: Record<string, string> };
function reduceWorkspace(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case 'student/information': {
      const current = state.students.find((s) => s.id === action.id);
      if (!current) return state;
      const result = prepareInformationEdit(current, action.patch, action.expected, state.students);
      return result.student
        ? {
            ...state,
            students: state.students.map((s) => (s.id === current.id ? result.student : s)),
          }
        : state;
    }
    case 'document/save': {
      const record = action.document;
      if (
        !record.localFile ||
        documentFileIssue(record.localFile) ||
        !state.sales?.some((s) => s.id === record.saleId && s.studentId === record.studentId) ||
        state.signedDocuments?.some((d) => d.id === record.id)
      )
        return state;
      return { ...state, signedDocuments: [record, ...(state.signedDocuments || [])] };
    }
    case 'communication/simulate': {
      const old = state.communicationLogs || [];
      return {
        ...state,
        communicationLogs: [
          ...action.logs.filter(
            (log) =>
              log.status === 'SIMULATED' &&
              state.students.some((s) => s.id === log.studentId) &&
              !old.some((s) => s.id === log.id),
          ),
          ...old,
        ],
      };
    }
    case 'activity/status': {
      const activity = state.activities?.find((a) => a.id === action.id);
      const next: Record<string, string[]> = {
        DRAFT: ['PUBLISHED', 'ARCHIVED'],
        SCHEDULED: ['PUBLISHED', 'ARCHIVED'],
        PUBLISHED: ['CLOSED', 'ARCHIVED'],
        ACTIVE: ['CLOSED', 'ARCHIVED'],
        CLOSED: ['ARCHIVED', 'PUBLISHED'],
        ARCHIVED: [],
      };
      if (
        !activity ||
        activity.status !== action.expected ||
        !next[activity.status]?.includes(action.status)
      )
        return state;
      return {
        ...state,
        activities: state.activities!.map((a) =>
          a.id === action.id
            ? { ...a, status: action.status, updatedAt: new Date().toISOString() }
            : a,
        ),
      };
    }
    case 'submission/save': {
      if (action.expectedBranch !== undefined && action.expectedBranch !== state.branch)
        return state;
      const submission = action.submission,
        activity = state.activities?.find((a) => a.id === submission.activityId);
      const previous = state.activitySubmissions?.find(
        (s) => s.activityId === submission.activityId && s.studentId === submission.studentId,
      );
      if (
        !activity ||
        (action.expectedActivityUpdatedAt !== undefined &&
          activity.updatedAt !== action.expectedActivityUpdatedAt) ||
        (action.expectedPreviousSubmittedAt !== undefined &&
          (previous?.submittedAt ?? null) !== action.expectedPreviousSubmittedAt) ||
        !state.students.some((s) => s.id === submission.studentId) ||
        !state.groupMemberships?.memberships.some(
          (m) =>
            m.studentId === submission.studentId &&
            m.groupId === activity.groupId &&
            m.status === 'active',
        ) ||
        submissionIssue(
          activity,
          submission.text || '',
          previous,
          Date.now(),
          submission.files || [],
        )
      )
        return state;
      const clean: Submission = {
        id: previous?.id || submission.id,
        activityId: activity.id,
        studentId: submission.studentId,
        studentName: state.students.find((s) => s.id === submission.studentId)!.name,
        text: submission.text?.trim() || undefined,
        files: submission.files || [],
        attemptNumber: (previous?.attemptNumber ?? (previous ? 1 : 0)) + 1,
        saveToken: submission.saveToken,
        submittedAt: new Date().toISOString(),
        status:
          activity.dueDate && Date.parse(activity.dueDate) < Date.now()
            ? 'LATE'
            : previous
              ? 'RESUBMITTED'
              : 'SUBMITTED',
      };
      return {
        ...state,
        activitySubmissions: [
          clean,
          ...(state.activitySubmissions || []).filter((s) => s.id !== previous?.id),
        ],
      };
    }
    case 'submission/grade': {
      const submission = state.activitySubmissions?.find((s) => s.id === action.id),
        activity = state.activities?.find((a) => a.id === submission?.activityId);
      if (
        !submission ||
        !activity ||
        submission.status === 'NOT_SUBMITTED' ||
        gradeIssue(activity, action.grade, action.letter || '', action.feedback, action.returned)
      )
        return state;
      return {
        ...state,
        activitySubmissions: state.activitySubmissions!.map((s) =>
          s.id === action.id
            ? {
                ...s,
                status: action.returned ? 'RETURNED' : 'GRADED',
                grade:
                  action.returned || activity.gradingMethod === 'LETTER' ? undefined : action.grade,
                maxGrade: activity.gradingMethod === 'PASS_FAIL' ? 1 : activity.maxPoints || 100,
                percentage:
                  action.returned || action.grade === undefined
                    ? undefined
                    : (action.grade /
                        (activity.gradingMethod === 'PASS_FAIL' ? 1 : activity.maxPoints || 100)) *
                      100,
                letterGrade: action.returned ? undefined : action.letter?.toUpperCase(),
                feedback: action.feedback.trim(),
                privateFeedback: action.privateFeedback?.trim(),
                gradedAt: action.returned ? undefined : new Date().toISOString(),
              }
            : s,
        ),
      };
    }
    case 'activity/save': {
      if (!activitySchema.safeParse(action.activity).success || action.activity.status !== 'DRAFT')
        return state;
      const old = state.activities?.find((a) => a.id === action.activity.id);
      if (old && old.status !== 'DRAFT') return state;
      return {
        ...state,
        activities: old
          ? state.activities!.map((a) => (a.id === action.activity.id ? action.activity : a))
          : [action.activity, ...(state.activities || [])],
      };
    }
    case 'activity/delete':
      return {
        ...state,
        activities: (state.activities || []).filter(
          (a) => a.id !== action.id || a.status !== 'DRAFT',
        ),
      };
    case 'salary/payment': {
      const record = state.salaryRecords?.find((r) => r.id === action.id);
      if (
        !record ||
        record.payments?.some((p) => p.id === action.payment.id) ||
        salaryPaymentIssue(record, action.payment.amount, action.payment.date)
      )
        return state;
      const paidAmount = Math.round((record.paidAmount + action.payment.amount) * 100) / 100;
      return {
        ...state,
        salaryRecords: state.salaryRecords!.map((r) =>
          r.id === record.id
            ? {
                ...r,
                paidAmount,
                status: paidAmount >= r.totalAmount ? 'PAID' : 'PARTIALLY_PAID',
                payments: [...(r.payments || []), action.payment],
              }
            : r,
        ),
      };
    }
    case 'entity-note/save': {
      if (noteFieldsIssue(action.note)) return state;
      const previous = state.entityNotes?.find((n) => n.id === action.note.id);
      if (
        action.expectedUpdatedAt !== undefined &&
        previous?.updatedAt !== action.expectedUpdatedAt
      )
        return state;
      if (
        previous &&
        (previous.targetId !== action.note.targetId ||
          previous.targetType !== action.note.targetType ||
          action.expectedUpdatedAt === undefined)
      )
        return state;
      const note = { ...action.note, createdAt: previous?.createdAt || action.note.createdAt };
      return {
        ...state,
        entityNotes: previous
          ? state.entityNotes!.map((n) => (n.id === note.id ? note : n))
          : [note, ...(state.entityNotes || [])],
      };
    }
    case 'entity-note/delete': {
      const previous = state.entityNotes || [];
      const notes = previous.filter(
        (n) =>
          n.id !== action.id ||
          n.targetId !== action.targetId ||
          n.targetType !== action.targetType ||
          n.updatedAt !== action.expectedUpdatedAt,
      );
      return notes.length === previous.length ? state : { ...state, entityNotes: notes };
    }
    case 'group-note/save': {
      const result = saveGroupNote(state.groupNotes || [], action.note, action.expectedUpdatedAt);
      return result.error ? state : { ...state, groupNotes: result.notes };
    }
    case 'group-note/delete':
      return {
        ...state,
        groupNotes: removeGroupNote(
          state.groupNotes || [],
          action.groupId,
          action.id,
          action.expectedUpdatedAt,
        ),
      };
    case 'schedule/batch-create':
      return batchEventIssue(action.events, state.events)
        ? state
        : { ...state, events: [...state.events, ...action.events] };
    case 'membership/transfer': {
      if (!state.groupMemberships || !state.branch) return state;
      const result = transferMembership(
        state.groupMemberships,
        action.transfer,
        state.students,
        action.groups,
      );
      return result.error ? state : { ...state, groupMemberships: result.records };
    }
    case 'event/save':
      return {
        ...state,
        events: state.events.some((event) => event.id === action.event.id)
          ? state.events.map((event) => (event.id === action.event.id ? action.event : event))
          : [...state.events, action.event],
      };
    case 'event/delete':
      return { ...state, events: state.events.filter((event) => event.id !== action.id) };
    case 'student/save':
      return {
        ...state,
        students: state.students.some((s) => s.id === action.student.id)
          ? state.students.map((s) => (s.id === action.student.id ? action.student : s))
          : [action.student, ...state.students],
        events: state.events.map((event) =>
          event.studentId === action.student.id ||
          state.meetings.some(
            (meeting) => meeting.id === event.id && meeting.studentId === action.student.id,
          )
            ? { ...event, person: action.student.name }
            : event,
        ),
      };
    case 'teacher/rename':
      return {
        ...state,
        students: state.students.map((s) =>
          s.teacher === action.previous ? { ...s, teacher: action.name } : s,
        ),
        events: state.events.map((e) =>
          e.teacher === action.previous ? { ...e, teacher: action.name } : e,
        ),
      };
    case 'meeting/save':
      if (state.meetings.some((m) => m.id === action.meeting.id)) return state;
      return {
        ...state,
        meetings: [action.meeting, ...state.meetings],
        events: [
          ...state.events.map((e) =>
            e.id === action.completedEventId && e.type === 'meeting'
              ? { ...e, completedAt: action.meeting.createdAt }
              : e,
          ),
          ...(action.event ? [action.event] : []),
        ],
      };
    case 'group/update':
      return {
        ...state,
        events: state.events.map((e) =>
          e.groupId === action.id
            ? { ...e, teacher: e.teacherId ? e.teacher : action.teacher, room: action.room }
            : e,
        ),
      };
    case 'attendance/set':
      return { ...state, attendance: { ...state.attendance, [action.id]: action.status } };
    case 'attendance/save':
      return {
        ...state,
        attendanceSessions: [
          action.session,
          ...(state.attendanceSessions || []).filter((s) => s.id !== action.session.id),
        ],
      };
    case 'sale/save': {
      const records = financeRecords(state);
      if (
        validateSale(action.sale) ||
        records.sales.some((s) => s.id === action.sale.id) ||
        !state.students.some((s) => s.id === action.sale.studentId)
      )
        return state;
      const next = { sales: [...records.sales, action.sale], receipts: records.receipts };
      return {
        ...state,
        ...next,
        students: state.students.map((s) =>
          s.id === action.sale.studentId ? studentFinancials({ ...s, status: 'Aktif' }, next) : s,
        ),
      };
    }
    case 'sale/lifecycle': {
      const current = state.sales?.find((s) => s.id === action.sale.id);
      if (!current || saleLifecycleRevision(current) !== action.expectedRevision) return state;
      return {
        ...state,
        sales: state.sales!.map((s) => (s.id === current.id ? action.sale : s)),
      };
    }
    case 'receipt/save': {
      const records = financeRecords(state);
      if (
        records.receipts.some((r) => r.id === action.receipt.id) ||
        validateReceipt(action.receipt, records, state.settings)
      )
        return state;
      const next = { sales: records.sales, receipts: [...records.receipts, action.receipt] };
      return {
        ...state,
        ...next,
        students: state.students.map((s) =>
          s.id === action.receipt.studentId ? studentFinancials(s, next) : s,
        ),
      };
    }
    case 'module/rows':
      return { ...state, moduleRows: { ...state.moduleRows, [action.key]: action.rows } };
    case 'branch/set':
      return { ...state, branch: action.branch };
    case 'privacy/toggle':
      return { ...state, privacy: !state.privacy };
    case 'chat/add':
      return { ...state, chat: [...state.chat, ...action.messages] };
    case 'chat/clear':
      return { ...state, chat: [] };
    case 'settings/save':
      return {
        ...state,
        settings: { ...state.settings, ...action.values },
      };
  }
}

/** Record successful local changes in the profile history, without logging input contents. */
export function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  const next = reduceWorkspace(state, action);
  if (next === state) return state;
  let targetId: string | undefined,
    targetType: AuditLog['targetType'] = 'student';
  const labels: Record<string, string> = {
    'student/save': 'Öğrenci kaydı güncellendi',
    'student/information': 'Öğrenci bilgileri düzenlendi',
    'membership/transfer': 'Grup üyeliği güncellendi',
    'sale/save': 'Satış kaydedildi',
    'sale/lifecycle': 'Eğitim yaşam döngüsü güncellendi',
    'receipt/save': 'Tahsilat kaydedildi',
    'document/save': 'Belge eklendi',
    'submission/save': 'Çalışma teslim edildi',
    'submission/grade': 'Çalışma değerlendirildi',
    'entity-note/save': 'Takip notu kaydedildi',
    'entity-note/delete': 'Takip notu silindi',
  };
  if (action.type === 'student/save') targetId = String(action.student.id);
  if (action.type === 'student/information') targetId = String(action.id);
  if (action.type === 'membership/transfer') targetId = String(action.transfer.studentId);
  if (action.type === 'sale/save') targetId = String(action.sale.studentId);
  if (action.type === 'sale/lifecycle') targetId = String(action.sale.studentId);
  if (action.type === 'receipt/save') targetId = String(action.receipt.studentId);
  if (action.type === 'document/save') targetId = String(action.document.studentId);
  if (action.type === 'submission/save') targetId = String(action.submission.studentId);
  if (action.type === 'submission/grade')
    targetId = String(state.activitySubmissions?.find((s) => s.id === action.id)?.studentId || '');
  if (action.type === 'entity-note/save') {
    targetId = action.note.targetId;
    targetType = action.note.targetType;
  }
  if (action.type === 'entity-note/delete') {
    targetId = action.targetId;
    targetType = action.targetType;
  }
  if (!targetId || !labels[action.type]) return next;
  const log: AuditLog = {
    id: crypto.randomUUID(),
    targetId,
    targetType,
    actorName: state.settings?.profileName || 'Çalışma alanı',
    action: labels[action.type],
    succeededCount: 1,
    failedCount: 0,
    createdAt: new Date().toISOString(),
  };
  return { ...next, auditLogs: [log, ...(next.auditLogs || [])].slice(0, 2000) };
}
