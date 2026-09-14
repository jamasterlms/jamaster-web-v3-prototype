import { useState } from 'react';
import { toast } from 'sonner';
import { useWorkspace } from '@/app/workspace-provider';
import { useOperations } from '@/features/operations/operations-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { isDate } from '@/lib/validation';
import { membershipTransferIssue, type GroupTransfer } from './membership-model';
import { useMemberships } from './use-memberships';

export function MembershipDialog({
  studentId,
  groupId,
  remove = false,
  onClose,
}: {
  studentId?: number;
  groupId?: string;
  remove?: boolean;
  onClose: () => void;
}) {
  const { state, dispatch } = useWorkspace();
  const { operations } = useOperations();
  const memberships = useMemberships();
  const [selectedStudent, setStudent] = useState(studentId ? String(studentId) : '');
  const [selectedGroup, setGroup] = useState(groupId || '');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState<GroupTransfer | null>(null);
  const student = state.students.find((s) => s.id === Number(selectedStudent));
  const group = operations.groups.find((g) => g.id === selectedGroup);
  const saleInfo = student ? state.activeSaleInfo?.[student.id] : undefined;
  const commit = (transfer: GroupTransfer) => {
    const issue = !state.branch
      ? 'Önce çalışma alanından şube seçin.'
      : membershipTransferIssue(memberships.records, transfer, state.students, operations.groups);
    if (issue) {
      setError(issue);
      setConfirmation(null);
      return;
    }
    dispatch({ type: 'membership/transfer', transfer, groups: operations.groups });
    toast.success(remove ? 'Grup üyeliği sonlandırıldı.' : 'Öğrenci gruba eklendi.');
    onClose();
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="jam-modal" preventOutsideClose>
        <DialogHeader>
          <DialogTitle>{remove ? 'Gruptan çıkar' : 'Gruba öğrenci ekle'}</DialogTitle>
          <DialogDescription>
            {remove
              ? 'Seçili grup üyeliğini nedenini belirterek sonlandırın.'
              : 'Öğrencinin mevcut grupları korunarak yeni üyelik oluşturulur.'}
          </DialogDescription>
        </DialogHeader>
        <form
          className="dialog-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (confirmation) {
              commit(confirmation);
              return;
            }
            if (!student || !group) {
              setError('Öğrenci ve grup seçin.');
              return;
            }
            if (date && !isDate(date)) {
              setError('Geçerli bir işlem tarihi girin.');
              return;
            }
            const transfer: GroupTransfer = {
              id: crypto.randomUUID(),
              studentId: student.id,
              ...(remove ? { fromGroupIds: [group.id] } : { toGroupId: group.id }),
              ...(date ? { transferDate: new Date(date).toISOString() } : {}),
              reason: reason.trim() || undefined,
              recordedAt: new Date().toISOString(),
            };
            const issue = membershipTransferIssue(
              memberships.records,
              transfer,
              state.students,
              operations.groups,
            );
            if (issue) {
              setError(issue);
              return;
            }
            setError('');
            if (saleInfo?.hasActiveSale) setConfirmation(transfer);
            else commit(transfer);
          }}
        >
          <div className="dialog-form-body">
            {confirmation ? (
              <div className="pending-banner" role="status">
                <h3 className="font-medium">Aktif satış bilgisi</h3>
                <p>
                  {saleInfo?.warning ||
                    'Bu öğrencinin aktif bir satışı bulunuyor. Grup değişikliğini onaylıyor musunuz?'}
                </p>
                {saleInfo?.status && <p>Durum: {saleInfo.status.toUpperCase()}</p>}
                {saleInfo?.paidAmount !== undefined && (
                  <p data-sensitive>Ödenen tutar: {saleInfo.paidAmount}</p>
                )}
                <p>
                  {student?.name} · {group?.name}
                </p>
              </div>
            ) : (
              <>
                <fieldset className="form-section" data-form-section="required">
                  <legend>
                    Üyelik bilgileri <span>Zorunlu</span>
                  </legend>
                  {studentId ? (
                    <p className="mb-4 font-medium">{student?.name || 'Öğrenci bulunamadı'}</p>
                  ) : (
                    <div className="form-field">
                      <Label htmlFor="membership-student">Öğrenci *</Label>
                      <Select
                        value={selectedStudent || undefined}
                        onValueChange={(value) => {
                          setStudent(value);
                          setError('');
                        }}
                        required
                      >
                        <SelectTrigger id="membership-student">
                          <SelectValue placeholder="Öğrenci seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {state.students
                            .filter(
                              (s) =>
                                !memberships.membersOf(selectedGroup).some((m) => m.id === s.id),
                            )
                            .map((s) => (
                              <SelectItem key={s.id} value={String(s.id)}>
                                {s.name} · #{s.id}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {groupId ? (
                    <p className="mt-3 muted">Grup: {group?.name || 'Grup bulunamadı'}</p>
                  ) : (
                    <div className="form-field">
                      <Label htmlFor="membership-group">Grup *</Label>
                      <Select value={selectedGroup || undefined} onValueChange={setGroup} required>
                        <SelectTrigger id="membership-group">
                          <SelectValue placeholder="Grup seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {operations.groups
                            .filter(
                              (g) =>
                                !memberships
                                  .groupsFor(Number(selectedStudent))
                                  .some((m) => m.id === g.id),
                            )
                            .map((g) => (
                              <SelectItem key={g.id} value={g.id}>
                                {g.name} · {g.course}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {student && (
                    <p className="muted mt-3">Mevcut gruplar: {memberships.labelFor(student.id)}</p>
                  )}
                  {remove && (
                    <div className="form-field mt-4">
                      <Label htmlFor="membership-reason">Çıkarma nedeni *</Label>
                      <Textarea
                        id="membership-reason"
                        required
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Öğrencinin gruptan ayrılma nedenini yazın"
                        maxLength={2000}
                      />
                    </div>
                  )}
                </fieldset>
                <fieldset
                  className="form-section form-section-optional"
                  data-form-section="optional"
                >
                  <legend>
                    İşlem ayrıntıları <span>İsteğe bağlı</span>
                  </legend>
                  <div className="form-field">
                    <Label htmlFor="membership-date">İşlem tarihi</Label>
                    <Input
                      id="membership-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      placeholder="Gün / ay / yıl"
                      aria-describedby="membership-date-help"
                    />
                    <small id="membership-date-help" className="muted">
                      Boş bırakırsanız işlem zamanı kullanılır.
                    </small>
                  </div>
                  {!remove && (
                    <div className="form-field">
                      <Label htmlFor="membership-reason">Açıklama</Label>
                      <Textarea
                        id="membership-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Gruba ekleme nedeni veya notunuz"
                        maxLength={2000}
                      />
                    </div>
                  )}
                </fieldset>
                {student && saleInfo === undefined && (
                  <p className="muted text-sm">
                    Aktif satış durumu doğrulanamıyor. Gerekirse öğrencinin satış ve tahsilatlarını
                    kontrol edin.
                  </p>
                )}
              </>
            )}
            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => (confirmation ? setConfirmation(null) : onClose())}
            >
              {confirmation ? 'Geri dön' : 'Vazgeç'}
            </Button>
            <Button type="submit" disabled={!student || !group || !state.branch}>
              {confirmation ? 'Onayla ve devam et' : remove ? 'Üyeliği sonlandır' : 'Gruba ekle'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
