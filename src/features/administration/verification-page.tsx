import { Icon } from '@/components/shared/icon';
import { useWorkspace } from '@/app/workspace-provider';
import { PageNavigation } from '@/components/navigation/page-navigation';
import { Metrics } from '@/components/shared/feature-primitives';
import { PageHeading, StatusBadge } from '@/components/shared/primitives';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { usePageState } from '@/hooks/use-page-state';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  decisionIssue,
  verificationRequests,
  type VerificationRequest,
} from './verification-model';
export function VerificationPage({ route }: { route: string }) {
  const { state, dispatch } = useWorkspace();
  const kind = route.endsWith('meetings')
    ? 'MEETING_CREATE'
    : route.endsWith('installments')
      ? 'INSTALLMENT_PAYMENT'
      : 'SALE_CREATE';
  const records = verificationRequests(state.settings),
    requests = records.filter((r) => r.type === kind);
  const [status, setStatus] = usePageState('status', 'PENDING');
  const [selected, setSelected] = useState<string | null>(null),
    [note, setNote] = useState('');
  const request = requests.find((r) => r.id === selected);
  const labels: Record<string, string> = {
    PENDING: 'Onay bekliyor',
    APPROVED: 'Onaylandı',
    REJECTED: 'Reddedildi',
  };
  const types: Record<string, string> = {
    SALE_CREATE: 'Satış',
    MEETING_CREATE: 'Görüşme',
    INSTALLMENT_PAYMENT: 'Senet ödemesi',
  };
  const list = requests.filter((r) => status === 'all' || r.status === status);
  const open = (r: VerificationRequest) => {
    setSelected(r.id);
    setNote(r.note || '');
  };
  const decide = (status: 'APPROVED' | 'REJECTED') => {
    if (!request) return;
    const issue = decisionIssue(request, status, note);
    if (issue) {
      toast.error(issue);
      return;
    }
    dispatch({
      type: 'settings/save',
      values: {
        'verification-requests-v4': JSON.stringify(
          records.map((r) =>
            r.id === request.id
              ? { ...r, status, note: note.trim(), decidedAt: new Date().toISOString() }
              : r,
          ),
        ),
      },
    });
    setSelected(null);
    toast.success('İnceleme kararı kaydedildi.');
  };
  return (
    <>
      <PageHeading
        title="Doğrulamalar"
        description="İncelemeye gönderilen işlem talepleri ve karar geçmişi."
      />
      <PageNavigation
        items={[
          { to: '/admin/verification-requests', label: 'Satış doğrulaması' },
          { to: '/admin/verification-requests/installments', label: 'Senet doğrulaması' },
          { to: '/admin/verification-requests/meetings', label: 'Görüşme doğrulaması' },
        ]}
      />
      <Metrics
        items={['PENDING', 'APPROVED', 'REJECTED'].map((s) => ({
          label: labels[s],
          value: requests.filter((r) => r.status === s).length,
          highlight: s === 'APPROVED',
        }))}
      />
      <div className="module-toolbar">
        <div className="form-field">
          <Label htmlFor="verification-status">Durum</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="verification-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['all', 'PENDING', 'APPROVED', 'REJECTED'].map((s) => (
                <SelectItem key={s} value={s}>
                  {s === 'all' ? 'Tümü' : labels[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DataTable
        name="verification-requests"
        data={list}
        getRowId={(r) => r.id}
        columns={[
          { id: 'type', header: 'İşlem', accessorFn: (r) => types[r.type] },
          { accessorKey: 'requester', header: 'Talep eden' },
          {
            accessorKey: 'createdAt',
            header: 'Talep tarihi',
            cell: ({ row }) => new Date(row.original.createdAt).toLocaleString('tr-TR'),
          },
          {
            id: 'status',
            header: 'Durum',
            accessorFn: (r) => labels[r.status],
            cell: ({ row }) => <StatusBadge>{labels[row.original.status]}</StatusBadge>,
          },
          {
            id: 'actions',
            header: 'İşlem',
            enableSorting: false,
            cell: ({ row }) => (
              <Button
                onClick={() => open(row.original)}
                variant="ghost"
                size="icon"
                aria-label="İncele"
                title="İncele"
              >
                <Icon name="eye" />
              </Button>
            ),
          },
        ]}
        mobileCard={(r) => (
          <>
            <h3>{types[r.type]} doğrulaması</h3>
            <p>{r.requester}</p>
            <p>{new Date(r.createdAt).toLocaleString('tr-TR')}</p>
            <StatusBadge>{labels[r.status]}</StatusBadge>
            <Button variant="outline" onClick={() => open(r)}>
              İncele
            </Button>
          </>
        )}
      />
      <Dialog
        open={!!request}
        onOpenChange={(v) => {
          if (!v) setSelected(null);
        }}
      >
        <DialogContent className="jam-modal">
          <DialogHeader>
            <DialogTitle>İşlem incelemesi</DialogTitle>
            <DialogDescription>Talep ayrıntıları ve kayıtlı karar.</DialogDescription>
          </DialogHeader>
          {request && (
            <>
              <div className="detail-grid">
                <div>
                  <small>Talep eden</small>
                  <b>{request.requester}</b>
                </div>
                <div>
                  <small>İşlem</small>
                  <b>{types[request.type]}</b>
                </div>
                <div>
                  <small>Durum</small>
                  <StatusBadge>{labels[request.status]}</StatusBadge>
                </div>
                <div>
                  <small>Karar tarihi</small>
                  <b>
                    {request.decidedAt ? new Date(request.decidedAt).toLocaleString('tr-TR') : '—'}
                  </b>
                </div>
              </div>
              <p className="contract-copy">{request.description}</p>
              <div className="form-field">
                <Label htmlFor="verification-note">İnceleme notu</Label>
                <Textarea
                  id="verification-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={request.status !== 'PENDING'}
                  maxLength={1500}
                  placeholder="Ret kararında gerekçe zorunludur."
                />
              </div>
              <div className="form-actions">
                <Button
                  variant="outline"
                  disabled={request.status !== 'PENDING'}
                  onClick={() => decide('REJECTED')}
                >
                  Reddet
                </Button>
                <Button disabled={request.status !== 'PENDING'} onClick={() => decide('APPROVED')}>
                  Onayla
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
