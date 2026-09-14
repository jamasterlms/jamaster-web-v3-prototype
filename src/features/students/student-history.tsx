import { useWorkspace } from '@/app/workspace-provider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Icon } from '@/components/shared/icon';
import { useSearchParams } from 'react-router-dom';
import { CommunicationHistory } from './communication-history';
import { HistoryFilters, useHistoryFilter } from './history-filters';
import { studentMeetingHistory, messageDateTime } from './history-model';
import { CalendarPage } from '@/features/calendar/calendar-page';
import { StudentRecords } from './student-records';
import { AuditHistory } from '@/features/entities/audit-history';
import { labelFor, meetingResults, meetingTypes } from '@/features/meetings/meeting-options';
import type { Student } from '@/types';
const tabs = [
  ['meetings', 'Görüşmeler'],
  ['schedule', 'Ders programı'],
  ['sms', 'SMS'],
  ['whatsapp', 'WhatsApp'],
  ['whatsappConversation', 'WhatsApp konuşması'],
  ['email', 'E-posta'],
  ['polling', 'Yoklamalar'],
  ['audit', 'İşlem geçmişi'],
];
export type { CommunicationLog } from '@/features/entities/record-model';
export function StudentHistory({ student }: { student: Student }) {
  const [params, setParams] = useSearchParams();
  const active = tabs.some(([key]) => key === params.get('tab')) ? params.get('tab')! : 'meetings';
  return (
    <>
      <Tabs
        value={active}
        onValueChange={(tab) =>
          setParams((p) => {
            const next = new URLSearchParams(p);
            ['page', 'limit', 'search', 'sort', 'order', 'startDate', 'endDate'].forEach((k) =>
              next.delete(k),
            );
            next.set('tab', tab);
            return next;
          })
        }
      >
        <TabsList className="detail-view-tabs" aria-label="Öğrenci geçmişi">
          {tabs.map(([key, label]) => (
            <TabsTrigger key={key} value={key}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="detail-view-content" key={active}>
        {active === 'schedule' ? (
          <CalendarPage embedded scope={{ studentId: student.id }} />
        ) : active === 'polling' ? (
          <StudentRecords id={student.id} section="polling-history" />
        ) : active === 'audit' ? (
          <AuditHistory targetType="student" targetId={String(student.id)} />
        ) : active === 'meetings' ? (
          <MeetingHistory student={student} />
        ) : (
          <CommunicationHistory
            student={student}
            channel={active === 'email' ? 'email' : active === 'sms' ? 'sms' : 'whatsapp'}
            conversation={active === 'whatsappConversation'}
          />
        )}
      </div>
    </>
  );
}
function MeetingHistory({ student }: { student: Student }) {
  const { state, openModal } = useWorkspace();
  const [filter, setFilter] = useHistoryFilter('meeting-history', ['createdAt', 'meetingDate']);
  const meetings = studentMeetingHistory(state.meetings, student.id, filter);
  return (
    <>
      <div className="module-toolbar">
        <HistoryFilters
          filter={filter}
          onChange={setFilter}
          fields={[
            ['createdAt', 'Oluşturma'],
            ['meetingDate', 'Görüşme tarihi'],
          ]}
          placeholder="Görüşme türü, sonuç veya not ara"
        />
        <Button onClick={() => openModal({ type: 'meeting', id: student.id })}>
          <Icon name="plus" />
          Yeni görüşme
        </Button>
      </div>
      <DataTable
        name={`student-${student.id}-meetings`}
        data={meetings}
        filterKey={JSON.stringify(filter)}
        manualSorting
        exportConfig={{
          filename: `ogrenci-${student.id}-gorusmeler`,
          columns: [
            { key: 'type', label: 'Görüşme türü', value: (m) => labelFor(meetingTypes, m.type) },
            { key: 'result', label: 'Sonuç', value: (m) => labelFor(meetingResults, m.result) },
            { key: 'note', label: 'Not', value: (m) => m.note },
            { key: 'date', label: 'Görüşme tarihi', value: (m) => m.date },
            { key: 'createdAt', label: 'Oluşturma', value: (m) => m.createdAt },
          ],
        }}
        getRowId={(m) => String(m.id)}
        columns={[
          { id: 'type', accessorFn: (m) => labelFor(meetingTypes, m.type), header: 'Görüşme türü' },
          { id: 'result', accessorFn: (m) => labelFor(meetingResults, m.result), header: 'Sonuç' },
          {
            accessorKey: 'note',
            header: 'Görüşme notu',
            cell: ({ row }) => <p className="line-clamp-3 max-w-md">{row.original.note || '—'}</p>,
          },
          {
            accessorKey: 'date',
            header: 'Görüşme tarihi',
            cell: ({ row }) => (row.original.date ? messageDateTime(row.original.date) : '—'),
          },
          {
            accessorKey: 'createdAt',
            header: 'Oluşturulma',
            cell: ({ row }) => messageDateTime(row.original.createdAt),
          },
        ]}
        mobileCard={(m) => (
          <>
            <strong>{labelFor(meetingTypes, m.type)}</strong>
            <p>{labelFor(meetingResults, m.result)}</p>
            <p>{m.note || 'Not eklenmedi.'}</p>
            <small>{messageDateTime(m.createdAt)}</small>
          </>
        )}
      />
    </>
  );
}
