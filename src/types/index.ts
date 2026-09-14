export type Student = {
  id: number;
  name: string;
  email: string;
  phone: string;
  course: string;
  /** Legacy migration input. Current group relations live in groupMemberships. */
  group: string;
  teacher: string;
  date: string;
  type: string;
  status: string;
  payment: string;
  amount: number;
  attendance: number;
  color: string;
  advisor?: string;
  profile?: Record<string, string | number | boolean>;
};
export type CalendarEvent = {
  id: number;
  scheduleId?: string;
  pollId?: string;
  lessonType?: 'GROUP' | 'PRIVATE';
  status?: 'active' | 'cancelled';
  teacherId?: string;
  educationId?: string;
  startTime?: string;
  endTime?: string;
  groupId?: string;
  studentId?: number;
  completedAt?: string;
  day: number;
  time: string;
  duration: number;
  title: string;
  teacher: string;
  room: string;
  count?: number;
  person?: string;
  type: string;
  color: string;
};
export type Meeting = {
  id: number;
  studentId: number;
  type: string;
  score: number;
  result: string;
  date: string;
  reason: string;
  note: string;
  createdAt: string;
};
export type NavigationItem = {
  label: string;
  path: string;
  icon: string;
  badge?: string;
  children?: { label: string; path: string; badge?: string }[];
};
export type NavigationGroup = { label: string; items: NavigationItem[] };
export type ModuleData = {
  title: string;
  columns: string[];
  rows: string[][];
  create?: string;
  meeting?: boolean;
  verification?: boolean;
  communication?: boolean;
};
export type ChatMessage = { id: number; role: 'user' | 'assistant'; text: string };
export type Modal =
  | {
      type:
        | 'search'
        | 'meeting-picker'
        | 'sale-picker'
        | 'help'
        | 'profile'
        | 'notifications'
        | 'language';
    }
  | {
      type: 'student' | 'student-form' | 'meeting';
      afterCreate?: 'meeting';
      id?: number;
      reportMode?: boolean;
      studentOrder?: number[];
      eventId?: number;
    }
  | { type: 'event'; id: number };
