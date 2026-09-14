import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useWorkspace } from '@/app/workspace-provider';
import { useOperations } from '@/features/operations/operations-provider';
import { usePageState } from '@/hooks/use-page-state';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { IconButton, StatusBadge } from '@/components/shared/primitives';
import { localDate, normalizePhone, parsePhone, displayPhone } from '@/lib/validation';
import { HistoryFilters, useHistoryFilter } from './history-filters';
import {
  communicationHistory,
  emptyHistoryFilter,
  messageDateTime,
  messageStatusLabel,
} from './history-model';
import type { CommunicationLog } from '@/features/entities/record-model';
import type { Student } from '@/types';

export function CommunicationHistory({
  student,
  channel,
  conversation,
}: {
  student: Student;
  channel: CommunicationLog['channel'];
  conversation: boolean;
}) {
  const { state } = useWorkspace();
  const [filter, setFilter] = useHistoryFilter(`${channel}-history`, ['createdAt', 'status']);
  const [preview, setPreview] = useState<CommunicationLog | null>(null);
  const records = communicationHistory(
    state.communicationLogs || [],
    student.id,
    channel,
    conversation ? { ...emptyHistoryFilter, order: 'asc' } : filter,
  );
  const target =
    channel === 'email'
      ? `email=${encodeURIComponent(student.email)}`
      : `phone=${encodeURIComponent(student.phone)}`;
  const label = channel === 'email' ? 'e-posta' : channel === 'sms' ? 'SMS' : 'WhatsApp mesajı';
  if (conversation)
    return (
      <WhatsAppConversation
        student={student}
        records={records}
        unavailable={state.communicationLogs === undefined}
      />
    );
  return (
    <>
      <div className="module-toolbar">
        <HistoryFilters
          filter={filter}
          onChange={setFilter}
          fields={[
            ['createdAt', 'Tarih'],
            ['status', 'Durum'],
          ]}
          placeholder="Başlık, içerik, alıcı veya gönderen ara"
        />
        <Button variant="outline" asChild>
          <Link to={`/admin/${channel}/create?${target}`}>Yeni {label}</Link>
        </Button>
      </div>
      <DataTable
        name={`student-${student.id}-${channel}`}
        data={records}
        getRowId={(r) => r.id}
        manualSorting
        filterKey={JSON.stringify(filter)}
        unavailable={
          state.communicationLogs === undefined ? 'Gönderim geçmişi henüz alınamadı.' : undefined
        }
        exportConfig={{
          filename: `ogrenci-${student.id}-${channel}`,
          columns: [
            { key: 'title', label: 'Başlık', value: (r) => r.title },
            { key: 'address', label: 'Alıcı', value: (r) => r.address },
            { key: 'content', label: 'İçerik', value: (r) => r.content },
            { key: 'status', label: 'Durum', value: (r) => messageStatusLabel(r.status) },
            { key: 'sender', label: 'Gönderen', value: (r) => r.senderName },
            { key: 'createdAt', label: 'Tarih', value: (r) => r.createdAt },
          ],
        }}
        columns={[
          { accessorKey: 'title', header: 'Başlık' },
          { accessorKey: 'address', header: 'Alıcı' },
          {
            accessorKey: 'content',
            header: 'İçerik',
            cell: ({ row }) => (
              <p className="line-clamp-2 max-w-xs whitespace-pre-wrap">
                {row.original.content || '—'}
              </p>
            ),
          },
          {
            accessorKey: 'status',
            header: 'Durum',
            cell: ({ row }) => <StatusBadge>{messageStatusLabel(row.original.status)}</StatusBadge>,
          },
          {
            accessorKey: 'senderName',
            header: 'Gönderen',
            cell: ({ row }) => row.original.senderName || '—',
          },
          {
            accessorKey: 'createdAt',
            header: 'Tarih',
            cell: ({ row }) => messageDateTime(row.original.createdAt),
          },
          {
            id: 'actions',
            header: 'İşlemler',
            cell: ({ row }) => (
              <IconButton
                icon="eye"
                label="Mesaj içeriğini görüntüle"
                onClick={() => setPreview(row.original)}
              />
            ),
          },
        ]}
        mobileCard={(r) => (
          <>
            <strong>{r.title || label}</strong>
            <p>{r.address}</p>
            <p className="line-clamp-3 whitespace-pre-wrap">{r.content}</p>
            <div className="mobile-record-meta">
              <StatusBadge>{messageStatusLabel(r.status)}</StatusBadge>
              <span>{messageDateTime(r.createdAt)}</span>
            </div>
            <IconButton
              icon="eye"
              label="Mesaj içeriğini görüntüle"
              onClick={() => setPreview(r)}
            />
          </>
        )}
      />
      <Dialog
        open={!!preview}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent className="jam-modal dialog-wide">
          <DialogHeader>
            <DialogTitle>{preview?.title || 'Mesaj içeriği'}</DialogTitle>
            <DialogDescription>
              {preview?.address} · {preview && messageDateTime(preview.createdAt)}
            </DialogDescription>
          </DialogHeader>
          <div className="dialog-form-body">
            <dl className="detail-grid">
              <div>
                <dt>Gönderen</dt>
                <dd>{preview?.senderName || '—'}</dd>
              </div>
              <div>
                <dt>Durum</dt>
                <dd>{preview && messageStatusLabel(preview.status)}</dd>
              </div>
            </dl>
            <div className="message-preview-text whitespace-pre-wrap">
              {preview?.content || 'İçerik bulunmuyor.'}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreview(null)}>
              Kapat
            </Button>
            <Button asChild>
              <Link to={`/admin/${channel}/create?${target}`}>Yeni mesaj hazırla</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function WhatsAppConversation({
  student,
  records,
  unavailable,
}: {
  student: Student;
  records: CommunicationLog[];
  unavailable: boolean;
}) {
  const { save } = useOperations();
  const { dispatch } = useWorkspace();
  const [draft, setDraft] = usePageState(`student-${student.id}-whatsapp-reply`, '');
  const [draftId, setDraftId] = usePageState(`student-${student.id}-whatsapp-reply-id`, '');
  const body = draft.trim();
  const phone = parsePhone(student.phone);
  const saveDraft = () => {
    if (!body || body.length > 5000 || !phone) return;
    const id = draftId || crypto.randomUUID();
    save({
      type: 'save',
      collection: 'messages',
      record: {
        id,
        channel: 'whatsapp',
        title: `${student.name} · Yanıt`,
        body,
        recipient: phone.number,
        recipientAddress: normalizePhone(student.phone),
        recipientMode: 'single',
        date: localDate(),
        status: 'Taslak',
        template: false,
      },
    });
    setDraftId(id);
    toast.success('Yanıt taslağı kaydedildi. Henüz gönderilmedi.');
  };
  return (
    <section className="student-conversation" aria-label="WhatsApp konuşması">
      <header className="conversation-heading">
        <div>
          <h2>{student.name}</h2>
          <p>{displayPhone(student.phone)}</p>
        </div>
        <StatusBadge>Konuşma</StatusBadge>
      </header>
      <div
        className="conversation-history"
        role="region"
        aria-label="Konuşma mesajları"
        tabIndex={0}
      >
        {records.map((r) => (
          <article
            key={r.id}
            className={`chat-message ${r.direction === 'outbound' ? 'user' : ''}`}
          >
            <small>
              {r.direction === 'outbound' ? 'Giden' : r.direction === 'inbound' ? 'Gelen' : 'Mesaj'}{' '}
              · {r.senderName || r.address}
            </small>
            <p>{r.content || r.title || '—'}</p>
            <small>
              {messageDateTime(r.createdAt)} · {messageStatusLabel(r.status)}
            </small>
          </article>
        ))}
        {!records.length && (
          <p className="empty-inline">
            {unavailable
              ? 'Konuşma geçmişi henüz alınamadı.'
              : 'Bu öğrenciyle kayıtlı konuşma bulunmuyor.'}
          </p>
        )}
      </div>
      <form
        className="conversation-composer"
        onSubmit={(e) => {
          e.preventDefault();
          saveDraft();
        }}
      >
        <Label htmlFor={`reply-${student.id}`}>Yanıt</Label>
        <Textarea
          id={`reply-${student.id}`}
          placeholder="Öğrenciye yanıtınızı yazın…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          maxLength={5000}
          aria-describedby={`reply-help-${student.id}`}
        />
        <div className="conversation-composer-footer">
          <p className="field-hint" id={`reply-help-${student.id}`}>
            {!phone
              ? 'Yanıt için öğrencinin telefon numarasını tamamlayın.'
              : 'Yanıt denemesi yalnız bu çalışma alanına kaydedilir; WhatsApp mesajı gönderilmez.'}
          </p>
          <span className="muted">{draft.length} / 5000</span>
        </div>
        <div className="form-actions">
          <Button type="submit" variant="outline" disabled={!body || body.length > 5000 || !phone}>
            Taslağı kaydet
          </Button>
          <Button
            type="button"
            disabled={!body || body.length > 5000 || !phone}
            aria-describedby={`reply-help-${student.id}`}
            onClick={() => {
              const id = crypto.randomUUID();
              dispatch({
                type: 'communication/simulate',
                logs: [
                  {
                    id,
                    messageId: id,
                    studentId: student.id,
                    channel: 'whatsapp',
                    address: normalizePhone(student.phone),
                    title: 'Yanıt',
                    content: body,
                    status: 'SIMULATED',
                    senderName: 'Çalışma alanı',
                    createdAt: new Date().toISOString(),
                    direction: 'outbound',
                  },
                ],
              });
              setDraft('');
              setDraftId('');
              toast.success('Yanıt denemesi kaydedildi.');
            }}
          >
            Yanıtı dene
          </Button>
        </div>
      </form>
    </section>
  );
}
