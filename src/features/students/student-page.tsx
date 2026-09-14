import { StudentActivities, StudentDocuments } from './student-academics';
import { StudentGroups } from './student-groups';
import { StudentHistory } from './student-history';
import { EntityNotes } from '@/features/entities/entity-notes';
import { useWorkspace } from '@/app/workspace-provider';
import { PageNavigation } from '@/components/navigation/page-navigation';
import { PageHeading } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { labelFor, meetingResults, meetingTypes } from '@/features/meetings/meeting-options';
import { Link } from 'react-router-dom';
import { StudentInformation } from './student-information';
import { StudentDetail } from './student-dialogs';
import { StudentRecords } from './student-records';
export function StudentPage({
  id: inputId,
  section = 'overview',
}: {
  id: number | string;
  section?: string;
}) {
  const { state } = useWorkspace();
  const student = state.students.find((s) => String(s.id) === String(inputId));
  if (!student)
    return (
      <>
        <PageHeading title="Öğrenci bulunamadı" />
        <Button asChild>
          <Link to="/admin/students">Öğrencilere dön</Link>
        </Button>
      </>
    );
  const id = student.id;
  return (
    <>
      <PageHeading
        title={student.name}
        description={`Öğrenci no: ${id} · Danışman: ${student.advisor || 'Atanmadı'}`}
      />
      <PageNavigation
        items={[
          { to: `/admin/students/${id}`, label: 'Öğrenci bilgileri' },
          { to: `/admin/students/${id}/payments`, label: 'Satış ve tahsilatlar' },
          { to: `/admin/students/${id}/groups`, label: 'Gruplar' },
          { to: `/admin/students/${id}/activities`, label: 'Aktiviteler' },
          { to: `/admin/students/${id}/documents`, label: 'Belgeler' },
          { to: `/admin/students/${id}/history`, label: 'Geçmiş' },
        ]}
      />
      {section === 'activities' ? (
        <StudentActivities id={id} />
      ) : section === 'documents' ? (
        <StudentDocuments id={id} />
      ) : section === 'history' ? (
        <StudentHistory student={student} />
      ) : section === 'groups' ? (
        <StudentGroups studentId={id} />
      ) : section === 'payments' ? (
        <StudentRecords id={id} section={section} />
      ) : (
        <>
          {section === 'overview' && (
            <>
              <Card className="student-profile-card">
                <StudentDetail student={student} />
              </Card>
              <StudentInformation key={student.id} student={student} />
              <EntityNotes targetType="student" targetId={String(id)} />
            </>
          )}
          <h2 className="subsection-title">Görüşme geçmişi</h2>
          {state.meetings
            .filter((m) => m.studentId === id)
            .map((m) => (
              <Card className="meeting-history-card" key={m.id}>
                <div className="flex justify-between">
                  <strong>{labelFor(meetingTypes, m.type)}</strong>
                  <span>{labelFor(meetingResults, m.result)}</span>
                </div>
                <p>{m.note || 'Görüşme notu eklenmedi.'}</p>
                <small>{new Date(m.createdAt).toLocaleString('tr-TR')}</small>
              </Card>
            ))}
          {!state.meetings.some((m) => m.studentId === id) && (
            <p className="empty-inline">Henüz görüşme kaydı bulunmuyor.</p>
          )}
        </>
      )}
    </>
  );
}
