import { useWorkspace } from '@/app/workspace-provider';
import { messageRecipients } from './recipients';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import {
  switchRecipientMode,
  messageTargetKeys,
  messageTargetIssue,
  messageTargetLabel,
  recipientOptions,
} from './message-model';
import { MultiSelect } from '@/components/ui/multi-select';
import { emailSchema, normalizePhone, parsePhone, localDate } from '@/lib/validation';
import { PageNavigation } from '@/components/navigation/page-navigation';
import { SearchField } from '@/components/shared/feature-primitives';
import { Icon } from '@/components/shared/icon';
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
import { Input as UIFieldInput } from '@/components/ui/input';
import { Label, Label as UIFieldLabel } from '@/components/ui/label';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type { MessageDraft } from '@/features/operations/model';
import { useOperations } from '@/features/operations/operations-provider';
import { usePageState } from '@/hooks/use-page-state';
import { navigate } from '@/hooks/use-route';
import { dateTR, normalize } from '@/lib/format';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
export function CommunicationsPage({ route }: { route: string }) {
  const channel = route.split('/')[1] as MessageDraft['channel'],
    templates = route.includes('templates'),
    create = route.endsWith('/create'),
    label = channel === 'email' ? 'E-posta' : channel === 'sms' ? 'SMS' : 'WhatsApp';
  const { operations, save } = useOperations();
  const { state, dispatch } = useWorkspace();
  const [params] = useSearchParams();
  const address = params.get(channel === 'email' ? 'email' : 'phone') || '';
  const [query, setQuery] = usePageState('query', ''),
    [preview, setPreview] = useState<MessageDraft | null>(null),
    [editing, setEditing] = useState<MessageDraft | null>(
      create
        ? {
            id: '',
            channel,
            title: '',
            body: '',
            recipient: address || 'Tüm aktif öğrenciler',
            recipientAddress: address,
            recipientMode: address ? 'single' : 'bulk',
            date: localDate(),
            status: 'Taslak',
            template: templates,
          }
        : null,
    );
  const detailId =
    !create && !templates && route.split('/').length === 3
      ? decodeURIComponent(route.split('/').at(-1)!)
      : undefined;
  const detail = operations.messages.find((m) => m.id === detailId && m.channel === channel);
  const groupOptions = recipientOptions(operations.groups);
  const recipientGroups = groupOptions.map((g) => g.label);
  const selectedGroups = editing ? messageTargetKeys(editing, operations.groups) : [];
  const recipientMode = editing?.recipientMode || (editing?.recipientAddress ? 'single' : 'bulk');
  const setRecipientMode = (value: string) =>
    setEditing((current) =>
      current ? switchRecipientMode(current, value as 'single' | 'bulk', recipientGroups) : current,
    );
  const recipients = preview ? messageRecipients(preview, state, operations) : [];
  const list = operations.messages.filter(
    (m) =>
      m.channel === channel &&
      m.template === templates &&
      normalize(m.title + m.body).includes(normalize(query)),
  );
  const close = () => {
    setEditing(null);
    if (create) navigate(`admin/${channel}${templates ? '/templates' : ''}`);
  };
  return (
    <>
      <PageHeading
        title={`${label}${templates ? ' şablonları' : ''}`}
        description={
          templates
            ? 'Tekrar kullanabileceğiniz mesajlar, tek bir yerde.'
            : 'Öğrencilerinizle iletişiminizi hazırlayın ve takip edin.'
        }
      >
        <Button
          onClick={() =>
            setEditing({
              id: '',
              channel,
              title: '',
              body: '',
              recipient: 'Tüm aktif öğrenciler',
              date: localDate(),
              status: 'Taslak',
              template: templates,
            })
          }
        >
          <Icon name="plus" />
          {templates ? 'Şablon oluştur' : 'Mesaj oluştur'}
        </Button>
      </PageHeading>
      <PageNavigation
        items={[
          { to: `/admin/${channel}`, label: 'Mesajlar' },
          { to: `/admin/${channel}/templates`, label: 'Şablonlar' },
        ]}
      />
      {detailId ? (
        <>
          {detail ? (
            <Card className="student-profile-card">
              <div className="detail-header">
                <h2>{detail.title}</h2>
                <StatusBadge>{detail.status}</StatusBadge>
              </div>
              <dl className="detail-grid">
                <div>
                  <dt>Alıcı</dt>
                  <dd>{messageTargetLabel(detail, operations.groups)}</dd>
                </div>
                <div>
                  <dt>Tarih</dt>
                  <dd>{dateTR(detail.date)}</dd>
                </div>
              </dl>
              <div className="message-preview-text">{detail.body}</div>
              <div className="form-actions">
                <Button variant="outline" asChild>
                  <Link to={`/admin/${channel}`}>Listeye dön</Link>
                </Button>
                <Button onClick={() => setEditing({ ...detail })}>
                  <Icon name="pencil" />
                  Düzenle
                </Button>
              </div>
            </Card>
          ) : (
            <p className="empty-inline">Mesaj bilgileri bulunamadı.</p>
          )}
        </>
      ) : (
        <>
          <div className="module-toolbar">
            <SearchField value={query} onChange={setQuery} placeholder="Başlık veya mesaj ara" />
            <span className="muted">
              {list.length} {templates ? 'şablon' : 'mesaj'}
            </span>
          </div>
          <DataTable
            data={list}
            getRowId={(m) => m.id}
            columns={[
              { accessorKey: 'title', header: 'Başlık' },
              {
                id: 'recipient',
                accessorFn: (message) => messageTargetLabel(message, operations.groups),
                header: 'Alıcı',
              },
              {
                accessorKey: 'date',
                header: 'Tarih',
                cell: ({ row }) => dateTR(row.original.date),
              },
              {
                accessorKey: 'status',
                header: 'Durum',
                cell: ({ row }) => <StatusBadge>{row.original.status}</StatusBadge>,
              },
              {
                id: 'actions',
                header: 'İşlemler',
                cell: ({ row }) => (
                  <div className="flex gap-1">
                    <Button
                      onClick={() => setPreview(row.original)}
                      variant="ghost"
                      size="icon"
                      aria-label="Aç"
                      title="Aç"
                    >
                      <Icon name="eye" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Mesajı düzenle"
                      onClick={() => setEditing({ ...row.original })}
                    >
                      <Icon name="pencil" />
                    </Button>
                  </div>
                ),
              },
            ]}
            mobileCard={(m) => (
              <>
                <div className="flex justify-between">
                  <strong>{m.title}</strong>
                  <StatusBadge>{m.status}</StatusBadge>
                </div>
                <p className="line-clamp-3 text-sm text-muted-foreground">{m.body}</p>
                <div className="mobile-record-meta">
                  <span>{messageTargetLabel(m, operations.groups)}</span>
                  <span>{dateTR(m.date)}</span>
                </div>
                <Button variant="outline" onClick={() => setPreview(m)}>
                  İçeriği aç
                </Button>
              </>
            )}
          />
        </>
      )}
      <Dialog
        open={!!preview}
        onOpenChange={(v) => {
          if (!v) setPreview(null);
        }}
      >
        <DialogContent className={'jam-modal'}>
          <DialogHeader>
            <DialogTitle>{preview?.title || 'Mesaj'}</DialogTitle>
            <DialogDescription>
              {preview ? messageTargetLabel(preview, operations.groups) || preview.title : 'Mesaj'}
            </DialogDescription>
          </DialogHeader>
          {preview && (
            <>
              <div className="dialog-form-body">
                <div className="message-preview-text">{preview.body}</div>
                {!preview.template && (
                  <section className="checkout-review-block">
                    <h3>{recipients.length} alıcı</h3>
                    <p>Deneme bu tarayıcıda kaydedilir. SMS, e-posta veya WhatsApp gönderilmez.</p>
                    {recipients.slice(0, 5).map((r) => (
                      <p key={r.address}>
                        {r.name} · {r.address}
                      </p>
                    ))}
                    {recipients.length > 5 && <small>ve {recipients.length - 5} alıcı daha</small>}
                  </section>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPreview(null)}>
                  Kapat
                </Button>
                <Button
                  onClick={() => {
                    setEditing({ ...preview, id: '', template: false, status: 'Taslak' });
                    setPreview(null);
                  }}
                >
                  Mesajda kullan
                  <Icon name="arrow-right" />
                </Button>
                {!preview.template && (
                  <Button
                    disabled={!recipients.length || preview.status === 'Denendi'}
                    onClick={() => {
                      const messageId = preview.id || crypto.randomUUID();
                      save({
                        type: 'save',
                        collection: 'messages',
                        record: { ...preview, id: messageId, status: 'Denendi' },
                      });
                      dispatch({
                        type: 'communication/simulate',
                        logs: recipients
                          .filter((r) => r.studentId !== undefined)
                          .map((r) => ({
                            id: `simulation-${messageId}-${r.studentId}`,
                            messageId,
                            studentId: r.studentId!,
                            channel,
                            address: r.address,
                            title: preview.title,
                            content: preview.body,
                            status: 'SIMULATED',
                            senderName: 'Çalışma alanı',
                            createdAt: new Date().toISOString(),
                            direction: 'outbound',
                          })),
                      });
                      setPreview({ ...preview, id: messageId, status: 'Denendi' });
                      toast.success('Gönderim denemesi kaydedildi. Dışarıya mesaj gönderilmedi.');
                    }}
                  >
                    {preview.status === 'Denendi' ? 'Deneme tamamlandı' : 'Gönderimi dene'}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!editing}
        onOpenChange={(v) => {
          if (!v) close();
        }}
      >
        <DialogContent className={'jam-modal dialog-wide'}>
          <DialogHeader>
            <DialogTitle>{editing?.template ? 'Mesaj şablonu' : `${label} oluştur`}</DialogTitle>
            <DialogDescription>
              {'Alıcı, başlık ve mesaj içeriğini birlikte hazırlayın.'}
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <form
              className="dialog-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (
                  ((channel === 'email' || editing.template || editing.title.trim()) &&
                    editing.title.trim().length < 2) ||
                  editing.body.trim().length < (channel === 'sms' ? 10 : 1) ||
                  editing.body.length > (channel === 'sms' ? 300 : 5000)
                ) {
                  toast.error(
                    channel === 'sms'
                      ? 'Başlık en az 2, SMS 10–300 karakter olmalıdır.'
                      : 'Başlık ve mesaj içeriğini kontrol edin.',
                  );
                  return;
                }
                if (
                  !editing.template &&
                  recipientMode === 'single' &&
                  !(channel === 'email'
                    ? emailSchema.safeParse(editing.recipientAddress || '').success
                    : parsePhone(editing.recipientAddress || ''))
                ) {
                  toast.error(
                    channel === 'email'
                      ? 'Geçerli bir alıcı e-posta adresi girin.'
                      : 'Geçerli bir alıcı telefon numarası girin.',
                  );
                  return;
                }
                if (
                  !editing.template &&
                  recipientMode === 'bulk' &&
                  messageTargetIssue(editing, operations.groups)
                ) {
                  toast.error(messageTargetIssue(editing, operations.groups)!);
                  return;
                }
                const recipientAddress =
                  recipientMode === 'single' && !editing.template
                    ? channel === 'email'
                      ? editing.recipientAddress!.trim().toLowerCase()
                      : normalizePhone(editing.recipientAddress!)
                    : undefined;
                const recordId =
                  editing.status === 'Denendi'
                    ? crypto.randomUUID()
                    : editing.id || crypto.randomUUID();
                const previewIntent =
                  (e.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'preview';
                const record: MessageDraft = {
                  ...editing,
                  title: editing.title.trim() || editing.body.trim().slice(0, 48),
                  body: editing.body.trim(),
                  recipientMode,
                  recipientAddress,
                  recipientGroups: recipientMode === 'bulk' ? selectedGroups : undefined,
                  recipient:
                    recipientMode === 'single'
                      ? recipientAddress || editing.recipient
                      : messageTargetLabel(editing, operations.groups),
                  status: 'Taslak',
                  id: recordId,
                };
                save({ type: 'save', collection: 'messages', record });
                toast.success(
                  editing.template ? 'Şablon kaydedildi.' : 'Mesaj taslağı kaydedildi.',
                );
                if (previewIntent) {
                  setPreview(record);
                  setEditing(null);
                } else close();
              }}
            >
              <div className="dialog-form-body">
                <div className="compose-layout">
                  <div className="dialog-form">
                    <fieldset className="form-section" data-form-section="required">
                      <legend>
                        {editing.template ? 'Şablon içeriği' : 'Alıcı ve mesaj'}{' '}
                        <span>Zorunlu</span>
                      </legend>
                      {(channel === 'email' || editing.template) && (
                        <>
                          <div className="form-field">
                            <UIFieldLabel htmlFor={'message-title'}>
                              {channel === 'email' ? 'Konu' : 'Başlık'}
                            </UIFieldLabel>
                            <UIFieldInput
                              id={'message-title'}
                              name="message-title"
                              minLength={2}
                              maxLength={160}
                              value={editing.title}
                              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                              required
                            />
                          </div>
                        </>
                      )}
                      {!editing.template && (
                        <Tabs value={recipientMode} onValueChange={setRecipientMode}>
                          <TabsList>
                            <TabsTrigger value="single">Tek alıcı</TabsTrigger>
                            <TabsTrigger value="bulk">Toplu mesaj</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      )}
                      {!editing.template && recipientMode === 'single' && (
                        <div className="form-field">
                          <UIFieldLabel htmlFor="recipient-address">
                            {channel === 'email'
                              ? 'Alıcı e-posta adresi'
                              : 'Alıcı telefon numarası'}
                          </UIFieldLabel>
                          <UIFieldInput
                            id="recipient-address"
                            type={channel === 'email' ? 'email' : 'tel'}
                            required
                            value={editing.recipientAddress || ''}
                            onValueChange={(value) =>
                              setEditing({ ...editing, recipientAddress: value })
                            }
                          />
                        </div>
                      )}
                      {!editing.template && recipientMode === 'bulk' && (
                        <div className="form-field recipient-multi-field">
                          <Label>Alıcı grupları *</Label>
                          <MultiSelect
                            label="Grupları seçin"
                            options={groupOptions}
                            value={selectedGroups}
                            onChange={(recipientGroups) =>
                              setEditing({ ...editing, recipientGroups })
                            }
                          />
                          <div className="recipient-chips">
                            {selectedGroups.map((key) => (
                              <Button
                                key={key}
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() =>
                                  setEditing({
                                    ...editing,
                                    recipientGroups: selectedGroups.filter((v) => v !== key),
                                  })
                                }
                                aria-label={`${groupOptions.find((g) => g.value === key)?.label || 'Bulunamayan grup'} seçimini kaldır`}
                              >
                                {groupOptions.find((g) => g.value === key)?.label ||
                                  'Bulunamayan grup'}
                                <Icon name="x" />
                              </Button>
                            ))}
                          </div>
                          <p
                            className={
                              messageTargetIssue(editing, operations.groups)
                                ? 'field-error'
                                : 'muted text-xs'
                            }
                          >
                            {messageTargetIssue(editing, operations.groups) ||
                              `${messageRecipients(editing, state, operations).length} farklı alıcı · Tekrarlanan adresler birleştirilir.`}
                          </p>
                        </div>
                      )}
                      <div className="form-field">
                        <Label htmlFor="message-body">Mesaj</Label>
                        <Textarea
                          id="message-body"
                          value={editing.body}
                          onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                          required
                          minLength={channel === 'sms' ? 10 : 1}
                          maxLength={channel === 'sms' ? 300 : 5000}
                          rows={7}
                        />
                        <span className="muted text-xs">
                          {editing.body.length} / {channel === 'sms' ? 300 : 5000} karakter
                          {channel === 'sms' ? ' · En az 10 karakter' : ''}
                        </span>
                      </div>
                    </fieldset>
                    {channel !== 'email' && !editing.template && (
                      <fieldset
                        className="form-section form-section-optional"
                        data-form-section="optional"
                      >
                        <legend>
                          Taslak bilgisi <span>İsteğe bağlı</span>
                        </legend>
                        <div className="form-field">
                          <Label htmlFor="message-draft-title">Taslak adı</Label>
                          <UIFieldInput
                            id="message-draft-title"
                            minLength={2}
                            maxLength={160}
                            value={editing.title}
                            onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                          />
                          <p className="field-hint">
                            Alıcıya gönderilmez. Boş bırakırsanız mesajın başlangıcı kullanılır.
                          </p>
                        </div>
                      </fieldset>
                    )}
                  </div>
                  <div className="compose-preview">
                    <span className="eyebrow">{label.toLocaleUpperCase('tr')} ÖNİZLEMESİ</span>
                    <div className="preview-bubble">
                      {channel === 'email' && <strong>{editing.title || 'Konu'}</strong>}
                      <p>{editing.body || 'Yazdığınız mesaj burada görünecek.'}</p>
                    </div>
                    <small>
                      {recipientMode === 'single' && !editing.template
                        ? editing.recipientAddress || 'Alıcı henüz girilmedi'
                        : messageTargetLabel(editing, operations.groups)}
                    </small>
                  </div>
                </div>
              </div>
              <DialogFooter className="form-actions">
                <Button type="button" variant="outline" onClick={close}>
                  Vazgeç
                </Button>
                {!editing.template && (
                  <Button type="submit" variant="secondary" value="preview">
                    Kontrol et ve dene
                  </Button>
                )}
                <Button type="submit">
                  <Icon name="check" />
                  {editing.template ? 'Şablonu kaydet' : 'Taslağı kaydet'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
