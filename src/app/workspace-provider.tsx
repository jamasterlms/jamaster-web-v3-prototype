import { initialActivities } from '@/features/activities/initial-activities';
import { toast } from 'sonner';
import events from '@/data/events.json';
import students from '@/data/students.json';
import { financeRecords } from '@/features/finance/finance-model';
import { useOperations } from '@/features/operations/operations-provider';
import { migrateMemberships } from '@/features/education/membership-model';
import type { Modal } from '@/types';
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
  type Dispatch,
  type PropsWithChildren,
} from 'react';
import { workspaceReducer, type WorkspaceAction, type WorkspaceState } from './workspace-reducer';
const initial: WorkspaceState = {
  auditLogs: [],
  communicationLogs: [],
  signedDocuments: [],
  activities: initialActivities,
  activitySubmissions: [],
  students,
  events,
  meetings: [],
  attendance: {},
  moduleRows: {},
  branch: 'New York',
  privacy: false,
  chat: [],
  settings: {
    branchName: 'New York',
    phone: '+90 212 555 01 01',
    email: 'newyork@jamaster.com.tr',
    address: 'Merkez Mahallesi, Eğitim Caddesi No: 24',
    bank: 'İş Bankası',
    iban: 'TR•• •••• •••• •••• •••• •••• ••',
    sender: 'JAMASTER',
  },
};
type WorkspaceContextValue = {
  state: WorkspaceState;
  dispatch: Dispatch<WorkspaceAction>;
  modal: Modal | null;
  modalOpen: boolean;
  openModal: (modal: Modal) => void;
  closeModal: () => void;
};
const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
export function WorkspaceProvider({ children }: PropsWithChildren) {
  const { operations } = useOperations();
  const [state, dispatch] = useReducer(workspaceReducer, initial, (seed) => {
    try {
      const saved = JSON.parse(localStorage.getItem('jamaster-workspace-v3') || 'null');
      if (
        saved &&
        Array.isArray(saved.students) &&
        Array.isArray(saved.events) &&
        Array.isArray(saved.meetings) &&
        saved.settings
      )
        return {
          ...seed,
          ...saved,
          activities: Array.isArray(saved.activities)
            ? saved.activities
            : saved.students.length
              ? seed.activities?.filter((a) => operations.groups.some((g) => g.id === a.groupId))
              : [],
          ...financeRecords(saved),
          groupMemberships: migrateMemberships(
            saved.groupMemberships || {},
            saved.students,
            operations.groups,
          ),
          privacy: false,
          attendanceSessions: Array.isArray(saved.attendanceSessions)
            ? saved.attendanceSessions
            : [],
          events: saved.events.map((event: (typeof events)[number]) => {
            const original = events.find(
              (e) => e.id === event.id && e.title === event.title && e.day === event.day,
            );
            return event.groupId || !original?.groupId
              ? event
              : { ...event, groupId: original.groupId };
          }),
        } as WorkspaceState;
    } catch {
      /* The workspace works when browser storage is unavailable. */
    }
    return {
      ...seed,
      ...financeRecords(seed),
      groupMemberships: migrateMemberships({}, seed.students, operations.groups),
    };
  });
  useEffect(() => {
    try {
      localStorage.setItem('jamaster-workspace-v3', JSON.stringify(state));
    } catch {
      toast.error(
        'Değişiklikler yalnız bu oturumda tutuluyor. Tarayıcı depolama alanını kontrol edin.',
        { id: 'workspace-storage-error' },
      );
    }
  }, [state]);
  const [modal, setModal] = useState<Modal | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const openModal = (value: Modal) => {
    setModal(value);
    setModalOpen(true);
  };
  return (
    <WorkspaceContext.Provider
      value={{
        state,
        dispatch,
        modal,
        modalOpen,
        openModal,
        closeModal: () => setModalOpen(false),
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('WorkspaceProvider is required');
  return context;
}
