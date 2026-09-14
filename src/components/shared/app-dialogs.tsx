import { HelpCenterContent } from '@/features/help/help-page';
import { useEntityNavigation } from '@/features/entities/use-entity-navigation';
import { useWorkspace } from '@/app/workspace-provider';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { allPages } from '@/data/navigation';
import { MeetingDialog } from '@/features/meetings/meeting-dialog';
import { StudentDetail, StudentForm } from '@/features/students/student-dialogs';
import { navigate } from '@/hooks/use-route';
import { attendanceRoute } from '@/features/calendar/attendance-model';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Icon } from './icon';
import { Avatar, Person } from './primitives';
export function AppDialogs() {
  const openEntity = useEntityNavigation();
  const { state, modal, modalOpen, openModal, closeModal } = useWorkspace();
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openModal({ type: 'search' });
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [openModal]);
  useEffect(() => {
    if (modal?.type === 'student' && modal.id && modalOpen) {
      closeModal();
      openEntity({ kind: 'students', id: String(modal.id) });
    }
  }, [modal, modalOpen]);
  if (!modal) return null;
  const type = modal.type;
  const student = 'id' in modal ? state.students.find((s) => s.id === modal.id) : undefined;
  const event = type === 'event' ? state.events.find((e) => e.id === modal.id) : undefined;
  const title = (
    {
      search: 'Hızlı arama',
      'meeting-picker': 'Görüşme yapılacak öğrenci',
      'sale-picker': 'Satış yapılacak öğrenci',
      student: 'Öğrenci bilgileri',
      'student-form': student ? 'Öğrenciyi düzenle' : 'Yeni öğrenci',
      meeting: 'Hızlı Görüşme',
      event: event?.type === 'meeting' ? 'Görüşme bilgileri' : 'Ders bilgileri',
      profile: 'Profil',
      help: 'Yardım merkezi',
      notifications: 'Bildirimler',
      language: 'Dil seçenekleri',
    } as Record<string, string>
  )[type];
  const chooseStudent = (id: number) => {
    if (type === 'sale-picker') {
      closeModal();
      navigate(`admin/sales/${id}`);
    } else openModal({ type: 'meeting', id });
  };
  return (
    <Dialog
      open={modalOpen}
      onOpenChange={(open) => {
        if (!open) closeModal();
      }}
    >
      <DialogContent
        preventOutsideClose={type === 'student-form' || type === 'meeting'}
        className={`jam-modal ${type === 'help' ? 'help-center-dialog' : ''} ${type === 'meeting' ? 'meeting-dialog' : type === 'student-form' || type === 'help' ? 'dialog-wide' : ''}`}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">{title} penceresi</DialogDescription>
        </DialogHeader>
        {type === 'search' ? (
          <Command>
            <CommandInput placeholder="Öğrenci veya sayfa ara…" />
            <CommandList>
              <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
              <CommandGroup heading="Sayfalar">
                {allPages.map((page) => (
                  <CommandItem
                    key={page.id}
                    value={page.title + ' ' + page.id}
                    onSelect={() => {
                      closeModal();
                      navigate(page.id);
                    }}
                  >
                    <Icon name={page.icon} />
                    {page.title}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup heading="Öğrenciler">
                {state.students.map((s) => (
                  <CommandItem
                    key={s.id}
                    value={s.name + ' ' + s.id}
                    onSelect={() => {
                      closeModal();
                      navigate(`admin/students/${s.id}`);
                    }}
                  >
                    <Person student={s} />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        ) : type === 'meeting-picker' || type === 'sale-picker' ? (
          <Command>
            <CommandInput placeholder="Ad soyad veya öğrenci numarası" />
            <CommandList>
              <CommandEmpty>Öğrenci bulunamadı.</CommandEmpty>
              {state.students.map((s) => (
                <CommandItem
                  key={s.id}
                  value={`${s.name} ${s.id}`}
                  onSelect={() => chooseStudent(s.id)}
                >
                  <Person student={s} />
                  <Icon name="arrow-right" className="ml-auto" />
                </CommandItem>
              ))}
            </CommandList>
            <Button
              variant="ghost"
              onClick={() => openModal({ type: 'student-form', afterCreate: 'meeting' })}
            >
              <Icon name="plus" />
              Yeni öğrenci kaydı
            </Button>
          </Command>
        ) : type === 'student' && student ? (
          <StudentDetail student={student} />
        ) : type === 'student-form' ? (
          <StudentForm
            key={student?.id || 'new'}
            student={student}
            afterCreate={modal.type === 'student-form' ? modal.afterCreate : undefined}
          />
        ) : type === 'meeting' && student ? (
          <MeetingDialog
            key={`${student.id}:${modal.eventId || ''}`}
            student={student}
            reportMode={modal.reportMode}
            studentOrder={modal.studentOrder}
            eventId={modal.eventId}
          />
        ) : type === 'event' && event ? (
          <>
            <h3 className="text-lg font-medium">{event.title}</h3>
            <div className="detail-grid">
              {[
                [
                  'Tarih',
                  new Date(2026, 8, event.day).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }),
                ],
                ['Saat', event.time + ' · ' + event.duration + ' dakika'],
                ['Öğretmen / danışman', event.teacher],
                ['Konum', event.room],
                [
                  'Öğrenci',
                  event.studentId !== undefined
                    ? state.students.find((s) => s.id === event.studentId)?.name ||
                      `Öğrenci #${event.studentId}`
                    : event.lessonType === 'PRIVATE'
                      ? 'Öğrenci atanmamış'
                      : event.person ||
                        (event.count != null ? `${event.count} öğrenci` : 'Belirtilmedi'),
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <b>{value}</b>
                </div>
              ))}
            </div>
            <div className="form-actions">
              <Button variant="outline" onClick={closeModal}>
                Kapat
              </Button>
              {event.type === 'meeting' ? (
                <Button
                  onClick={() => {
                    const s = state.students.find((s) => s.name === event.person);
                    s
                      ? openModal({ type: 'meeting', id: s.id })
                      : openModal({ type: 'meeting-picker' });
                  }}
                >
                  <Icon name="handshake" />
                  Görüşme kaydet
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    closeModal();
                    navigate(attendanceRoute(event, state.attendanceSessions || [], state.branch));
                  }}
                >
                  Yoklamayı aç
                </Button>
              )}
            </div>
          </>
        ) : type === 'profile' ? (
          <>
            <div className="detail-header">
              <Avatar name="Furkan Çolak" className="profile-avatar" />
              <div>
                <h3>Furkan Çolak</h3>
                <p>Şube yöneticisi</p>
              </div>
            </div>
            <div className="detail-grid">
              <div>
                <span>Aktif şube</span>
                <b>{state.branch}</b>
              </div>
              <div>
                <span>Arayüz dili</span>
                <b>Türkçe</b>
              </div>
            </div>
            <Button
              onClick={() => {
                closeModal();
                navigate('admin/settings');
              }}
            >
              Ayarları aç
            </Button>
          </>
        ) : type === 'help' ? (
          <HelpCenterContent />
        ) : type === 'notifications' ? (
          <>
            {[
              [
                'receipt-text',
                '14 taksitin vadesi geçti',
                'Toplam 42.800 ₺ tutarındaki ödemeleri gözden geçirin.',
              ],
              ['users', 'Yeni kayıtlar eklendi', 'Elif Yılmaz ve Mert Kaya bugün kaydoldu.'],
              [
                'calendar-days',
                'Bugün bir görüşmeniz var',
                '13:30 · Bora Eren ile seviye tespit görüşmesi.',
              ],
            ].map(([icon, title, text]) => (
              <div key={title} className="notification-item">
                <Icon name={icon} />
                <div>
                  <b>{title}</b>
                  <p>{text}</p>
                </div>
              </div>
            ))}
            <Button
              onClick={() => {
                closeModal();
                navigate('admin/payments/installments');
              }}
            >
              Tahsilatları aç
            </Button>
          </>
        ) : type === 'language' ? (
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={() => {
                closeModal();
                toast('Türkçe seçildi.');
              }}
            >
              Türkçe
              <Icon name="check" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => toast('Bu çalışma alanı Türkçe olarak hazırlanmıştır.')}
            >
              English
            </Button>
          </div>
        ) : (
          <p>Kayıt bulunamadı.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
