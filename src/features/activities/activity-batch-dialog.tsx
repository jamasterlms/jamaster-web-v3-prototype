import { useRef, useState } from 'react';
import { useWorkspace } from '@/app/workspace-provider';
import type { LearningGroup } from '@/features/operations/model';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
export type ActivityBatch = { ids: string[]; action: 'publish' | 'archive' | 'duplicate' };
export function ActivityBatchDialog({
  batch,
  groups,
  onClose,
  onApplied,
  onRestoreFocus,
}: {
  batch: ActivityBatch | null;
  groups: LearningGroup[];
  onClose: () => void;
  onApplied?: (ids: string[]) => void;
  onRestoreFocus?: () => boolean;
}) {
  return (
    <Dialog
      open={!!batch}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="jam-modal"
        onCloseAutoFocus={(event) => {
          if (onRestoreFocus?.()) event.preventDefault();
        }}
      >
        {batch && (
          <BatchContent
            key={batch.action + batch.ids.join('-')}
            batch={batch}
            groups={groups}
            onClose={onClose}
            onApplied={onApplied}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
function BatchContent({
  batch,
  groups,
  onClose,
  onApplied,
}: {
  batch: ActivityBatch;
  groups: LearningGroup[];
  onClose: () => void;
  onApplied?: (ids: string[]) => void;
}) {
  const { state, dispatch } = useWorkspace();
  const applied = useRef(false);
  const [groupId, setGroupId] = useState('_keep'),
    [result, setResult] = useState<{ count: number; failures: string[] } | null>(null);
  const title = {
    publish: 'Aktiviteleri yayımla',
    archive: 'Aktiviteleri arşivle',
    duplicate: 'Aktiviteleri çoğalt',
  }[batch.action];
  const apply = () => {
    if (applied.current) return;
    applied.current = true;
    const failures: string[] = [];
    const succeeded: string[] = [];
    let count = 0;
    for (const id of batch.ids) {
      const record = state.activities?.find((a) => a.id === id);
      if (!record || !groups.some((g) => g.id === record.groupId)) {
        failures.push('Bir kayıt artık bu listede bulunmuyor.');
        continue;
      }
      if (batch.action === 'duplicate') {
        if (groupId !== '_keep' && !groups.some((g) => g.id === groupId && g.status === 'Aktif')) {
          failures.push(`${record.title}: Hedef grup aktif değil.`);
          continue;
        }
        const now = new Date().toISOString();
        dispatch({
          type: 'activity/save',
          activity: {
            ...record,
            id: crypto.randomUUID(),
            title: (record.title + ' · Kopya').slice(0, 255),
            groupId: groupId === '_keep' ? record.groupId : groupId,
            status: 'DRAFT',
            createdAt: now,
            updatedAt: now,
          },
        });
        count++;
        succeeded.push(id);
      } else if (
        batch.action === 'publish'
          ? ['DRAFT', 'SCHEDULED', 'CLOSED'].includes(record.status)
          : record.status !== 'ARCHIVED'
      ) {
        dispatch({
          type: 'activity/status',
          id,
          expected: record.status,
          status: batch.action === 'publish' ? 'PUBLISHED' : 'ARCHIVED',
        });
        count++;
        succeeded.push(id);
      } else failures.push(`${record.title}: Mevcut durum bu işleme uygun değil.`);
    }
    setResult({ count, failures });
    onApplied?.(succeeded);
  };
  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {batch.ids.length} kayıt seçildi.{' '}
          {batch.action === 'archive'
            ? 'Teslimler korunur, öğrenci portalından kaldırılır.'
            : batch.action === 'duplicate'
              ? 'Yeni kayıtlar taslak olarak hazırlanır; eski teslimler kopyalanmaz.'
              : 'Aktiviteler kendi gruplarındaki öğrencilere görünür olur.'}
        </DialogDescription>
      </DialogHeader>
      <div className="dialog-form-body">
        {result ? (
          <>
            <p role="status">
              {result.count} işlem tamamlandı · {result.failures.length} işlem uygulanamadı
            </p>
            {result.failures.length > 0 && (
              <ul className="space-y-2 mt-4">
                {result.failures.map((error, i) => (
                  <li key={i} className="field-error">
                    {error}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : batch.action === 'duplicate' ? (
          <div className="form-field">
            <Label htmlFor="duplicate-group">Hedef grup · İsteğe bağlı</Label>
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger id="duplicate-group">
                <SelectValue placeholder="Mevcut grupları koru" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_keep">Mevcut grupları koru</SelectItem>
                {groups
                  .filter((g) => g.status === 'Aktif')
                  .map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <p>Seçtiğiniz kayıtları kontrol edip işlemi onaylayın.</p>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          {result ? 'Kapat' : 'Vazgeç'}
        </Button>
        {!result && <Button onClick={apply}>Onayla</Button>}
      </DialogFooter>
    </>
  );
}
