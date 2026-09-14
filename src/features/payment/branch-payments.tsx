import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeading, IconButton } from '@/components/shared/primitives';
import { SearchField } from '@/components/shared/feature-primitives';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Icon } from '@/components/shared/icon';
import { usePaymentResource, usePaymentService } from './payment-provider';
import { PaymentNotice, PaymentStatusBadge } from './payment-ui';
import { money, paymentDate } from './payment-model';
import {
  paymentError,
  paymentMutationFailure,
  type BranchPayment,
  type BranchReceipt,
} from './payment-service';
import { parseReceipt } from './receipt-model';
const orderOptions = [
  ['dueDate:desc', 'En yeni vade'],
  ['dueDate:asc', 'En yakın vade'],
  ['branchName:asc', 'Şube adı A–Z'],
  ['branchName:desc', 'Şube adı Z–A'],
  ['amount:desc', 'En yüksek tutar'],
  ['amount:asc', 'En düşük tutar'],
];
export function BranchPayments() {
  const [params, setParams] = useSearchParams(),
    service = usePaymentService();
  const query = params.get('search') || '',
    sort = orderOptions.some(([value]) => value === params.get('sortOrder'))
      ? params.get('sortOrder')!
      : 'dueDate:desc';
  const requestedPage = Number(params.get('page')),
    page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    request = new URLSearchParams({
      search: query,
      sortOrder: sort,
      page: String(page),
      limit: '10',
    }).toString();
  const resource = usePaymentResource('branch-payments:' + request, () =>
    service.branchPayments(request),
  );
  const [receive, setReceive] = useState<BranchPayment | null>(null),
    [url, setUrl] = useState(''),
    [copyMessage, setCopyMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const inFlight = useRef(false);
  const filter = (key: string, value: string) =>
    setParams(
      (old) => {
        const next = new URLSearchParams(old);
        next.set(key, value);
        if (key !== 'page') next.set('page', '1');
        return next;
      },
      { replace: true },
    );
  const create = async (row: BranchPayment) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    setCopyMessage('');
    try {
      const result = await service.collectorLink(row.branchId, [row.id]);
      setUrl(result.url);
    } catch (e) {
      setError(paymentError(e));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const openReceipt = async (row: BranchPayment) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await resource.refresh();
      if (result.kind !== 'success') return;
      const current = result.data.data.find((item) => item.id === row.id);
      if (!current) {
        setError('Ödeme bu listede artık bulunmuyor. Güncel kayıtları kontrol edin.');
      } else if (current.status.toUpperCase() === 'PAID') {
        setError('Bu ödeme için tahsilat zaten kaydedilmiş. Liste güncellendi.');
      } else {
        setReceive(current);
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const actions = (row: BranchPayment) => (
    <div className="flex items-center gap-1">
      {row.status.toUpperCase() !== 'PAID' && (
        <>
          <IconButton
            icon="copy"
            label={`${row.branchName} için ödeme bağlantısı oluştur`}
            disabled={busy || !!resource.error || resource.loading}
            onClick={() => void create(row)}
          />
          <IconButton
            icon="wallet"
            label={`${row.branchName} tahsilatını kaydet`}
            disabled={busy || !!resource.error || resource.loading}
            onClick={() => void openReceipt(row)}
          />
        </>
      )}
      <Button asChild variant="ghost" size="icon" aria-label={`${row.branchName} detayları`}>
        <Link to={'/super/branches/' + encodeURIComponent(row.branchId)}>
          <Icon name="arrow-up-right" />
        </Link>
      </Button>
    </div>
  );
  return (
    <div className="payment-page">
      <PageHeading
        title="Şube ödemeleri"
        description="Şubelerin ödeme takvimini inceleyin, ödeme bağlantısı oluşturun ve alınan tahsilatları kaydedin."
      >
        <Button asChild variant="outline">
          <Link to="/payment">
            Ödeme merkezi
            <Icon name="arrow-up-right" />
          </Link>
        </Button>
      </PageHeading>
      <div className="module-toolbar payment-filters">
        <SearchField
          value={query}
          onChange={(value) => filter('search', value)}
          placeholder="Şube veya ödeme ara"
        />
        <Select value={sort} onValueChange={(value) => filter('sortOrder', value)}>
          <SelectTrigger aria-label="Şube ödemelerini sırala">
            <SelectValue placeholder="Sıralama seçin" />
          </SelectTrigger>
          <SelectContent>
            {orderOptions.map(([value, label]) => (
              <SelectItem value={value} key={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" onClick={() => setParams({})}>
          Filtreleri temizle
        </Button>
      </div>
      {resource.error && (
        <PaymentNotice retry={resource.refresh} loading={resource.loading}>
          {resource.error}
        </PaymentNotice>
      )}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <DataTable
        name="branch-payments"
        data={resource.data?.data || []}
        getRowId={(row) => row.id}
        manualSorting
        manualPagination
        filterKey={request}
        columns={[
          {
            accessorKey: 'branchName',
            header: 'Şube',
            enableSorting: false,
            cell: ({ row }) => (
              <Link to={'/super/branches/' + encodeURIComponent(row.original.branchId)}>
                {row.original.branchName}
              </Link>
            ),
          },
          {
            accessorKey: 'amount',
            header: 'Tutar',
            enableSorting: false,
            cell: ({ row }) => money(row.original.amount),
          },
          {
            accessorKey: 'status',
            header: 'Durum',
            enableSorting: false,
            cell: ({ row }) => <PaymentStatusBadge status={row.original.status.toUpperCase()} />,
          },
          {
            accessorKey: 'dueDate',
            header: 'Vade tarihi',
            enableSorting: false,
            cell: ({ row }) => paymentDate(row.original.dueDate),
          },
          {
            accessorKey: 'paymentDate',
            header: 'Ödeme tarihi',
            enableSorting: false,
            cell: ({ row }) =>
              row.original.paymentDate ? paymentDate(row.original.paymentDate) : '—',
          },
          { id: 'actions', header: 'İşlemler', cell: ({ row }) => actions(row.original) },
        ]}
        unavailable={
          resource.error
            ? 'Şube ödeme kayıtları alınamadı.'
            : resource.loading
              ? 'Şube ödeme kayıtları kontrol ediliyor.'
              : undefined
        }
        mobileCard={(row) => (
          <div className="payment-mobile-obligation">
            <div>
              <strong>{row.branchName}</strong>
              <PaymentStatusBadge status={row.status.toUpperCase()} />
            </div>
            <p>Vade · {paymentDate(row.dueDate)}</p>
            <footer>
              <b>{money(row.amount)}</b>
              {actions(row)}
            </footer>
          </div>
        )}
      />
      {resource.data && (
        <div className="payment-server-pagination">
          <span>
            {resource.data.totalItems} kayıt · Sayfa {page} /{' '}
            {Math.max(1, resource.data.totalPages)}
          </span>
          <div>
            <IconButton
              icon="chevron-left"
              label="Önceki sayfa"
              disabled={page <= 1 || resource.loading}
              onClick={() => filter('page', String(page - 1))}
            />
            <IconButton
              icon="chevron-right"
              label="Sonraki sayfa"
              disabled={page >= resource.data.totalPages || resource.loading}
              onClick={() => filter('page', String(page + 1))}
            />
          </div>
        </div>
      )}
      {receive && (
        <BranchReceiptDialog
          key={receive.id}
          payment={receive}
          onClose={() => {
            setReceive(null);
            void resource.refresh();
          }}
          onSaved={() => {
            setReceive(null);
            resource.refresh();
          }}
        />
      )}
      <Dialog
        open={!!url}
        onOpenChange={(open) => {
          if (!open) setUrl('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ödeme bağlantısı hazır</DialogTitle>
            <DialogDescription>
              Bu bağlantı ile şube yöneticisi ödemesini ödeme merkezinde tamamlayabilir.
            </DialogDescription>
          </DialogHeader>
          <Label htmlFor="collector-link">Ödeme bağlantısı</Label>
          <Input
            id="collector-link"
            placeholder="Ödeme bağlantısı"
            readOnly
            value={url}
            onFocus={(e) => e.target.select()}
          />
          {copyMessage && (
            <p role="status" className="payment-section-intro">
              {copyMessage}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setUrl('')}>
              Kapat
            </Button>
            <Button
              onClick={async () => {
                try {
                  if (!navigator.clipboard) throw new Error('Clipboard unavailable');
                  await navigator.clipboard.writeText(url);
                  setCopyMessage('Bağlantı kopyalandı.');
                } catch {
                  setCopyMessage('Bağlantıyı seçip elle kopyalayabilirsiniz.');
                }
              }}
            >
              <Icon name="copy" />
              Bağlantıyı kopyala
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function BranchReceiptDialog({
  payment,
  onClose,
  onSaved,
}: {
  payment: BranchPayment;
  onClose: () => void;
  onSaved: () => void;
}) {
  const service = usePaymentService(),
    [draft, setDraft] = useState<BranchReceipt>({ paymentType: 'BANK_TRANSFER' }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [uncertain, setUncertain] = useState(false);
  const inFlight = useRef(false);
  const submit = async () => {
    if (inFlight.current || uncertain) return;
    const parsed = parseReceipt(draft);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>('#branch-receipt [aria-invalid="true"]')?.focus(),
      );
      return;
    }
    inFlight.current = true;
    setErrors({});
    setBusy(true);
    setError('');
    try {
      await service.receiveBranchPayment(payment.id, parsed.value);
      onSaved();
    } catch (e) {
      setError(paymentError(e));
      setUncertain(paymentMutationFailure(e) === 'verify');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent className="jam-modal" preventOutsideClose showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle>Tahsilatı kaydet</DialogTitle>
          <DialogDescription>
            {payment.branchName} · {money(payment.amount)}. Daha önce alınmış ödemenin kaydını
            oluşturun.
          </DialogDescription>
        </DialogHeader>
        <form
          id="branch-receipt"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
          className="dialog-form-body checkout-fields"
        >
          <fieldset disabled={busy || uncertain}>
            <div className="form-field">
              <Label htmlFor="branch-receipt-type">Ödeme yöntemi *</Label>
              <Select
                value={draft.paymentType}
                onValueChange={(value) =>
                  setDraft({ ...draft, paymentType: value as BranchReceipt['paymentType'] })
                }
              >
                <SelectTrigger
                  id="branch-receipt-type"
                  aria-invalid={!!errors.paymentType}
                  aria-describedby={errors.paymentType ? 'branch-receipt-type-error' : undefined}
                >
                  <SelectValue placeholder="Ödeme yöntemini seçin" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    ['BANK_TRANSFER', 'Banka havalesi'],
                    ['CREDIT_CARD', 'Kredi kartı'],
                    ['CASH', 'Nakit'],
                    ['OTHER', 'Diğer'],
                  ].map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.paymentType && (
                <p id="branch-receipt-type-error" className="field-error" role="alert">
                  {errors.paymentType}
                </p>
              )}
            </div>
            <section className="checkout-optional">
              <h3>İsteğe bağlı bilgiler</h3>
              <div className="space-y-4">
                <div className="form-field">
                  <Label htmlFor="branch-receipt-date">Ödeme tarihi</Label>
                  <Input
                    id="branch-receipt-date"
                    type="datetime-local"
                    placeholder="Ödeme tarihi ve saati"
                    value={draft.paymentDate || ''}
                    aria-invalid={!!errors.paymentDate}
                    aria-describedby={errors.paymentDate ? 'branch-receipt-date-error' : undefined}
                    onValueChange={(paymentDate) => setDraft({ ...draft, paymentDate })}
                  />
                  {errors.paymentDate && (
                    <p id="branch-receipt-date-error" className="field-error" role="alert">
                      {errors.paymentDate}
                    </p>
                  )}
                </div>
                <div className="form-field">
                  <Label htmlFor="branch-receipt-reference">İşlem referansı</Label>
                  <Input
                    id="branch-receipt-reference"
                    placeholder="Dekont veya işlem numarası"
                    maxLength={255}
                    value={draft.paymentReference || ''}
                    aria-invalid={!!errors.paymentReference}
                    aria-describedby={
                      errors.paymentReference ? 'branch-receipt-reference-error' : undefined
                    }
                    onValueChange={(paymentReference) => setDraft({ ...draft, paymentReference })}
                  />
                  {errors.paymentReference && (
                    <p id="branch-receipt-reference-error" className="field-error" role="alert">
                      {errors.paymentReference}
                    </p>
                  )}
                </div>
                <div className="form-field">
                  <Label htmlFor="branch-receipt-notes">Notlar</Label>
                  <Textarea
                    id="branch-receipt-notes"
                    placeholder="Tahsilatla ilgili ek bilgi"
                    value={draft.notes || ''}
                    onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                  />
                </div>
              </div>
            </section>
          </fieldset>
          {error && (
            <p className="field-error" role="alert">
              {error}
              {uncertain && ' Tekrar kayıt oluşturmadan güncel ödeme durumunu kontrol edin.'}
            </p>
          )}
        </form>
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={onClose}>
            {uncertain ? 'Ödeme listesini kontrol et' : 'Kapat'}
          </Button>
          <Button type="submit" form="branch-receipt" disabled={busy || uncertain}>
            {busy ? 'Kaydediliyor' : 'Tahsilatı kaydet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
